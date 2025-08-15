#!/bin/bash

# 商城API部署脚本
set -e

echo "🚀 开始部署商城API服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "系统依赖检查完成"
}

# 环境检查
check_environment() {
    log_info "检查环境配置..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "未找到.env文件，使用默认配置"
        cp env.example .env
    fi
    
    # 检查必要的目录
    mkdir -p logs public/uploads $BACKUP_DIR
    
    log_success "环境配置检查完成"
}

# 数据备份
backup_data() {
    log_info "备份数据..."
    
    BACKUP_TIME=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIME"
    
    mkdir -p "$BACKUP_PATH"
    
    # 备份数据库
    if docker-compose ps mysql | grep -q "Up"; then
        log_info "备份MySQL数据库..."
        docker-compose exec -T mysql mysqldump -u root -pMq123 mall_db > "$BACKUP_PATH/mysql_backup.sql"
        log_success "MySQL数据库备份完成"
    fi
    
    # 备份Redis数据
    if docker-compose ps redis | grep -q "Up"; then
        log_info "备份Redis数据..."
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp mall_redis:/data/dump.rdb "$BACKUP_PATH/redis_backup.rdb"
        log_success "Redis数据备份完成"
    fi
    
    # 备份上传文件
    if [ -d "public/uploads" ]; then
        log_info "备份上传文件..."
        cp -r public/uploads "$BACKUP_PATH/"
        log_success "上传文件备份完成"
    fi
    
    log_success "数据备份完成: $BACKUP_PATH"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    
    docker-compose build --no-cache
    
    log_success "Docker镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 启动基础服务
    docker-compose up -d mysql redis
    
    # 等待数据库就绪
    log_info "等待数据库服务就绪..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec mysql mysqladmin ping -h localhost -u root -pMq123 --silent; then
            log_success "MySQL服务就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "MySQL服务启动超时"
        exit 1
    fi
    
    # 等待Redis就绪
    log_info "等待Redis服务就绪..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose exec redis redis-cli ping | grep -q "PONG"; then
            log_success "Redis服务就绪"
            break
        fi
        sleep 1
        timeout=$((timeout-1))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Redis服务启动超时"
        exit 1
    fi
    
    # 启动应用服务
    docker-compose up -d api nginx
    
    log_success "所有服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查API服务
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/health &> /dev/null; then
            log_success "API服务健康检查通过"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "API服务健康检查失败"
        docker-compose logs api
        exit 1
    fi
    
    log_success "健康检查完成"
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker-compose ps
    
    echo ""
    log_success "部署完成！"
    echo "📱 API地址: http://localhost/api"
    echo "🌐 Web地址: http://localhost"
    echo "🔧 数据库管理: http://localhost:8080 (可选)"
    echo "📊 Redis管理: http://localhost:8081 (可选)"
    echo "📋 查看日志: docker-compose logs -f"
    echo "🛑 停止服务: docker-compose down"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 清理旧的镜像
    docker image prune -f
    log_success "清理完成"
}

# 主流程
main() {
    case "${1:-deploy}" in
        "deploy")
            check_dependencies
            check_environment
            backup_data
            build_images
            start_services
            health_check
            show_status
            ;;
        "start")
            log_info "启动服务..."
            docker-compose up -d
            health_check
            show_status
            ;;
        "stop")
            log_info "停止服务..."
            docker-compose down
            log_success "服务已停止"
            ;;
        "restart")
            log_info "重启服务..."
            docker-compose restart
            health_check
            show_status
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "status")
            docker-compose ps
            ;;
        "backup")
            backup_data
            ;;
        "clean")
            log_info "清理所有数据..."
            docker-compose down -v
            docker system prune -f
            log_success "清理完成"
            ;;
        "dev")
            log_info "启动开发环境..."
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
            log_success "开发环境启动完成"
            ;;
        "tools")
            log_info "启动管理工具..."
            docker-compose --profile tools up -d adminer redis-commander
            log_success "管理工具启动完成"
            echo "🔧 数据库管理: http://localhost:8080"
            echo "📊 Redis管理: http://localhost:8081"
            ;;
        *)
            echo "使用方法: $0 {deploy|start|stop|restart|logs|status|backup|clean|dev|tools}"
            echo ""
            echo "命令说明:"
            echo "  deploy  - 完整部署 (默认)"
            echo "  start   - 启动服务"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  logs    - 查看日志"
            echo "  status  - 查看状态"
            echo "  backup  - 备份数据"
            echo "  clean   - 清理所有数据"
            echo "  dev     - 启动开发环境"
            echo "  tools   - 启动管理工具"
            exit 1
            ;;
    esac
}

# 捕获中断信号
trap cleanup EXIT

# 执行主流程
main "$@"