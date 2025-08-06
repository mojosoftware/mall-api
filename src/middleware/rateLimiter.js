const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../utils/redis');

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'middleware',
  points: 10, // 请求次数
  duration: 1, // 时间窗口（秒）
});

module.exports = async (ctx, next) => {
  try {
    await rateLimiter.consume(ctx.ip);
    await next();
  } catch (rejRes) {
    ctx.status = 429;
    ctx.body = { 
      success: false, 
      message: '请求过于频繁，请稍后再试' 
    };
  }
}; 