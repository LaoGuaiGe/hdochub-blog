#!/bin/bash
# ============================================================
# hdochub 博客本地一键启动脚本（Mac / Linux）
# 首次运行：自动初始化全部环境
# 后续运行：跳过初始化，直接启动服务
# 如需重新初始化：./start-dev.sh --reset
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 错误处理策略：不启用 errexit（会导致 MySQL 轮询超时直接退出）
# 改为每个关键步骤显式检查退出码

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}
print_ok()   { echo -e "${GREEN}  [完成] $1${NC}"; }
print_warn() { echo -e "${YELLOW}  [注意] $1${NC}"; }
print_err()  { echo -e "${RED}  [错误] $1${NC}"; }

# ========== 检查是否需要重新初始化 ==========
if [ "$1" == "--reset" ]; then
    rm -f .setup-done src/server/.env src/client/.env src/server/tsconfig.tsbuildinfo
    print_warn "检测到 --reset，将重新初始化"
fi

# ========== 前置检查 ==========
print_step "第 0 步：环境检查"

if ! command -v docker &> /dev/null; then
    print_err "未检测到 Docker"
    exit 1
fi
print_ok "Docker 已安装"

if ! command -v node &> /dev/null; then
    print_err "未检测到 Node.js"
    exit 1
fi
print_ok "Node.js 已安装 ($(node -v))"

# ========== 启动 MySQL 和 Redis ==========
print_step "第 1 步：启动 MySQL 和 Redis"
docker compose up -d

# 轮询等待 MySQL 就绪（最多 60 秒）
echo "  等待 MySQL 就绪..."
WAIT_COUNT=0
while [ $WAIT_COUNT -lt 30 ]; do
    if docker exec hdochub-mysql mysqladmin ping -h localhost -uroot -phdochub_dev_2026 --silent 2>/dev/null; then
        print_ok "MySQL 已就绪（等待了 $((WAIT_COUNT * 2)) 秒）"
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo "  等待中... ($WAIT_COUNT/30)"
    sleep 2
done

if [ $WAIT_COUNT -ge 30 ]; then
    print_err "MySQL 启动超时（60 秒）"
    exit 1
fi

# 等待 Redis
docker exec hdochub-redis redis-cli ping > /dev/null 2>&1 || sleep 3
print_ok "Redis 已就绪"

# ========== 判断是否已初始化 ==========
if [ -f .setup-done ]; then
    print_warn "已初始化过，直接启动服务"
    echo "  如需重新初始化：./start-dev.sh --reset"
else
    # ========== 首次初始化 ==========
    print_step "首次初始化：配置环境和数据库"

    cd "$PROJECT_DIR/src/server"
    [ ! -f .env ] && cp .env.dev .env && print_ok "后端 .env 已生成"

    echo "  安装后端依赖（约 1-2 分钟）..."
    if ! npm install --silent; then
        print_err "后端依赖安装失败，请检查网络后重试"
        exit 1
    fi
    print_ok "后端依赖已安装"

    echo "  生成 Prisma Client..."
    if ! npx prisma generate; then
        print_err "Prisma Client 生成失败"
        exit 1
    fi
    print_ok "Prisma Client 已生成"

    echo "  创建数据库表结构..."
    if ! npx prisma db push --accept-data-loss; then
        print_err "数据库表结构创建失败，请检查 MySQL 是否就绪"
        exit 1
    fi
    print_ok "数据库表结构已创建"

    echo "  写入初始数据..."
    if ! npm run prisma:seed; then
        print_err "初始数据写入失败"
        exit 1
    fi
    print_ok "初始数据已写入"

    echo "  首次编译后端..."
    if ! npm run build; then
        print_err "后端编译失败"
        exit 1
    fi
    print_ok "后端编译完成"

    cd "$PROJECT_DIR/src/client"
    [ ! -f .env ] && cp .env.example .env && print_ok "前端 .env 已生成"

    echo "  安装前端依赖（约 1-2 分钟）..."
    if ! npm install --silent; then
        print_err "前端依赖安装失败，请检查网络后重试"
        exit 1
    fi
    print_ok "前端依赖已安装"

    cd "$PROJECT_DIR"
    echo "done" > .setup-done
    print_ok "首次初始化完成"
fi

# ========== 启动服务 ==========
print_step "第 2 步：启动服务"

cd "$PROJECT_DIR/src/server"
npm run start:dev &
SERVER_PID=$!

# 轮询等待后端就绪
echo "  等待后端就绪..."
BACKEND_WAIT=0
while [ $BACKEND_WAIT -lt 20 ]; do
    sleep 2
    if curl -s http://localhost:4000/api > /dev/null 2>&1; then
        print_ok "后端已就绪"
        break
    fi
    BACKEND_WAIT=$((BACKEND_WAIT + 1))
    echo "  等待中... ($BACKEND_WAIT/20)"
done

cd "$PROJECT_DIR/src/client"
npm run dev &
CLIENT_PID=$!

sleep 3
print_step "启动完成！"

echo -e "  ${CYAN}博客首页：http://localhost:3000${NC}"
echo -e "  ${CYAN}后台管理：http://localhost:3000/admin${NC}"
echo ""
echo -e "  管理员账号：${YELLOW}admin${NC}"
echo -e "  管理员密码：${YELLOW}Admin@123456${NC}"
echo ""
echo "  数据库 MySQL: localhost:3307 (Docker)"
echo "  缓存 Redis:  localhost:6380 (Docker)"
echo ""
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止服务"

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo '已停止'; exit 0" INT TERM EXIT
wait
