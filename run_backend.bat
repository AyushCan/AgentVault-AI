@echo off
echo ===================================================
echo Starting AgentVault FastAPI Backend Server...
echo ===================================================
cd /d "%~dp0backend"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
