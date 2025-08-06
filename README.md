# 商城后端API

基于Node.js + Koa2 + MySQL + Redis的中型商城后端API项目，使用Docker编排部署

## 技术栈

- **运行时**: Node.js 18
- **框架**: Koa2
- **数据库**: MySQL 8.0 + Sequelize ORM
- **缓存**: Redis 7
- **认证**: JWT
- **验证**: Joi
- **日志**: Winston
- **安全**: Helmet, Rate Limiter
- **容器化**: Docker + Docker Compose

## 项目结构

```
mall-api/
├── src/                    # 源代码目录
│   ├── app.js             # 应用入口
│   ├── config/            # 配置文件
│   ├── database/          # 数据库配置
│   ├── models/            # 数据模型层
│   ├── repositories/      # 数据访问层
│   ├── services/          # 业务逻辑层
│   ├── controllers/       # 控制器层
│   ├── routes/           # 路由层
│   ├── middleware/       # 中间件
│   └── utils/            # 工具类
├── docker/               # Docker配置
│   ├── mysql/           # MySQL配置
│   └── nginx/           # Nginx配置
├── public/              # 静态文件
├── logs/               # 日志文件
├── scripts/            # 启动脚本
├── docker-compose.yml  # Docker编排
├── Dockerfile          # Docker镜像
└── package.json        # 项目配置
```

## 三层架构

### 1. Controller层 (控制器层)
- 处理HTTP请求和响应
- 参数验证
- 调用Service层方法
- 返回统一格式的响应

### 2. Service层 (业务逻辑层)
- 实现具体的业务逻辑
- 调用Repository层获取数据
- 处理业务规则和验证
- 数据转换和格式化

### 3. Repository层 (数据访问层)
- 直接与数据库交互
- 封装数据库操作
- 提供数据访问接口

## 快速启动

### 使用Docker (推荐)

```bash
# 克隆项目
git clone <repository-url>
cd mall-api

# 启动所有服务
./scripts/start.sh

# 或者手动启动
npm run docker:up
```

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp env.example .env

# 启动开发服务器
npm run dev
```

## Docker服务

项目包含以下Docker服务：

- **mysql**: MySQL 8.0 数据库
- **redis**: Redis 7 缓存
- **api**: Node.js API服务
- **nginx**: Nginx反向代理

### Docker命令

```bash
# 构建镜像
npm run docker:build

# 启动服务
npm run docker:up

# 停止服务
npm run docker:down

# 查看日志
npm run docker:logs
```

## API接口

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息
- `POST /api/users/logout` - 退出登录
- `POST /api/users/change-password` - 修改密码
- `GET /api/users/sessions` - 获取活跃session列表
- `POST /api/users/logout-all` - 退出所有设备
- `DELETE /api/users/sessions/:sessionId` - 退出指定设备
- `GET /api/users/session/:sessionId/validate` - 验证session

### 商品相关
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情
- `GET /api/products/hot` - 获取热门商品
- `POST /api/products` - 创建商品（管理员）
- `PUT /api/products/:id` - 更新商品（管理员）
- `DELETE /api/products/:id` - 删除商品（管理员）

### 分类相关
- `GET /api/categories` - 获取分类列表
- `GET /api/categories/:id` - 获取分类详情
- `POST /api/categories` - 创建分类（管理员）
- `PUT /api/categories/:id` - 更新分类（管理员）
- `DELETE /api/categories/:id` - 删除分类（管理员）

### 订单相关
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id/status` - 更新订单状态

### 购物车相关
- `GET /api/cart` - 获取购物车
- `POST /api/cart/add` - 添加到购物车
- `PUT /api/cart/update/:itemId` - 更新购物车商品
- `DELETE /api/cart/remove/:itemId` - 移除购物车商品
- `DELETE /api/cart/clear` - 清空购物车

### 管理员相关
- `GET /api/admin/users` - 获取用户列表
- `PUT /api/admin/users/:id/status` - 更新用户状态
- `GET /api/admin/orders` - 获取订单列表
- `PUT /api/admin/orders/:id/status` - 更新订单状态
- `GET /api/admin/stats` - 获取统计信息

## 数据库设计

### 核心表结构

- **users**: 用户表
- **categories**: 分类表
- **products**: 商品表
- **orders**: 订单表
- **order_items**: 订单项表
- **carts**: 购物车表

### 初始化数据

项目启动时会自动创建以下测试数据：

- 管理员用户: admin@example.com / admin123
- 普通用户: user1@example.com / user123
- 商品分类: 电子产品、服装、食品、家居
- 示例商品: iPhone 15、MacBook Pro、Nike运动鞋

## 特性

- ✅ JWT认证
- ✅ Session管理
- ✅ 密码加密
- ✅ 参数验证
- ✅ 错误处理
- ✅ 日志记录
- ✅ 限流保护
- ✅ 安全中间件
- ✅ 分层架构
- ✅ Redis缓存
- ✅ Docker编排
- ✅ 自动初始化数据

## 开发规范

1. **代码风格**: 使用ESLint和Prettier
2. **提交规范**: 使用Conventional Commits
3. **测试**: 编写单元测试和集成测试
4. **文档**: 保持API文档更新

## 部署

### 生产环境

1. 配置生产环境变量
2. 使用Docker Compose部署
3. 配置Nginx反向代理
4. 设置SSL证书

### 环境变量

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
DB_USERNAME=mall_user
DB_PASSWORD=mall123
DB_NAME=mall_db

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
```

## 监控和日志

- 应用日志: `logs/combined.log`
- 错误日志: `logs/error.log`
- Docker日志: `docker-compose logs -f`

## 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request 