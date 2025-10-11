# Walrus Data Marketplace Development Startup Script

Write-Host "🚀 Starting Walrus Data Marketplace Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if server directory exists
if (-not (Test-Path "server")) {
    Write-Host "❌ Server directory not found!" -ForegroundColor Red
    exit 1
}

# Check if server package.json exists
if (-not (Test-Path "server/package.json")) {
    Write-Host "❌ Server package.json not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "📦 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🌐 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
