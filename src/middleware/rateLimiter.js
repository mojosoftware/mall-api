const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../utils/redis');
const Response = require('../utils/response');
const logger = require('../utils/logger');

// 预定义的限流配置
const RATE_LIMIT_CONFIGS = {
  // 严格限流 - 用于敏感操作
  strict: {
    points: 3,
    duration: 60,
    blockDuration: 300, // 5分钟
    keyPrefix: 'strict'
  },
  
  // 登录限流
  login: {
    points: 5,
    duration: 60,
    blockDuration: 900, // 15分钟
    keyPrefix: 'login'
  },
  
  // 注册限流
  register: {
    points: 3,
    duration: 300, // 5分钟
    blockDuration: 1800, // 30分钟
    keyPrefix: 'register'
  },
  
  // API通用限流
  api: {
    points: 100,
    duration: 60,
    blockDuration: 60,
    keyPrefix: 'api'
  },
  
  // 上传限流
  upload: {
    points: 10,
    duration: 60,
    blockDuration: 300,
    keyPrefix: 'upload'
  },
  
  // 管理员操作限流
  admin: {
    points: 50,
    duration: 60,
    blockDuration: 120,
    keyPrefix: 'admin'
  },
  
  // 邮件发送限流
  email: {
    points: 1,
    duration: 60,
    blockDuration: 600, // 10分钟
    keyPrefix: 'email'
  }
};

// 限流器缓存
const rateLimiters = new Map();

/**
 * 获取或创建限流器
 * @param {Object} config 限流配置
 * @returns {RateLimiterRedis} 限流器实例
 */
function getRateLimiter(config) {
  const key = `${config.keyPrefix}_${config.points}_${config.duration}`;
  
  if (!rateLimiters.has(key)) {
    const limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: config.keyPrefix,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration || config.duration,
      execEvenly: true, // 平滑限流
    });
    
    rateLimiters.set(key, limiter);
    logger.info('创建限流器', { config });
  }
  
  return rateLimiters.get(key);
}

/**
 * 生成限流键
 * @param {Object} ctx Koa上下文
 * @param {Object} options 选项
 * @returns {string} 限流键
 */
function generateKey(ctx, options) {
  const { keyGenerator, includeUserId } = options;
  
  if (keyGenerator && typeof keyGenerator === 'function') {
    return keyGenerator(ctx);
  }
  
  let key = ctx.ip;
  
  // 包含用户ID（用于已登录用户的限流）
  if (includeUserId && ctx.state.user?.id) {
    key = `${key}:${ctx.state.user.id}`;
  }
  
  return key;
}

/**
 * 创建限流中间件
 * @param {string|Object} configOrName 配置名称或配置对象
 * @param {Object} options 额外选项
 * @returns {Function} Koa中间件
 */
function createRateLimiter(configOrName = 'api', options = {}) {
  let config;
  
  // 如果是字符串，使用预定义配置
  if (typeof configOrName === 'string') {
    config = RATE_LIMIT_CONFIGS[configOrName];
    if (!config) {
      throw new Error(`未找到限流配置: ${configOrName}`);
    }
  } else {
    // 自定义配置
    config = {
      points: 10,
      duration: 60,
      blockDuration: 60,
      keyPrefix: 'custom',
      ...configOrName
    };
  }
  
  const rateLimiter = getRateLimiter(config);
  
  return async (ctx, next) => {
    try {
      const key = generateKey(ctx, options);
      
      // 尝试消费点数
      const result = await rateLimiter.consume(key);
      
      // 添加限流信息到响应头
      ctx.set({
        'X-RateLimit-Limit': config.points,
        'X-RateLimit-Remaining': result.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext)
      });
      
      await next();
      
    } catch (rejRes) {
      // 限流触发
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      // 记录限流日志
      logger.warn('触发限流限制', {
        ip: ctx.ip,
        userId: ctx.state.user?.id,
        method: ctx.method,
        url: ctx.url,
        userAgent: ctx.headers['user-agent'],
        config: config.keyPrefix,
        remainingPoints: rejRes.remainingPoints || 0,
        resetTime: secs
      });
      
      // 设置限流响应头
      ctx.set({
        'X-RateLimit-Limit': config.points,
        'X-RateLimit-Remaining': rejRes.remainingPoints || 0,
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext),
        'Retry-After': secs
      });
      
      // 返回限流错误
      Response.error(
        ctx, 
        `请求过于频繁，请在 ${secs} 秒后重试`, 
        -1, 
        429
      );
    }
  };
}

/**
 * 基于用户的限流中间件
 * @param {string|Object} configOrName 配置名称或配置对象
 * @returns {Function} Koa中间件
 */
function userRateLimit(configOrName = 'api') {
  return createRateLimiter(configOrName, { includeUserId: true });
}

/**
 * 基于IP的限流中间件
 * @param {string|Object} configOrName 配置名称或配置对象
 * @returns {Function} Koa中间件
 */
function ipRateLimit(configOrName = 'api') {
  return createRateLimiter(configOrName, { includeUserId: false });
}

/**
 * 自定义键生成器的限流中间件
 * @param {string|Object} configOrName 配置名称或配置对象
 * @param {Function} keyGenerator 键生成函数
 * @returns {Function} Koa中间件
 */
function customKeyRateLimit(configOrName, keyGenerator) {
  return createRateLimiter(configOrName, { keyGenerator });
}

/**
 * 获取限流状态
 * @param {string} key 限流键
 * @param {string} configName 配置名称
 * @returns {Promise<Object>} 限流状态
 */
async function getRateLimitStatus(key, configName = 'api') {
  const config = RATE_LIMIT_CONFIGS[configName];
  if (!config) {
    throw new Error(`未找到限流配置: ${configName}`);
  }
  
  const rateLimiter = getRateLimiter(config);
  return await rateLimiter.get(key);
}

/**
 * 重置限流状态
 * @param {string} key 限流键
 * @param {string} configName 配置名称
 * @returns {Promise<void>}
 */
async function resetRateLimit(key, configName = 'api') {
  const config = RATE_LIMIT_CONFIGS[configName];
  if (!config) {
    throw new Error(`未找到限流配置: ${configName}`);
  }
  
  const rateLimiter = getRateLimiter(config);
  await rateLimiter.delete(key);
  
  logger.info('重置限流状态', { key, config: configName });
}

module.exports = {
  // 主要导出
  createRateLimiter,
  userRateLimit,
  ipRateLimit,
  customKeyRateLimit,
  
  // 工具函数
  getRateLimitStatus,
  resetRateLimit,
  
  // 配置
  RATE_LIMIT_CONFIGS,
  
  // 向后兼容
  default: createRateLimiter
};