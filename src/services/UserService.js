const { signToken } = require("../utils/jwt");
const UserRepository = require("../repositories/UserRepository");
const logger = require("../utils/logger");
const redis = require("../utils/redis");
class UserService {
  async register(userData) {
    const { email, username } = userData;
    // 检查邮箱和用户名是否已存在
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error("邮箱已被注册");
    }
    const existingUsername = await UserRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error("用户名已被使用");
    }
    // 注册用户默认未激活
    const user = await UserRepository.create({
      ...userData,
      status: "inactive",
    });

    // 生成验证token并存入redis，24小时有效
    const verifyToken = Buffer.from(`${user.id}:${Date.now()}`).toString(
      "base64"
    );
    const redisKey = `verify:email:${verifyToken}`;
    await redis.set(redisKey, user.id, "EX", 24 * 60 * 60);

    // 生成验证链接
    const verifyUrl = `${
      process.env.BASE_URL || "http://localhost:3000"
    }/api/users/verify-email?token=${verifyToken}`;
    const { sendMail } = require("../utils/mailer");
    await sendMail({
      to: user.email,
      subject: "邮箱验证",
      html: `<p>欢迎注册，请点击下方链接完成邮箱验证（24小时内有效）：</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    // return this.generateUserResponse(user);
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("用户不存在");
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error("密码错误");
    }

    if (user.status !== "active") {
      throw new Error("账户未激活或已被禁用");
    }

    // 更新最后登录时间
    await UserRepository.updateLastLogin(user.id);

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

    await UserRepository.update(userId, { password: newPassword });
    logger.info(`用户 ${userId} 修改密码`);

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

    await UserRepository.update(id, { status });
    logger.info(`用户 ${id} 状态更新为 ${status}`);
    return true;
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
