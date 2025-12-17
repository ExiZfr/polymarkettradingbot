#!/usr/bin/env python3
"""
Recalculate profile balance from order history
Fixes balance inconsistencies after bug fixes
"""

import json
from pathlib import Path

DATA_DIR = Path("/root/PolygraalX/data")
ORDERS_FILE = DATA_DIR / "server_paper_orders.json"
PROFILES_FILE = DATA_DIR / "server_paper_profiles.json"

# Read data
orders = json.loads(ORDERS_FILE.read_text())
profiles = json.loads(PROFILES_FILE.read_text())

# Find active profile
active_profile = None
for p in profiles:
    if p.get("isActive"):
        active_profile = p
        break

if not active_profile:
    print("No active profile found!")
    exit(1)

print(f"Active profile: {active_profile['name']}")
print(f"Current balance: ${active_profile['balance']:.2f}")
print(f"Initial balance: ${active_profile['initialBalance']:.2f}")
print(f"Current totalPnL: ${active_profile['totalPnL']:.2f}")
print()

# Recalculate from orders
initial_balance = active_profile['initialBalance']
total_invested = 0
total_recovered = 0
total_pnl = 0
win_count = 0
loss_count = 0
open_orders_count = 0
closed_orders_count = 0

for order in orders:
    amount = order.get('amount', 0)
    original_amount = order.get('originalAmount', amount)
    status = order.get('status', 'OPEN')
    
    if status == 'OPEN':
        total_invested += amount
        open_orders_count += 1
    elif status == 'CLOSED':
        # Capital was deducted when order was placed (originalAmount)
        total_invested += original_amount
        
        # Capital returned when order closed
        shares = order.get('shares', order.get('originalShares', 0))
        exit_price = order.get('exitPrice', order.get('entryPrice', 0))
        
        if exit_price > 0 and shares > 0:
            recovered = shares * exit_price
            total_recovered += recovered
        
        # PnL
        pnl = order.get('pnl', 0)
        total_pnl += pnl
        
        if pnl > 0:
            win_count += 1
        elif pnl < 0:
            loss_count += 1
        
        closed_orders_count += 1

# Calculate correct balance
# Balance = Initial - (invested but not recovered) + recovered
correct_balance = initial_balance - total_invested + total_recovered

print("=" * 50)
print(f"Orders analyzed: {len(orders)}")
print(f"  - Open: {open_orders_count}")
print(f"  - Closed: {closed_orders_count}")
print()
print(f"Total invested: ${total_invested:.2f}")
print(f"Total recovered from closed: ${total_recovered:.2f}")
print(f"Total realized PnL: ${total_pnl:.2f}")
print()
print(f"Wins: {win_count}, Losses: {loss_count}")
print()
print("=" * 50)
print(f"CORRECT BALANCE should be: ${correct_balance:.2f}")
print(f"Current balance is: ${active_profile['balance']:.2f}")
print(f"Difference: ${correct_balance - active_profile['balance']:.2f}")
print("=" * 50)

# Ask to fix
response = input("\nDo you want to fix the profile? (y/n): ")
if response.lower() == 'y':
    active_profile['balance'] = round(correct_balance, 2)
    active_profile['totalPnL'] = round(total_pnl, 2)
    active_profile['winningTrades'] = win_count
    active_profile['losingTrades'] = loss_count
    active_profile['totalTrades'] = closed_orders_count
    
    PROFILES_FILE.write_text(json.dumps(profiles, indent=2))
    print("\n✅ Profile updated!")
    print(f"   Balance: ${active_profile['balance']:.2f}")
    print(f"   Total PnL: ${active_profile['totalPnL']:.2f}")
    print(f"   Wins/Losses: {win_count}/{loss_count}")
else:
    print("\nNo changes made.")
