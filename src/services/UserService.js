const { signToken } = require("../utils/jwt");
const UserRepository = require("../repositories/UserRepository");
const logger = require("../utils/logger");
const { sendEmailVerification, sendWelcomeEmail, sendSecurityAlert } = require("../utils/mailer");

class UserService {
  async register(userData) {
    const { email, username } = userData;
    
    logger.logBusiness('用户注册尝试', { email, username });
    
    // 检查邮箱和用户名是否已存在
    const existingEmail = await UserRepository.findByEmail(email);

    if (existingEmail?.status === "active" || existingEmail?.lastLoginAt !== null) {
      throw new Error("邮箱已被注册");
    }
    const existingUsername = await UserRepository.findByUsername(username);
    if (existingUsername?.status === "active"  || existingUsername.lastLoginAt !== null) {
      throw new Error("用户名已被使用");
    }
    
    // 检查邮箱发送频率
    await sendEmailVerification(email, username);
    
    // 注册用户默认未激活
    if (!existingEmail && !existingUsername) {
      await UserRepository.create({
        ...userData,
        status: "inactive",
      });
      logger.logBusiness('用户注册成功', { email, username });
    }
  }

  async login(email, password) {
    logger.logBusiness('用户登录尝试', { email });
    
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      logger.logBusiness('用户登录失败 - 用户不存在', { email });
      throw new Error("用户不存在");
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.logBusiness('用户登录失败 - 密码错误', { email, userId: user.id });
      throw new Error("密码错误");
    }

    if (user.status !== "active") {
      logger.logBusiness('用户登录失败 - 账户未激活', { email, userId: user.id, status: user.status });
      throw new Error("账户未激活或已被禁用");
    }

    // 更新最后登录时间
    await UserRepository.updateLastLogin(user.id);
    
    // 发送登录安全提醒（可选）
    if (process.env.SEND_LOGIN_ALERTS === 'true') {
      try {
        await sendSecurityAlert(email, {
          username: user.username,
          type: 'login',
          message: '账户登录成功',
          ip: '127.0.0.1', // 实际使用时从请求中获取
          userAgent: 'Unknown',
          timestamp: new Date().toLocaleString('zh-CN')
        });
      } catch (alertError) {
        logger.warn('发送登录提醒失败', { error: alertError.message });
      }
    }
    
    logger.logBusiness('用户登录成功', { email, userId: user.id });

    return this.generateUserResponse(user);
  }

  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("用户不存在");
    }
    return this.formatUserData(user);
  }

  async updateProfile(userId, updateData) {
    const user = await UserRepository.update(userId, updateData);
    if (!user) {
      throw new Error("用户不存在");
    }
    return this.formatUserData(user);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("用户不存在");
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error("当前密码错误");
    }
    
    // 发送密码修改安全提醒
    try {
      await sendSecurityAlert(user.email, {
        username: user.username,
        type: 'password_change',
        message: '账户密码已修改',
        ip: '127.0.0.1',
        userAgent: 'Unknown',
        timestamp: new Date().toLocaleString('zh-CN')
      });
    } catch (alertError) {
      logger.warn('发送密码修改提醒失败', { error: alertError.message });
    }

    await UserRepository.update(userId, { password: newPassword });
    logger.logBusiness('用户修改密码', { userId });

    return { message: "密码修改成功" };
  }

  async listUsers({
    page,
    limit,
    status,
    email,
    createdAtStart,
    createdAtEnd,
  }) {
    const query = { page, limit };
    if (status) query.status = status;
    if (email) query.email = email;
    if (createdAtStart) query.createdAtStart = createdAtStart;
    if (createdAtEnd) query.createdAtEnd = createdAtEnd;

    const { rows: users, count: total } = await UserRepository.findAll(query);
    return {
      list: users.map((user) => this.formatUserData(user)),
      total,
    };
  }

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error("用户不存在");
    }
    return this.formatUserData(user);
  }


  async updateUserStatus(id, status) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error("用户不存在");
    }

    if (user.role === "admin") {
      throw new Error("不能修改管理员状态");
    }
    
    const oldStatus = user.status;

    await UserRepository.update(id, { status });
    logger.logBusiness('管理员更新用户状态', { 
      userId: id, 
      oldStatus, 
      newStatus: status 
    });
    
    return true;
  }

  async updateUserStatusByEmail(email, status) {
    logger.logBusiness('邮箱验证激活用户', { email, status });
    
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("用户不存在");
    }
    
    const result = await this.updateUserStatus(user.id, status);
    
    // 发送欢迎邮件
    if (status === 'active') {
      try {
        await sendWelcomeEmail(email, user.username);
      } catch (welcomeError) {
        logger.warn('发送欢迎邮件失败', { error: welcomeError.message });
      }
    }
    
    return result;
  }

  generateUserResponse(user) {
    // 生成包含用户信息的token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.formatUserData(user),
      token,
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
      createdAt: user.createdAt,
    };
  }
}

module.exports = new UserService();
