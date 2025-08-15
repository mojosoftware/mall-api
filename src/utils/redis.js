const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1秒
    
    this.init();
  }

  init() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // 重连策略
        retryDelayOnClusterDown: 300,
        retryDelayOnClusterDown: 300,
        maxRetriesPerRequest: null,
      });

      this.setupEventHandlers();
      this.connect();
    } catch (error) {
      logger.error('Redis客户端初始化失败', { error: error.message });
      throw error;
    }
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Redis连接成功', {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db
      });
    });

    this.client.on('ready', () => {
      logger.info('Redis客户端就绪');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis连接错误', { 
        error: error.message,
        code: error.code,
        errno: error.errno
      });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis连接关闭');
    });

    this.client.on('reconnecting', (delay) => {
      this.reconnectAttempts++;
      logger.info('Redis重连中', { 
        attempt: this.reconnectAttempts,
        delay: delay
      });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('Redis连接结束');
    });
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Redis连接失败', { error: error.message });
      throw error;
    }
  }

  // 检查连接状态
  isReady() {
    return this.isConnected && this.client.status === 'ready';
  }

  // 安全执行Redis命令
  async safeExecute(command, ...args) {
    try {
      if (!this.isReady()) {
        throw new Error('Redis连接未就绪');
      }
      return await this.client[command](...args);
    } catch (error) {
      logger.error(`Redis命令执行失败: ${command}`, {
        command,
        args: args.slice(0, 2), // 只记录前两个参数，避免敏感信息
        error: error.message
      });
      throw error;
    }
  }

  // 基础操作方法
  async get(key) {
    return await this.safeExecute('get', key);
  }

  async set(key, value, ...options) {
    return await this.safeExecute('set', key, value, ...options);
  }

  async del(key) {
    return await this.safeExecute('del', key);
  }

  async exists(key) {
    return await this.safeExecute('exists', key);
  }

  async expire(key, seconds) {
    return await this.safeExecute('expire', key, seconds);
  }

  async ttl(key) {
    return await this.safeExecute('ttl', key);
  }

  // 哈希操作
  async hget(key, field) {
    return await this.safeExecute('hget', key, field);
  }

  async hset(key, field, value) {
    return await this.safeExecute('hset', key, field, value);
  }

  async hmset(key, obj) {
    return await this.safeExecute('hmset', key, obj);
  }

  async hgetall(key) {
    return await this.safeExecute('hgetall', key);
  }

  async hdel(key, field) {
    return await this.safeExecute('hdel', key, field);
  }

  // 集合操作
  async sadd(key, member) {
    return await this.safeExecute('sadd', key, member);
  }

  async srem(key, member) {
    return await this.safeExecute('srem', key, member);
  }

  async smembers(key) {
    return await this.safeExecute('smembers', key);
  }

  async sismember(key, member) {
    return await this.safeExecute('sismember', key, member);
  }

  // 列表操作
  async lpush(key, value) {
    return await this.safeExecute('lpush', key, value);
  }

  async rpush(key, value) {
    return await this.safeExecute('rpush', key, value);
  }

  async lpop(key) {
    return await this.safeExecute('lpop', key);
  }

  async rpop(key) {
    return await this.safeExecute('rpop', key);
  }

  async lrange(key, start, stop) {
    return await this.safeExecute('lrange', key, start, stop);
  }

  // 有序集合操作
  async zadd(key, score, member) {
    return await this.safeExecute('zadd', key, score, member);
  }

  async zrem(key, member) {
    return await this.safeExecute('zrem', key, member);
  }

  async zrange(key, start, stop, withScores = false) {
    const args = withScores ? [key, start, stop, 'WITHSCORES'] : [key, start, stop];
    return await this.safeExecute('zrange', ...args);
  }

  async zrank(key, member) {
    return await this.safeExecute('zrank', key, member);
  }

  // 高级功能
  async setWithExpiry(key, value, expirySeconds) {
    return await this.safeExecute('set', key, value, 'EX', expirySeconds);
  }

  async setIfNotExists(key, value, expirySeconds = null) {
    const args = expirySeconds 
      ? [key, value, 'EX', expirySeconds, 'NX']
      : [key, value, 'NX'];
    return await this.safeExecute('set', ...args);
  }

  async increment(key, amount = 1) {
    return amount === 1 
      ? await this.safeExecute('incr', key)
      : await this.safeExecute('incrby', key, amount);
  }

  async decrement(key, amount = 1) {
    return amount === 1
      ? await this.safeExecute('decr', key)
      : await this.safeExecute('decrby', key, amount);
  }

  // 批量操作
  async mget(keys) {
    return await this.safeExecute('mget', ...keys);
  }

  async mset(keyValuePairs) {
    const args = [];
    for (const [key, value] of Object.entries(keyValuePairs)) {
      args.push(key, value);
    }
    return await this.safeExecute('mset', ...args);
  }

  async deletePattern(pattern) {
    const keys = await this.safeExecute('keys', pattern);
    if (keys.length > 0) {
      return await this.safeExecute('del', ...keys);
    }
    return 0;
  }

  // 管道操作
  pipeline() {
    return this.client.pipeline();
  }

  // 事务操作
  multi() {
    return this.client.multi();
  }

  // 发布订阅
  async publish(channel, message) {
    return await this.safeExecute('publish', channel, message);
  }

  async subscribe(channel, callback) {
    const subscriber = this.client.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', callback);
    return subscriber;
  }

  // 缓存装饰器
  cache(key, ttl = 3600) {
    return (target, propertyName, descriptor) => {
      const method = descriptor.value;
      descriptor.value = async function(...args) {
        const cacheKey = `${key}:${JSON.stringify(args)}`;
        
        try {
          const cached = await this.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (error) {
          logger.warn('缓存读取失败', { key: cacheKey, error: error.message });
        }

        const result = await method.apply(this, args);
        
        try {
          await this.setWithExpiry(cacheKey, JSON.stringify(result), ttl);
        } catch (error) {
          logger.warn('缓存写入失败', { key: cacheKey, error: error.message });
        }

        return result;
      };
    };
  }

  // 分布式锁
  async acquireLock(key, ttl = 10, retryTimes = 3, retryDelay = 100) {
    const lockKey = `lock:${key}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    for (let i = 0; i < retryTimes; i++) {
      const result = await this.setIfNotExists(lockKey, lockValue, ttl);
      if (result === 'OK') {
        return {
          key: lockKey,
          value: lockValue,
          release: async () => {
            const script = `
              if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
              else
                return 0
              end
            `;
            return await this.safeExecute('eval', script, 1, lockKey, lockValue);
          }
        };
      }
      
      if (i < retryTimes - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error(`获取分布式锁失败: ${key}`);
  }

  // 健康检查
  async healthCheck() {
    try {
      const start = Date.now();
      await this.safeExecute('ping');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        connected: this.isConnected,
        ready: this.isReady()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: this.isConnected,
        ready: this.isReady()
      };
    }
  }

  // 获取统计信息
  async getStats() {
    try {
      const info = await this.safeExecute('info');
      const dbSize = await this.safeExecute('dbsize');
      
      return {
        connected: this.isConnected,
        ready: this.isReady(),
        dbSize,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      logger.error('获取Redis统计信息失败', { error: error.message });
      return null;
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    let section = '';
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        section = line.substring(2).toLowerCase();
        result[section] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (section) {
          result[section][key] = isNaN(value) ? value : Number(value);
        }
      }
    }
    
    return result;
  }

  // 优雅关闭
  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        logger.info('Redis连接已关闭');
      }
    } catch (error) {
      logger.error('Redis关闭失败', { error: error.message });
    }
  }
}

// 创建单例实例
const redisClient = new RedisClient();

// 导出实例和类
module.exports = redisClient;
module.exports.RedisClient = RedisClient;