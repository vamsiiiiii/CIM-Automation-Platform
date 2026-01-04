@echo off
echo 🚀 Starting CIM Automation Platform Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Setup environment file
if not exist .env (
    echo 📝 Creating environment file...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please add your Google AI Studio API key to .env file
    echo    1. Visit: https://makersuite.google.com/app/apikey
    echo    2. Create an API key
    echo    3. Edit .env file and replace 'your-google-ai-studio-api-key-here' with your actual key
    echo.
    pause
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

echo 📦 Installing server dependencies...
cd server
call npm install

echo 📦 Installing client dependencies...
cd ..\client
call npm install

cd ..

REM Setup database
echo 🗄️  Setting up database...
cd server

REM Generate Prisma client
call npx prisma generate

REM Run migrations
call npx prisma migrate dev --name init

REM Create required directories
if not exist uploads mkdir uploads
if not exist logs mkdir logs

cd ..

echo.
echo 🎉 Setup complete! Starting the application...
echo.
echo 📊 Backend will run on: http://localhost:5000
echo 🌐 Frontend will run on: http://localhost:3000
echo.

REM Start the application
call npm run dev