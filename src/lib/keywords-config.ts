/**
 * Keywords Configuration for Polymarket Listener & Radar
 * 
 * These keywords are used to:
 * 1. Match markets in the Radar view
 * 2. Filter news/social signals in the Listener
 * 3. Prioritize notifications for matching markets
 * 
 * Categories are organized by topic for easy management.
 */

export const LISTENER_KEYWORDS = {
    // 🎮 Gaming & Esports
    gaming: [
        'GTA', 'GTA 6', 'Rockstar', 'Grand Theft Auto', 'PlayStation', 'PS5', 'Xbox', 'Nintendo', 'Switch',
        'Steam', 'Epic Games', 'Fortnite', 'Valorant', 'League of Legends', 'LoL', 'Dota', 'CSGO', 'Counter-Strike',
        'Elden Ring', 'Zelda', 'Mario', 'Pokemon', 'Minecraft', 'Roblox', 'Twitch', 'streamer',
        'esports', 'gaming', 'World of Warcraft', 'WoW', 'Diablo', 'Call of Duty', 'COD', 'FIFA', 'EA Sports',
        'Ubisoft', 'Activision', 'Blizzard', 'Cyberpunk', 'Baldur\'s Gate', 'Starfield', 'game release'
    ],

    // 🎬 Entertainment & Celebrities
    entertainment: [
        'Taylor Swift', 'Kanye', 'Drake', 'Beyonce', 'Rihanna', 'Travis Scott', 'Bad Bunny',
        'Netflix', 'Disney', 'HBO', 'Hulu', 'Amazon Prime', 'Spotify', 'Apple Music',
        'Oscar', 'Emmy', 'Grammy', 'Golden Globe', 'box office', 'movie', 'film', 'Hollywood',
        'Kardashian', 'celebrity', 'influencer', 'YouTube', 'TikTok', 'Instagram', 'viral',
        'MrBeast', 'Logan Paul', 'Jake Paul', 'KSI', 'PewDiePie', 'scandal', 'breakup', 'dating',
        'wedding', 'divorce', 'baby', 'pregnant', 'album', 'concert', 'tour', 'streaming'
    ],

    // 💻 Tech & AI
    tech: [
        'Apple', 'iPhone', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Facebook',
        'OpenAI', 'ChatGPT', 'GPT-5', 'Claude', 'Gemini', 'AI', 'artificial intelligence',
        'Nvidia', 'AMD', 'Intel', 'Tesla', 'SpaceX', 'Starlink', 'Neuralink', 'Elon Musk',
        'rocket launch', 'satellite', 'robot', 'automation', 'self-driving', 'autonomous',
        'VR', 'AR', 'metaverse', 'Web3', 'startup', 'IPO', 'acquisition', 'merger', 'layoff',
        'CEO', 'founder', 'Series A', 'unicorn', 'valuation', 'data breach', 'hack'
    ],

    // ₿ Crypto & DeFi
    crypto: [
        'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'Solana', 'SOL', 'Dogecoin', 'DOGE', 'XRP', 'Ripple',
        'NFT', 'DeFi', 'blockchain', 'Binance', 'Coinbase', 'FTX', 'Tether', 'USDT', 'USDC',
        'altcoin', 'memecoin', 'Shiba', 'Pepe coin', 'stablecoin', 'mining', 'halving',
        'airdrop', 'token', 'wallet', 'exchange', 'rug pull', 'whale', 'pump', 'dump',
        'bull run', 'bear market', 'ATH', 'all time high', 'crypto crash', 'regulation'
    ],

    // 🏛️ Politics & Government
    politics: [
        'Trump', 'Biden', 'election', 'president', 'Congress', 'Senate', 'vote', 'ballot',
        'Democrat', 'Republican', 'governor', 'mayor', 'law', 'bill', 'legislation',
        'Supreme Court', 'impeach', 'indictment', 'trial', 'verdict', 'conviction',
        'Ukraine', 'Russia', 'China', 'war', 'NATO', 'military', 'sanction', 'tariff',
        'border', 'immigration', 'abortion', 'gun', 'policy', 'Brexit', 'EU', 'UN', 'summit',
        'debate', 'poll', 'swing state', 'electoral', 'primary', 'caucus', 'midterm'
    ],

    // ⚽ Sports
    sports: [
        'NFL', 'NBA', 'NHL', 'MLB', 'MLS', 'FIFA', 'World Cup', 'Olympics', 'Super Bowl',
        'championship', 'playoff', 'league', 'soccer', 'football', 'basketball', 'baseball',
        'hockey', 'tennis', 'golf', 'boxing', 'UFC', 'MMA', 'F1', 'Formula 1', 'NASCAR',
        'winner', 'champion', 'MVP', 'injury', 'trade', 'draft', 'transfer', 'coach',
        'LeBron', 'Messi', 'Ronaldo', 'Patrick Mahomes', 'Tom Brady', 'record breaking'
    ],

    // 📈 Finance & Economy
    finance: [
        'stock', 'market', 'Fed', 'rate', 'inflation', 'GDP', 'earnings', 'NASDAQ', 'S&P',
        'Dow', 'treasury', 'bond', 'economy', 'recession', 'bull', 'bear', 'crash', 'rally',
        'IPO', 'dividend', 'Wall Street', 'hedge fund', 'ETF', 'mutual fund', '401k',
        'mortgage', 'housing', 'real estate', 'oil', 'gold', 'commodity', 'forex', 'currency',
        'interest rate', 'Fed meeting', 'FOMC', 'Jerome Powell', 'unemployment', 'jobs report'
    ],

    // 🔬 Science & Health
    science: [
        'vaccine', 'COVID', 'virus', 'pandemic', 'disease', 'health', 'FDA', 'drug', 'medicine',
        'cancer', 'cure', 'treatment', 'clinical trial', 'breakthrough',
        'climate', 'weather', 'hurricane', 'earthquake', 'wildfire', 'flood', 'drought', 'temperature',
        'NASA', 'space', 'Mars', 'Moon', 'asteroid', 'UFO', 'alien', 'discovery',
        'research', 'study', 'scientist', 'Nobel Prize', 'CRISPR', 'gene', 'DNA'
    ],

    // 🔥 Trending & Viral
    trending: [
        'meme', 'viral', 'trend', 'challenge', 'drama', 'beef', 'diss', 'fight', 'controversy',
        'cancelled', 'exposed', 'leak', 'hack', 'prank', 'stunt', 'record', 'world record',
        'Guinness', 'first', 'biggest', 'smallest', 'oldest', 'youngest', 'most', 'least',
        'breaking', 'shocking', 'exclusive', 'bombshell', 'reveal', 'announcement'
    ],

    // 🌍 World Events & Misc
    world: [
        'earthquake', 'tsunami', 'volcano', 'disaster', 'emergency', 'crisis',
        'terrorist', 'attack', 'shooting', 'bombing', 'explosion',
        'royal', 'queen', 'king', 'prince', 'pope', 'Vatican',
        'Nobel', 'award', 'ceremony', 'anniversary', 'memorial',
        'festival', 'event', 'parade', 'protest', 'riot', 'strike'
    ]
};

// Flat array of all keywords for quick searching
export const ALL_KEYWORDS = Object.values(LISTENER_KEYWORDS).flat();

// Keywords to prioritize (high-value markets)
export const PRIORITY_KEYWORDS = [
    'Trump', 'Biden', 'election', 'Bitcoin', 'ETH', 'GTA 6', 'Super Bowl', 'World Cup',
    'Fed', 'rate', 'recession', 'ChatGPT', 'AI', 'Taylor Swift', 'Elon Musk', 'SpaceX'
];

// Export categories for UI display
export const KEYWORD_CATEGORIES = [
    { id: 'gaming', label: '🎮 Gaming', count: LISTENER_KEYWORDS.gaming.length },
    { id: 'entertainment', label: '🎬 Entertainment', count: LISTENER_KEYWORDS.entertainment.length },
    { id: 'tech', label: '💻 Tech', count: LISTENER_KEYWORDS.tech.length },
    { id: 'crypto', label: '₿ Crypto', count: LISTENER_KEYWORDS.crypto.length },
    { id: 'politics', label: '🏛️ Politics', count: LISTENER_KEYWORDS.politics.length },
    { id: 'sports', label: '⚽ Sports', count: LISTENER_KEYWORDS.sports.length },
    { id: 'finance', label: '📈 Finance', count: LISTENER_KEYWORDS.finance.length },
    { id: 'science', label: '🔬 Science', count: LISTENER_KEYWORDS.science.length },
    { id: 'trending', label: '🔥 Trending', count: LISTENER_KEYWORDS.trending.length },
    { id: 'world', label: '🌍 World', count: LISTENER_KEYWORDS.world.length },
];

export default LISTENER_KEYWORDS;
