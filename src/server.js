const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const sequelize = require('./database/connection');

const PORT = config.port || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ force: false });
        logger.info('数据库模型同步完成');
    }
    app.listen(PORT, () => {
      logger.info(`商城API服务启动成功，端口: ${PORT}`);
      logger.info(`API文档: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
