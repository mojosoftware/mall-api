# 多阶段构建
FROM node:18-alpine AS base

# 设置构建参数
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF
ENV NODE_ENV=${NODE_ENV}

# 添加标签
LABEL maintainer="mall-api-team\" \
      org.opencontainers.image.title="Mall API\" \
      org.opencontainers.image.description="商城后端API服务\" \
      org.opencontainers.image.created=${BUILD_DATE} \
      org.opencontainers.image.revision=${VCS_REF} \
      org.opencontainers.image.source="https://github.com/your-org/mall-api"

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 开发阶段
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# 生产构建阶段
FROM base AS production-build
# 根据环境安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 生产运行阶段
FROM node:18-alpine AS production
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 从构建阶段复制文件
COPY --from=production-build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=production-build --chown=nodejs:nodejs /app/src ./src
COPY --from=production-build --chown=nodejs:nodejs /app/package*.json ./

# 创建必要的目录
RUN mkdir -p logs public/uploads && \
    chown -R nodejs:nodejs logs public/uploads

# 切换到非root用户
USER nodejs

# 设置默认环境变量
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/server.js"]