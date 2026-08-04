@echo off
title Elipse Backend Restart
echo ============================================
echo  Stopping old backend on port 5003...
echo ============================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5003 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo.
echo ============================================
echo  Starting backend...
echo  URL: http://localhost:5003/status
echo ============================================
cd /d "%~dp0"
start "" cmd /k "npm start"
timeout /t 6 /nobreak >nul
echo.
echo Backend started. Health check:
curl -s http://localhost:5003/status
echo.
pause
