@echo off
setlocal
echo ===================================================
echo   CIM Automation Platform - React + FastAPI
echo ===================================================

:: Ensure we are in the root directory
cd /d "%~dp0"

:: Stop any previous instances to avoid port conflicts
echo [1/4] Stopping existing processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak > nul

:: Step 1: Backend Setup
echo [2/4] Initializing Python Backend...
if not exist "backend\venv" (
    echo Creating virtual environment...
    python -m venv backend\venv
)

:: Ensure dependencies and seed data
echo Verifying backend dependencies and sample data...
call backend\venv\Scripts\activate.bat
python -m pip install -r backend\requirements.txt --quiet
python backend\seed_data.py
deactivate

:: Step 2: Start Backend in the SAME terminal (background)
echo.
echo Starting FastAPI Backend on http://localhost:5000...
:: Use start /B to run in the background within the same window
start /B "" "backend\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 5000 --app-dir "%~dp0backend"

:: Wait for backend to warm up
timeout /t 3 /nobreak > nul

:: Step 3: Frontend Setup
echo.
echo [3/4] Initializing React Frontend...
cd client
if not exist "node_modules" (
    echo Installing node dependencies...
    call npm install
)

:: Step 4: Start Frontend
echo.
echo [4/4] Starting React Frontend on http://localhost:3000...
echo.
npm start

pause
