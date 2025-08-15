# 代码生成器使用指南

## 🚀 快速开始

### 使用方式

```bash
# 方式1: 使用npm脚本
npm run generate
# 或简写
npm run g

# 方式2: 直接运行
node bin/generate

# 方式3: 全局安装后使用
npm install -g .
mall-generate
```

## 📋 生成内容

代码生成器会自动创建完整的三层架构代码：

### 1. 数据模型层 (Model)
- **位置**: `src/models/[ModuleName].js`
- **功能**: Sequelize数据模型定义
- **包含**: 字段定义、验证规则、关联关系

### 2. 数据访问层 (Repository)
- **位置**: `src/repositories/[ModuleName]Repository.js`
- **功能**: 数据库操作封装
- **包含**: CRUD操作、查询方法、统计方法

### 3. 业务逻辑层 (Service)
- **位置**: `src/services/[ModuleName]Service.js`
- **功能**: 业务规则处理
- **包含**: 业务验证、数据转换、第三方调用

### 4. 控制器层 (Controller)
- **位置**: `src/controllers/[ModuleName]Controller.js`
- **功能**: HTTP请求处理
- **包含**: 参数验证、响应格式化、错误处理

### 5. 路由层 (Route)
- **位置**: `src/routes/[modulename].js`
- **功能**: API路由定义
- **包含**: 路由配置、中间件应用、权限控制

### 6. 验证器 (Validator)
- **位置**: `src/utils/validators/[modulename].js`
- **功能**: 参数验证规则
- **包含**: 创建验证、更新验证、查询验证

## 🎯 使用示例

### 生成文章管理模块

```bash
npm run generate
```

**交互式配置**:
```
请输入模块名称: Article
请输入表名: articles
请输入模块描述: 文章管理

配置字段信息:
字段名称: title
字段类型: STRING
是否必填: y
是否唯一: n
字段描述: 文章标题

字段名称: content
字段类型: TEXT
是否必填: n
是否唯一: n
字段描述: 文章内容

字段名称: status
字段类型: STRING
是否必填: n
是否唯一: n
字段描述: 文章状态

字段名称: (空行结束)

是否需要权限控制: y
```

### 生成的文件结构

```
src/
├── models/Article.js                    # 数据模型
├── repositories/ArticleRepository.js   # 数据访问层
├── services/ArticleService.js          # 业务逻辑层
├── controllers/ArticleController.js    # 控制器层
├── routes/article.js                   # 路由层
└── utils/validators/article.js         # 验证器
```

### 生成的API接口

```
GET    /api/articles          # 获取文章列表
GET    /api/articles/:id      # 获取文章详情
POST   /api/articles          # 创建文章 (需要权限)
PUT    /api/articles/:id      # 更新文章 (需要权限)
DELETE /api/articles/:id      # 删除文章 (需要权限)
```

## 🔧 配置选项

### 字段类型支持

- **STRING**: 字符串类型 (VARCHAR)
- **INTEGER**: 整数类型
- **TEXT**: 长文本类型
- **BOOLEAN**: 布尔类型
- **DATE**: 日期时间类型

### 权限控制

如果选择启用权限控制，会自动生成以下权限：
- `[module]:list` - 列表查看权限
- `[module]:view` - 详情查看权限
- `[module]:create` - 创建权限
- `[module]:update` - 更新权限
- `[module]:delete` - 删除权限

## 📝 生成后的操作

### 1. 注册模型关联
在 `src/models/index.js` 中添加模型关联：

```javascript
const Article = require('./Article');

// 添加关联关系
Article.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Article, { foreignKey: 'userId', as: 'articles' });

module.exports = {
  // ... 其他模型
  Article
};
```

### 2. 注册路由
在 `src/app.js` 中注册路由：

```javascript
const articleRoutes = require('./routes/article');

app.use(articleRoutes.routes());
app.use(articleRoutes.allowedMethods());
```

### 3. 创建数据库表
运行数据库迁移或手动创建表结构。

### 4. 添加权限数据
如果启用了权限控制，需要在权限管理中添加相应的权限数据。

## 🎨 自定义模板

可以修改 `src/cli/generator.js` 中的模板方法来自定义生成的代码结构：

- `getModelTemplate()` - 模型模板
- `getRepositoryTemplate()` - Repository模板
- `getServiceTemplate()` - Service模板
- `getControllerTemplate()` - Controller模板
- `getRouteTemplate()` - 路由模板
- `getValidatorTemplate()` - 验证器模板

## 🚨 注意事项

1. **模块名称**: 使用PascalCase命名 (如: Article, UserProfile)
2. **表名称**: 使用复数形式 (如: articles, user_profiles)
3. **权限命名**: 使用小写加冒号格式 (如: article:create)
4. **文件覆盖**: 生成器会覆盖同名文件，请注意备份
5. **依赖注入**: 生成后需要手动注册路由和模型关联

## 🔄 扩展功能

### 批量生成
可以创建配置文件批量生成多个模块：

```javascript
// generate-config.js
module.exports = [
  {
    name: 'Article',
    tableName: 'articles',
    description: '文章管理',
    fields: [
      { name: 'title', type: 'STRING', required: true },
      { name: 'content', type: 'TEXT', required: false }
    ]
  },
  // ... 更多模块
];
```

### 自定义字段类型
可以扩展字段类型映射来支持更多数据类型。

这个代码生成器大大提高了开发效率，确保了代码结构的一致性和规范性。