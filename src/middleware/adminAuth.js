const Response = require('../utils/response');
const logger = require('../utils/logger');
const UserRepository = require('../repositories/UserRepository');

module.exports = async (ctx, next) => {
  try {
    const { user } = ctx.state;
    
    // 检查用户是否存在
    if (!user) {
      logger.warn(`管理员权限检查失败 - 用户不存在: ${ctx.method} ${ctx.url} - IP: ${ctx.ip}`);
      Response.error(ctx, '用户信息不存在，请重新登录', 401, 401);
      return;
    }

    // 检查用户ID是否有效
    if (!user.id || typeof user.id !== 'number') {
      logger.warn(`管理员权限检查失败 - 用户ID无效: ${JSON.stringify(user)} - ${ctx.method} ${ctx.url}`);
      Response.error(ctx, '用户信息异常，请重新登录', 401, 401);
      return;
    }

    // 检查用户角色
    if (!user.role || user.role !== 'admin') {
      logger.warn(`权限不足: 用户${user.id}(${user.role || 'unknown'}) 尝试访问管理员接口 - ${ctx.method} ${ctx.url}`);
      Response.error(ctx, '权限不足，需要管理员权限', 403, 403);
      return;
    }

    // 验证用户在数据库中的状态（可选，用于额外安全检查）
    try {
      const dbUser = await UserRepository.findById(user.id);
      if (!dbUser) {
        logger.warn(`管理员用户不存在: ${user.id} - ${ctx.method} ${ctx.url}`);
        Response.error(ctx, '用户不存在，请重新登录', 401, 401);
        return;
      }

      if (dbUser.status !== 'active') {
        logger.warn(`管理员账户状态异常: ${user.id} - 状态: ${dbUser.status}`);
        Response.error(ctx, '账户已被禁用', 403, 403);
        return;
      }

      if (dbUser.role !== 'admin') {
        logger.warn(`管理员权限已变更: ${user.id} - 当前角色: ${dbUser.role}`);
        Response.error(ctx, '管理员权限已变更，请重新登录', 403, 403);
        return;
      }
    } catch (dbError) {
      logger.error(`数据库查询用户失败: ${user.id}`, dbError);
      // 数据库查询失败时，仍然允许通过（避免因数据库问题导致服务不可用）
      logger.warn(`跳过数据库用户验证: ${user.id} - 数据库查询失败`);
    }

    // 记录管理员操作日志
    logger.info(`管理员操作: ${user.id}(${user.email || user.username}) - ${ctx.method} ${ctx.url} - IP: ${ctx.ip}`);

    await next();
  } catch (err) {
    logger.error(`管理员权限中间件错误: ${ctx.method} ${ctx.url}`, err);
    Response.error(ctx, '权限验证过程中发生错误', 500, 500);
  }
};