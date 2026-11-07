Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "          SentinelMind - AI Incident Response Agent" -ForegroundColor Cyan
Write-Host "          An AI Agent That Learns From Every Incident" -ForegroundColor Magenta
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$PSScriptRoot\backend"
Write-Host "Starting SentinelMind Unified Server on http://127.0.0.1:8000 ..." -ForegroundColor Green
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

