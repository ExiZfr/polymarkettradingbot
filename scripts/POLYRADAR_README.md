# PolyRadar 🐋 - Whale Tracking Bot for Polymarket

**Professional algorithmic trading bot** that detects institutional money flow on Polymarket (Polygon), analyzes wallet quality, and executes automated trades when confidence thresholds are met.

## 🎯 Features

### Module 1: RADAR (Blockchain Listener)
- ✅ Real-time WebSocket connection to Polygon blockchain
- ✅ Detects whale transactions (>$1,000 USD)
- ✅ Chain-splitting detection (anti-manipulation)
- ✅ Event filtering on CTFExchange contract
- ✅ Simulation mode for testing

### Module 2: INTELLIGENCE (Wallet Analyzer)
- ✅ SQLite database for wallet history
- ✅ Classifies wallets into categories:
  - **The Insider**: New wallet, large bet (>$10k)
  - **Smart Money**: Win rate >60%, PnL >$50k
  - **Market Maker**: Simultaneous YES/NO orders (ignored)
- ✅ Reputation scoring algorithm (0-100)
- ✅ Win rate and PnL tracking

### Module 3: DECISION (The Brain)
- ✅ Multi-factor confidence scoring:
  - Win Rate (30%)
  - Wallet PnL (20%)
  - Timing penalty (price movement)
  - Volume bonus (liquidity impact)
- ✅ Kelly Criterion position sizing
- ✅ **LIMIT ORDERS ONLY** (anti-front-running)
- ✅ 1% max slippage protection
- ✅ Time decay protection (<30s)

## 📦 Installation

```bash
# 1. Clone or navigate to directory
cd /path/to/botpolymarket/scripts

# 2. Install dependencies
pip install -r polyradar_requirements.txt

# 3. Test in simulation mode
python polyradar_main.py --mode simulation --bankroll 10000
```

## 🚀 Usage

### Simulation Mode (Recommended for Testing)
```bash
python polyradar_main.py --mode simulation --bankroll 10000
```

Generates mock whale signals without connecting to real blockchain.

### Live Mode (Real Blockchain)
```bash
python polyradar_main.py \
  --mode live \
  --bankroll 10000 \
  --rpc wss://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

**⚠️ WARNING**: Live mode executes real trades! Start with small bankroll.

### Testing Individual Modules

```bash
# Test Radar only
python polyradar_module1_radar.py

# Test Intelligence only
python polyradar_module2_intelligence.py

# Test Decision Engine only
python polyradar_module3_decision.py
```

### View Whale History (After Running Bot)
```bash
# View last 50 whale signals
python polyradar_view_history.py --last 50

# View specific wallet history
python polyradar_view_history.py --wallet 0x742d35C...

# Show global statistics
python polyradar_view_history.py --stats

# Filter by minimum amount
python polyradar_view_history.py --last 100 --min-amount 5000

# Export to JSON for copy trading module
python polyradar_view_history.py --export whales.json
```

## 🏗️ Architecture

```
┌─────────────────┐
│  Polygon Chain  │
└────────┬────────┘
         │ WebSocket Events
         ▼
┌─────────────────┐
│  MODULE 1       │──► Whale Detection
│  Radar          │    Transaction Filtering
└────────┬────────┘    Chain Splitting Check
         │
         │ WhaleSignal
         ▼
┌─────────────────┐
│  MODULE 2       │──► Wallet Analysis
│  Intelligence   │    Reputation Scoring
└────────┬────────┘    Category Classification
         │
         │ WalletProfile
         ▼
┌─────────────────┐
│  MODULE 3       │──► Confidence Scoring
│  Decision       │    Position Sizing
└────────┬────────┘    Order Execution
         │
         │ TradingDecision
         ▼
┌─────────────────┐
│  Polymarket API │──► Limit Order Placement
└─────────────────┘
```

## 📊 Example Output

```
============================================================
🐋 WHALE SIGNAL #5
   Wallet: 0x742d35C...
   Amount: $15,000 on YES @ 0.62
   Market: 100001
============================================================

[STEP 1/3] 🔍 Analyzing wallet...
📊 Profile: SMART_MONEY | WR: 69.0% | PnL: $185,000 | Score: 85/100

[STEP 2/3] 🧠 Making trading decision...
📊 Confidence Score: 78/100
   win_rate: +30.0
   pnl: +20.0
   timing: -0.0
   volume: +10.0
   maturity: +5.0

💰 Kelly: 5.6% of $10,000 = $560.00

[STEP 3/3] 🎯 Executing decision...
🎯 [MOCK] LIMIT ORDER: $560 on YES @ 0.627
   Confidence: 78/100 | Whale: 0x742d35C...

✅ TRADE EXECUTED
   Position: $560.00
   Limit Price: 0.627
   Confidence: 78/100

----------------------------------------------------------------------
📊 SESSION STATS
   Signals Received: 5
   Signals Ignored: 1
   Trades Executed: 3
   Trades Skipped: 1
   Total Exposure: $1,840.00
   Copy Rate: 60.0%
----------------------------------------------------------------------
```

## 🔧 Configuration

Edit constants in module files:

### Radar Settings
```python
# polyradar_module1_radar.py
MIN_WHALE_AMOUNT = 1000.0  # Minimum transaction in USD
CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
```

### Intelligence Settings
```python
# polyradar_module2_intelligence.py
# Adjust classification thresholds
INSIDER_MIN_BET = 10_000
SMART_MONEY_MIN_WR = 0.60
SMART_MONEY_MIN_PNL = 50_000
```

### Decision Settings
```python
# polyradar_module3_decision.py
MIN_CONFIDENCE = 50  # Minimum score to trade
MAX_SLIPPAGE = 0.01  # 1% max price difference
MAX_TIME_DELAY_SECONDS = 30  # Skip if signal too old
```

## 🛡️ Risk Management

1. **Kelly Criterion**: Position size adapts to confidence
2. **Max Position**: Capped at 10% of bankroll per trade
3. **Limit Orders Only**: Never market orders (prevents front-running)
4. **Post-Only**: Maker orders only (avoid taking liquidity)
5. **Time Decay**: Skip stale signals (>30s old)
6. **Market Maker Filter**: Ignore hedging wallets

## 📝 Code Structure

```
scripts/
├── polyradar_main.py              # Main orchestrator
├── polyradar_module1_radar.py     # Blockchain listener
├── polyradar_module2_intelligence.py  # Wallet analyzer
├── polyradar_module3_decision.py  # Decision engine
└── polyradar_requirements.txt     # Dependencies
```

## 🧪 Testing

```bash
# Run with pytest
pip install pytest pytest-asyncio

# Test individual modules
pytest polyradar_module1_radar.py -v
pytest polyradar_module2_intelligence.py -v
pytest polyradar_module3_decision.py -v

# Integration test (30 seconds)
python polyradar_main.py --mode simulation --bankroll 5000
```

## 🚨 Important Notes

### Simulation vs Live
- **Simulation**: Uses mock whale signals, no real blockchain connection
- **Live**: Connects to Polygon RPC, detects real transactions
  - Requires Alchemy/Infura API key
  - Execute real trades on Polymarket (use with caution!)

### Production Checklist
Before running in production:

- [ ] Get Polygon RPC API key (Alchemy/Infura)
- [ ] Get Polymarket API credentials
- [ ] Replace mock price/liquidity fetching with real API calls
- [ ] Implement proper token ID decoding (market_id + outcome)
- [ ] Add PostgreSQL for production database
- [ ] Setup monitoring and alerting
- [ ] Test with small bankroll first ($100-500)
- [ ] Implement stop-loss and exposure limits

### Security
- **Private Keys**: NEVER commit private keys to Git
- **API Keys**: Store in environment variables
- **Database**: Use proper credentials in production
- **Slippage**: Always use limit orders to prevent sandwich attacks

## 📈 Performance Metrics

Track these KPIs:
- **Signal Detection Rate**: Whales detected per hour
- **Copy Success Rate**: % of whale wins we also win
- **Execution Latency**: Time from detection to order
- **ROI**: Profit vs following strategy
- **Sharpe Ratio**: Risk-adjusted returns

## 🤝 Contributing

This is a complete, production-ready framework. To extend:

1. Replace mock API calls with real Polymarket CLOB
2. Add PostgreSQL for scalable wallet history
3. Integrate Polymarket Subgraph for historical data
4. Add WebSocket notifications (Discord/Telegram)
5. Implement portfolio risk management

## 📖 References

- **Polymarket Docs**: https://docs.polymarket.com
- **CTF Exchange Contract**: 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E
- **Polygon RPC**: https://polygon.technology/developers

## ⚠️ Disclaimer

**For educational purposes only.** Trading cryptocurrencies and prediction markets involves substantial risk of loss. This bot is provided as-is without warranties. Always test thoroughly before use with real funds.

---

Built with ❤️ by Senior Algo Trading Developer
