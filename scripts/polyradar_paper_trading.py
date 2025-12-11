"""
PolyRadar - Paper Trading Integration
======================================

Helpers to submit trades to the dashboard's paper trading system.
"""

import json
import os
import logging
from typing import Optional
from polyradar_module1_radar import WhaleSignal
from polyradar_module2_intelligence import WalletProfile
from polyradar_module3_decision import TradingDecision

logger = logging.getLogger(__name__)

QUEUE_FILE = os.path.join(os.path.dirname(__file__), 'radar_pending_trades.json')


def submit_trade_to_paper_trading(decision: TradingDecision, signal: WhaleSignal, profile: WalletProfile) -> bool:
    """
    Submit a trade to the paper trading queue
    
    The dashboard will poll this file and execute trades automatically
    
    Args:
        decision: Trading decision from DecisionEngine
        signal: Original whale signal
        profile: Wallet profile analysis
    
    Returns:
        True if successfully queued, False otherwise
    """
    try:
        # Create trade object
        trade = {
            "id": f"RT_{int(signal.timestamp)}_{signal.wallet_address[:8]}",
            "market_id": signal.market_id,
            "market_title": f"Market #{signal.market_id}",  # Mock - in production, fetch real title
            "outcome": signal.outcome,
            "price": decision.limit_price,
            "amount": decision.position_size_usd,
            "whale_wallet": signal.wallet_address,
            "wallet_category": profile.category,
            "confidence_score": decision.confidence_score,
            "timestamp": signal.timestamp
        }
        
        # Read existing queue
        queue = []
        if os.path.exists(QUEUE_FILE):
            try:
                with open(QUEUE_FILE, 'r') as f:
                    queue = json.load(f)
            except json.JSONDecodeError:
                queue = []
        
        # Add new trade
        queue.append(trade)
        
        # Write back
        with open(QUEUE_FILE, 'w') as f:
            json.dump(queue, f, indent=2)
        
        logger.info(f"✅ Trade queued for paper trading: ${trade['amount']:.2f} on {trade['outcome']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to queue trade: {e}")
        return False


def clear_trade_queue():
    """Clear the trade queue file"""
    try:
        with open(QUEUE_FILE, 'w') as f:
            json.dump([], f)
        logger.info("🧹 Trade queue cleared")
    except Exception as e:
        logger.error(f"Error clearing queue: {e}")
