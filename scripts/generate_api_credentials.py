#!/usr/bin/env python3
"""
Polymarket API Credentials Generator
=====================================
Generates API credentials programmatically using your private key.
No need to use the web interface!

Usage:
    python3 scripts/generate_api_credentials.py

Requirements:
    - Private key in .env file (PK=0x...)
"""

import os
import sys
from dotenv import load_dotenv

# Load environment
load_dotenv()

print("=" * 70)
print("🔐 Polymarket API Credentials Generator")
print("=" * 70)

# Check for private key
private_key = os.getenv("PK")
if not private_key or private_key == "0x...":
    print("\n❌ ERROR: Private key not found!")
    print("\nPlease add your private key to .env file:")
    print("  PK=0xYOUR_PRIVATE_KEY_HERE")
    print("\nGet it from MetaMask: Settings → Security & Privacy → Reveal Private Key")
    sys.exit(1)

print(f"\n✅ Private key found: {private_key[:10]}...{private_key[-8:]}")

# Try to import py_clob_client
try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import ApiCreds
    from py_clob_client.constants import POLYGON
except ImportError:
    print("\n❌ ERROR: py_clob_client not installed!")
    print("\nInstall it with:")
    print("  pip3 install py-clob-client")
    sys.exit(1)

print("\n🔄 Generating API credentials...")
print("(This uses L1 authentication with your private key)\n")

try:
    # Initialize client
    client = ClobClient(
        host="https://clob.polymarket.com",
        chain_id=POLYGON,
        private_key=private_key,
        signature_type=2  # EIP-712
    )
    
    # Generate/derive API credentials
    api_creds: ApiCreds = client.create_or_derive_api_creds()
    
    print("=" * 70)
    print("✅ SUCCESS! API Credentials Generated")
    print("=" * 70)
    
    print(f"\nAPI Key:     {api_creds.api_key}")
    print(f"Secret:      {api_creds.api_secret}")
    print(f"Passphrase:  {api_creds.api_passphrase}")
    
    # Ask user if they want to save to .env
    print("\n" + "=" * 70)
    response = input("\n💾 Save these credentials to .env file? (y/n): ").lower().strip()
    
    if response == 'y':
        # Read current .env
        env_path = ".env"
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_content = f.read()
        else:
            env_content = ""
        
        # Update credentials
        lines = env_content.split('\n')
        updated = False
        new_lines = []
        
        for line in lines:
            if line.startswith('CLOB_API_KEY='):
                new_lines.append(f'CLOB_API_KEY={api_creds.api_key}')
                updated = True
            elif line.startswith('CLOB_SECRET='):
                new_lines.append(f'CLOB_SECRET={api_creds.api_secret}')
            elif line.startswith('CLOB_PASSPHRASE='):
                new_lines.append(f'CLOB_PASSPHRASE={api_creds.api_passphrase}')
            else:
                new_lines.append(line)
        
        # Write back
        with open(env_path, 'w') as f:
            f.write('\n'.join(new_lines))
        
        print("\n✅ Credentials saved to .env!")
        print("\n⚠️  IMPORTANT: Keep .env secure and never commit it to git!")
    else:
        print("\n⚠️  Please save these credentials manually to your .env file:")
        print(f"\n  CLOB_API_KEY={api_creds.api_key}")
        print(f"  CLOB_SECRET={api_creds.api_secret}")
        print(f"  CLOB_PASSPHRASE={api_creds.api_passphrase}")
    
    print("\n" + "=" * 70)
    print("🎯 Next Steps:")
    print("=" * 70)
    print("\n1. Get your Proxy Wallet address from:")
    print("   https://polymarket.com/wallet")
    print("\n2. Add it to .env:")
    print("   PROXY_ADDRESS=0xYOUR_PROXY_ADDRESS")
    print("\n3. Test connection:")
    print("   python3 scripts/polymarket_trader.py")
    print("\n" + "=" * 70)
    
except Exception as e:
    print(f"\n❌ ERROR: Failed to generate credentials")
    print(f"\nDetails: {e}")
    print("\nMake sure your private key is valid and has the right format (0x...)")
    sys.exit(1)
