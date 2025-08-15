const winston = require('winston');
const path = require('path');
const moment = require('moment');

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => moment().format('YYYY-MM-DD HH:mm:ss')
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, userId, ip, method, url, stack, ...meta }) => {
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] [${service}]`;
    
    // 添加用户信息
    if (userId) {
      logMessage += ` [User:${userId}]`;
    }
    
    // 添加请求信息
    if (method && url) {
      logMessage += ` [${method} ${url}]`;
    }
    
    // 添加IP信息
    if (ip) {
      logMessage += ` [IP:${ip}]`;
    }
    
    logMessage += ` ${message}`;
    
    // 添加额外的元数据
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    // 添加错误堆栈
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// 创建日志目录
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logger = winston.createLogger({
  level: 'info',
  format: customFormat,
  defaultMeta: { service: 'mall-api' },
  transports: [
    // 错误日志
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // 综合日志
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // 访问日志
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/access.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
