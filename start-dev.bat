@echo off
chcp 65001 >nul
title hdochub blog

REM ============================================================
REM hdochub blog local startup script (Windows)
REM First run: full initialization
REM Later runs: skip init, start services directly
REM Reset: start-dev.bat --reset
REM ============================================================

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo.
echo ==================================================
echo   hdochub blog local startup
echo ==================================================
echo.

REM ========== Check reset flag ==========
if /i "%1"=="--reset" (
    echo [INFO] --reset detected, will re-initialize
    if exist .setup-done del /q .setup-done
    if exist src\server\.env del /q src\server\.env
    if exist src\client\.env del /q src\client\.env
)

REM ========== Check Docker ==========
echo [Step 0] Checking environment...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker not found. Please run setup-windows.bat first
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please run setup-windows.bat first
    pause
    exit /b 1
)

REM Check if Docker engine is running
docker ps >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Docker engine not running, trying to start...
    set "DOCKER_EXE="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    if defined DOCKER_EXE (
        start "" "%DOCKER_EXE%"
        echo [INFO] Waiting for Docker engine to start...
        set /a DOCKER_WAIT=0
        :wait_docker_engine
        set /a DOCKER_WAIT+=1
        timeout /t 3 /nobreak >nul
        docker ps >nul 2>nul
        if %errorlevel% equ 0 (
            echo [OK] Docker engine is ready
            goto docker_ok
        )
        if %DOCKER_WAIT% lss 20 (
            echo   Waiting... (%DOCKER_WAIT%/20)
            goto wait_docker_engine
        )
    )
    echo [ERROR] Docker engine not running
    echo   Please open Docker Desktop manually, wait for the whale icon to stop animating
    echo   Then run this script again
    pause
    exit /b 1
)
:docker_ok
echo [OK] Docker engine is running

REM ========== Start MySQL and Redis ==========
echo.
echo [Step 1] Starting MySQL and Redis...
docker compose up -d

REM Wait for MySQL to be ready (poll, max 60 seconds)
echo Waiting for MySQL...
set /a WAIT_COUNT=0
:wait_mysql
set /a WAIT_COUNT+=1
docker exec hdochub-mysql mysqladmin ping -h localhost -uroot -phdochub_dev_2026 --silent >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MySQL is ready
    goto mysql_ready
)
if %WAIT_COUNT% lss 30 (
    timeout /t 2 /nobreak >nul
    echo   Waiting... (%WAIT_COUNT%/30)
    goto wait_mysql
)
echo [ERROR] MySQL startup timeout (60s)
pause
exit /b 1

:mysql_ready

REM Wait for Redis
docker exec hdochub-redis redis-cli ping >nul 2>nul
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak >nul
)
echo [OK] Redis is ready

REM ========== Check if already initialized ==========
if exist .setup-done (
    echo.
    echo [SKIP] Already initialized, starting services directly
    echo   To re-initialize: start-dev.bat --reset
    goto start_services
)

REM ========== First-time initialization ==========
echo.
echo [INIT] First-time setup...
echo.

REM --- Backend ---
cd /d "%PROJECT_DIR%src\server"

if not exist .env (
    copy .env.dev .env >nul
    echo [OK] Backend .env created
)

echo Installing backend dependencies (1-2 min)...
call npm install --silent
echo [OK] Backend dependencies installed

echo Generating Prisma Client...
call npx prisma generate
echo [OK] Prisma Client generated

echo Creating database tables...
call npx prisma db push --accept-data-loss
echo [OK] Database tables created

echo Seeding initial data...
call npm run prisma:seed
echo [OK] Initial data seeded

REM --- Frontend ---
cd /d "%PROJECT_DIR%src\client"

if not exist .env (
    copy .env.example .env >nul
    echo [OK] Frontend .env created
)

echo Installing frontend dependencies (1-2 min)...
call npm install --silent
echo [OK] Frontend dependencies installed

REM --- Mark done ---
cd /d "%PROJECT_DIR%"
echo done > .setup-done
echo.
echo [OK] First-time setup complete

:start_services
REM ========== Start services ==========
echo.
echo [Step 2] Starting services...

echo Starting backend...
start "hdochub backend" cmd /k "cd /d %PROJECT_DIR%src\server && npm run start:dev"

echo Waiting for backend...
set /a BACKEND_WAIT=0
:wait_backend
set /a BACKEND_WAIT+=1
timeout /t 2 /nobreak >nul
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:4000/api' -UseBasicParsing -TimeoutSec 2).StatusCode" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Backend is ready
    goto backend_ready
)
if %BACKEND_WAIT% lss 20 (
    echo   Waiting... (%BACKEND_WAIT%/20)
    goto wait_backend
)
echo [INFO] Backend is slow, starting frontend anyway
goto start_frontend

:backend_ready
:start_frontend
echo Starting frontend...
start "hdochub frontend" cmd /k "cd /d %PROJECT_DIR%src\client && npm run dev"

REM ========== Done ==========
echo.
echo ==================================================
echo   Startup complete!
echo ==================================================
echo.
echo   Blog:       http://localhost:3000
echo   Admin:      http://localhost:3000/admin
echo.
echo   Username:   admin
echo   Password:   Admin@123456
echo.
echo   MySQL:      localhost:3307 (Docker)
echo   Redis:      localhost:6380 (Docker)
echo.
echo   Close backend/frontend windows to stop services
echo   Stop Docker containers: docker compose down
echo.
pause
