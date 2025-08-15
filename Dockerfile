# 多阶段构建
FROM node:18-alpine

# 设置构建参数
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 根据环境安装依赖
RUN if [ "$NODE_ENV" = "development" ]; then \
        npm install; \
    else \
        npm ci --only=production && npm cache clean --force; \
    fi

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs public/uploads

# 设置权限
RUN chown -R node:node /app
USER node

# 设置默认环境变量
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令