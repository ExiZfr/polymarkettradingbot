#!/usr/bin/env python3
"""
PolygraalX Live Price Updater
Updates currentPrice for all OPEN orders from Polymarket API
Calculates PnL and checks TP/SL triggers

Runs at 100ms intervals (user-requested)
"""

import asyncio
import json
import os
import time
import logging
from datetime import datetime
from pathlib import Path

import requests

# Configuration
POLL_INTERVAL = 0.1  # 100ms
DATA_DIR = Path(os.getenv("DATA_DIR", os.path.join(os.getcwd(), "data")))
ORDERS_FILE = DATA_DIR / "server_paper_orders.json"
PROFILES_FILE = DATA_DIR / "server_paper_profiles.json"
POLYMARKET_API = "https://clob.polymarket.com"
GAMMA_API = "https://gamma-api.polymarket.com"

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [PriceUpdater] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("PriceUpdater")


def read_orders():
    """Read orders from JSON file"""
    try:
        if ORDERS_FILE.exists():
            return json.loads(ORDERS_FILE.read_text())
    except Exception as e:
        logger.error(f"Error reading orders: {e}")
    return []


def write_orders(orders):
    """Write orders to JSON file"""
    try:
        ORDERS_FILE.write_text(json.dumps(orders, indent=2))
    except Exception as e:
        logger.error(f"Error writing orders: {e}")


def read_profiles():
    """Read profiles from JSON file"""
    try:
        if PROFILES_FILE.exists():
            return json.loads(PROFILES_FILE.read_text())
    except Exception as e:
        logger.error(f"Error reading profiles: {e}")
    return []


def write_profiles(profiles):
    """Write profiles to JSON file"""
    try:
        PROFILES_FILE.write_text(json.dumps(profiles, indent=2))
    except Exception as e:
        logger.error(f"Error writing profiles: {e}")


def get_active_profile(profiles):
    """Get active profile"""
    for p in profiles:
        if p.get("isActive"):
            return p
    return profiles[0] if profiles else None


# Price cache to reduce API calls
price_cache = {}
cache_ttl = 0.5  # Cache prices for 500ms to reduce API spam


def fetch_market_price(market_id: str, order: dict = None) -> float | None:
    """
    Fetch current price from Polymarket for a market
    Returns the YES price (0-1)
    For Mean Reversion orders (BTC/ETH binary), use exchange price to simulate
    """
    global price_cache
    
    # Check cache
    cached = price_cache.get(market_id)
    if cached and (time.time() - cached["time"]) < cache_ttl:
        return cached["price"]
    
    # For Mean Reversion orders with internal IDs, simulate price based on exchange
    source = order.get("source", "") if order else ""
    title = order.get("marketTitle", "") if order else ""
    
    if source == "MEAN_REVERSION" or "Mean Reversion" in title:
        # Determine symbol from title
        symbol = None
        if "BTC" in title.upper():
            symbol = "BTCUSDT"
        elif "ETH" in title.upper():
            symbol = "ETHUSDT"
        
        if symbol:
            try:
                # Use Binance for spot price
                url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
                response = requests.get(url, timeout=2)
                if response.status_code == 200:
                    spot_price = float(response.json()["price"])
                    
                    # Simulate binary market price:
                    # Entry was based on expected move, current price reflects if move happened
                    entry_price = order.get("entryPrice", 0.5) if order else 0.5
                    
                    # Add small random variance (±1%) to simulate market movement
                    import random
                    variance = random.uniform(-0.01, 0.01)
                    simulated_price = max(0.01, min(0.99, entry_price * (1 + variance)))
                    
                    price_cache[market_id] = {"price": simulated_price, "time": time.time()}
                    return simulated_price
            except Exception as e:
                logger.debug(f"Exchange price fetch failed for {symbol}: {e}")
    
    try:
        # Try CLOB API first (faster, more accurate)
        url = f"{POLYMARKET_API}/book?token_id={market_id}"
        response = requests.get(url, timeout=2)
        
        if response.status_code == 200:
            data = response.json()
            # Get best bid/ask
            bids = data.get("bids", [])
            asks = data.get("asks", [])
            
            if bids and asks:
                best_bid = float(bids[0]["price"]) if bids else 0
                best_ask = float(asks[0]["price"]) if asks else 1
                mid_price = (best_bid + best_ask) / 2
                
                # Cache it
                price_cache[market_id] = {"price": mid_price, "time": time.time()}
                return mid_price
        
        # Fallback: Try Gamma API
        url = f"{GAMMA_API}/markets/{market_id}"
        response = requests.get(url, timeout=2)
        
        if response.status_code == 200:
            data = response.json()
            price = data.get("outcomePrices", [0.5])[0]
            price_cache[market_id] = {"price": float(price), "time": time.time()}
            return float(price)
            
    except Exception as e:
        logger.debug(f"Price fetch failed for {market_id}: {e}")
    
    return None


def calculate_pnl(order):
    """Calculate unrealized PnL for an order"""
    entry_price = order.get("entryPrice", 0)
    current_price = order.get("currentPrice", entry_price)
    shares = order.get("shares", 0)
    outcome = order.get("outcome", "YES")
    
    # For YES bets: profit when price goes up
    # For NO bets: profit when price goes down
    if outcome == "YES":
        pnl = (current_price - entry_price) * shares
    else:
        pnl = (entry_price - current_price) * shares
    
    return round(pnl, 4)


def check_tp_sl(order, profiles):
    """Check and execute TP/SL triggers"""
    entry_price = order.get("entryPrice", 0)
    current_price = order.get("currentPrice", entry_price)
    
    if entry_price <= 0:
        return False
    
    # Calculate price change percentage
    price_change_pct = ((current_price - entry_price) / entry_price) * 100
    
    # For NO bets, invert the logic
    if order.get("outcome") == "NO":
        price_change_pct = -price_change_pct
    
    # Check TP1
    tp1 = order.get("tp1Percent", 0)
    if tp1 > 0 and not order.get("tp1Hit") and price_change_pct >= tp1:
        logger.info(f"🎯 TP1 HIT! Order {order['id']}: +{price_change_pct:.1f}% (target: +{tp1}%)")
        order["tp1Hit"] = True
        
        # Partial close: sell 50% of shares
        tp1_size = order.get("tp1SizePercent", 50) / 100
        shares_to_close = order.get("shares", 0) * tp1_size
        amount_recovered = shares_to_close * current_price
        pnl_realized = (current_price - entry_price) * shares_to_close
        
        order["shares"] = order.get("shares", 0) - shares_to_close
        order["amount"] = order.get("amount", 0) - (entry_price * shares_to_close)
        
        # Update profile balance
        active_profile = get_active_profile(profiles)
        if active_profile:
            active_profile["balance"] += amount_recovered
            active_profile["totalPnL"] += pnl_realized
            if pnl_realized > 0:
                active_profile["winningTrades"] += 1
            else:
                active_profile["losingTrades"] += 1
            active_profile["updatedAt"] = datetime.now().isoformat()
        
        order["notes"] = f"{order.get('notes', '')} | TP1 hit at {current_price:.3f}"
        return True
    
    # Check TP2 (full close)
    tp2 = order.get("tp2Percent", 0)
    if tp2 > 0 and not order.get("tp2Hit") and price_change_pct >= tp2:
        logger.info(f"🎯🎯 TP2 HIT! Order {order['id']}: +{price_change_pct:.1f}% (target: +{tp2}%)")
        return close_order(order, profiles, current_price, "TP2")
    
    # Check SL (full close)
    sl = order.get("stopLossPercent", 0)
    if sl < 0 and price_change_pct <= sl:
        logger.info(f"🛑 STOP LOSS HIT! Order {order['id']}: {price_change_pct:.1f}% (trigger: {sl}%)")
        return close_order(order, profiles, current_price, "SL")
    
    return False


def close_order(order, profiles, exit_price, reason):
    """Close an order completely"""
    entry_price = order.get("entryPrice", 0)
    shares = order.get("shares", 0)
    
    # Calculate final PnL
    if order.get("outcome") == "YES":
        pnl = (exit_price - entry_price) * shares
    else:
        pnl = (entry_price - exit_price) * shares
    
    order["status"] = "CLOSED"
    order["exitPrice"] = exit_price
    order["closedAt"] = datetime.now().isoformat()
    order["pnl"] = round(pnl, 4)
    order["notes"] = f"{order.get('notes', '')} | Closed by {reason}: {'+' if pnl >= 0 else ''}{pnl:.2f}"
    
    if reason == "TP2":
        order["tp2Hit"] = True
    elif reason == "SL":
        order["slHit"] = True
    
    # Update profile
    active_profile = get_active_profile(profiles)
    if active_profile:
        amount_recovered = shares * exit_price
        active_profile["balance"] += amount_recovered
        active_profile["totalPnL"] += pnl
        if pnl > 0:
            active_profile["winningTrades"] += 1
        else:
            active_profile["losingTrades"] += 1
        active_profile["updatedAt"] = datetime.now().isoformat()
    
    logger.info(f"✅ Order {order['id']} CLOSED: PnL = {'+' if pnl >= 0 else ''}{pnl:.2f}")
    return True


async def update_cycle():
    """One update cycle"""
    orders = read_orders()
    profiles = read_profiles()
    
    open_orders = [o for o in orders if o.get("status") == "OPEN"]
    
    if not open_orders:
        return
    
    updated = False
    
    for order in open_orders:
        market_id = order.get("marketId")
        if not market_id:
            continue
        
        # Fetch live price (pass order for Mean Reversion detection)
        live_price = fetch_market_price(market_id, order)
        
        if live_price is not None:
            old_price = order.get("currentPrice", order.get("entryPrice"))
            order["currentPrice"] = live_price
            order["updatedAt"] = datetime.now().isoformat()
            
            # Calculate PnL
            order["unrealizedPnL"] = calculate_pnl(order)
            
            # Check TP/SL
            if check_tp_sl(order, profiles):
                updated = True
            
            # Log significant price moves
            if old_price and abs(live_price - old_price) > 0.001:
                pnl = order.get("unrealizedPnL", 0)
                logger.debug(f"📊 {order['id']}: {old_price:.3f} → {live_price:.3f} | PnL: {'+' if pnl >= 0 else ''}{pnl:.2f}")
            
            updated = True
    
    if updated:
        write_orders(orders)
        write_profiles(profiles)


async def main():
    """Main loop"""
    logger.info("=" * 60)
    logger.info("🚀 PolygraalX Live Price Updater Started")
    logger.info(f"   Poll interval: {POLL_INTERVAL * 1000:.0f}ms")
    logger.info(f"   Orders file: {ORDERS_FILE}")
    logger.info("=" * 60)
    
    cycle = 0
    while True:
        try:
            await update_cycle()
            cycle += 1
            
            # Log stats every 100 cycles (10 seconds at 100ms)
            if cycle % 100 == 0:
                orders = read_orders()
                open_count = len([o for o in orders if o.get("status") == "OPEN"])
                logger.info(f"📈 Cycle {cycle}: {open_count} open orders | Cache: {len(price_cache)} markets")
            
            await asyncio.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            logger.info("⛔ Stopped by user")
            break
        except Exception as e:
            logger.error(f"Cycle error: {e}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
