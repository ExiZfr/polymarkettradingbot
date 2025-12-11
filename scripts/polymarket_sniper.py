#!/usr/bin/env python3
"""
POLYMARKET SNIPER v1.0 (Paper Trading)
======================================
Async module for simulating sniping of new Polymarket binary markets.
Features:
- Real-time market detection (Radar)
- Inefficiency analysis (Brain)
- AMM slippage simulation
- Fee-aware PnL calculation (2% on profits)
- Complete trade journal in virtual_ledger.json
"""

import asyncio
import json
import math
import os
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

# File paths
SCRIPT_DIR = Path(__file__).parent
LEDGER_FILE = SCRIPT_DIR / "virtual_ledger.json"
LOG_FILE = SCRIPT_DIR / "sniper.log"

# Logger to redirect stdout to file + terminal
class DualLogger:
    def __init__(self):
        self.terminal = sys.stdout
        # Ensure log directory exists
        if not LOG_FILE.parent.exists():
            LOG_FILE.parent.mkdir(parents=True)
        self.log = open(LOG_FILE, "a", encoding="utf-8")

    def write(self, message):
        try:
            self.terminal.write(message)
            self.log.write(message)
            self.log.flush() # Ensure real-time logging
        except Exception:
            pass

    def flush(self):
        try:
            self.terminal.flush()
            self.log.flush()
        except Exception:
            pass

# Windows console UTF-8 support for emojis
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass  # Fallback to default encoding

# Hook stdout
sys.stdout = DualLogger()

# Auto-install httpx if missing
def install_httpx():
    import subprocess
    print("📦 Installing httpx...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx", "--quiet"])
        print("✅ httpx installed successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to install httpx: {e}")
        return False

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    print("[WARN] httpx not found. Attempting auto-install...")
    if install_httpx():
        import httpx
        HTTPX_AVAILABLE = True
    else:
        httpx = None
        HTTPX_AVAILABLE = False
        print("[WARN] httpx not installed. Run: pip install httpx")

# =============================================================================
# 1. CONFIGURATION
# =============================================================================

API_ENDPOINT = "https://gamma-api.polymarket.com"  # Polymarket Gamma API

# Optimized for 1000 API calls/hour
# Strategy: Dynamic polling that adapts based on pagination needs
TARGET_API_CALLS_PER_HOUR = 950  # Target slightly below 1000 to have margin
INITIAL_CAPITAL_USDC = 1000.00  # Starting paper trading capital matched with UI
MAX_BET_USDC = 100.00  # Maximum risk per snipe (Modified to fits smaller capital)
PRICE_TOLERANCE = 0.05  # Minimum deviation from 0.50 to trigger snipe
TAKE_PROFIT_TARGET_CENTS = 0.10  # Sell if price rises by this amount
PLATFORM_FEE_RATE = 0.02  # 2% fee on profits only

# AMM Slippage Simulation Parameters
ASSUMED_INITIAL_LIQUIDITY = 10000.0  # Assumed initial pool liquidity for slippage calc
SLIPPAGE_FACTOR = 0.005  # Slippage multiplier based on bet size vs liquidity

# API Call Tracking (global state)
api_call_tracker = {
    "total_calls": 0,
    "start_time": None,
    "calls_per_scan": 0,
    "optimal_interval": 3.6  # Start with ~1000 calls/hour (3600/1000)
}



# =============================================================================
# 2. LEDGER MODULE (Load/Save)
# =============================================================================

def load_ledger() -> dict:
    """
    Load the virtual ledger from disk.
    Creates a fresh ledger if file doesn't exist or is corrupted.
    """
    default_ledger = {
        "capital_current_USDC": INITIAL_CAPITAL_USDC,
        "capital_initial_USDC": INITIAL_CAPITAL_USDC,
        "processed_market_ids": [],
        "trades": []
    }
    
    if not LEDGER_FILE.exists():
        print(f"📒 Creating new ledger: {LEDGER_FILE.name}")
        save_ledger(default_ledger)
        return default_ledger
    
    try:
        with open(LEDGER_FILE, "r", encoding="utf-8") as f:
            ledger = json.load(f)
            # Ensure all keys exist (backward compatibility)
            for key in default_ledger:
                if key not in ledger:
                    ledger[key] = default_ledger[key]
            return ledger
    except (json.JSONDecodeError, IOError) as e:
        print(f"⚠️  Ledger corrupted, resetting: {e}")
        save_ledger(default_ledger)
        return default_ledger


def save_ledger(ledger: dict) -> None:
    """Persist the ledger to disk."""
    try:
        with open(LEDGER_FILE, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2, ensure_ascii=False)
    except IOError as e:
        print(f"❌ Failed to save ledger: {e}")


# =============================================================================
# 3. RADAR MODULE (Market Detection)
# =============================================================================

async def fetch_markets(client: "httpx.AsyncClient") -> tuple[list, int]:
    """
    Fetch ALL active markets from Polymarket API using pagination.
    Returns tuple of (markets list, number of API calls made).
    Implements retry logic with exponential backoff.
    """
    all_markets = []
    offset = 0
    limit = 100  # Fetch 100 at a time for efficiency
    max_retries = 3
    api_calls_made = 0
    
    # Initialize tracker on first call
    if api_call_tracker["start_time"] is None:
        api_call_tracker["start_time"] = time.time()
    
    try:
        while True:
            url = f"{API_ENDPOINT}/markets"
            params = {
                "closed": "false",
                "active": "true",
                "limit": limit,
                "offset": offset
            }
            
            # Retry logic with exponential backoff
            for retry in range(max_retries):
                try:
                    headers = {
                        "User-Agent": "PolymarketSniper/1.0",
                        "Accept": "application/json"
                    }
                    response = await client.get(
                        url, 
                        params=params, 
                        headers=headers,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    # Track API call
                    api_calls_made += 1
                    api_call_tracker["total_calls"] += 1
                    
                    if not data or not isinstance(data, list):
                        return (all_markets, api_calls_made)  # Reached end
                        
                    all_markets.extend(data)
                    
                    # If we got less than limit, we've reached the end
                    if len(data) < limit:
                        return (all_markets, api_calls_made)
                        
                    offset += limit
                    break  # Success, continue to next batch
                    
                except httpx.HTTPStatusError as e:
                    status_code = e.response.status_code
                    if status_code == 429:  # Rate limit
                        wait_time = (2 ** retry) * 5  # Exponential backoff: 5s, 10s, 20s
                        print(f"⚠️  Rate limited (429). Waiting {wait_time}s before retry {retry+1}/{max_retries}...")
                        await asyncio.sleep(wait_time)
                    elif status_code >= 500:  # Server error
                        wait_time = 2 ** retry
                        print(f"⚠️  Server error ({status_code}). Retrying in {wait_time}s ({retry+1}/{max_retries})...")
                        await asyncio.sleep(wait_time)
                    else:
                        print(f"❌ API fetch failed: HTTP {status_code} - {e.response.text[:200]}")
                        return (all_markets, api_calls_made)
                        
                except httpx.TimeoutException:
                    wait_time = 2 ** retry
                    print(f"⚠️  Request timeout. Retrying in {wait_time}s ({retry+1}/{max_retries})...")
                    await asyncio.sleep(wait_time)
                    
                except httpx.ConnectError as e:
                    print(f"❌ Connection failed: {e}. Check your internet connection.")
                    return (all_markets, api_calls_made)
                    
            else:
                # All retries exhausted
                print(f"❌ API fetch failed after {max_retries} retries. Returning {len(all_markets)} markets.")
                return (all_markets, api_calls_made)
        
        return (all_markets, api_calls_made)
        
    except Exception as e:
        print(f"❌ Unexpected error in fetch_markets: {type(e).__name__}: {e}")
        return (all_markets, api_calls_made)  # Return what we have so far


def calculate_optimal_polling_interval() -> float:
    """
    Calculate the optimal polling interval based on API call tracking.
    Goal: Maximize API usage up to TARGET_API_CALLS_PER_HOUR while scanning all markets.
    
    Returns:
        Optimal polling interval in seconds
    """
    calls_per_scan = api_call_tracker.get("calls_per_scan", 1)
    
    # If we need X calls per scan and want to stay under TARGET_API_CALLS_PER_HOUR,
    # we can do TARGET_API_CALLS_PER_HOUR / X scans per hour
    # Interval = 3600 / (TARGET_API_CALLS_PER_HOUR / calls_per_scan)
    # Simplified: interval = (3600 * calls_per_scan) / TARGET_API_CALLS_PER_HOUR
    
    if calls_per_scan > 0:
        optimal = (3600 * calls_per_scan) / TARGET_API_CALLS_PER_HOUR
        # Ensure minimum interval of 3 seconds to avoid hammering
        optimal = max(3.0, optimal)
        # Cap at 60 seconds maximum
        optimal = min(60.0, optimal)
        return optimal
    
    # Default fallback
    return 3.6  # ~1000 calls/hour if 1 call per scan


async def monitor_new_markets(ledger: dict, 
                               client: "httpx.AsyncClient",
                               on_new_market_callback) -> None:
    """
    Continuous monitoring loop. Detects new markets and triggers analysis.
    Dynamically adjusts polling interval to maximize API usage up to 1000/hour.
    
    Args:
        ledger: Current state with processed_market_ids
        client: HTTP client for API requests
        on_new_market_callback: Async function to call for each new market
    """
    processed_ids = set(ledger.get("processed_market_ids", []))
    
    print(f"🔍 Radar started. {len(processed_ids)} markets already processed.")
    print(f"🎯 Target: ~{TARGET_API_CALLS_PER_HOUR} API calls/hour (max 1000)")
    
    cycle_count = 0
    while True:
        try:
            cycle_count += 1
            scan_start = time.time()
            
            # Fetch all markets and track API calls
            markets, api_calls = await fetch_markets(client)
            
            # Update calls per scan tracking
            if api_calls > 0:
                api_call_tracker["calls_per_scan"] = api_calls
            
            # Calculate current API call rate
            elapsed_hours = (time.time() - api_call_tracker["start_time"]) / 3600
            current_rate = api_call_tracker["total_calls"] / elapsed_hours if elapsed_hours > 0 else 0
            
            # Display scan results every cycle
            if cycle_count % 5 == 0 or cycle_count == 1:
                print(f"👀 Scan #{cycle_count}: {len(markets)} markets | API calls: {api_calls} | Rate: {current_rate:.0f}/hour")
            
            # Process markets to detect new ones
            new_count = 0
            for market in markets:
                market_id = market.get("id")
                if market_id and market_id not in processed_ids:
                    # New market detected!
                    new_count += 1
                    processed_ids.add(market_id)
                    ledger["processed_market_ids"] = list(processed_ids)
                    
                    print(f"🆕 New market detected: {market.get('question', 'Unknown')[:60]}...")
                    await on_new_market_callback(market, ledger, client)
            
            if new_count > 0:
                print(f"✨ {new_count} new market(s) detected this scan!")
            
            # Calculate optimal polling interval for next cycle
            optimal_interval = calculate_optimal_polling_interval()
            api_call_tracker["optimal_interval"] = optimal_interval
            
            # Show interval adjustment info every 10 cycles
            if cycle_count % 10 == 0:
                print(f"⏱️  Polling interval: {optimal_interval:.1f}s | Calls/scan: {api_calls} | Total API calls: {api_call_tracker['total_calls']}")
            
            await asyncio.sleep(optimal_interval)
            
        except asyncio.CancelledError:
            print("🛑 Radar stopped.")
            # Print final stats
            elapsed_hours = (time.time() - api_call_tracker["start_time"]) / 3600
            final_rate = api_call_tracker["total_calls"] / elapsed_hours if elapsed_hours > 0 else 0
            print(f"📊 Final stats: {api_call_tracker['total_calls']} API calls in {elapsed_hours:.2f}h = {final_rate:.0f} calls/hour")
            break
        except Exception as e:
            print(f"⚠️  Radar error: {e}")
            await asyncio.sleep(5)  # Back off on error


# =============================================================================
# 4. BRAIN MODULE (Sniping Analysis)
# =============================================================================

def analyze_sniping_opportunity(market_data: dict) -> Tuple[bool, Optional[str], float, float]:
    """
    Analyze a market for sniping opportunity based on price inefficiency.
    
    Returns:
        Tuple of (should_snipe, outcome_to_buy, amount_to_bet, adjusted_price)
        If should_snipe is False, other values are None/0
    """
    # Extract outcome prices
    outcomes = market_data.get("outcomes", [])
    outcome_prices = market_data.get("outcomePrices", [])
    
    if not outcomes or not outcome_prices:
        # Try alternative structure
        tokens = market_data.get("tokens", [])
        if tokens:
            outcomes = [t.get("outcome", "UNKNOWN") for t in tokens]
            outcome_prices = [float(t.get("price", 0.5)) for t in tokens]
    
    if len(outcomes) < 2 or len(outcome_prices) < 2:
        return (False, None, 0, 0)
    
    try:
        # Parse prices (can be strings or floats)
        prices = [float(p) if isinstance(p, (int, float, str)) else 0.5 for p in outcome_prices]
    except (ValueError, TypeError):
        return (False, None, 0, 0)
    
    # Find the outcome with lowest price (potential undervalued)
    min_idx = 0 if prices[0] <= prices[1] else 1
    min_price = prices[min_idx]
    chosen_outcome = outcomes[min_idx] if min_idx < len(outcomes) else "YES"
    
    # Check for inefficiency: abs(price - 0.50) > PRICE_TOLERANCE
    deviation = abs(min_price - 0.50)
    
    if deviation > PRICE_TOLERANCE and min_price < 0.50:
        # Simulate slippage to get adjusted entry price
        liquidity = float(market_data.get("liquidity", ASSUMED_INITIAL_LIQUIDITY))
        adjusted_price = simulate_slippage(min_price, MAX_BET_USDC, liquidity)
        
        return (True, str(chosen_outcome), MAX_BET_USDC, adjusted_price)
    
    return (False, None, 0, 0)


def simulate_slippage(spot_price: float, bet_amount: float, liquidity: float) -> float:
    """
    Simulate AMM/LMSR slippage impact on entry price.
    
    Uses a simplified model where slippage increases with bet size relative to liquidity.
    Formula: adjusted_price = spot_price * (1 + slippage_impact)
    
    Returns:
        Adjusted average entry price after simulated slippage
    """
    if liquidity <= 0:
        liquidity = ASSUMED_INITIAL_LIQUIDITY
    
    # Slippage impact based on bet size vs liquidity
    # Higher bet relative to liquidity = more slippage
    relative_size = bet_amount / liquidity
    slippage_impact = relative_size * SLIPPAGE_FACTOR * 100  # Scale factor
    
    # Cap maximum slippage at 10%
    slippage_impact = min(slippage_impact, 0.10)
    
    adjusted_price = spot_price * (1 + slippage_impact)
    return round(adjusted_price, 4)


# =============================================================================
# 5. EXECUTION MODULE (Order Simulation)
# =============================================================================

async def simulate_snipe_order(market_data: dict, 
                                outcome: str, 
                                amount_usdc: float, 
                                price_entry: float,
                                ledger: dict) -> Optional[dict]:
    """
    Simulate placing a snipe order with slippage-adjusted entry price.
    
    This function:
    1. Deducts the bet amount from current capital
    2. Creates a trade entry with OPEN status
    3. Calculates shares received based on adjusted price
    
    Returns:
        Trade record dict if successful, None if insufficient capital
    """
    current_capital = ledger.get("capital_current_USDC", 0)
    
    if current_capital < amount_usdc:
        print(f"⚠️  Insufficient capital: ${current_capital:.2f} < ${amount_usdc:.2f}")
        return None
    
    # Calculate shares received (after slippage)
    # shares = amount / price_entry (where price_entry is already adjusted)
    shares_received = amount_usdc / price_entry if price_entry > 0 else 0
    
    trade_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat() + "Z"
    
    trade = {
        "trade_id": trade_id,
        "market_id": market_data.get("id", "unknown"),
        "market_question": market_data.get("question", "")[:100],
        "market_slug": market_data.get("slug", ""),
        "status": "OPEN",
        "date_ouverture": now,
        "outcome_taken": outcome,
        "amount_invested_USDC": round(amount_usdc, 2),
        "shares_received": round(shares_received, 4),
        "price_entry": round(price_entry, 4),  # Slippage-adjusted price
        "price_exit": None,
        "date_cloture": None,
        "gross_pnl_USDC": None,
        "fees_simulated": None,
        "net_pnl_USDC": None
    }
    
    # Deduct capital
    ledger["capital_current_USDC"] = round(current_capital - amount_usdc, 2)
    
    # Add to trades
    if "trades" not in ledger:
        ledger["trades"] = []
    ledger["trades"].append(trade)
    
    # Persist
    save_ledger(ledger)
    
    print(f"📥 SNIPE EXECUTED: {outcome} @ ${price_entry:.4f} (${amount_usdc:.2f})")
    print(f"   Shares: {shares_received:.4f} | Capital remaining: ${ledger['capital_current_USDC']:.2f}")
    
    return trade


# =============================================================================
# 6. CLOSING MODULE (Position Management)
# =============================================================================

async def check_and_close_positions(ledger: dict, client: "httpx.AsyncClient") -> None:
    """
    Check all OPEN trades for take-profit or resolution conditions.
    
    Closing Logic:
    1. Take Profit: If current_price - price_entry >= TAKE_PROFIT_TARGET_CENTS
    2. Resolution: If market is RESOLVED
    
    Fee Calculation:
    - Fees = gross_pnl * 0.02 IF gross_pnl > 0, else 0
    """
    trades = ledger.get("trades", [])
    open_trades = [t for t in trades if t.get("status") == "OPEN"]
    
    if not open_trades:
        return
    
    print(f"📊 Checking {len(open_trades)} open position(s)...")
    
    for trade in open_trades:
        market_id = trade.get("market_id")
        
        try:
            # Fetch current market state
            url = f"{API_ENDPOINT}/markets/{market_id}"
            response = await client.get(url, timeout=10.0)
            
            if response.status_code != 200:
                continue
                
            market = response.json()
            
            # Check resolution status
            is_resolved = market.get("resolved", False) or market.get("closed", False)
            resolution_outcome = market.get("resolutionOutcome")
            
            # Get current price for the outcome we hold
            current_price = get_current_price(market, trade.get("outcome_taken"))
            price_entry = trade.get("price_entry", 0)
            
            should_close = False
            close_reason = ""
            exit_price = current_price
            
            # Check Take Profit
            if not is_resolved and current_price is not None:
                price_gain = current_price - price_entry
                if price_gain >= TAKE_PROFIT_TARGET_CENTS:
                    should_close = True
                    close_reason = "TAKE_PROFIT"
                    exit_price = current_price
            
            # Check Resolution
            if is_resolved:
                should_close = True
                close_reason = "RESOLVED"
                # Determine if we won
                our_outcome = trade.get("outcome_taken", "").upper()
                winning = str(resolution_outcome).upper() if resolution_outcome else ""
                if our_outcome == winning or winning == our_outcome:
                    exit_price = 1.0  # Full payout
                else:
                    exit_price = 0.0  # Total loss
            
            if should_close:
                close_trade(trade, exit_price, close_reason, ledger)
                
        except Exception as e:
            print(f"⚠️  Error checking trade {trade.get('trade_id')}: {e}")


def get_current_price(market: dict, outcome: str) -> Optional[float]:
    """Extract current price for a specific outcome from market data."""
    try:
        tokens = market.get("tokens", [])
        outcome_prices = market.get("outcomePrices", [])
        outcomes = market.get("outcomes", [])
        
        if tokens:
            for token in tokens:
                if str(token.get("outcome", "")).upper() == str(outcome).upper():
                    return float(token.get("price", 0))
        
        if outcomes and outcome_prices:
            for i, o in enumerate(outcomes):
                if str(o).upper() == str(outcome).upper() and i < len(outcome_prices):
                    return float(outcome_prices[i])
        
        return None
    except (ValueError, TypeError, IndexError):
        return None


def close_trade(trade: dict, exit_price: float, reason: str, ledger: dict) -> None:
    """
    Close a trade and calculate PnL with fee deduction.
    
    Fee Model: 2% fee applied ONLY on positive gross PnL
    """
    now = datetime.utcnow().isoformat() + "Z"
    
    shares = trade.get("shares_received", 0)
    amount_invested = trade.get("amount_invested_USDC", 0)
    
    # Calculate gross PnL
    exit_value = shares * exit_price
    gross_pnl = exit_value - amount_invested
    
    # Calculate fees (only on profits)
    if gross_pnl > 0:
        fees = round(gross_pnl * PLATFORM_FEE_RATE, 2)
    else:
        fees = 0
    
    net_pnl = round(gross_pnl - fees, 2)
    
    # Update trade record
    trade["price_exit"] = round(exit_price, 4)
    trade["date_cloture"] = now
    trade["gross_pnl_USDC"] = round(gross_pnl, 2)
    trade["fees_simulated"] = fees
    trade["net_pnl_USDC"] = net_pnl
    
    # Determine status
    if net_pnl >= 0:
        trade["status"] = "CLOSED_PROFIT"
    else:
        trade["status"] = "CLOSED_LOSS"
    
    # Add exit value back to capital
    ledger["capital_current_USDC"] = round(
        ledger.get("capital_current_USDC", 0) + exit_value - fees, 2
    )
    
    # Persist
    save_ledger(ledger)
    
    status_emoji = "✅" if net_pnl >= 0 else "❌"
    print(f"{status_emoji} CLOSED ({reason}): {trade.get('market_question', '')[:40]}...")
    print(f"   Exit: ${exit_price:.4f} | Gross: ${gross_pnl:.2f} | Fees: ${fees:.2f} | Net: ${net_pnl:.2f}")


# =============================================================================
# 7. PERFORMANCE REPORTING MODULE
# =============================================================================

def generate_performance_report(ledger: dict) -> dict:
    """
    Generate comprehensive performance metrics from trade history.
    
    Returns dict with:
    - capital_initial, capital_current
    - total_net_pnl
    - win_rate
    - profit_factor
    - max_drawdown
    - avg_pnl_per_trade
    - total_trades, winning_trades, losing_trades
    """
    trades = ledger.get("trades", [])
    closed_trades = [t for t in trades if t.get("status") in ("CLOSED_PROFIT", "CLOSED_LOSS")]
    
    if not closed_trades:
        report = {
            "capital_initial_USDC": ledger.get("capital_initial_USDC", INITIAL_CAPITAL_USDC),
            "capital_current_USDC": ledger.get("capital_current_USDC", INITIAL_CAPITAL_USDC),
            "total_net_pnl_USDC": 0,
            "win_rate_percent": 0,
            "profit_factor": 0,
            "max_drawdown_percent": 0,
            "avg_pnl_per_trade_USDC": 0,
            "total_trades": len(trades),
            "open_trades": len([t for t in trades if t.get("status") == "OPEN"]),
            "closed_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "total_fees_paid_USDC": 0
        }
        print_report(report)
        return report
    
    # Calculate metrics
    winning_trades = [t for t in closed_trades if t.get("net_pnl_USDC", 0) >= 0]
    losing_trades = [t for t in closed_trades if t.get("net_pnl_USDC", 0) < 0]
    
    total_gross_profit = sum(t.get("gross_pnl_USDC", 0) for t in winning_trades)
    total_gross_loss = abs(sum(t.get("gross_pnl_USDC", 0) for t in losing_trades))
    total_net_pnl = sum(t.get("net_pnl_USDC", 0) for t in closed_trades)
    total_fees = sum(t.get("fees_simulated", 0) for t in closed_trades)
    
    win_rate = (len(winning_trades) / len(closed_trades) * 100) if closed_trades else 0
    profit_factor = (total_gross_profit / total_gross_loss) if total_gross_loss > 0 else float('inf')
    avg_pnl = total_net_pnl / len(closed_trades) if closed_trades else 0
    
    # Calculate max drawdown
    max_drawdown = calculate_max_drawdown(closed_trades, ledger.get("capital_initial_USDC", INITIAL_CAPITAL_USDC))
    
    report = {
        "capital_initial_USDC": ledger.get("capital_initial_USDC", INITIAL_CAPITAL_USDC),
        "capital_current_USDC": ledger.get("capital_current_USDC", INITIAL_CAPITAL_USDC),
        "total_net_pnl_USDC": round(total_net_pnl, 2),
        "win_rate_percent": round(win_rate, 2),
        "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else "∞",
        "max_drawdown_percent": round(max_drawdown, 2),
        "avg_pnl_per_trade_USDC": round(avg_pnl, 2),
        "total_trades": len(trades),
        "open_trades": len([t for t in trades if t.get("status") == "OPEN"]),
        "closed_trades": len(closed_trades),
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "total_fees_paid_USDC": round(total_fees, 2)
    }
    
    print_report(report)
    return report


def calculate_max_drawdown(closed_trades: list, initial_capital: float) -> float:
    """Calculate maximum drawdown percentage from equity curve."""
    if not closed_trades:
        return 0
    
    # Sort by close date
    sorted_trades = sorted(closed_trades, key=lambda t: t.get("date_cloture", ""))
    
    equity = initial_capital
    peak = initial_capital
    max_dd = 0
    
    for trade in sorted_trades:
        pnl = trade.get("net_pnl_USDC", 0)
        equity += pnl
        
        if equity > peak:
            peak = equity
        
        dd = ((peak - equity) / peak * 100) if peak > 0 else 0
        max_dd = max(max_dd, dd)
    
    return max_dd


def print_report(report: dict) -> None:
    """Pretty print the performance report."""
    print("\n" + "=" * 60)
    print("📊 PERFORMANCE REPORT - POLYMARKET SNIPER")
    print("=" * 60)
    print(f"💰 Capital Initial:    ${report['capital_initial_USDC']:,.2f}")
    print(f"💵 Capital Current:    ${report['capital_current_USDC']:,.2f}")
    print(f"📈 Total Net P&L:      ${report['total_net_pnl_USDC']:+,.2f}")
    print("-" * 60)
    print(f"🎯 Win Rate:           {report['win_rate_percent']:.1f}%")
    print(f"⚖️  Profit Factor:      {report['profit_factor']}")
    print(f"📉 Max Drawdown:       {report['max_drawdown_percent']:.1f}%")
    print(f"📊 Avg P&L/Trade:      ${report['avg_pnl_per_trade_USDC']:+,.2f}")
    print("-" * 60)
    print(f"📋 Total Trades:       {report['total_trades']}")
    print(f"    ├─ Open:           {report['open_trades']}")
    print(f"    ├─ Won:            {report['winning_trades']}")
    print(f"    └─ Lost:           {report['losing_trades']}")
    print(f"💸 Total Fees Paid:    ${report['total_fees_paid_USDC']:.2f}")
    print("=" * 60 + "\n")


# =============================================================================
# 8. MAIN ORCHESTRATOR
# =============================================================================

async def handle_new_market(market: dict, ledger: dict, client: "httpx.AsyncClient") -> None:
    """
    Callback for new market detection. Analyzes and potentially snipes.
    """
    # Extract prices for display
    outcomes = market.get("outcomes", [])
    outcome_prices = market.get("outcomePrices", [])
    
    # Fallback: try tokens array
    if not outcome_prices:
        tokens = market.get("tokens", [])
        if tokens:
            outcomes = [str(t.get("outcome", "?")) for t in tokens]
            outcome_prices = [t.get("price", 0) for t in tokens]
    
    # Fallback: try clobTokenIds for price info
    if not outcome_prices:
        outcome_prices = [market.get("bestBid", 0), market.get("bestAsk", 0)]
    
    # Format prices for display
    price_str = ""
    try:
        # Convert to floats
        prices = []
        for p in outcome_prices[:2]:
            if isinstance(p, str):
                prices.append(float(p) if p else 0.5)
            else:
                prices.append(float(p) if p else 0.5)
        
        if len(prices) >= 2 and any(p > 0 for p in prices):
            o1 = outcomes[0] if outcomes else "YES"
            o2 = outcomes[1] if len(outcomes) > 1 else "NO"
            price_str = f"[{o1}:{prices[0]:.2f} | {o2}:{prices[1]:.2f}]"
        else:
            price_str = "[No odds yet]"
    except Exception as e:
        price_str = "[Prix N/A]"
    
    should_snipe, outcome, amount, adjusted_price = analyze_sniping_opportunity(market)
    
    if should_snipe:
        print(f"🎯 OPPORTUNITE DETECTEE! {market.get('question', '')[:50]}...")
        print(f"   Prix: {price_str} -> Achat {outcome} @ ${adjusted_price:.4f}")
        
        # Monitor/Send Signal to Dashboard API
        try:
            signal_data = {
                "level": "SNIPE",
                "message": f"Snipe: {market.get('question', '')[:40]}... [{outcome} @ ${adjusted_price:.4f}]",
                "market": market.get('question', ''),
                "price": adjusted_price,
                "outcome": outcome
            }
            # Fire and forget signal (non-blocking) - assuming localhost:3000
            asyncio.create_task(client.post("http://localhost:3001/api/sniper/signals", json=signal_data))
        except Exception:
            pass

        await simulate_snipe_order(market, outcome, amount, adjusted_price, ledger)
    else:
        # Show brief analysis even for skipped markets
        print(f"📊 {market.get('question', 'Unknown')[:55]}... {price_str}")
        
        # Send "Scanned" signal to Dashboard (so it appears in Snipe Console)
        try:
            signal_data = {
                "level": "SNIPE", # Using SNIPE level so it appears in the requested category
                "message": f"Scanned: {market.get('question', '')[:40]}... {price_str}",
                "market": market.get('question', ''),
                "price": outcome_prices[0] if outcome_prices else 0, # Best effort price
                "outcome": "SKIP"
            }
            asyncio.create_task(client.post("http://localhost:3001/api/sniper/signals", json=signal_data))
        except Exception:
            pass


async def main():
    """Main entry point for the sniper bot."""
    if not HTTPX_AVAILABLE:
        print("❌ Cannot run without httpx. Install with: pip install httpx")
        return
    
    print("\n" + "=" * 60)
    print("🚀 POLYMARKET SNIPER v1.0 - Paper Trading Mode")
    print("=" * 60)
    print(f"📁 Ledger: {LEDGER_FILE}")
    print(f"💵 Max Bet: ${MAX_BET_USDC} | Price Tolerance: {PRICE_TOLERANCE}")
    print(f"🎯 Take Profit: {TAKE_PROFIT_TARGET_CENTS*100:.0f} cents")
    print(f"📡 API Strategy: Dynamic polling (~{TARGET_API_CALLS_PER_HOUR} calls/hour)")
    print(f"   Each scan fetches ALL active markets to detect new ones")
    print("=" * 60 + "\n")
    
    ledger = load_ledger()
    print(f"💰 Current Capital: ${ledger['capital_current_USDC']:,.2f}")
    print(f"📊 Open Positions: {len([t for t in ledger.get('trades', []) if t.get('status') == 'OPEN'])}")
    print()
    
    async with httpx.AsyncClient() as client:
        # Create tasks for monitoring and position checking
        monitor_task = asyncio.create_task(
            monitor_new_markets(ledger, client, handle_new_market)
        )
        
        # Periodic position checking (every 30 seconds)
        async def position_checker():
            while True:
                await asyncio.sleep(30)
                await check_and_close_positions(ledger, client)
        
        checker_task = asyncio.create_task(position_checker())
        
        try:
            await asyncio.gather(monitor_task, checker_task)
        except KeyboardInterrupt:
            print("\n🛑 Shutting down...")
            monitor_task.cancel()
            checker_task.cancel()
            generate_performance_report(ledger)


# =============================================================================
# CLI INTERFACE
# =============================================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--report":
            # Just show report and exit
            ledger = load_ledger()
            generate_performance_report(ledger)
        elif sys.argv[1] == "--reset":
            # Reset the ledger
            if LEDGER_FILE.exists():
                os.remove(LEDGER_FILE)
            print("🔄 Ledger reset. Starting fresh on next run.")
        elif sys.argv[1] == "--help":
            print("""
Polymarket Sniper v1.0 - Paper Trading

Usage:
    python polymarket_sniper.py          # Run the sniper bot
    python polymarket_sniper.py --report # Show performance report
    python polymarket_sniper.py --reset  # Reset the virtual ledger
    python polymarket_sniper.py --help   # Show this help
""")
        else:
            print(f"Unknown option: {sys.argv[1]}")
    else:
        # Normal run
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
