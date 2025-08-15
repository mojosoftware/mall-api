require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Session配置
  sessionExpiresIn: process.env.SESSION_EXPIRES_IN || 24 * 60 * 60, // 24小时（秒）

  // 数据库配置
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mall_db",
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development",
  },

  // 邮箱服务配置
  email: {
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@example.com",
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || "",
    db: process.env.REDIS_DB || 0,
  },

  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB (默认)
    uploadPath: "public/uploads/",
    // 图片压缩配置
    imageCompression: {
      quality: 80,
      maxWidth: 1200,
      maxHeight: 1200,
      progressive: true
    },
    // 清理配置
    cleanup: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
      schedule: '0 2 * * *' // 每天凌晨2点
    }
  },

  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
};
