#!/bin/bash

# Gitee CI/CD 部署脚本
set -e

echo "🚀 开始Gitee CI/CD部署..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 参数
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
DEPLOY_DIR="/opt/mall-api"

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

# 检查环境参数
check_environment() {
    log_info "检查部署环境: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        staging|production)
            log_success "环境参数有效: $ENVIRONMENT"
            ;;
        *)
            log_error "无效的环境参数: $ENVIRONMENT"
            echo "支持的环境: staging, production"
            exit 1
            ;;
    esac
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    case $ENVIRONMENT in
        staging)
            export API_PORT=3001
            export DB_NAME=mall_staging_db
            export REDIS_DB=1
            ;;
        production)
            export API_PORT=3000
            export DB_NAME=mall_db
            export REDIS_DB=0
            ;;
    esac
    
    export IMAGE_TAG=$IMAGE_TAG
    export COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    
    log_success "环境变量设置完成"
}

# 备份数据
backup_data() {
    log_info "备份现有数据..."
    
    BACKUP_TIME=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="/opt/backups/gitee_${ENVIRONMENT}_${BACKUP_TIME}"
    
    mkdir -p "$BACKUP_PATH"
    
    # 备份数据库
    if docker ps | grep -q mysql; then
        log_info "备份MySQL数据库..."
        docker exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > "$BACKUP_PATH/mysql_backup.sql"
        log_success "MySQL数据库备份完成"
    fi
    
    # 备份Redis数据
    if docker ps | grep -q redis; then
        log_info "备份Redis数据..."
        docker exec redis redis-cli BGSAVE
        docker cp redis:/data/dump.rdb "$BACKUP_PATH/redis_backup.rdb"
        log_success "Redis数据备份完成"
    fi
    
    # 备份上传文件
    if [ -d "$DEPLOY_DIR/public/uploads" ]; then
        log_info "备份上传文件..."
        cp -r "$DEPLOY_DIR/public/uploads" "$BACKUP_PATH/"
        log_success "上传文件备份完成"
    fi
    
    log_success "数据备份完成: $BACKUP_PATH"
}

# 更新代码
update_code() {
    log_info "更新应用代码..."
    
    cd $DEPLOY_DIR
    
    # 拉取最新代码
    git fetch origin
    
    if [ "$ENVIRONMENT" = "staging" ]; then
        git checkout develop
        git pull origin develop
    else
        # 生产环境使用标签
        LATEST_TAG=$(git describe --tags --abbrev=0)
        git checkout $LATEST_TAG
    fi
    
    log_success "代码更新完成"
}

# 更新Docker镜像
update_docker_image() {
    log_info "更新Docker镜像..."
    
    # 更新docker-compose文件中的镜像标签
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        sed -i "s|image: .*mall-api:.*|image: registry.cn-hangzhou.aliyuncs.com/mall-api:${IMAGE_TAG}|g" "docker-compose.${ENVIRONMENT}.yml"
    else
        sed -i "s|image: .*mall-api:.*|image: registry.cn-hangzhou.aliyuncs.com/mall-api:${IMAGE_TAG}|g" docker-compose.yml
    fi
    
    log_success "Docker镜像标签更新完成"
}

# 部署应用
deploy_application() {
    log_info "部署应用..."
    
    cd $DEPLOY_DIR
    
    # 停止旧服务
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        docker-compose -f "docker-compose.${ENVIRONMENT}.yml" down
    else
        docker-compose down
    fi
    
    # 拉取新镜像
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        docker-compose -f "docker-compose.${ENVIRONMENT}.yml" pull
    else
        docker-compose pull
    fi
    
    # 启动新服务
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        docker-compose -f "docker-compose.${ENVIRONMENT}.yml" up -d
    else
        docker-compose up -d
    fi
    
    log_success "应用部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查API服务
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "http://localhost:${API_PORT}/health" &> /dev/null; then
            log_success "API服务健康检查通过"
            return 0
        fi
        
        log_warning "健康检查失败，重试 ($attempt/$max_attempts)..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "API服务健康检查失败"
    return 1
}

# 回滚部署
rollback_deployment() {
    log_error "部署失败，开始回滚..."
    
    cd $DEPLOY_DIR
    
    # 回滚到上一个版本
    git checkout HEAD~1
    
    # 重新部署
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        docker-compose -f "docker-compose.${ENVIRONMENT}.yml" up -d
    else
        docker-compose up -d
    fi
    
    log_warning "回滚完成"
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    log_info "发送部署通知..."
    
    # 这里可以集成钉钉、企业微信等通知
    if [ -n "$DING_TOKEN" ]; then
        curl -X POST "https://oapi.dingtalk.com/robot/send?access_token=$DING_TOKEN" \
            -H 'Content-Type: application/json' \
            -d "{
                \"msgtype\": \"markdown\",
                \"markdown\": {
                    \"title\": \"部署通知\",
                    \"text\": \"## 🚀 Gitee CI/CD 部署通知\\n\\n- **项目**: 商城API\\n- **环境**: $ENVIRONMENT\\n- **状态**: $status\\n- **消息**: $message\\n- **时间**: $(date)\"
                }
            }"
    fi
}

# 显示部署结果
show_result() {
    log_success "部署完成！"
    echo ""
    echo "📱 API地址: http://localhost:${API_PORT}/api"
    echo "🌐 健康检查: http://localhost:${API_PORT}/health"
    echo "📋 查看日志: docker-compose logs -f"
    echo "🛑 停止服务: docker-compose down"
}

# 主流程
main() {
    log_info "开始Gitee CI/CD部署流程..."
    
    # 检查参数
    check_environment
    setup_environment
    
    # 创建部署目录
    mkdir -p $DEPLOY_DIR
    cd $DEPLOY_DIR
    
    # 备份数据
    backup_data
    
    # 更新代码和镜像
    update_code
    update_docker_image
    
    # 部署应用
    deploy_application
    
    # 健康检查
    if health_check; then
        send_notification "✅ 成功" "部署成功完成"
        show_result
    else
        rollback_deployment
        send_notification "❌ 失败" "部署失败，已回滚"
        exit 1
    fi
}

# 错误处理
trap 'log_error "部署过程中发生错误"; rollback_deployment; exit 1' ERR

# 执行主流程
main "$@"