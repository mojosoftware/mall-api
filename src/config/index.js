require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Session配置
  sessionExpiresIn: process.env.SESSION_EXPIRES_IN || 24 * 60 * 60, // 24小时（秒）
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mall_db',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },
  
  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadPath: 'public/uploads/'
  },
  
  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  }
}; 