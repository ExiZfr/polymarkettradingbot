@echo off
title Polymarket Sniper Bot (24/7)
color 0a
cls

echo ==================================================
echo    POLYMARKET SNIPER - 24/7 EXECUTION MODE
echo ==================================================
echo.
echo [INFO] Starting the bot loop...
echo [INFO] Press Ctrl+C to stop manually.
echo.

:loop
echo [%date% %time%] Launching Bot...
py -3 scripts/polymarket_sniper.py
echo.
echo [WARN] Bot crashed or stopped! Restarting in 5 seconds...
timeout /t 5
goto loop
