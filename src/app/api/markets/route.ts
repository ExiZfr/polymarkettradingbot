import { NextResponse } from 'next/server';

const GAMMA_API = 'https://gamma-api.polymarket.com';

export async function GET() {
    try {
        console.log('[API Route] Fetching markets from Gamma (Server-Side)...');

        const response = await fetch(`${GAMMA_API}/markets?closed=false&limit=500`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 10 }
        });

        if (!response.ok) {
            console.error(`[API Route Error] Upstream status: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch markets' }, { status: response.status });
        }

        const markets = await response.json();
        console.log(`[API Route] Successfully fetched ${markets.length} markets`);

        // Filter and process on server to save bandwidth
        const processed = markets
            .filter((m: any) => m.active && m.volume > 100)
            .map((m: any) => ({
                id: m.id || m.condition_id,
                slug: m.slug || m.id || m.condition_id, // Add slug for Polymarket URLs
                title: m.question || m.description,
                image: m.image || 'https://via.placeholder.com/400x200/1a1a2e/ffffff?text=Polymarket',
                outcome: m.outcomes?.[0]?.name || 'YES',
                probability: Math.round((m.outcomes?.[0]?.price || m.clobTokenIds?.[0]?.price || 0.5) * 100),
                volume: formatVolume(m.volume || 0),
                liquidity: m.liquidity || 0,
                endDate: m.end_date_iso || m.endDate || new Date(Date.now() + 86400000).toISOString(),
                category: detectCategory(m.question || m.description, m.category, m.tags || []),
                tags: m.tags || []
            }));

        // Deduplicate markets by ID
        const uniqueMarkets = new Map();
        processed.forEach((m: any) => {
            if (!uniqueMarkets.has(m.id)) {
                uniqueMarkets.set(m.id, m);
            }
        });

        return NextResponse.json(Array.from(uniqueMarkets.values()));

    } catch (error) {
        console.error('[API Route] Critical error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function detectCategory(title: string, originalCategory: string, tags: string[]): string {
    // If we have a valid category, use it
    if (originalCategory && originalCategory !== 'Other' && originalCategory !== 'Unknown') {
        return originalCategory;
    }

    const lower = title.toLowerCase();
    const tagStr = tags.join(' ').toLowerCase();
    const combined = lower + ' ' + tagStr;

    // Gaming / Video Games
    if (combined.match(/gta|gta 6|rockstar|playstation|xbox|nintendo|switch|gaming|esports|twitch|streamer|valorant|fortnite|minecraft|roblox|steam|epic games|call of duty|cod|league of legends|lol|dota|csgo|counter-strike|elden ring|zelda|mario|pokemon|diablo|world of warcraft|wow|fifa game|ea sports|ubisoft|activision|blizzard/)) {
        return 'Gaming';
    }

    // Entertainment / Pop Culture / Celebrities
    if (combined.match(/movie|film|oscar|emmy|grammy|netflix|disney|hollywood|actor|actress|celebrity|kardashian|taylor swift|kanye|drake|beyonce|rihanna|elon musk|mrbeast|logan paul|jake paul|ksi|pewdiepie|youtube|tiktok|instagram|influencer|viral|meme|scandal|breakup|dating|wedding|divorce|baby|pregnant|album|concert|tour|box office|streaming|hulu|hbo|amazon prime|spotify|apple music/)) {
        return 'Entertainment';
    }

    // Tech / AI / Companies
    if (combined.match(/apple|iphone|google|microsoft|amazon|meta|facebook|openai|chatgpt|ai|artificial intelligence|gpt|claude|gemini|nvidia|amd|intel|tesla|spacex|starlink|launch|rocket|satellite|neuralink|robot|automation|self-driving|autonomous|vr|ar|metaverse|web3|startup|ipo|acquisition|merger|layoff|ceo|founder/)) {
        return 'Tech';
    }

    // Crypto / DeFi
    if (combined.match(/bitcoin|btc|ethereum|eth|crypto|solana|sol|dogecoin|doge|nft|defi|blockchain|binance|coinbase|ftx|tether|usdt|usdc|altcoin|memecoin|shiba|pepe coin|ape|stablecoin|mining|halving|airdrop|token|wallet|exchange|rug pull/)) {
        return 'Crypto';
    }

    // Politics / Government
    if (combined.match(/trump|biden|election|president|congress|senate|vote|democrat|republican|governor|mayor|law|bill|legislation|supreme court|impeach|indictment|trial|ukraine|russia|china|war|nato|military|sanction|tariff|border|immigration|abortion|gun|policy|minister|parliament|brexit|eu|un|summit/)) {
        return 'Politics';
    }

    // Sports
    if (combined.match(/nfl|nba|nhl|mlb|mls|fifa|world cup|olympics|championship|super bowl|playoff|league|team|soccer|football|basketball|baseball|hockey|tennis|golf|boxing|ufc|mma|f1|formula 1|nascar|winner|champion|mvp|injury|trade|draft|transfer|coach|player/)) {
        return 'Sports';
    }

    // Finance / Economy
    if (combined.match(/stock|market|fed|rate|inflation|gdp|earnings|nasdaq|s&p|dow|treasury|bond|economy|recession|bull|bear|crash|rally|ipo|dividend|wall street|hedge fund|etf|mutual fund|401k|mortgage|housing|real estate|oil|gold|commodity|forex|currency/)) {
        return 'Finance';
    }

    // Science / Health / Nature
    if (combined.match(/vaccine|covid|virus|pandemic|disease|health|fda|drug|medicine|cancer|cure|climate|weather|hurricane|earthquake|wildfire|flood|drought|temperature|nasa|space|mars|moon|asteroid|ufo|alien|discovery|research|study|scientist/)) {
        return 'Science';
    }

    // Memes / Internet Culture / Viral
    if (combined.match(/meme|viral|trend|challenge|drama|beef|diss|fight|controversy|cancelled|canceled|exposed|leak|hack|prank|stunt|record|world record|guinness|first|biggest|smallest|oldest|youngest|most|least/)) {
        return 'Trending';
    }

    return 'Other';
}



function formatVolume(volume: number | null | undefined): string {
    if (!volume || typeof volume !== 'number') {
        return '$0';
    }
    if (volume >= 1000000) {
        return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
        return `$${(volume / 1000).toFixed(0)}K`;
    }
    return `$${volume.toFixed(0)}`;
}
