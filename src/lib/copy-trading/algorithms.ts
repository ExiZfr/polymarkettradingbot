/**
 * ADVANCED COPY TRADING ALGORITHMS
 * 
 * Core calculation engine for:
 * - Smart wallet scoring
 * - Risk-adjusted metrics (Sharpe, Sortino, Calmar)
 * - Kelly Criterion position sizing
 * - Risk of Ruin calculations
 * - Correlation analysis
 */

// ==================== TYPES ====================

export interface WalletMetrics {
    address: string;
    username: string;

    // Basic Metrics
    pnl: number;
    volume: number;
    tradesCount: number;
    winRate: number;
    roi: number;

    // Advanced Metrics
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdown: number;
    profitFactor: number;
    kellyPercentage: number;
    riskOfRuin: number;

    // Consistency
    winStreak: number;
    lossStreak: number;
    maxWinStreak: number;
    maxLossStreak: number;

    // Activity
    avgHoldTime: number; // hours
    avgTradeSize: number;
    avgWin: number;
    avgLoss: number;

    // Derived
    smartScore: number; // 0-100
    farmScore: number;
    categoriesTraded: string[];
}

export interface TradeRecord {
    pnl: number;
    amount: number;
    holdTime: number; // hours
    category: string;
    timestamp: Date;
}

export interface CorrelationMatrix {
    [walletA: string]: {
        [walletB: string]: number; // -1 to 1
    };
}

export interface PositionSizingResult {
    recommendedSize: number;
    kellySize: number;
    safetyAdjusted: number;
    reasoning: string;
}

// ==================== UTILITIES ====================

function normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = mean(squareDiffs);
    return Math.sqrt(variance);
}

function downsideDeviation(returns: number[], targetReturn: number = 0): number {
    const negativeReturns = returns.filter(r => r < targetReturn);
    if (negativeReturns.length === 0) return 0;

    const squaredDownside = negativeReturns.map(r => Math.pow(r - targetReturn, 2));
    return Math.sqrt(mean(squaredDownside));
}

// ==================== RISK METRICS ====================

/**
 * Calculate Sharpe Ratio
 * (Return - RiskFreeRate) / StandardDeviation
 * Good: >1, Excellent: >2
 */
export function calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.02 // 2% annualized
): number {
    if (returns.length < 2) return 0;

    const avgReturn = mean(returns);
    const stdDeviation = stdDev(returns);

    if (stdDeviation === 0) return 0;

    // Annualize if needed (assuming daily returns)
    const annualizedReturn = avgReturn * 252; // Trading days
    const annualizedStdDev = stdDeviation * Math.sqrt(252);

    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * Calculate Sortino Ratio
 * Like Sharpe but only penalizes downside volatility
 * Better for assymetric return distributions
 */
export function calculateSortinoRatio(
    returns: number[],
    targetReturn: number = 0
): number {
    if (returns.length < 2) return 0;

    const avgReturn = mean(returns);
    const downsideDev = downsideDeviation(returns, targetReturn);

    if (downsideDev === 0) return 0;

    return (avgReturn - targetReturn) / downsideDev;
}

/**
 * Calculate Calmar Ratio
 * AnnualizedReturn / MaxDrawdown
 * Risk/Reward considering worst drawdown
 */
export function calculateCalmarRatio(
    returns: number[],
    maxDrawdown: number
): number {
    if (maxDrawdown === 0 || returns.length === 0) return 0;

    const avgReturn = mean(returns);
    const annualizedReturn = avgReturn * 252;

    return annualizedReturn / (maxDrawdown / 100);
}

/**
 * Calculate Maximum Drawdown
 * Largest peak-to-trough decline
 */
export function calculateMaxDrawdown(equityCurve: number[]): number {
    if (equityCurve.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = equityCurve[0];

    for (const value of equityCurve) {
        if (value > peak) {
            peak = value;
        }

        const drawdown = ((peak - value) / peak) * 100;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }

    return maxDrawdown;
}

/**
 * Calculate Profit Factor
 * GrossProfit / GrossLoss
 * >1 = profitable, >2 = good
 */
export function calculateProfitFactor(trades: TradeRecord[]): number {
    let grossProfit = 0;
    let grossLoss = 0;

    trades.forEach(trade => {
        if (trade.pnl > 0) {
            grossProfit += trade.pnl;
        } else if (trade.pnl < 0) {
            grossLoss += Math.abs(trade.pnl);
        }
    });

    if (grossLoss === 0) return grossProfit > 0 ? 999 : 0;

    return grossProfit / grossLoss;
}

// ==================== KELLY CRITERION ====================

/**
 * Calculate Kelly Criterion percentage
 * Optimal bet sizing for maximizing long-term growth
 * 
 * Kelly% = (WinRate * AvgWin - LossRate * AvgLoss) / AvgWin
 */
export function calculateKellyCriterion(
    winRate: number,
    avgWin: number,
    avgLoss: number,
    safetyFactor: number = 0.25 // Quarter Kelly (conservative)
): number {
    if (avgWin === 0) return 0;

    const lossRate = 1 - winRate;
    const kelly = (winRate * avgWin - lossRate * avgLoss) / avgWin;

    // Apply safety factor (common practice)
    const safeKelly = Math.max(0, kelly * safetyFactor);

    // Cap at 20% (never risk more than 20% of capital)
    return Math.min(0.20, safeKelly);
}

/**
 * Calculate position size based on Kelly Criterion
 */
export function calculatePositionSize(
    capital: number,
    winRate: number,
    avgWin: number,
    avgLoss: number,
    mode: 'kelly' | 'fixed' | 'percentage',
    fixedAmount?: number,
    percentage?: number
): PositionSizingResult {
    let recommendedSize: number;
    let reasoning: string;

    const kellyPercent = calculateKellyCriterion(winRate, avgWin, avgLoss);
    const kellySize = capital * kellyPercent;

    switch (mode) {
        case 'kelly':
            recommendedSize = kellySize;
            reasoning = `Kelly Criterion: ${(kellyPercent * 100).toFixed(1)}% of capital`;
            break;

        case 'fixed':
            recommendedSize = fixedAmount || 0;
            reasoning = `Fixed amount: $${recommendedSize}`;

            // Warn if fixed amount >> Kelly
            if (recommendedSize > kellySize * 2) {
                reasoning += ` ⚠️ Warning: 2x larger than Kelly optimal ($${kellySize.toFixed(2)})`;
            }
            break;

        case 'percentage':
            recommendedSize = capital * (percentage || 0);
            reasoning = `${((percentage || 0) * 100).toFixed(1)}% of portfolio`;

            if (recommendedSize > kellySize * 2) {
                reasoning += ` ⚠️ Warning: Exceeds Kelly recommendation`;
            }
            break;

        default:
            recommendedSize = kellySize;
            reasoning = 'Default Kelly';
    }

    // Safety adjusted (never more than 20% of capital)
    const safetyAdjusted = Math.min(recommendedSize, capital * 0.20);

    if (safetyAdjusted < recommendedSize) {
        reasoning += ` | Capped at 20% of capital`;
    }

    return {
        recommendedSize: safetyAdjusted,
        kellySize,
        safetyAdjusted,
        reasoning
    };
}

// ==================== RISK OF RUIN ====================

/**
 * Calculate Risk of Ruin
 * Probability of losing entire bankroll
 * 
 * Simplified formula (assumes fixed bet size):
 * RoR = ((1 - WinRate) / WinRate) ^ (Capital / BetSize)
 */
export function calculateRiskOfRuin(
    capital: number,
    betSize: number,
    winRate: number,
    avgWin: number,
    avgLoss: number
): number {
    if (winRate >= 1 || winRate <= 0) return 0;
    if (betSize >= capital) return 1;

    // Account for win/loss asymmetry
    const advantage = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    if (advantage <= 0) return 1; // Negative edge = certain ruin eventually

    const riskRatio = (1 - winRate) / winRate;
    const units = capital / betSize;

    // Simplified RoR calculation
    const ror = Math.pow(riskRatio, units);

    return Math.min(1, Math.max(0, ror));
}

// ==================== CORRELATION ANALYSIS ====================

/**
 * Calculate Pearson Correlation Coefficient
 * Measures linear relationship between two wallets' PnL
 * -1 = perfect negative, 0 = no correlation, 1 = perfect positive
 */
export function calculateCorrelation(
    walletAReturns: number[],
    walletBReturns: number[]
): number {
    if (walletAReturns.length !== walletBReturns.length || walletAReturns.length < 2) {
        return 0;
    }

    const n = walletAReturns.length;
    const meanA = mean(walletAReturns);
    const meanB = mean(walletBReturns);

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < n; i++) {
        const diffA = walletAReturns[i] - meanA;
        const diffB = walletBReturns[i] - meanB;

        numerator += diffA * diffB;
        denomA += diffA * diffA;
        denomB += diffB * diffB;
    }

    const denominator = Math.sqrt(denomA * denomB);

    if (denominator === 0) return 0;

    return numerator / denominator;
}

/**
 * Build correlation matrix for multiple wallets
 */
export function buildCorrelationMatrix(
    walletsReturns: { [walletAddress: string]: number[] }
): CorrelationMatrix {
    const wallets = Object.keys(walletsReturns);
    const matrix: CorrelationMatrix = {};

    wallets.forEach(walletA => {
        matrix[walletA] = {};

        wallets.forEach(walletB => {
            if (walletA === walletB) {
                matrix[walletA][walletB] = 1; // Perfect correlation with self
            } else {
                const correlation = calculateCorrelation(
                    walletsReturns[walletA],
                    walletsReturns[walletB]
                );
                matrix[walletA][walletB] = correlation;
            }
        });
    });

    return matrix;
}

/**
 * Detect highly correlated wallets (>0.7 correlation)
 */
export function detectHighCorrelation(
    correlationMatrix: CorrelationMatrix,
    threshold: number = 0.7
): Array<{ walletA: string; walletB: string; correlation: number }> {
    const pairs: Array<{ walletA: string; walletB: string; correlation: number }> = [];
    const wallets = Object.keys(correlationMatrix);

    for (let i = 0; i < wallets.length; i++) {
        for (let j = i + 1; j < wallets.length; j++) {
            const walletA = wallets[i];
            const walletB = wallets[j];
            const correlation = correlationMatrix[walletA][walletB];

            if (Math.abs(correlation) >= threshold) {
                pairs.push({ walletA, walletB, correlation });
            }
        }
    }

    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

// ==================== SMART WALLET SCORING ====================

/**
 * Calculate comprehensive smart score (0-100)
 * Multi-dimensional evaluation of wallet quality
 */
export function calculateSmartScore(wallet: WalletMetrics): number {
    let score = 0;

    // 1. Performance Score (40 points)
    const roiScore = normalize(wallet.roi, 0, 200) * 15;
    const sharpeScore = normalize(wallet.sharpeRatio, 0, 3) * 15;
    const winRateScore = normalize(wallet.winRate, 0.4, 0.8) * 10;

    score += roiScore + sharpeScore + winRateScore;

    // 2. Consistency Score (25 points)
    const maxDD = Math.min(wallet.maxDrawdown, 100);
    const ddScore = normalize(100 - maxDD, 0, 100) * 15;
    const streakScore = wallet.maxLossStreak <= 5 ? 10 : (wallet.maxLossStreak <= 8 ? 5 : 0);

    score += ddScore + streakScore;

    // 3. Risk Score (20 points)
    const profitFactorScore = normalize(wallet.profitFactor, 1, 3) * 10;
    const riskOfRuinScore = wallet.riskOfRuin < 0.05 ? 10 : (wallet.riskOfRuin < 0.15 ? 5 : 0);

    score += profitFactorScore + riskOfRuinScore;

    // 4. Activity Score (10 points)
    const tradeCountScore = normalize(wallet.tradesCount, 10, 100) * 5;
    const volumeScore = normalize(wallet.volume, 10000, 500000) * 5;

    score += tradeCountScore + volumeScore;

    // 5. Diversification Score (5 points)
    const categoryDiversity = wallet.categoriesTraded.length >= 3 ? 5 :
        wallet.categoriesTraded.length >= 2 ? 3 : 0;

    score += categoryDiversity;

    // Penalize farm suspicion
    if (wallet.farmScore > 50) {
        score *= 0.5; // Halve score for suspected farms
    } else if (wallet.farmScore > 30) {
        score *= 0.75; // 25% penalty for questionable activity
    }

    return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Generate comprehensive wallet metrics from trade history
 */
export function calculateWalletMetrics(
    trades: TradeRecord[],
    wallet: { address: string; username: string }
): WalletMetrics {
    if (trades.length === 0) {
        return {
            address: wallet.address,
            username: wallet.username,
            pnl: 0,
            volume: 0,
            tradesCount: 0,
            winRate: 0,
            roi: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            maxDrawdown: 0,
            profitFactor: 0,
            kellyPercentage: 0,
            riskOfRuin: 0,
            winStreak: 0,
            lossStreak: 0,
            maxWinStreak: 0,
            maxLossStreak: 0,
            avgHoldTime: 0,
            avgTradeSize: 0,
            avgWin: 0,
            avgLoss: 0,
            smartScore: 0,
            farmScore: 0,
            categoriesTraded: []
        };
    }

    // Basic calculations
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalVolume = trades.reduce((sum, t) => sum + t.amount, 0);
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;

    const avgWin = winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
        : 0;
    const avgLoss = losingTrades.length > 0
        ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
        : 0;

    // Build equity curve
    const equityCurve: number[] = [];
    let runningTotal = 0;
    trades.forEach(trade => {
        runningTotal += trade.pnl;
        equityCurve.push(runningTotal);
    });

    // Returns (daily approximation)
    const returns = trades.map(t => (t.pnl / t.amount) * 100); // % return

    // Advanced metrics
    const sharpeRatio = calculateSharpeRatio(returns);
    const sortinoRatio = calculateSortinoRatio(returns);
    const maxDrawdown = calculateMaxDrawdown(equityCurve);
    const calmarRatio = calculateCalmarRatio(returns, maxDrawdown);
    const profitFactor = calculateProfitFactor(trades);
    const kellyPercentage = calculateKellyCriterion(winRate, avgWin, avgLoss);

    // Estimate capital and calculate RoR
    const avgTradeSize = totalVolume / trades.length;
    const estimatedCapital = avgTradeSize * 20; // Assume avg trade is 5% of capital
    const riskOfRuin = calculateRiskOfRuin(estimatedCapital, avgTradeSize, winRate, avgWin, avgLoss);

    // Streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let winStreak = 0;
    let lossStreak = 0;

    trades.forEach(trade => {
        if (trade.pnl > 0) {
            winStreak++;
            lossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, winStreak);
        } else if (trade.pnl < 0) {
            lossStreak++;
            winStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, lossStreak);
        }
    });

    // Categories
    const categories = [...new Set(trades.map(t => t.category))];

    // Hold time
    const avgHoldTime = trades.reduce((sum, t) => sum + t.holdTime, 0) / trades.length;

    const metrics: WalletMetrics = {
        address: wallet.address,
        username: wallet.username,
        pnl: totalPnl,
        volume: totalVolume,
        tradesCount: trades.length,
        winRate,
        roi: totalVolume > 0 ? (totalPnl / totalVolume) * 100 : 0,
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        maxDrawdown,
        profitFactor,
        kellyPercentage,
        riskOfRuin,
        winStreak,
        lossStreak,
        maxWinStreak,
        maxLossStreak,
        avgHoldTime,
        avgTradeSize,
        avgWin,
        avgLoss,
        categoriesTraded: categories,
        farmScore: 0, // Will be calculated separately
        smartScore: 0  // Calculated last
    };

    // Calculate smart score
    metrics.smartScore = calculateSmartScore(metrics);

    return metrics;
}
