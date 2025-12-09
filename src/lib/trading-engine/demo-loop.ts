import { PaperWallet } from './paper-wallet';
import { SimulatedExecutionManager } from './execution-manager';
import { OrderSide, PositionSide } from './interfaces';

async function runDemoLoop() {
    console.log("🚀 Starting PAPER TRADING Simulation Loop...");

    // 1. Initialize
    const wallet = new PaperWallet(); // Uses default profile
    const executor = new SimulatedExecutionManager(wallet);

    console.log(`Initial Balance: $${wallet.getBalance()}`);

    // 2. Market Data Simulation (Trump 2024 Market)
    const marketId = "trump-2024";
    let currentPrice = 0.60; // 60 cents

    // 3. Buy Loop
    console.log("\n--- SIGNAL DETECTED: BUY YES ---");
    const buyOrder = await executor.executeOrder(marketId, OrderSide.BUY, PositionSide.YES, 500, currentPrice);

    if (buyOrder.status === 'FILLED') {
        console.log(`✅ Order FILLED: BUY $500 @ ${buyOrder.price.toFixed(4)}`);
    } else {
        console.log(`❌ Order REJECTED`);
    }

    console.log("Wallet State:", wallet.getPortfolio());

    // 4. Simulation of Price Move (Price goes up to 0.65)
    console.log("\n--- MARKET MOVE: Price 0.60 -> 0.65 ---");
    currentPrice = 0.65;
    wallet.updateMarkPrice(marketId, PositionSide.YES, currentPrice);

    const portfolio = wallet.getPortfolio();
    const position = portfolio.positions.get(`${marketId}-${PositionSide.YES}`);
    console.log(`Unrealized PnL: $${position?.pnl.toFixed(2)} (${position?.pnlPercent.toFixed(2)}%)`);

    // 5. Sell Loop (Take Profit)
    console.log("\n--- SIGNAL DETECTED: TAKE PROFIT ---");
    // Sell $200 worth (not full position)
    const sellOrder = await executor.executeOrder(marketId, OrderSide.SELL, PositionSide.YES, 200, currentPrice);

    if (sellOrder.status === 'FILLED') {
        console.log(`✅ Order FILLED: SELL $200 @ ${sellOrder.price.toFixed(4)}`);
    } else {
        console.log(`❌ Order REJECTED`);
    }

    console.log("\nFinal Portfolio State:");
    // Custom print
    const finalPf = wallet.getPortfolio();
    console.log(`Balance: $${finalPf.balance.toFixed(2)}`);
    console.log(`Equity:  $${finalPf.totalEquity.toFixed(2)}`);
    finalPf.positions.forEach(p => {
        console.log(`Pos: ${p.marketId} [${p.outcome}] | Shares: ${p.shares.toFixed(1)} | PnL: $${p.pnl.toFixed(2)}`);
    });
}

// Execute
runDemoLoop().catch(console.error);
