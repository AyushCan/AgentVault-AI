@echo off
echo ===================================================
echo Starting AgentVault Frontend (Vite + React)...
echo ===================================================
cd /d "%~dp0frontend"
npm.cmd run dev
pause
