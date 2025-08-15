const { verifyToken } = require('../utils/jwt');
const Response = require('../utils/response');
const logger = require('../utils/logger');
const UserRepository = require('../repositories/UserRepository');

module.exports = async (ctx, next) => {
  try {
    // 获取token
    let token = ctx.header.authorization || ctx.cookies.get('token');
    
    if (!token) {
      logger.logAuth(ctx, '未授权访问 - 缺少认证令牌', 'warn');
      Response.error(ctx, '未提供认证令牌', 401, 401);
      return;
    }

    // 如果token带有Bearer前缀，去掉该前缀
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    // 验证token格式
    if (!token || typeof token !== 'string' || token.trim() === '') {
      logger.logAuth(ctx, '无效的认证令牌格式', 'warn');
      Response.error(ctx, '无效的认证令牌格式', 401, 401);
      return;
    }

    // 验证token
    const user = await verifyToken(token);
    
    if (!user) {
      logger.logAuth(ctx, 'JWT令牌验证失败', 'warn');
      Response.error(ctx, '认证令牌无效或已过期', 401, 401);
      return;
    }

    // 验证用户在数据库中的状态
    try {
      const dbUser = await UserRepository.findById(user.id);
      if (!dbUser) {
        logger.logAuth(ctx, `用户不存在: ${user.id}`, 'warn');
        Response.error(ctx, '用户不存在，请重新登录', 401, 401);
        return;
      }

      if (dbUser.status !== 'active') {
        logger.logAuth(ctx, `用户状态异常: ${user.id} - 状态: ${dbUser.status}`, 'warn');
        Response.error(ctx, '账户已被禁用或状态异常', 403, 403);
        return;
      }

      // 更新用户信息到最新状态
      ctx.state.user = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        status: dbUser.status
      };
    } catch (dbError) {
      logger.error('数据库查询用户失败', {
        userId: user.id,
        error: dbError.message,
        method: ctx.method,
        url: ctx.url,
        ip: ctx.ip
      });
      // 数据库查询失败时使用JWT中的用户信息
      ctx.state.user = user;
    }

    // 记录成功认证（仅在开发环境或特殊情况下）
    if (process.env.NODE_ENV === 'development') {
      logger.logAuth(ctx, `用户认证成功: ${ctx.state.user.id}(${ctx.state.user.email})`);
    }

    await next();
  } catch (err) {
    // 捕获所有可能的错误
    if (err.name === 'JsonWebTokenError') {
      logger.logAuth(ctx, `JWT格式错误: ${err.message}`, 'warn');
      Response.error(ctx, '认证令牌格式错误', 401, 401);
    } else if (err.name === 'TokenExpiredError') {
      logger.logAuth(ctx, `JWT已过期: ${err.message}`, 'warn');
      Response.error(ctx, '认证令牌已过期，请重新登录', 401, 401);
    } else if (err.name === 'NotBeforeError') {
      logger.logAuth(ctx, `JWT尚未生效: ${err.message}`, 'warn');
      Response.error(ctx, '认证令牌尚未生效', 401, 401);
    } else {
      logger.logError(ctx, err, '认证中间件异常');
      Response.error(ctx, '认证过程中发生错误', 500, 500);
    }
  }
};