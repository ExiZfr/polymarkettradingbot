@echo off
title Polymarket Remote Updater
color 0b
cls

echo ==================================================
echo    REMOTE VPS UPDATER
echo ==================================================
echo.
echo This script will connect to your VPS and update the bot automatically.
echo.

:: Configuration (Modify these if you want to hardcode them)
set VPS_USER=root
set VPS_IP=
set REMOTE_PATH=~/botpolymarket

:: Ask for IP if not set
if "%VPS_IP%"=="" (
    set /p VPS_IP="Enter VPS IP Address: "
)

echo.
echo [INFO] Connecting to %VPS_USER%@%VPS_IP%...
echo [INFO] Executing update script at %REMOTE_PATH%...
echo.

:: Execute SSH command
ssh %VPS_USER%@%VPS_IP% "cd %REMOTE_PATH% && git pull && chmod +x deploy.sh && ./deploy.sh"

echo.
echo ==================================================
if %ERRORLEVEL% EQU 0 (
    echo    SUCCESS! Bot updated remotely.
) else (
    echo    ERROR! Check your connection or path.
)
echo ==================================================
pause
