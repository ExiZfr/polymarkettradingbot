# PolyGraalX - Real Polymarket Trading Integration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements-polymarket.txt
```

### 2. Configure Credentials

1. Copy the example environment file:
```bash
cp env.polymarket.example .env
```

2. Edit `.env` and fill in your credentials:
   - Get **CLOB API credentials** from: https://polymarket.com/settings/api
   - Your **Private Key (PK)** from your wallet
   - Your **Proxy Address** (where USDC is held on Polymarket)

### 3. Test Connection

```bash
python scripts/polymarket_trader.py
```

This will:
- ✅ Connect to Polymarket CLOB
- 💰 Show your USDC balance
- 📊 Ready to execute trades!

## 📖 Usage

### Basic Example

```python
import asyncio
from scripts.polymarket_trader import PolymarketTrader

async def main():
    # Initialize trader
    trader = PolymarketTrader()
    
    # Check balance
    balance = await trader.get_balance()
    print(f"Balance: ${balance:,.2f} USDC")
    
    # Execute market order
    result = await trader.execute_market_order(
        token_id="YOUR_TOKEN_ID",  # Get from Polymarket API
        amount_usd=5.0,  # Start small!
        side="BUY"  # or "SELL"
    )
    
    if result["success"]:
        # Track order status
        status = await trader.get_order_status(result["order_id"])
        print(f"Order Status: {status['status']}")
    
    await trader.close()

asyncio.run(main())
```

## 🔐 Security Best Practices

> **⚠️ CRITICAL: Real Money at Risk**

1. **Never commit `.env`** - It contains your private key!
2. **Start with small amounts** ($1-5) to test
3. **Verify all parameters** before executing trades
4. **Monitor your Proxy Wallet** on Polymarket UI
5. **Keep private key secure** - Never share or expose

## 📚 API Methods

### `get_balance()` → float
Returns USDC balance on Proxy Wallet.

### `execute_market_order(token_id, amount_usd, side)` → dict
Executes market buy/sell order.
- `token_id`: Polymarket conditional token ID
- `amount_usd`: Amount in USDC (e.g., 10.0)
- `side`: "BUY" or "SELL"

### `get_order_status(order_id)` → dict
Tracks order execution status.

## 🐛 Troubleshooting

### "Missing env variables"
- Ensure `.env` file exists and all variables are filled

### "Failed to initialize CLOB client"
- Check API credentials are correct
- Verify private key format (starts with `0x`)

### "Balance is 0"
- Deposit USDC to your Polymarket Proxy Wallet
- Check proxy address is correct

## 📞 Support

For Polymarket API issues:
- Docs: https://docs.polymarket.com
- Discord: https://discord.gg/polymarket

---

**Made with ❤️ by PolyGraalX Team**
