-- Database Schema for Polymarket TWA
-- Compatible with PostgreSQL (Supabase/Neon)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Stores user identity and subscription status.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MARKETS TABLE (Optional caching for Radar)
-- Stores cached market data to avoid excessive API calls.
CREATE TABLE markets (
    id VARCHAR(255) PRIMARY KEY, -- Polymarket Condition ID or Slug
    question TEXT NOT NULL,
    slug VARCHAR(255),
    volume NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FAVORITES TABLE
-- Links users to markets they are watching.
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    market_id VARCHAR(255) NOT NULL, -- Reference to Polymarket ID
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, market_id)
);

-- 4. COPY STRATEGIES TABLE
-- Complex configuration for copy trading.
CREATE TABLE copy_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Target
    target_wallet_address VARCHAR(42) NOT NULL,
    target_label VARCHAR(100), -- e.g., "Whale 1", "Smart Money"
    
    -- Money Management
    mode VARCHAR(20) CHECK (mode IN ('FIXED', 'PERCENTAGE')) DEFAULT 'FIXED',
    fixed_amount NUMERIC(10, 2), -- Amount in USDC per trade
    percentage_amount NUMERIC(5, 2), -- Percentage of bankroll (if mode is PERCENTAGE)
    max_open_positions INTEGER DEFAULT 5,
    
    -- Risk Management
    slippage_limit NUMERIC(5, 2) DEFAULT 1.0, -- Max allowed price deviation in %
    stop_loss_percentage NUMERIC(5, 2),
    take_profit_percentage NUMERIC(5, 2),
    
    -- Advanced Rules
    is_inverse_copy BOOLEAN DEFAULT FALSE, -- Counter-trade option
    allowed_categories TEXT[], -- Array of strings: ['Sports', 'Politics', 'Crypto']
    min_volume_threshold NUMERIC, -- Only copy if market volume > X
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, target_wallet_address)
);

-- 5. TRADES_HISTORY (Optional)
-- To track performance of copy trading
CREATE TABLE trades_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    strategy_id UUID REFERENCES copy_strategies(id),
    market_id VARCHAR(255),
    side VARCHAR(10), -- 'BUY' or 'SELL'
    outcome VARCHAR(10), -- 'YES' or 'NO'
    price NUMERIC,
    amount NUMERIC,
    pnl NUMERIC,
    status VARCHAR(20), -- 'OPEN', 'CLOSED', 'FAILED'
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_copy_strategies_user_id ON copy_strategies(user_id);
CREATE INDEX idx_copy_strategies_active ON copy_strategies(is_active) WHERE is_active = TRUE;
