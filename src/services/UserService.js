const { signToken } = require("../utils/jwt");
const UserRepository = require("../repositories/UserRepository");
const logger = require("../utils/logger");
const redis = require("../utils/redis");
const { rateLimitMail } = require("../utils/mailer");

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
    await rateLimitMail(email);
    
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
    
    // 强制退出所有设备的逻辑可以在这里添加

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
    
    return this.updateUserStatus(user.id, status);
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
