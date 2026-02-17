@echo off
REM Matasree Store - Full Stack Quick Start Script for Windows

echo.
echo 🚀 Starting Matasree Store - Full Stack Setup
echo ============================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found

REM Backend Setup
echo.
echo >>> Setting up Backend...
cd matasree-backend

if not exist ".env" (
    echo.
    echo ⚠ No .env file found in backend. Creating from .env.example...
    copy .env.example .env
    echo ⚠ Please update .env with your MongoDB URI and other credentials
)

echo.
echo >>> Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

REM Frontend Setup
echo.
echo >>> Setting up Frontend...
cd ..\matasree-superstore-main

if not exist ".env.local" (
    echo.
    echo ⚠ Creating .env.local for frontend...
    (
        echo VITE_API_URL=http://localhost:5000/api
    ) > .env.local
)

echo.
echo >>> Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

echo.
echo ============================================
echo ✓ Setup Complete!
echo.
echo Next Steps:
echo 1. Update backend\.env with your MongoDB URI and credentials
echo 2. Start Backend: cd matasree-backend ^&^& npm run dev
echo 3. Start Frontend: cd matasree-superstore-main ^&^& npm run dev
echo.
echo Backend URL: http://localhost:5000
echo Frontend URL: http://localhost:5173
echo.
pause
