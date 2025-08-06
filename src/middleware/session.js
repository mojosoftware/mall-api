const UserService = require('../services/UserService');

module.exports = async (ctx, next) => {
  const sessionId = ctx.headers['x-session-id'];
  
  if (sessionId) {
    try {
      const user = await UserService.validateSession(sessionId);
      if (user) {
        ctx.state.user = user;
        ctx.state.sessionId = sessionId;
      }
    } catch (error) {
      // Session验证失败，继续执行但不设置用户状态
    }
  }
  
  await next();
}; 