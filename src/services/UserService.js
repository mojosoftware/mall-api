const jwt = require('jsonwebtoken');
const config = require('../config');
const UserRepository = require('../repositories/UserRepository');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

class UserService {
  async register(userData) {
    const { email, username } = userData;
    
    // 检查邮箱和用户名是否已存在
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }
    
    const existingUsername = await UserRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('用户名已被使用');
    }
    
    const user = await UserRepository.create(userData);
    return this.generateUserResponse(user);
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('密码错误');
    }
    
    if (user.status !== 'active') {
      throw new Error('账户已被禁用');
    }
    
    // 更新最后登录时间
    await UserRepository.updateLastLogin(user.id);
    
    // 创建session
    const sessionData = await this.createSession(user);
    
    return {
      user: this.formatUserData(user),
      token: sessionData.token,
      sessionId: sessionData.sessionId
    };
  }

  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return this.formatUserData(user);
  }

  async updateProfile(userId, updateData) {
    const user = await UserRepository.update(userId, updateData);
    if (!user) {
      throw new Error('用户不存在');
    }
    return this.formatUserData(user);
  }

  async logout(userId, sessionId) {
    // 删除session
    if (sessionId) {
      await this.deleteSession(sessionId);
    }
    
    // 将token加入黑名单
    const token = `blacklist:${userId}`;
    await redis.setex(token, 3600, '1'); // 1小时过期
    
    logger.info(`用户 ${userId} 退出登录`);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('当前密码错误');
    }
    
    await UserRepository.update(userId, { password: newPassword });
    
    // 删除所有session，强制重新登录
    await this.deleteAllUserSessions(userId);
    
    logger.info(`用户 ${userId} 修改密码`);
  }

  async validateSession(sessionId) {
    try {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return null;
      }
      
      const session = JSON.parse(sessionData);
      
      // 检查session是否过期
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(sessionId);
        return null;
      }
      
      // 更新session过期时间
      session.expiresAt = Date.now() + (config.sessionExpiresIn || 24 * 60 * 60 * 1000);
      await redis.setex(`session:${sessionId}`, config.sessionExpiresIn || 24 * 60 * 60, JSON.stringify(session));
      
      return session.user;
    } catch (error) {
      logger.error('验证session失败:', error);
      return null;
    }
  }

  async createSession(user) {
    const sessionId = this.generateSessionId();
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    const sessionData = {
      userId: user.id,
      user: this.formatUserData(user),
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + (config.sessionExpiresIn || 24 * 60 * 60 * 1000)
    };
    
    // 存储session到Redis
    await redis.setex(
      `session:${sessionId}`, 
      config.sessionExpiresIn || 24 * 60 * 60, 
      JSON.stringify(sessionData)
    );
    
    // 存储用户session列表
    await redis.sadd(`user_sessions:${user.id}`, sessionId);
    
    logger.info(`用户 ${user.id} 创建session: ${sessionId}`);
    
    return { sessionId, token };
  }

  async deleteSession(sessionId) {
    try {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // 从用户session列表中移除
        await redis.srem(`user_sessions:${session.userId}`, sessionId);
      }
      
      await redis.del(`session:${sessionId}`);
      logger.info(`删除session: ${sessionId}`);
    } catch (error) {
      logger.error('删除session失败:', error);
    }
  }

  async deleteAllUserSessions(userId) {
    try {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);
      for (const sessionId of sessionIds) {
        await redis.del(`session:${sessionId}`);
      }
      await redis.del(`user_sessions:${userId}`);
      logger.info(`删除用户 ${userId} 的所有session`);
    } catch (error) {
      logger.error('删除用户所有session失败:', error);
    }
  }

  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateUserResponse(user) {
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    return {
      user: this.formatUserData(user),
      token
    };
  }

  formatUserData(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  }

  async getActiveSessions(userId) {
    try {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);
      const sessions = [];
      
      for (const sessionId of sessionIds) {
        const sessionData = await redis.get(`session:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.expiresAt > Date.now()) {
            sessions.push({
              sessionId,
              createdAt: session.createdAt,
              expiresAt: session.expiresAt
            });
          }
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error('获取用户活跃session失败:', error);
      return [];
    }
  }
}

module.exports = new UserService(); 