@echo off
chcp 65001 >nul
title hdochub setup

REM ============================================================
REM hdochub blog Windows environment setup script
REM Run as Administrator
REM ============================================================

echo.
echo ==================================================
echo   hdochub environment setup
echo   Please run as Administrator
echo ==================================================
echo.

REM ========== Check admin ==========
net session >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Administrator permission required
    echo   Right-click this file -^> Run as administrator
    pause
    exit /b 1
)
echo [OK] Administrator permission confirmed

REM ========== Check Node.js ==========
echo.
echo [CHECK] Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [MISSING] Node.js not installed
    echo   Downloading Node.js 18 LTS...
    start https://nodejs.org/dist/v18.20.4/node-v18.20.4-x64.msi
    echo   Please install and re-run this script
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo [OK] Node.js installed: %NODE_VER%
)

REM ========== Check WSL2 ==========
echo.
echo [CHECK] WSL2...
wsl --status >nul 2>nul
if %errorlevel% neq 0 (
    echo [MISSING] WSL2 not installed
    echo   Installing WSL2...
    echo   (Reboot required after installation)
    wsl --install
    echo.
    echo ==================================================
    echo   WSL2 installed! Please reboot and re-run
    echo ==================================================
    pause
    exit /b 0
) else (
    echo [OK] WSL2 installed
)

REM ========== Check Docker Desktop ==========
echo.
echo [CHECK] Docker Desktop...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [MISSING] Docker Desktop not installed
    echo   Opening download page...
    start https://docs.docker.com/desktop/install/windows-install/
    echo   Install Docker Desktop, reboot, then re-run
    pause
    exit /b 1
)

echo [CHECK] Docker engine...
docker ps >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Docker engine not running, starting Docker Desktop...
    set "DOCKER_PATH="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )

    if defined DOCKER_PATH (
        echo   Starting Docker Desktop...
        start "" "%DOCKER_PATH%"
        echo   Waiting for Docker engine (max 90s)...
    ) else (
        echo   Cannot find Docker Desktop, please start manually
        pause
        exit /b 1
    )

    set /a WAIT_COUNT=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    set /a WAIT_COUNT+=1
    docker ps >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Docker engine is ready
        goto docker_ready
    )
    if %WAIT_COUNT% lss 18 (
        echo   Waiting... (%WAIT_COUNT%/18)
        goto wait_docker
    ) else (
        echo [ERROR] Docker engine startup timeout
        echo   Open Docker Desktop manually, wait for whale icon
        echo   Then run start-dev.bat
        pause
        exit /b 1
    )
) else (
    echo [OK] Docker engine is running
)

:docker_ready

REM ========== Ready ==========
echo.
echo ==================================================
echo   Environment check passed!
echo ==================================================
echo.
echo   Node.js:  %NODE_VER%
echo   WSL2:     Installed
echo   Docker:   Running
echo.
echo   Now run: start-dev.bat
echo.
echo   Start blog now? (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo.
    call "%~dp0start-dev.bat"
)
pause
