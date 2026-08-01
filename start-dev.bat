@echo off
chcp 65001 >nul
title hdochub 博客本地启动

REM ============================================================
REM hdochub 博客本地一键启动脚本（Windows）
REM 老板专用：只需要装好 Docker Desktop，然后双击本文件
REM ============================================================

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo.
echo ==================================================
echo   hdochub 博客本地启动
echo ==================================================
echo.

REM ========== 前置检查 ==========
echo [第 0 步] 环境检查...
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker，请先安装 Docker Desktop
    echo   下载地址: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)
echo [完成] Docker 已安装

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo   下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [完成] Node.js 已安装

REM ========== 第 1 步：启动 MySQL 和 Redis ==========
echo.
echo [第 1 步] 启动 MySQL 和 Redis (Docker)...
echo.

docker compose up -d
echo 等待 MySQL 启动...
timeout /t 8 /nobreak >nul
echo [完成] MySQL 和 Redis 已启动

REM ========== 第 2 步：配置后端 ==========
echo.
echo [第 2 步] 配置后端环境...
echo.

cd /d "%PROJECT_DIR%src\server"

if not exist .env (
    copy .env.dev .env >nul
    echo [完成] 已生成后端 .env 配置文件
) else (
    echo [注意] .env 已存在，跳过
)

echo 安装后端依赖（可能需要 1-2 分钟）...
call npm install --silent
echo [完成] 后端依赖安装完成

echo 生成 Prisma Client...
call npx prisma generate
echo [完成] Prisma Client 已生成

echo 创建数据库表结构...
call npx prisma db push --accept-data-loss
echo [完成] 数据库表结构已创建

echo 写入初始数据...
call npm run prisma:seed
echo [完成] 初始数据已写入

REM ========== 第 3 步：配置前端 ==========
echo.
echo [第 3 步] 配置前端环境...
echo.

cd /d "%PROJECT_DIR%src\client"

if not exist .env (
    copy .env.example .env >nul
    echo [完成] 已生成前端 .env 配置文件
) else (
    echo [注意] .env 已存在，跳过
)

echo 安装前端依赖（可能需要 1-2 分钟）...
call npm install --silent
echo [完成] 前端依赖安装完成

REM ========== 第 4 步：启动服务 ==========
echo.
echo [第 4 步] 启动服务...
echo.

echo 正在启动后端（新窗口）...
start "hdochub 后端" cmd /k "cd /d %PROJECT_DIR%src\server && npm run start:dev"

echo 等待后端启动...
timeout /t 5 /nobreak >nul

echo 正在启动前端（新窗口）...
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
echo   后端和前端已在新窗口运行，关闭对应窗口即可停止
echo.
pause
