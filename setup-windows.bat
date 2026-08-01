@echo off
chcp 65001 >nul
title hdochub 环境初始化

REM ============================================================
REM hdochub 博客 Windows 环境初始化脚本
REM 一键检查并配置：Node.js、WSL2、Docker Desktop
REM 使用方式：右键「以管理员身份运行」
REM ============================================================

echo.
echo ==================================================
echo   hdochub 博客环境初始化
echo   请以管理员身份运行此脚本
echo ==================================================
echo.

REM ========== 检查管理员权限 ==========
net session >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 需要管理员权限！
    echo   请右键此文件 → 「以管理员身份运行」
    pause
    exit /b 1
)
echo [完成] 管理员权限已确认

REM ========== 检查 Node.js ==========
echo.
echo [检查] Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [缺失] Node.js 未安装
    echo   正在下载 Node.js 18 LTS...
    echo   请安装完成后重新运行此脚本
    start https://nodejs.org/dist/v18.20.4/node-v18.20.4-x64.msi
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo [完成] Node.js 已安装: %NODE_VER%
)

REM ========== 检查并安装 WSL2 ==========
echo.
echo [检查] WSL2...
wsl --status >nul 2>nul
if %errorlevel% neq 0 (
    echo [缺失] WSL2 未安装或未配置
    echo   正在安装 WSL2...
    echo   （安装完成后需要重启电脑）
    wsl --install
    echo.
    echo ==================================================
    echo   WSL2 安装完成！
    echo   请重启电脑，然后重新运行此脚本
    echo ==================================================
    pause
    exit /b 0
) else (
    echo [完成] WSL2 已安装
)

REM ========== 检查 Docker Desktop ==========
echo.
echo [检查] Docker Desktop...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [缺失] Docker Desktop 未安装
    echo   正在打开下载页面...
    start https://docs.docker.com/desktop/install/windows-install/
    echo   请下载安装 Docker Desktop，安装完重启后再运行此脚本
    pause
    exit /b 1
)

echo [检查] Docker 引擎是否在运行...
docker ps >nul 2>nul
if %errorlevel% neq 0 (
    echo [注意] Docker 引擎未启动，正在尝试启动 Docker Desktop...
    
    REM 尝试找到 Docker Desktop 并启动
    set "DOCKER_PATH="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%PROGRAMFILES%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_PATH=%PROGRAMFILES%\Docker\Docker\Docker Desktop.exe"
    ) else (
        for /f "tokens=*" %%p in ('where docker') do (
            set "DOCKER_BIN=%%p"
        )
    )

    if defined DOCKER_PATH (
        echo   正在启动 Docker Desktop...
        start "" "%DOCKER_PATH%"
        echo   等待 Docker 引擎启动（最多等 90 秒）...
    ) else (
        echo   无法自动找到 Docker Desktop，请手动打开
        pause
        exit /b 1
    )
    
    REM 等待 Docker 引擎就绪
    set /a WAIT_COUNT=0
:wait_docker
    timeout /t 5 /nobreak >nul
    set /a WAIT_COUNT+=1
    docker ps >nul 2>nul
    if %errorlevel% equ 0 (
        echo [完成] Docker 引擎已就绪
        goto docker_ready
    )
    if %WAIT_COUNT% lss 18 (
        echo   等待中... (%WAIT_COUNT%/18)
        goto wait_docker
    ) else (
        echo [错误] Docker 引擎启动超时
        echo   请手动打开 Docker Desktop，等鲸鱼图标稳定后
        echo   再运行 start-dev.bat 启动博客
        pause
        exit /b 1
    )
) else (
    echo [完成] Docker 引擎正在运行
)

:docker_ready

REM ========== 环境就绪 ==========
echo.
echo ==================================================
echo   环境检查全部通过！
echo ==================================================
echo.
echo   Node.js:  %NODE_VER%
echo   WSL2:     已安装
echo   Docker:   已运行
echo.
echo   现在可以运行 start-dev.bat 启动博客了
echo.
echo   是否立即启动博客？(Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo.
    echo 正在启动博客...
    call "%~dp0start-dev.bat"
)
pause
