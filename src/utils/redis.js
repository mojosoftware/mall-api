const Redis = require('ioredis');
const config = require('.././config');
const logger = require('./logger');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  logger.info('Redis连接成功');
});

redis.on('error', (err) => {
  logger.error('Redis连接错误:', err);
});

module.exports = redis; 