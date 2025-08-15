# 商城后端API

基于Node.js + Koa2 + MySQL + Redis的企业级商城后端API项目，采用Docker编排部署，支持RBAC权限管理和完整的CI/CD流程。

## 🚀 技术栈

- **运行时**: Node.js 18
- **框架**: Koa2 + @koa/router
- **数据库**: MySQL 8.0 + Sequelize ORM
- **缓存**: Redis 7 + ioredis
- **认证**: JWT + Session管理
- **验证**: Joi参数验证
- **日志**: Winston日志系统
- **安全**: Helmet + Rate Limiter + RBAC权限
- **邮件**: Nodemailer + EJS模板
- **文件**: Multer + Sharp图片处理
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions + Gitee Go

## 📁 项目结构

```
mall-api/
├── src/                    # 源代码目录
│   ├── app.js             # 应用入口
│   ├── server.js          # 服务器启动
│   ├── config/            # 配置文件
│   ├── database/          # 数据库配置
│   ├── models/            # 数据模型层 (Sequelize)
│   ├── repositories/      # 数据访问层 (Repository Pattern)
│   ├── services/          # 业务逻辑层 (Service Layer)
│   ├── controllers/       # 控制器层 (Controller)
│   ├── routes/           # 路由层 (Router)
│   ├── middleware/       # 中间件 (Auth, RBAC, Upload, etc.)
│   ├── utils/            # 工具类 (JWT, Redis, Logger, etc.)
│   ├── templates/        # 邮件模板 (EJS)
│   └── scripts/          # 初始化脚本
├── docker/               # Docker配置
│   ├── mysql/           # MySQL配置文件
│   ├── redis/           # Redis配置文件
│   └── nginx/           # Nginx配置文件
├── tests/               # 测试文件
│   ├── setup.js         # 测试环境配置
│   └── smoke/           # 冒烟测试
├── .github/             # GitHub CI/CD
│   ├── workflows/       # GitHub Actions
│   └── actions/         # 自定义Actions
├── .gitee/              # Gitee CI/CD
│   └── workflows/       # Gitee Go
├── scripts/             # 部署脚本
├── public/              # 静态文件
├── logs/               # 日志文件
├── docker-compose*.yml  # Docker编排文件
├── Dockerfile          # Docker镜像
└── package.json        # 项目配置
```

## 🏗️ 系统架构

### 三层架构 + RBAC权限

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controller    │    │    Service      │    │   Repository    │
│   控制器层       │───▶│   业务逻辑层     │───▶│   数据访问层     │
│                 │    │                 │    │                 │
│ • HTTP请求处理   │    │ • 业务规则验证   │    │ • 数据库操作     │
│ • 参数验证       │    │ • 数据转换处理   │    │ • SQL查询封装    │
│ • 响应格式化     │    │ • 第三方服务调用 │    │ • 事务管理       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Middleware    │    │   RBAC权限      │    │   Data Models   │
│   中间件层       │    │   权限管理       │    │   数据模型       │
│                 │    │                 │    │                 │
│ • 身份认证       │    │ • 角色管理       │    │ • Sequelize模型  │
│ • 权限检查       │    │ • 权限分配       │    │ • 关联关系       │
│ • 限流保护       │    │ • 菜单控制       │    │ • 数据验证       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ 核心特性

### 🔐 RBAC权限管理
- ✅ 角色管理 (Role Management)
- ✅ 权限管理 (Permission Management)
- ✅ 用户角色分配 (User Role Assignment)
- ✅ 菜单权限控制 (Menu Permission)
- ✅ 按钮权限控制 (Button Permission)
- ✅ API权限控制 (API Permission)
- ✅ 权限继承和层级管理

### 🔑 认证与安全
- ✅ JWT Token认证
- ✅ Session会话管理
- ✅ 多设备登录管理
- ✅ 密码加密存储
- ✅ 限流保护 (Rate Limiting)
- ✅ 安全中间件 (Helmet)
- ✅ Token黑名单机制

### 📧 邮件系统
- ✅ EJS模板引擎
- ✅ 响应式邮件设计
- ✅ 邮箱验证邮件
- ✅ 密码重置邮件
- ✅ 订单确认邮件
- ✅ 状态更新通知
- ✅ 安全提醒邮件

### 📁 文件管理
- ✅ 多文件上传支持
- ✅ 图片自动压缩
- ✅ 文件类型验证
- ✅ 文件大小限制
- ✅ 安全文件存储

### 🐳 容器化部署
- ✅ Docker多阶段构建
- ✅ Docker Compose编排
- ✅ 多环境配置
- ✅ 健康检查机制
- ✅ 数据持久化

### 🔄 CI/CD流程
- ✅ GitHub Actions
- ✅ Gitee Go支持
- ✅ 自动化测试
- ✅ 安全扫描
- ✅ 多环境部署
- ✅ 自动回滚

## 🚀 快速启动

### 使用Docker (推荐)

```bash
# 克隆项目
git clone <repository-url>
cd mall-api

# 一键部署生产环境
npm run deploy

# 或使用脚本
./scripts/deploy.sh deploy
```

### 开发环境

```bash
# 启动开发环境
npm run deploy:dev

# 或手动启动
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 管理工具

```bash
# 启动管理工具
npm run deploy:tools

# 访问地址
# 数据库管理: http://localhost:8080
# Redis管理: http://localhost:8081
```

## 🌐 API接口

### 🔐 认证相关
```
POST   /api/users/register          # 用户注册
POST   /api/users/login             # 用户登录
POST   /api/users/logout            # 退出登录
GET    /api/users/verify-email      # 邮箱验证
POST   /api/users/change-password   # 修改密码
GET    /api/users/profile           # 获取用户信息
PUT    /api/users/profile           # 更新用户信息
```

### 👥 RBAC权限管理
```
# 角色管理
GET    /api/roles                   # 获取角色列表
GET    /api/roles/:id               # 获取角色详情
POST   /api/roles                   # 创建角色
PUT    /api/roles/:id               # 更新角色
DELETE /api/roles/:id               # 删除角色
POST   /api/roles/:id/permissions   # 分配权限

# 权限管理
GET    /api/permissions             # 获取权限列表
GET    /api/permissions/tree        # 获取权限树
GET    /api/permissions/:id         # 获取权限详情
POST   /api/permissions             # 创建权限
PUT    /api/permissions/:id         # 更新权限
DELETE /api/permissions/:id         # 删除权限
GET    /api/permissions/user/menus  # 获取用户菜单
```

### 🛍️ 商城业务
```
# 商品管理
GET    /api/products                # 获取商品列表
GET    /api/products/:id            # 获取商品详情
POST   /api/products                # 创建商品 (管理员)
PUT    /api/products/:id            # 更新商品 (管理员)
DELETE /api/products/:id            # 删除商品 (管理员)

# 分类管理
GET    /api/categories              # 获取分类列表
GET    /api/categories/:id          # 获取分类详情
POST   /api/categories              # 创建分类 (管理员)
PUT    /api/categories/:id          # 更新分类 (管理员)
DELETE /api/categories/:id          # 删除分类 (管理员)

# 购物车
GET    /api/cart                    # 获取购物车
POST   /api/cart/add                # 添加到购物车
PUT    /api/cart/update/:itemId     # 更新购物车商品
DELETE /api/cart/remove/:itemId     # 移除购物车商品
DELETE /api/cart/clear              # 清空购物车

# 订单管理
GET    /api/orders                  # 获取订单列表
GET    /api/orders/:id              # 获取订单详情
POST   /api/orders                  # 创建订单
PUT    /api/orders/:id/status       # 更新订单状态
```

### 📁 文件上传
```
POST   /api/upload                  # 通用文件上传
POST   /api/upload/avatar           # 头像上传
POST   /api/upload/product          # 商品图片上传
POST   /api/upload/multiple         # 多文件上传
DELETE /api/upload/:filename        # 删除文件
GET    /api/upload/:filename/info   # 获取文件信息
```

### 🔧 管理员功能
```
GET    /api/admin/users             # 获取用户列表
PUT    /api/admin/users/:id/status  # 更新用户状态
GET    /api/admin/orders            # 获取订单列表
PUT    /api/admin/orders/:id/status # 更新订单状态
GET    /api/admin/stats             # 获取统计信息
POST   /api/admin/reset-user-rate-limit  # 重置用户限流
POST   /api/admin/reset-ip-rate-limit    # 重置IP限流
```

## 🗄️ 数据库设计

### 核心表结构

```sql
-- 用户相关
users              # 用户表
roles              # 角色表
permissions        # 权限表
user_roles         # 用户角色关联表
role_permissions   # 角色权限关联表

-- 商城业务
categories         # 分类表
products           # 商品表
orders             # 订单表
order_items        # 订单项表
carts              # 购物车表
```

### 初始化数据

```bash
# 初始化测试数据
npm run init:testdata

# 初始化RBAC权限数据
npm run init:rbac
```

**默认账户**:
- 管理员: admin@example.com / admin123
- 普通用户: user1@example.com / user123

## 🔧 开发指南

### 环境配置

```bash
# 复制环境变量文件
cp env.example .env

# 编辑配置
vim .env
```

### 开发命令

```bash
# 开发模式
npm run dev

# 运行测试
npm run test
npm run test:coverage

# 代码检查
npm run lint
npm run format

# Docker操作
npm run docker:build
npm run docker:up
npm run docker:down
npm run docker:logs
```

### 代码规范

- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **Conventional Commits**: 提交信息规范
- **Jest**: 单元测试和集成测试

## 🚀 部署指南

### 生产环境部署

```bash
# 1. 克隆代码
git clone <repository-url>
cd mall-api

# 2. 配置环境变量
cp env.example .env
# 编辑 .env 文件

# 3. 一键部署
./scripts/deploy.sh deploy

# 4. 验证部署
curl http://localhost/health
```

### CI/CD部署

#### GitHub Actions
1. 推送代码到 `develop` 分支 → 自动部署到测试环境
2. 创建 Release → 自动部署到生产环境

#### Gitee Go
1. 推送代码到 `develop` 分支 → 自动部署到测试环境
2. 推送标签 → 自动部署到生产环境

### 环境变量配置

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=mall_db

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 邮件配置
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@example.com
```

## 📊 监控和日志

### 日志文件
- 应用日志: `logs/combined.log`
- 错误日志: `logs/error.log`
- 访问日志: `logs/access.log`

### 健康检查
- API健康检查: `GET /health`
- 服务状态: `docker-compose ps`
- 日志查看: `docker-compose logs -f`

### 性能监控
- Redis状态: `redis-cli info`
- MySQL状态: `SHOW PROCESSLIST`
- 系统资源: `docker stats`

## 🔒 安全特性

- ✅ JWT Token认证
- ✅ Session会话管理
- ✅ RBAC权限控制
- ✅ 密码加密存储
- ✅ 限流保护
- ✅ 安全头设置
- ✅ 参数验证
- ✅ SQL注入防护
- ✅ XSS防护
- ✅ CSRF防护

## 🧪 测试

### 运行测试

```bash
# 单元测试
npm run test

# 覆盖率测试
npm run test:coverage

# 冒烟测试
npm run test:smoke

# 监听模式
npm run test:watch
```

### 测试覆盖率

目标覆盖率: 80%
- 行覆盖率: ≥80%
- 函数覆盖率: ≥80%
- 分支覆盖率: ≥80%

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 提交规范

使用 [Conventional Commits](https://conventionalcommits.org/) 规范:

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢以下开源项目:
- [Koa.js](https://koajs.com/) - Web框架
- [Sequelize](https://sequelize.org/) - ORM框架
- [Redis](https://redis.io/) - 缓存数据库
- [MySQL](https://www.mysql.com/) - 关系数据库
- [Docker](https://www.docker.com/) - 容器化平台

## 📞 联系方式

- 项目地址: [GitHub](https://github.com/your-org/mall-api)
- 问题反馈: [Issues](https://github.com/your-org/mall-api/issues)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！