const jwt = require('jsonwebtoken');
const config = require('.././config');

module.exports = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, message: '未提供认证令牌' };
    return;
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    ctx.state.user = decoded;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { success: false, message: '无效的认证令牌' };
  }
}; 