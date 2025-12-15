#!/usr/bin/env python3
"""Debug script to inspect Polymarket Data-API response structure"""
import aiohttp
import asyncio
import json

async def test_api():
    """Fetch one trade and print its FULL structure"""
    url = "https://data-api.polymarket.com/trades"
    params = {'limit': 1}  # Just get 1 trade
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params, timeout=10) as resp:
            if resp.status == 200:
                trades = await resp.json()
                
                if trades and len(trades) > 0:
                    trade = trades[0]
                    
                    print("=" * 80)
                    print("FULL TRADE OBJECT:")
                    print("=" * 80)
                    print(json.dumps(trade, indent=2))
                    print("=" * 80)
                    print("\nKEY FIELDS:")
                    print("=" * 80)
                    
                    # Check if 'market' exists
                    if 'market' in trade:
                        print(f"✅ trade['market'] EXISTS:")
                        print(json.dumps(trade['market'], indent=2))
                    else:
                        print("❌ trade['market'] DOES NOT EXIST")
                    
                    # Check top-level fields
                    print(f"\n📋 Top-level fields: {list(trade.keys())}")
                    
                    # Try to find market info
                    for key in ['title', 'question', 'slug', 'marketSlug', 'market_question']:
                        if key in trade:
                            print(f"✅ trade['{key}'] = {trade[key]}")
                    
                else:
                    print("❌ No trades returned")
            else:
                print(f"❌ API returned status {resp.status}")

if __name__ == "__main__":
    asyncio.run(test_api())
