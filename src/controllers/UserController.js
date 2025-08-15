const Joi = require("joi");
const UserService = require("../services/UserService");
const redis = require("../utils/redis");
const Response = require("../utils/response");


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
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      await UserService.register(value);
      Response.success(ctx, null, "注册成功，请前往邮箱验证");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async verifyEmail(ctx) {
    const { token } = ctx.query;
    if (!token) {
      Response.error(ctx, "无效的验证链接", -1, 400);
      return;
    }
    const redisKey = `verify:email:${token}`;
    const userEmail = await redis.get(redisKey);
    if (!userEmail) {
      Response.error(ctx, "链接已失效或无效", -1, 400);
      return;
    }
    
    await UserService.updateUserStatusByEmail(userEmail, "active");
    
    Response.success(ctx, null, "邮箱验证成功，账户已激活");
  }

  async login(ctx) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const result = await UserService.login(value.email, value.password);
      Response.success(ctx, result, "登录成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 401);
    }
  }

  async getProfile(ctx) {
    try {
      const result = await UserService.getProfile(ctx.state.user.id);
      Response.success(ctx, result, "获取用户信息成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 404);
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
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const result = await UserService.updateProfile(ctx.state.user.id, value);
      Response.success(ctx, result, "更新用户信息成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async changePassword(ctx) {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      await UserService.changePassword(
        ctx.state.user.id,
        value.currentPassword,
        value.newPassword
      );
      Response.success(ctx, null, "密码修改成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
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
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const result = await UserService.listUsers(value);
      Response.page(ctx, result.list, result.total, value.page, value.limit, "获取用户列表成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getUserById(ctx) {
    try {
      const { id } = ctx.params;
      const user = await UserService.getUserById(id);
      Response.success(ctx, user, "获取用户信息成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async disableUser(ctx) {
    try {
      const { id } = ctx.params;
      await UserService.updateUserStatus(id, "inactive");
      Response.success(ctx, null, "用户已禁用");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async enableUser(ctx) {
    try {
      const { id } = ctx.params;
      await UserService.updateUserStatus(id, "active");
      Response.success(ctx, null, "用户已启用");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }
}

module.exports = new UserController();
