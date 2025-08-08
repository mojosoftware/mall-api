const { verifyToken } = require('../utils/jwt')

module.exports = async (ctx, next) => {
  // 获取token
  let token = ctx.header.authorization || ctx.cookies.get('token')
  
  if (!token) {
    ctx.throw(401, 'No token detected in HTTP header "Authorization" or cookies')
  }

  // 如果token带有Bearer前缀，去掉该前缀
  if (token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '')
  }

  try {
    // 验证token
    const user = await verifyToken(token)
    // 将用户信息挂载到ctx state中
    ctx.state.user = user
  } catch (err) {
    ctx.throw(401, 'token已失效')
  }

  await next()
}