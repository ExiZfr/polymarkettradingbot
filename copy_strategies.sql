-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS copy_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    target_wallet VARCHAR(42) NOT NULL,
    label VARCHAR(100), -- e.g. "Whale 1"
    
    fixed_amount NUMERIC(10, 2) DEFAULT 10.00, -- Bet size in USD
    max_slippage NUMERIC(5, 2) DEFAULT 1.0, -- Percentage (e.g. 1.0 = 1%)
    
    is_inverse BOOLEAN DEFAULT FALSE, -- Counter-trade mode
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, target_wallet)
);

-- Index for fast lookup by active status
CREATE INDEX idx_copy_strategies_active ON copy_strategies(is_active) WHERE is_active = TRUE;
