const Joi = require("joi");
const UserService = require("../services/UserService");
const redis = require("../utils/redis");


class UserController {
  async register(ctx) {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      phone: Joi.string()
        .pattern(/^1[3-9]\d{9}$/)
        .optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      await UserService.register(value);
      ctx.status = 201;
      ctx.body = { success: true, message: "注册成功，请前往邮箱验证" };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async verifyEmail(ctx) {
    const { token } = ctx.query;
    if (!token) {
      ctx.status = 400;
      ctx.body = { success: false, message: "无效的验证链接" };
      return;
    }
    const redisKey = `verify:email:${token}`;
    const userEmail = await redis.get(redisKey);
    if (!userEmail) {
      ctx.status = 400;
      ctx.body = { success: false, message: "链接已失效或无效" };
      return;
    }
    
    await UserService.updateUserStatusByEmail(userEmail, "active");
    
    ctx.body = { success: true, message: "邮箱验证成功，账户已激活" };
  }

  async login(ctx) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const result = await UserService.login(value.email, value.password);
      ctx.body = { success: true, data: result };
    } catch (err) {
      ctx.status = 401;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getProfile(ctx) {
    try {
      const result = await UserService.getProfile(ctx.state.user.id);
      ctx.body = { success: true, data: result };
    } catch (err) {
      ctx.status = 404;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateProfile(ctx) {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).optional(),
      phone: Joi.string()
        .pattern(/^1[3-9]\d{9}$/)
        .optional(),
      avatar: Joi.string().uri({ allowRelative: true }).optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const result = await UserService.updateProfile(ctx.state.user.id, value);
      ctx.body = { success: true, data: result };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async changePassword(ctx) {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      await UserService.changePassword(
        ctx.state.user.id,
        value.currentPassword,
        value.newPassword
      );
      ctx.body = { success: true, message: "密码修改成功" };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  // 新增用户管理相关方法
  async listUsers(ctx) {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      status: Joi.string().valid("active", "inactive").optional(),
      email: Joi.string().optional(),
      createdAtStart: Joi.date().iso().optional(),
      createdAtEnd: Joi.date().iso().optional(),
    }).unknown(true); // 允许额外参数

    const { error, value } = schema.validate(ctx.query);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const result = await UserService.listUsers(value);
      ctx.body = { success: true, data: result };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getUserById(ctx) {
    try {
      const { id } = ctx.params;
      const user = await UserService.getUserById(id);
      ctx.body = { success: true, data: user };
    } catch (err) {
      ctx.status = 404;
      ctx.body = { success: false, message: err.message };
    }
  }

  async disableUser(ctx) {
    try {
      const { id } = ctx.params;
      await UserService.updateUserStatus(id, "inactive");
      ctx.body = { success: true, message: "用户已禁用" };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async enableUser(ctx) {
    try {
      const { id } = ctx.params;
      await UserService.updateUserStatus(id, "active");
      ctx.body = { success: true, message: "用户已启用" };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new UserController();
