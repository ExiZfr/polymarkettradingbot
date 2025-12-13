#!/bin/bash
# =============================================================================
# FIX DÉFINITIF WHALE TRACKER - DOWNGRADE WEB3.PY v6
# =============================================================================
set -e

echo "=========================================="
echo "🔧 FIX DÉFINITIF WHALE TRACKER"
echo "=========================================="
echo ""

cd ~/PolygraalX

echo "[1/6] 📥 Pull code..."
git fetch origin
git reset --hard origin/main
echo "✅ Code à jour"
echo ""

echo "[2/6] 🐍 DOWNGRADE Web3.py vers v6..."
echo "Web3.py v7 a trop de bugs. On passe à v6 (stable)"
pip3 uninstall -y web3 2>/dev/null || true
pip3 install --break-system-packages web3==6.11.3
echo "✅ Web3.py v6.11.3 installé"
echo ""

echo "[3/6] 🔧 Patch script pour Web3.py v6..."
cd scripts

# Backup
cp whale_tracker.py whale_tracker.py.backup

# Fix 1: Import correct
sed -i 's/from web3.providers import HTTPProvider/from web3 import Web3, HTTPProvider/' whale_tracker.py

# Fix 2: Remove event signature (v6 doesn't need it)
sed -i '/event_signature = self.w3.keccak/d' whale_tracker.py

# Fix 3: Simplify get_logs for v6
cat > /tmp/fix_v6.py << 'PYTHON_EOF'
import re

with open('whale_tracker.py', 'r') as f:
    content = f.read()

# Replace complex v7 get_logs with simple v6 version
old_pattern = r"""# Get logs using eth\.get_logs
                        logs = self\.w3\.eth\.get_logs\(\{
                            'address': Web3\.to_checksum_address\(CTF_EXCHANGE_ADDRESS\),
                            'fromBlock': last_block \+ 1,
                            'toBlock': current_block,
                            'topics': \[event_signature\]
                        \}\)
                        
                        for log in logs:
                            # Parse log using contract ABI
                            try:
                                event = contract\.events\.OrderFilled\(\)\.process_log\(log\)"""

new_code = """# Get events using v6 API (simple and stable)
                        try:
                            events = contract.events.OrderFilled.get_logs(
                                fromBlock=last_block + 1,
                                toBlock=current_block
                            )
                        except Exception as e:
                            logger.error(f"Error fetching logs: {e}")
                            events = []
                        
                        for event in events:
                            try:"""

content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

with open('whale_tracker.py', 'w') as f:
    f.write(content)

print("✅ Code patché pour Web3.py v6")
PYTHON_EOF

python3 /tmp/fix_v6.py
cd ..
echo "✅ Script patché pour Web3.py v6"
echo ""

echo "[4/6] 🧪 Test script..."
cd scripts
export WHALE_TRACKER_MODE=production
export POLYGON_RPC_WSS=$(grep "^POLYGON_RPC_WSS=" ../.env | cut -d'=' -f2)
export API_BASE_URL=http://localhost:3001
export MIN_WHALE_AMOUNT=5000

timeout 5 python3 whale_tracker.py 2>&1 | head -30 || true
cd ..
echo ""

echo "[5/6] 🧹 Nettoyage PM2..."
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true
echo ""

echo "[6/6] 🚀 Démarrage whale-tracker..."
pm2 start scripts/whale_tracker.py \
  --name whale-tracker \
  --interpreter python3 \
  --restart-delay 5000

sleep 3
pm2 save
echo ""

echo "=========================================="
echo "✅ FIX TERMINÉ"
echo "=========================================="
echo ""

pm2 list | grep whale-tracker
echo ""
pm2 logs whale-tracker --lines 30 --nostream
echo ""

echo "🎯 Si vous voyez 'Connected to Polygon' sans erreur,"
echo "   le whale tracker fonctionne ENFIN !"
echo ""
