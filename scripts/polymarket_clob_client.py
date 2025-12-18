#!/usr/bin/env python3
"""
Polymarket CLOB Client
Handles real order execution on Polymarket using CLOB API
"""

import os
import logging
from typing import Optional, Dict, Any
from decimal import Decimal

try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import OrderArgs, OrderType
    from py_clob_client.constants import POLYGON
except ImportError:
    print("ERROR: py-clob-client not installed. Run: pip install py-clob-client")
    ClobClient = None

logger = logging.getLogger(__name__)

class PolymarketCLOBClient:
    """Client for interacting with Polymarket CLOB API"""
    
    def __init__(self):
        """Initialize CLOB client with credentials from environment"""
        if ClobClient is None:
            raise ImportError("py-clob-client not installed")
        
        # Get credentials from environment
        self.private_key = os.getenv("POLYMARKET_PRIVATE_KEY")
        self.api_key = os.getenv("POLYMARKET_API_KEY")
        self.api_secret = os.getenv("POLYMARKET_API_SECRET")
        self.api_passphrase = os.getenv("POLYMARKET_API_PASSPHRASE")
        self.funder_address = os.getenv("POLYMARKET_FUNDER_ADDRESS")
        
        # Validate credentials
        if not all([self.private_key, self.api_key, self.api_secret, self.api_passphrase]):
            raise ValueError("Missing Polymarket credentials in environment variables")
        
        # Initialize client
        self.client = ClobClient(
            host="https://clob.polymarket.com",
            key=self.private_key,
            chain_id=POLYGON,
            api_creds={
                "key": self.api_key,
                "secret": self.api_secret,
                "passphrase": self.api_passphrase
            }
        )
        
        logger.info(f"✅ CLOB client initialized for {self.funder_address[:10]}...")
    
    def get_balance(self) -> float:
        """Get USDC balance for funder address"""
        try:
            # Get balance from CLOB API
            balance_data = self.client.get_balance()
            usdc_balance = float(balance_data.get("usdc", 0))
            logger.info(f"💰 USDC Balance: ${usdc_balance:.2f}")
            return usdc_balance
        except Exception as e:
            logger.error(f"Error fetching balance: {e}")
            return 0.0
    
    def place_order(
        self,
        token_id: str,
        side: str,  # "BUY" or "SELL"
        size: float,  # Amount in USD
        price: float,  # Limit price (0-1)
        market_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Place a limit order on Polymarket
        
        Args:
            token_id: Conditional token ID
            side: "BUY" or "SELL"
            size: Position size in USD
            price: Limit price between 0 and 1
            market_id: Market ID (optional, for logging)
        
        Returns:
            Order response or None if failed
        """
        try:
            # Validate inputs
            if not 0 < price < 1:
                logger.error(f"Invalid price: {price}. Must be between 0 and 1")
                return None
            
            if size < 1:
                logger.error(f"Size too small: ${size}. Minimum is $1")
                return None
            
            # Create order arguments
            order_args = OrderArgs(
                token_id=token_id,
                price=Decimal(str(price)),
                size=Decimal(str(size)),
                side=side.upper(),
                funder=self.funder_address
            )
            
            logger.info(f"📤 Placing {side} order: ${size} @ {price:.3f} on token {token_id[:10]}...")
            
            # Place order via CLOB
            signed_order = self.client.create_order(order_args)
            response = self.client.post_order(signed_order, OrderType.GTC)
            
            order_id = response.get("orderID")
            logger.info(f"✅ Order placed successfully! ID: {order_id}")
            
            return {
                "success": True,
                "order_id": order_id,
                "token_id": token_id,
                "side": side,
                "size": size,
                "price": price,
                "response": response
            }
            
        except Exception as e:
            logger.error(f"❌ Error placing order: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order"""
        try:
            self.client.cancel_order(order_id)
            logger.info(f"🚫 Order {order_id} cancelled")
            return True
        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            return False
    
    def get_order_status(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get status of an order"""
        try:
            order = self.client.get_order(order_id)
            return order
        except Exception as e:
            logger.error(f"Error fetching order status: {e}")
            return None


def test_connection():
    """Test CLOB connection and credentials"""
    try:
        client = PolymarketCLOBClient()
        balance = client.get_balance()
        print(f"✅ Connection successful!")
        print(f"💰 USDC Balance: ${balance:.2f}")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


if __name__ == "__main__":
    # Test connection when run directly
    logging.basicConfig(level=logging.INFO)
    test_connection()
