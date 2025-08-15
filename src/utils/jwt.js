const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config");
const logger = require("./logger");

class JWTManager {
  constructor() {
    this.secret = config.jwtSecret;
    this.defaultExpiresIn = config.jwtExpiresIn;
    this.algorithm = 'HS256';
    this.issuer = config.siteName || 'mall-api';
    
    if (!this.secret) {
      throw new Error("JWT_SECRET is not defined in config");
    }

    // 验证密钥强度
    this.validateSecret();
  }

  validateSecret() {
    if (this.secret.length < 32) {
      logger.warn('JWT密钥长度不足，建议使用至少32位字符的密钥');
    }
    
    if (this.secret === 'your-secret-key' || this.secret === 'your-super-secret-jwt-key') {
      logger.error('检测到默认JWT密钥，请在生产环境中更换为安全的密钥');
    }
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - 载荷数据
   * @param {Object} options - 选项
   * @returns {string} JWT令牌
   */
  signToken(payload, options = {}) {
    try {
      // 验证载荷
      if (!payload || typeof payload !== 'object') {
        throw new Error('载荷必须是一个对象');
      }

      // 默认选项
      const defaultOptions = {
        expiresIn: this.defaultExpiresIn,
        algorithm: this.algorithm,
        issuer: this.issuer,
        audience: config.siteUrl || 'localhost',
        subject: payload.id ? payload.id.toString() : undefined,
        jwtid: this.generateJTI(),
        notBefore: 0, // 立即生效
      };

      const finalOptions = { ...defaultOptions, ...options };

      // 添加标准声明
      const enhancedPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000), // 签发时间
        type: options.type || 'access', // 令牌类型
      };

      const token = jwt.sign(enhancedPayload, this.secret, finalOptions);
      
      logger.info('JWT令牌生成成功', {
        subject: finalOptions.subject,
        type: enhancedPayload.type,
        expiresIn: finalOptions.expiresIn,
        jwtid: finalOptions.jwtid
      });

      return token;
    } catch (error) {
      logger.error('JWT令牌生成失败', { 
        error: error.message,
        payload: this.sanitizePayload(payload)
      });
      throw new Error(`令牌生成失败: ${error.message}`);
    }
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @param {Object} options - 验证选项
   * @returns {Object|null} 解码后的载荷
   */
  verifyToken(token, options = {}) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('令牌格式无效');
      }

      // 清理token（移除Bearer前缀）
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      
      if (!cleanToken) {
        throw new Error('令牌不能为空');
      }

      const defaultOptions = {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: config.siteUrl || 'localhost',
        clockTolerance: 30, // 30秒时钟偏差容忍
      };

      const finalOptions = { ...defaultOptions, ...options };
      const decoded = jwt.verify(cleanToken, this.secret, finalOptions);

      logger.info('JWT令牌验证成功', {
        subject: decoded.sub,
        type: decoded.type,
        jwtid: decoded.jti,
        userId: decoded.id
      });

      return decoded;
    } catch (error) {
      logger.warn('JWT令牌验证失败', { 
        error: error.message,
        name: error.name,
        token: token ? token.substring(0, 20) + '...' : 'null'
      });
      
      // 根据错误类型返回null或抛出错误
      if (this.isRecoverableError(error)) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * 解码JWT令牌（不验证签名）
   * @param {string} token - JWT令牌
   * @returns {Object|null} 解码后的载荷
   */
  decodeToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      const decoded = jwt.decode(cleanToken, { complete: true });
      
      if (!decoded) {
        return null;
      }

      return {
        header: decoded.header,
        payload: decoded.payload,
        signature: decoded.signature
      };
    } catch (error) {
      logger.warn('JWT令牌解码失败', { error: error.message });
      return null;
    }
  }

  /**
   * 生成刷新令牌
   * @param {Object} payload - 载荷数据
   * @returns {string} 刷新令牌
   */
  generateRefreshToken(payload) {
    return this.signToken(payload, {
      expiresIn: '30d', // 刷新令牌有效期30天
      type: 'refresh'
    });
  }

  /**
   * 生成访问令牌
   * @param {Object} payload - 载荷数据
   * @returns {string} 访问令牌
   */
  generateAccessToken(payload) {
    return this.signToken(payload, {
      expiresIn: '15m', // 访问令牌有效期15分钟
      type: 'access'
    });
  }

  /**
   * 生成重置密码令牌
   * @param {Object} payload - 载荷数据
   * @returns {string} 重置令牌
   */
  generateResetToken(payload) {
    return this.signToken(payload, {
      expiresIn: '1h', // 重置令牌有效期1小时
      type: 'reset'
    });
  }

  /**
   * 生成邮箱验证令牌
   * @param {Object} payload - 载荷数据
   * @returns {string} 验证令牌
   */
  generateVerificationToken(payload) {
    return this.signToken(payload, {
      expiresIn: '24h', // 验证令牌有效期24小时
      type: 'verification'
    });
  }

  /**
   * 刷新令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Object} 新的令牌对
   */
  refreshTokens(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      if (!decoded || decoded.type !== 'refresh') {
        throw new Error('无效的刷新令牌');
      }

      // 生成新的令牌对
      const payload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      logger.info('令牌刷新成功', { userId: decoded.id });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: '15m'
      };
    } catch (error) {
      logger.error('令牌刷新失败', { error: error.message });
      throw new Error(`令牌刷新失败: ${error.message}`);
    }
  }

  /**
   * 获取令牌剩余有效时间
   * @param {string} token - JWT令牌
   * @returns {number|null} 剩余秒数
   */
  getTokenTTL(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.payload.exp - now;
      
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      logger.warn('获取令牌TTL失败', { error: error.message });
      return null;
    }
  }

  /**
   * 检查令牌是否即将过期
   * @param {string} token - JWT令牌
   * @param {number} threshold - 阈值（秒）
   * @returns {boolean} 是否即将过期
   */
  isTokenExpiringSoon(token, threshold = 300) {
    const ttl = this.getTokenTTL(token);
    return ttl !== null && ttl <= threshold;
  }

  /**
   * 生成JWT ID
   * @returns {string} JWT ID
   */
  generateJTI() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 清理敏感信息
   * @param {Object} payload - 载荷
   * @returns {Object} 清理后的载荷
   */
  sanitizePayload(payload) {
    const sanitized = { ...payload };
    delete sanitized.password;
    delete sanitized.secret;
    delete sanitized.token;
    return sanitized;
  }

  /**
   * 判断是否为可恢复的错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否可恢复
   */
  isRecoverableError(error) {
    const recoverableErrors = [
      'JsonWebTokenError',
      'TokenExpiredError',
      'NotBeforeError'
    ];
    return recoverableErrors.includes(error.name);
  }

  /**
   * 验证令牌格式
   * @param {string} token - JWT令牌
   * @returns {boolean} 格式是否正确
   */
  validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    const parts = cleanToken.split('.');
    
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * 获取令牌信息（不验证签名）
   * @param {string} token - JWT令牌
   * @returns {Object|null} 令牌信息
   */
  getTokenInfo(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }

      const payload = decoded.payload;
      const now = Math.floor(Date.now() / 1000);

      return {
        valid: this.validateTokenFormat(token),
        type: payload.type || 'unknown',
        subject: payload.sub,
        issuer: payload.iss,
        audience: payload.aud,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        notBefore: payload.nbf ? new Date(payload.nbf * 1000) : null,
        jwtId: payload.jti,
        isExpired: payload.exp ? payload.exp < now : false,
        isActive: payload.nbf ? payload.nbf <= now : true,
        ttl: payload.exp ? Math.max(0, payload.exp - now) : null
      };
    } catch (error) {
      logger.warn('获取令牌信息失败', { error: error.message });
      return null;
    }
  }

  /**
   * 批量验证令牌
   * @param {string[]} tokens - 令牌数组
   * @returns {Object[]} 验证结果数组
   */
  verifyTokens(tokens) {
    return tokens.map(token => {
      try {
        const payload = this.verifyToken(token);
        return { token, valid: true, payload };
      } catch (error) {
        return { token, valid: false, error: error.message };
      }
    });
  }

  /**
   * 创建令牌黑名单检查器
   * @param {Function} isBlacklisted - 黑名单检查函数
   * @returns {Function} 验证函数
   */
  createBlacklistChecker(isBlacklisted) {
    return async (token) => {
      try {
        const decoded = this.verifyToken(token);
        if (!decoded) {
          return null;
        }

        const blacklisted = await isBlacklisted(decoded.jti || token);
        if (blacklisted) {
          throw new Error('令牌已被列入黑名单');
        }

        return decoded;
      } catch (error) {
        logger.warn('黑名单检查失败', { error: error.message });
        throw error;
      }
    };
  }
}

// 创建单例实例
const jwtManager = new JWTManager();

// 向后兼容的导出
module.exports = {
  signToken: (payload, options) => jwtManager.signToken(payload, options),
  verifyToken: (token, options) => jwtManager.verifyToken(token, options),
  decodeToken: (token) => jwtManager.decodeToken(token),
  
  // 新增功能
  generateRefreshToken: (payload) => jwtManager.generateRefreshToken(payload),
  generateAccessToken: (payload) => jwtManager.generateAccessToken(payload),
  generateResetToken: (payload) => jwtManager.generateResetToken(payload),
  generateVerificationToken: (payload) => jwtManager.generateVerificationToken(payload),
  refreshTokens: (refreshToken) => jwtManager.refreshTokens(refreshToken),
  getTokenTTL: (token) => jwtManager.getTokenTTL(token),
  isTokenExpiringSoon: (token, threshold) => jwtManager.isTokenExpiringSoon(token, threshold),
  validateTokenFormat: (token) => jwtManager.validateTokenFormat(token),
  getTokenInfo: (token) => jwtManager.getTokenInfo(token),
  verifyTokens: (tokens) => jwtManager.verifyTokens(tokens),
  createBlacklistChecker: (isBlacklisted) => jwtManager.createBlacklistChecker(isBlacklisted),
  
  // 导出管理器实例
  JWTManager,
  jwtManager
};