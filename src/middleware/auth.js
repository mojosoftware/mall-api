const { verifyToken } = require('../utils/jwt');
const Response = require('../utils/response');
const logger = require('../utils/logger');

module.exports = async (ctx, next) => {
  try {
    // 获取token
    let token = ctx.header.authorization || ctx.cookies.get('token');
    
    if (!token) {
      logger.warn(`未授权访问: ${ctx.method} ${ctx.url} - IP: ${ctx.ip}`);
      Response.error(ctx, '未提供认证令牌', 401, 401);
      return;
    }

    // 如果token带有Bearer前缀，去掉该前缀
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    // 验证token格式
    if (!token || typeof token !== 'string' || token.trim() === '') {
      logger.warn(`无效token格式: ${ctx.method} ${ctx.url} - IP: ${ctx.ip}`);
      Response.error(ctx, '无效的认证令牌格式', 401, 401);
      return;
    }

    // 验证token
    const user = await verifyToken(token);
    
    if (!user) {
      logger.warn(`token验证失败: ${ctx.method} ${ctx.url} - IP: ${ctx.ip}`);
      Response.error(ctx, '认证令牌无效或已过期', 401, 401);
      return;
    }

    // 检查用户状态
    if (user.status && user.status !== 'active') {
      logger.warn(`用户状态异常: ${user.id} - 状态: ${user.status}`);
      Response.error(ctx, '账户已被禁用或状态异常', 403, 403);
      return;
    }

    // 将用户信息挂载到ctx state中
    ctx.state.user = user;
    
    // 记录访问日志（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      logger.info(`用户访问: ${user.id} - ${ctx.method} ${ctx.url}`);
    }

    await next();
  } catch (err) {
    // 捕获所有可能的错误
    if (err.name === 'JsonWebTokenError') {
      logger.warn(`JWT格式错误: ${ctx.method} ${ctx.url} - ${err.message}`);
      Response.error(ctx, '认证令牌格式错误', 401, 401);
    } else if (err.name === 'TokenExpiredError') {
      logger.warn(`JWT已过期: ${ctx.method} ${ctx.url} - ${err.message}`);
      Response.error(ctx, '认证令牌已过期，请重新登录', 401, 401);
    } else if (err.name === 'NotBeforeError') {
      logger.warn(`JWT尚未生效: ${ctx.method} ${ctx.url} - ${err.message}`);
      Response.error(ctx, '认证令牌尚未生效', 401, 401);
    } else {
      logger.error(`认证中间件错误: ${ctx.method} ${ctx.url}`, err);
      Response.error(ctx, '认证过程中发生错误', 500, 500);
    }
  }
}