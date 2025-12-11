@echo off
echo ==========================================
echo      POLYMARKET BOT - TOTAL RESET
echo ==========================================
echo.
echo 1. Cleaning Local Data...
del scripts\virtual_ledger.json 2>nul
del scripts\sniper.log 2>nul

echo 2. Pushing Code updates...
git add .
git commit -m "chore: full reset and update" 2>nul
git push

echo 3. Connecting to VPS (Update & Reset)...
:: Calls the remote updater (Make sure you set your IP in remote_update.bat!)
call remote_update.bat

echo.
echo ✅ ALL DONE!
pause
