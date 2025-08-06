# Session管理使用说明

## 概述

本项目实现了基于Redis的Session管理功能，支持多设备登录、Session验证、设备管理等功能。

## Session工作流程

### 1. 用户登录
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

响应示例：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user1",
      "email": "user@example.com",
      "role": "user",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionId": "sess_1640995200000_abc123def"
  }
}
```

### 2. 使用Session访问API

在后续请求中，需要在请求头中包含Session ID：

```bash
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Session-Id: sess_1640995200000_abc123def
```

### 3. Session验证

```bash
GET /api/users/session/sess_1640995200000_abc123def/validate
```

## Session管理功能

### 1. 获取活跃Session列表
```bash
GET /api/users/sessions
Authorization: Bearer <token>
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "sess_1640995200000_abc123def",
      "createdAt": 1640995200000,
      "expiresAt": 1641081600000
    }
  ]
}
```

### 2. 退出指定设备
```bash
DELETE /api/users/sessions/sess_1640995200000_abc123def
Authorization: Bearer <token>
```

### 3. 退出所有设备
```bash
POST /api/users/logout-all
Authorization: Bearer <token>
```

### 4. 修改密码（会强制退出所有设备）
```bash
POST /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## Redis存储结构

### Session数据
```
Key: session:sess_1640995200000_abc123def
Value: {
  "userId": 1,
  "user": { ... },
  "token": "...",
  "createdAt": 1640995200000,
  "expiresAt": 1641081600000
}
```

### 用户Session列表
```
Key: user_sessions:1
Value: Set[sess_1640995200000_abc123def, sess_1640995300000_xyz789ghi]
```

### Token黑名单
```
Key: blacklist:1
Value: "1"
```

## 安全特性

1. **Session过期时间**: 默认24小时，可配置
2. **自动续期**: 每次验证Session时自动延长过期时间
3. **多设备管理**: 支持查看和管理多个设备的登录状态
4. **强制退出**: 修改密码时强制退出所有设备
5. **Token黑名单**: 退出登录时将Token加入黑名单

## 配置选项

在`.env`文件中可以配置以下选项：

```bash
# Session过期时间（秒）
SESSION_EXPIRES_IN=86400

# JWT过期时间
JWT_EXPIRES_IN=7d

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key
```

## 最佳实践

1. **客户端存储**: 将`sessionId`存储在客户端（如localStorage）
2. **请求头**: 每次API请求都在请求头中包含`X-Session-Id`
3. **错误处理**: 当Session过期时，客户端应重新登录
4. **设备管理**: 定期清理不需要的Session
5. **安全退出**: 用户主动退出时删除对应Session

## 错误处理

### Session过期
```json
{
  "success": false,
  "message": "Session无效或已过期"
}
```

### 无效Session
```json
{
  "success": false,
  "message": "Session无效或已过期"
}
```

## 注意事项

1. Session数据存储在Redis中，确保Redis服务稳定运行
2. Session过期时间不应超过JWT过期时间
3. 生产环境中应使用HTTPS传输Session ID
4. 定期清理过期的Session数据
5. 监控Redis内存使用情况 