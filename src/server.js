const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const sequelize = require('./database/connection');
require('./models'); // 确保模型关联被加载

const PORT = config.port || 3000;

async function startServer() {
  try {
    logger.info('正在启动商城API服务...', { port: PORT, env: process.env.NODE_ENV });
    
    await sequelize.authenticate();
    logger.info('数据库连接成功', { 
      host: config.database.host, 
      database: config.database.database 
    });

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ force: false });
      logger.info('数据库模型同步完成');
    }
    
    app.listen(PORT, () => {
      logger.info('商城API服务启动成功', { 
        port: PORT,
        env: process.env.NODE_ENV,
        apiUrl: `http://localhost:${PORT}/api`
      });
    });
  } catch (error) {
    logger.error('服务器启动失败', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { 
    reason: reason,
    promise: promise 
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});

startServer();
