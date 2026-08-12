@echo off
echo Starting Eventful Fullstack Application...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Docker is installed and running
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    if exist .env.docker (
        copy .env.docker .env
    ) else if exist .env.example (
        copy .env.example .env
    )
    echo .env file created
    echo Please edit .env with your credentials (especially Paystack keys)
    echo.
)

REM Stop any existing containers
echo Stopping any existing containers...
docker-compose down 2>nul

REM Start services
echo.
echo Starting Docker containers...
docker-compose up -d

REM Wait for services
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo.
echo Checking service health...

curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend is healthy
) else (
    echo Backend is not responding
    echo Check logs with: docker-compose logs backend
)

curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend is accessible
) else (
    echo Frontend is not responding
    echo Check logs with: docker-compose logs frontend
)

REM Display service status
echo.
echo Service Status:
docker-compose ps

echo.
echo Eventful Fullstack Application is now running!
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
echo    2. Click 'Get Started' to register
echo    3. Choose 'Creator' or 'Eventee'
echo    4. Start exploring!
echo.
pause
