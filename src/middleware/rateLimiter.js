const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../utils/redis');

module.exports = ({
  points = 10,
  duration = 1,
  keyPrefix = 'middleware',
}) => {

  const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix,
    points, // 请求次数
    duration, // 时间窗口（秒）
  });
  const rateLimiterMiddleware = async (ctx, next) => {
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
  }

  return rateLimiterMiddleware;
}; 