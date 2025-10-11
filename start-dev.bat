@echo off
echo Starting Walrus Data Marketplace Development Environment...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Press any key to exit this window...
pause > nul
