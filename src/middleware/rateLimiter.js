const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../utils/redis');
const Response = require('../utils/response');
const logger = require('../utils/logger');

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
      // 记录限流日志
      logger.warn('请求频率限制触发', {
        ip: ctx.ip,
        method: ctx.method,
        url: ctx.url,
        userAgent: ctx.headers['user-agent'],
        keyPrefix,
        points,
        duration
      });
      
      Response.error(ctx, '请求过于频繁，请稍后再试', -1, 429);
    }
  }

  return rateLimiterMiddleware;
}; 