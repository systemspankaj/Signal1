@echo off
title Signal Clone - Startup
echo ========================================
echo   Signal Clone - Starting Servers
echo ========================================
echo.

:: Free port 3000 if an old server is still running
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Freeing port 3000 ^(PID %%a^)...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Free port 8000 if an old backend is still running
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Freeing port 8000 ^(PID %%a^)...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start Backend
echo [1/2] Starting Backend on http://localhost:8000 ...
start "Signal Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

:: Start Frontend on port 3000
echo [2/2] Starting Frontend on http://localhost:3000 ...
start "Signal Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 6 /nobreak >nul

echo.
echo ========================================
echo   Open: http://localhost:3000
echo   Login: alice / password123
echo ========================================
echo.
start http://localhost:3000
