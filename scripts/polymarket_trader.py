#!/usr/bin/env python3
"""
PolyGraalX - Real Polymarket Trading Integration
================================================
Production-ready CLOB client for executing real trades on Polymarket.

Author: PolyGraalX Team
License: MIT
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
from decimal import Decimal
from dotenv import load_dotenv

try:
    from py_clob_client.client import ClobClient
    from py_clob_client.constants import POLYGON
except ImportError:
    raise ImportError(
        "py_clob_client not installed. Run: pip install py-clob-client"
    )

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [PolymarketTrader] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


class PolymarketTrader:
    """
    Production-ready Polymarket CLOB trading client.
    
    Features:
    - Async/await for non-blocking operations
    - Comprehensive error handling
    - USDC balance checking on Proxy Wallet
    - Market order execution
    - Order status tracking
    
    Environment Variables Required:
    - PK: Private key of EOA wallet (0x...)
    - CLOB_API_KEY: API key from Polymarket
    - CLOB_SECRET: API secret
    - CLOB_PASSPHRASE: API passphrase
    - PROXY_ADDRESS: Polymarket Proxy Wallet contract address
    """
    
    def __init__(self, chain_id: int = POLYGON):
        """
        Initialize Polymarket CLOB client.
        
        Args:
            chain_id: Blockchain network (default: Polygon Mainnet = 137)
        
        Raises:
            ValueError: If required env variables are missing
        """
        logger.info("=" * 60)
        logger.info("🚀 Initializing PolymarketTrader")
        logger.info("=" * 60)
        
        # Load credentials from environment
        self.private_key = os.getenv("PK")
        self.api_key = os.getenv("CLOB_API_KEY")
        self.api_secret = os.getenv("CLOB_SECRET")
        self.api_passphrase = os.getenv("CLOB_PASSPHRASE")
        self.proxy_address = os.getenv("PROXY_ADDRESS")
        
        # Validate credentials
        if not all([self.private_key, self.api_key, self.api_secret, 
                   self.api_passphrase, self.proxy_address]):
            missing = [k for k, v in {
                "PK": self.private_key,
                "CLOB_API_KEY": self.api_key,
                "CLOB_SECRET": self.api_secret,
                "CLOB_PASSPHRASE": self.api_passphrase,
                "PROXY_ADDRESS": self.proxy_address
            }.items() if not v]
            raise ValueError(f"Missing env variables: {', '.join(missing)}")
        
        # Initialize CLOB client
        try:
            self.client = ClobClient(
                host="https://clob.polymarket.com",
                key=self.api_key,
                secret=self.api_secret,
                passphrase=self.api_passphrase,
                chain_id=chain_id,
                private_key=self.private_key,
                signature_type=2  # EIP-712 for Polygon
            )
            logger.info(f"✅ Connected to Polymarket CLOB (Chain ID: {chain_id})")
            logger.info(f"📍 Proxy Wallet: {self.proxy_address[:10]}...{self.proxy_address[-8:]}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize CLOB client: {e}")
            raise
    
    async def get_balance(self) -> float:
        """
        Get USDC balance on Polymarket Proxy Wallet.
        
        Returns:
            float: USDC balance (human-readable, e.g., 1000.50)
        
        Raises:
            Exception: If API call fails
        """
        try:
            logger.info("💰 Fetching USDC balance...")
            
            # Get balance from CLOB
            balance_response = await asyncio.to_thread(
                self.client.get_balance
            )
            
            # Parse balance (CLOB returns in smallest unit)
            raw_balance = balance_response.get("balance", "0")
            usdc_balance = float(raw_balance) / 1e6  # USDC has 6 decimals
            
            logger.info(f"✅ Current USDC Balance: ${usdc_balance:,.2f}")
            return usdc_balance
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch balance: {e}")
            raise
    
    async def execute_market_order(
        self,
        token_id: str,
        amount_usd: float,
        side: str  # "BUY" or "SELL"
    ) -> Dict[str, Any]:
        """
        Execute a market order on Polymarket.
        
        Args:
            token_id: Polymarket token ID (e.g., conditional token for YES/NO)
            amount_usd: Amount in USDC to trade (e.g., 10.0)
            side: "BUY" or "SELL"
        
        Returns:
            dict: Order response with order_id, status, etc.
        
        Raises:
            ValueError: If inputs are invalid
            Exception: If order execution fails
        """
        # Validate inputs
        if side not in ["BUY", "SELL"]:
            raise ValueError(f"Invalid side: {side}. Must be 'BUY' or 'SELL'")
        
        if amount_usd <= 0:
            raise ValueError(f"Invalid amount: {amount_usd}. Must be > 0")
        
        try:
            logger.info("=" * 60)
            logger.info(f"📊 Executing Market Order")
            logger.info(f"   Token ID: {token_id}")
            logger.info(f"   Side: {side}")
            logger.info(f"   Amount: ${amount_usd:.2f} USDC")
            logger.info("=" * 60)
            
            # Convert amount to smallest unit (USDC has 6 decimals)
            raw_amount = int(amount_usd * 1e6)
            
            # Create market order
            order_response = await asyncio.to_thread(
                self.client.create_market_order,
                token_id=token_id,
                amount=str(raw_amount),
                side=side.upper()
            )
            
            order_id = order_response.get("orderID")
            status = order_response.get("status")
            
            logger.info(f"✅ Order Submitted!")
            logger.info(f"   Order ID: {order_id}")
            logger.info(f"   Status: {status}")
            
            return {
                "success": True,
                "order_id": order_id,
                "status": status,
                "token_id": token_id,
                "amount_usd": amount_usd,
                "side": side,
                "response": order_response
            }
            
        except Exception as e:
            logger.error(f"❌ Order execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "token_id": token_id,
                "amount_usd": amount_usd,
                "side": side
            }
    
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """
        Get the status of an existing order.
        
        Args:
            order_id: Order ID returned from execute_market_order
        
        Returns:
            dict: Order details (status, filled amount, etc.)
        
        Raises:
            Exception: If API call fails
        """
        try:
            logger.info(f"🔍 Checking order status: {order_id}")
            
            order_details = await asyncio.to_thread(
                self.client.get_order,
                order_id=order_id
            )
            
            status = order_details.get("status")
            filled_amount = order_details.get("sizeMatched", "0")
            
            logger.info(f"   Status: {status}")
            logger.info(f"   Filled: {filled_amount}")
            
            return {
                "order_id": order_id,
                "status": status,
                "filled_amount": filled_amount,
                "details": order_details
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch order status: {e}")
            raise
    
    async def close(self):
        """Clean up resources."""
        logger.info("👋 Closing PolymarketTrader")


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def main():
    """Example usage of PolymarketTrader"""
    
    try:
        # Initialize trader
        trader = PolymarketTrader()
        
        # Check balance
        balance = await trader.get_balance()
        print(f"\n💰 Available: ${balance:,.2f} USDC\n")
        
        # Example: Place a small test order
        # UNCOMMENT TO EXECUTE REAL TRADE (START WITH $1-5 FOR TESTING!)
        """
        result = await trader.execute_market_order(
            token_id="YOUR_TOKEN_ID_HERE",  # Get from Polymarket API
            amount_usd=1.0,  # Start small!
            side="BUY"
        )
        
        if result["success"]:
            order_id = result["order_id"]
            
            # Wait a moment for order to process
            await asyncio.sleep(2)
            
            # Check status
            status = await trader.get_order_status(order_id)
            print(f"Order Status: {status}")
        """
        
        # Clean up
        await trader.close()
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
