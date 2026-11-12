@echo off
echo =====================================================================
echo  Starting AgentVault: Financial Governance Platform for AI Agents
echo =====================================================================
echo.
echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "AgentVault Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend Server on http://localhost:5173 ...
start "AgentVault Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Both servers started!
echo - Frontend Dashboard: http://localhost:5173
echo - Interactive Swagger API Docs: http://127.0.0.1:8000/docs
echo.
pause
