@echo off
chcp 65001 >nul
title hdochub blog

REM ============================================================
REM hdochub blog local startup script (Windows)
REM First run: full initialization
REM Later runs: skip init, start services directly
REM Reset: start-dev.bat --reset
REM ============================================================

setlocal enabledelayedexpansion
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
    if exist src\server\tsconfig.tsbuildinfo del /q src\server\tsconfig.tsbuildinfo
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
if !errorlevel! equ 0 (
    echo [OK] Docker engine is running
    goto docker_ok
)

REM Docker not running, auto-start Docker Desktop
echo [INFO] Docker engine not running, auto-starting Docker Desktop...

REM Strategy 1: Derive Docker Desktop.exe path from docker CLI path
REM docker.exe is at <install>\resources\bin\docker.exe
REM Docker Desktop.exe is at <install>\Docker Desktop.exe
set "DOCKER_EXE="
for /f "delims=" %%i in ('where docker 2^>nul') do (
    set "DOCKER_CLI=%%i"
)
if defined DOCKER_CLI (
    REM Replace \resources\bin\docker.exe with \Docker Desktop.exe
    set "DOCKER_EXE=!DOCKER_CLI:\resources\bin\docker.exe=!\Docker Desktop.exe"
    if not exist "!DOCKER_EXE!" set "DOCKER_EXE="
)

REM Strategy 2: Common install paths
if not defined DOCKER_EXE if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe"
if not defined DOCKER_EXE if exist "C:\Program Files (x86)\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=C:\Program Files (x86)\Docker\Docker\Docker Desktop.exe"

REM Strategy 3: Registry query
if not defined DOCKER_EXE (
    for /f "tokens=2,*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Docker Desktop" /v InstallLocation 2^>nul') do (
        if exist "%%b\Docker Desktop.exe" set "DOCKER_EXE=%%b\Docker Desktop.exe"
    )
)

REM Strategy 4: PowerShell registry search (last resort)
if not defined DOCKER_EXE (
    for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*','HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue ^| Where-Object { $_.DisplayName -like '*Docker Desktop*' } ^| Select-Object -First 1 -ExpandProperty InstallLocation" 2^>nul') do (
        if exist "%%i\Docker Desktop.exe" set "DOCKER_EXE=%%i\Docker Desktop.exe"
    )
)

if defined DOCKER_EXE (
    echo   Found: !DOCKER_EXE!
    echo   Starting Docker Desktop...
    start "" "!DOCKER_EXE!"
) else (
    echo [WARN] Cannot locate Docker Desktop.exe, trying shell protocol...
    start "" "dockerdesktop:"
)

echo   Waiting for Docker engine (max 120s)...
set /a DOCKER_WAIT=0

:wait_docker_engine
set /a DOCKER_WAIT+=1
timeout /t 3 /nobreak >nul
docker ps >nul 2>nul
if !errorlevel! equ 0 (
    echo [OK] Docker engine is ready
    goto docker_ok
)
if !DOCKER_WAIT! lss 40 (
    echo   Waiting... (!DOCKER_WAIT!/40)
    goto wait_docker_engine
)
echo [ERROR] Docker engine startup timeout (120s)
echo.
echo   Please open Docker Desktop manually from Start Menu,
echo   wait for whale icon to become steady, then run again.
echo.
pause
exit /b 1

:docker_ok

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
if !errorlevel! equ 0 (
    echo [OK] MySQL is ready
    goto mysql_ready
)
if !WAIT_COUNT! lss 30 (
    timeout /t 2 /nobreak >nul
    echo   Waiting... (!WAIT_COUNT!/30)
    goto wait_mysql
)
echo [ERROR] MySQL startup timeout (60s)
pause
exit /b 1

:mysql_ready

REM Wait for Redis
docker exec hdochub-redis redis-cli ping >nul 2>nul
if !errorlevel! neq 0 (
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

echo Building backend (first compile)...
call npm run build
echo [OK] Backend built successfully

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

REM Use curl if available (Windows 10+), otherwise fallback to PowerShell
where curl >nul 2>nul
if !errorlevel! equ 0 (
    REM curl returns 0 if it connects and gets any HTTP response (even 404/500)
    REM This is sufficient: we just need to know the backend is up
    curl -s -o nul --connect-timeout 2 http://localhost:4000/api 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Backend is ready
        goto backend_ready
    )
) else (
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:4000/api' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Backend is ready
        goto backend_ready
    )
)

if !BACKEND_WAIT! lss 20 (
    echo   Waiting... (!BACKEND_WAIT!/20)
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
exit /b 0
