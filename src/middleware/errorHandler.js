const logger = require('../utils/logger');
const Response = require('../utils/response');

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // 记录详细的错误信息
    logger.logError(ctx, err, 'API请求处理异常');
    
    const status = err.status || 500;
    const message = err.message || '服务器内部错误';
    
    Response.error(ctx, message, -1, status);
    
    // 开发环境下添加错误堆栈信息
    if (process.env.NODE_ENV === 'development') {
      ctx.body.stack = err.stack;
    }
  }
}; 