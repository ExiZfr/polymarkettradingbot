#!/usr/bin/env python3
"""
Quick test script to verify Polymarket API connectivity
"""
import asyncio
import sys

try:
    import httpx
except ImportError:
    print("❌ httpx not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx", "--quiet"])
    import httpx

async def test_api():
    """Test basic API connectivity"""
    api_url = "https://gamma-api.polymarket.com/markets"
    
    print("🔍 Testing Polymarket API connectivity...")
    print(f"📍 Endpoint: {api_url}")
    print()
    
    async with httpx.AsyncClient() as client:
        try:
            headers = {
                "User-Agent": "PolymarketSniper/1.0",
                "Accept": "application/json"
            }
            params = {
                "closed": "false",
                "active": "true",
                "limit": 5  # Just fetch 5 markets for testing
            }
            
            print("⏳ Sending request...")
            response = await client.get(
                api_url,
                params=params,
                headers=headers,
                timeout=30.0
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Received {len(data)} markets")
                
                if data and len(data) > 0:
                    first_market = data[0]
                    print(f"\n📈 Sample Market:")
                    print(f"   Question: {first_market.get('question', 'N/A')[:80]}...")
                    print(f"   ID: {first_market.get('id', 'N/A')}")
                    print(f"   Active: {first_market.get('active', 'N/A')}")
                print("\n✅ API is working correctly!")
                return True
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return False
                
        except httpx.TimeoutException:
            print("❌ Connection timeout - API might be slow or unreachable")
            return False
        except httpx.ConnectError as e:
            print(f"❌ Connection failed: {e}")
            print("   Check your internet connection")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {type(e).__name__}: {e}")
            return False

if __name__ == "__main__":
    result = asyncio.run(test_api())
    sys.exit(0 if result else 1)
