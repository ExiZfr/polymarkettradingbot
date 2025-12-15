import { NextResponse } from 'next/server';

// Proxy to call Python CryptoOracle scan functionality
// For now, we'll fetch from Gamma API directly since Python is running as separate process

const GAMMA_API = "https://gamma-api.polymarket.com";

async function getSpotPrice(symbol: string): Promise<number> {
    try {
        // Use CoinGecko as fallback
        const coinMap: Record<string, string> = {
            "BTC": "bitcoin",
            "ETH": "ethereum",
            "SOL": "solana"
        };
        const coinId = coinMap[symbol] || "bitcoin";

        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
            { next: { revalidate: 30 } }
        );
        const data = await response.json();
        return data[coinId]?.usd || 0;
    } catch {
        return 0;
    }
}

export async function GET() {
    try {
        // Fetch spot prices
        const [btcPrice, ethPrice, solPrice] = await Promise.all([
            getSpotPrice("BTC"),
            getSpotPrice("ETH"),
            getSpotPrice("SOL")
        ]);

        const spotPrices = { BTC: btcPrice, ETH: ethPrice, SOL: solPrice };

        // Fetch markets from Gamma API
        const response = await fetch(
            `${GAMMA_API}/markets?closed=false&limit=100&active=true`,
            { next: { revalidate: 60 } }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch markets');
        }

        const allMarkets = await response.json();

        // Filter for crypto price markets
        const cryptoKeywords = ["bitcoin", "btc", "ethereum", "eth", "solana", "sol"];
        const priceKeywords = ["price", "$", "above", "below", "hit", "reach", "dip"];

        const cryptoMarkets = allMarkets.filter((market: any) => {
            const question = (market.question || "").toLowerCase();
            const isCrypto = cryptoKeywords.some(k => question.includes(k));
            const isPriceMarket = priceKeywords.some(k => question.includes(k));
            return isCrypto && isPriceMarket;
        });

        // Process markets
        const processedMarkets = cryptoMarkets.map((market: any) => {
            const question = (market.question || "").toLowerCase();

            // Determine symbol
            let symbol = "BTC/USDT";
            if (question.includes("ethereum") || question.includes("eth")) {
                symbol = "ETH/USDT";
            } else if (question.includes("solana") || question.includes("sol")) {
                symbol = "SOL/USDT";
            }

            // Extract strike price
            const priceMatch = question.replace(/,/g, "").match(/\$?([\d]+)k?/);
            let strikePrice = 0;
            if (priceMatch) {
                strikePrice = parseFloat(priceMatch[1]);
                if (question.includes("k")) {
                    strikePrice *= 1000;
                }
            }

            // Parse outcome prices
            let yesPrice = 0.5;
            try {
                const outcomePrices = market.outcomePrices;
                if (typeof outcomePrices === 'string') {
                    const parsed = JSON.parse(outcomePrices);
                    yesPrice = parseFloat(parsed[0]) || 0.5;
                } else if (Array.isArray(outcomePrices) && outcomePrices.length > 0) {
                    yesPrice = parseFloat(outcomePrices[0]) || 0.5;
                }
            } catch {
                yesPrice = 0.5;
            }

            // Get spot price for this symbol
            const spotPrice = symbol === "BTC/USDT" ? btcPrice :
                symbol === "ETH/USDT" ? ethPrice : solPrice;

            // Calculate fair value estimate
            let fairValue = 0.5;
            if (strikePrice > 0 && spotPrice > 0) {
                const distancePct = (spotPrice - strikePrice) / strikePrice;
                if (distancePct > 0) {
                    fairValue = Math.min(0.95, 0.5 + distancePct);
                } else {
                    fairValue = Math.max(0.05, 0.5 + distancePct / 2);
                }
            }

            // Calculate alpha
            const alpha = fairValue - yesPrice;

            return {
                market_id: market.conditionId || market.condition_id || "",
                slug: market.slug || "",
                question: market.question || "",
                symbol,
                strike_price: strikePrice,
                yes_price: yesPrice,
                volume: parseFloat(market.volume) || 0,
                liquidity: parseFloat(market.liquidity) || 0,
                fair_value: fairValue,
                alpha,
                spot_price: spotPrice
            };
        });

        // Sort by volume
        processedMarkets.sort((a: any, b: any) => b.volume - a.volume);

        return NextResponse.json({
            markets: processedMarkets.slice(0, 30),
            spotPrices,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('Oracle scan error:', error);
        return NextResponse.json(
            { error: 'Failed to scan markets', markets: [], spotPrices: { BTC: 0, ETH: 0, SOL: 0 } },
            { status: 500 }
        );
    }
}
