# Signal Clone - Start both servers
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Signal Clone - Starting Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Stop-PortListener($port) {
    $connections = netstat -ano | Select-String ":$port\s+.*LISTENING"
    foreach ($line in $connections) {
        $pid = ($line -split '\s+')[-1]
        if ($pid -match '^\d+$') {
            Write-Host "Freeing port $port (PID $pid)..." -ForegroundColor DarkYellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

Stop-PortListener 3000
Stop-PortListener 8000
Start-Sleep -Seconds 2

Write-Host "`n[1/2] Starting Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 6

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Open: http://localhost:3000" -ForegroundColor Green
Write-Host "  Login: alice / password123" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Start-Process "http://localhost:3000"
