@echo off
cd /d D:\Matasree_Store\matasree-backend
echo Starting Matasree Backend Server...
set PORT=5001
echo Port: %PORT%
echo.
npm run dev
pause
