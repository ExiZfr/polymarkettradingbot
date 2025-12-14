// Manual Test Script for Whale Tracker
// Run this in a PowerShell terminal to simulate whale transactions

const API_BASE = 'http://localhost:3000';

const markets = [
    { id: "sim-1", question: "Will Bitcoin reach $100K by Dec 2024?", slug: "bitcoin-100k" },
    { id: "sim-2", question: "Will Trump win 2024 election?", slug: "trump-2024" },
    { id: "sim-3", question: "Will Fed cut rates in January?", slug: "fed-rate-january" },
];

const wallets = [
    { address: "0x1234...abcd", tag: "🐋 Whale Legend", win_rate: 0.85, pnl: 250000 },
    { address: "0x5678...efgh", tag: "🦈 Shark", win_rate: 0.72, pnl: 75000 },
    { address: "0x9abc...ijkl", tag: "🐬 Dolphin", win_rate: 0.68, pnl: 25000 },
];

async function sendTransaction() {
    const market = markets[Math.floor(Math.random() * markets.length)];
    const wallet = wallets[Math.floor(Math.random() * wallets.length)];

    const tx = {
        wallet_address: wallet.address,
        wallet_tag: wallet.tag,
        wallet_win_rate: wallet.win_rate,
        wallet_pnl: wallet.pnl,
        market_id: market.id,
        market_question: market.question,
        market_slug: market.slug,
        outcome: Math.random() > 0.5 ? "YES" : "NO",
        amount: Math.random() * 49000 + 1000,
        price: Math.random() * 0.8 + 0.1,
        timestamp: new Date().toISOString(),
        tx_hash: `sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    };

    try {
        const response = await fetch(`${API_BASE}/api/tracker/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
        });

        if (response.ok) {
            console.log(`✅ Sent: ${tx.wallet_tag} | $${tx.amount.toFixed(0)} ${tx.outcome}`);
        } else {
            console.error(`❌ Failed: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function log(message, level = 'info') {
    try {
        await fetch(`${API_BASE}/api/tracker/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                level,
                timestamp: new Date().toLocaleTimeString()
            })
        });
    } catch (error) {
        // Ignore log errors
    }
}

async function runSimulation() {
    console.log('🐋 Starting Whale Tracker Simulation (JavaScript)...');
    await log('🎮 Simulation started (JavaScript)', 'success');

    // Send a transaction every 3-8 seconds
    while (true) {
        await sendTransaction();
        const delay = Math.random() * 5000 + 3000; // 3-8 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

runSimulation().catch(console.error);
