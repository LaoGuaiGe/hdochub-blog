@echo off
chcp 65001 >nul
title hdochub 博客本地启动

REM ============================================================
REM hdochub 博客本地一键启动脚本（Windows）
REM 首次运行：自动初始化全部环境
REM 后续运行：跳过初始化，直接启动服务（约 10 秒）
REM 如需重新初始化：start-dev.bat --reset
REM ============================================================

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo.
echo ==================================================
echo   hdochub 博客本地启动
echo ==================================================
echo.

REM ========== 检查是否需要重新初始化 ==========
set FORCE_RESET=0
if /i "%1"=="--reset" (
    set FORCE_RESET=1
    echo [注意] 检测到 --reset 参数，将重新初始化数据库
    if exist .setup-done del /q .setup-done
)

REM ========== 前置检查 ==========
echo [第 0 步] 环境检查...
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker，请先运行 setup-windows.bat 安装环境
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先运行 setup-windows.bat 安装环境
    pause
    exit /b 1
)
echo [完成] 环境检查通过

REM ========== 启动 MySQL 和 Redis ==========
echo.
echo [第 1 步] 启动 MySQL 和 Redis...
docker compose up -d
echo [完成] 数据库服务已就绪

REM ========== 判断是否已初始化 ==========
if exist .setup-done (
    echo.
    echo [跳过初始化] 检测到已初始化过，直接启动服务
    echo   如需重新初始化，请运行: start-dev.bat --reset
    goto start_services
)

REM ========== 首次初始化 ==========
echo.
echo [首次初始化] 配置环境和数据库...
echo.

REM --- 后端配置 ---
cd /d "%PROJECT_DIR%src\server"

if not exist .env (
    copy .env.dev .env >nul
    echo [完成] 后端 .env 已生成
)

echo 安装后端依赖（约 1-2 分钟）...
call npm install --silent
echo [完成] 后端依赖已安装

echo 生成 Prisma Client...
call npx prisma generate
echo [完成] Prisma Client 已生成

echo 创建数据库表结构...
call npx prisma db push --accept-data-loss
echo [完成] 数据库表结构已创建

echo 写入初始数据（管理员账号、分类、设置）...
call npm run prisma:seed
echo [完成] 初始数据已写入

REM --- 前端配置 ---
cd /d "%PROJECT_DIR%src\client"

if not exist .env (
    copy .env.example .env >nul
    echo [完成] 前端 .env 已生成
)

echo 安装前端依赖（约 1-2 分钟）...
call npm install --silent
echo [完成] 前端依赖已安装

REM --- 标记初始化完成 ---
cd /d "%PROJECT_DIR%"
echo done > .setup-done
echo.
echo [完成] 首次初始化全部完成，下次启动将跳过这些步骤

:start_services
REM ========== 启动服务 ==========
echo.
echo [第 2 步] 启动服务...
echo.

echo 启动后端...
start "hdochub 后端" cmd /k "cd /d %PROJECT_DIR%src\server && npm run start:dev"

echo 等待后端就绪...
timeout /t 5 /nobreak >nul

echo 启动前端...
start "hdochub 前端" cmd /k "cd /d %PROJECT_DIR%src\client && npm run dev"

REM ========== 完成 ==========
echo.
echo ==================================================
echo   启动完成！
echo ==================================================
echo.
echo   博客首页:  http://localhost:3000
echo   后台管理:  http://localhost:3000/admin
echo.
echo   管理员账号: admin
echo   管理员密码: Admin@123456
echo.
echo   首次启动较慢，以后每次启动约 10 秒
echo   关闭后端/前端窗口即可停止对应服务
echo.
pause
