@echo off
title Nutrinance - Live Cloudflare Public Hosting
echo ========================================================
echo   Starting Nutrinance Local Server and Cloudflare Tunnel
echo ========================================================
echo.

:: 1. Start local node server in background if not already running
netstat -ano | findstr :5599 >nul
if %errorlevel% neq 0 (
    echo Starting Node server on http://localhost:5599 ...
    start "" /B node server.js
    timeout /t 2 /nobreak >nul
) else (
    echo Local Node server is running on port 5599.
)

echo.
echo Starting secure Cloudflare Tunnel...
echo (The public HTTPS link below is accessible worldwide on any network)
echo.

:: 2. Run cloudflared tunnel
"%~dp0cloudflared.exe" tunnel --url http://localhost:5599
pause
