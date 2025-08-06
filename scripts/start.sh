#!/bin/bash

echo "🚀 启动商城API服务..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
mkdir -p logs public/uploads

# 构建并启动服务
echo "📦 构建Docker镜像..."
docker-compose build

echo "🔄 启动服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

echo "✅ 服务启动完成！"
echo "📱 API地址: http://localhost/api"
echo "🔧 管理后台: http://localhost/admin"
echo "📊 查看日志: npm run docker:logs" 