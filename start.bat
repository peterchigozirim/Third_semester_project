@echo off
echo Starting Eventful Platform...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Docker is running
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.docker .env
    echo .env file created
    echo Please edit .env with your credentials (especially Paystack and SMTP)
    echo.
)

REM Start services
echo Starting all services...
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check services
echo.
echo Service Status:
docker-compose ps

echo.
echo Eventful is now running!
echo.
echo Access Points:
echo    Frontend:    http://localhost:3001
echo    Backend API: http://localhost:3000
echo    API Docs:    http://localhost:3000/api-docs
echo.
echo Useful Commands:
echo    View logs:        docker-compose logs -f
echo    Stop services:    docker-compose down
echo    Restart:          docker-compose restart
echo    Seed database:    docker-compose exec backend npm run seed
echo.
echo Next Steps:
echo    1. Visit http://localhost:3001
echo    2. Register a new account
echo    3. Start creating or attending events!
echo.
pause
