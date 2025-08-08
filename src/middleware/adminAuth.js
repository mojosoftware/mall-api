module.exports = async (ctx, next) => {
  const { user } = ctx.state;
  
  if (!user || user.role !== 'admin') {
    ctx.throw(403, '需要管理员权限');
  }
  
  await next();
};