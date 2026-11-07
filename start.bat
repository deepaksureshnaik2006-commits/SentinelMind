@echo off
echo ==============================================================
echo           SentinelMind - AI Incident Response Agent
echo           An AI Agent That Learns From Every Incident
echo ==============================================================
echo.

cd backend
echo Starting SentinelMind Unified Server on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause

