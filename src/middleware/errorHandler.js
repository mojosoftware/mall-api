const logger = require('../utils/logger');

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error('API错误:', err);
    
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || '服务器内部错误',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
  }
}; 