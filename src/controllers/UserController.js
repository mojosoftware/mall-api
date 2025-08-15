const UserService = require("../services/UserService");
const redis = require("../utils/redis");
const Response = require("../utils/response");


class UserController {
  async register(ctx) {
    try {
      await UserService.register(ctx.request.body);
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
    try {
      const result = await UserService.login(ctx.request.body.email, ctx.request.body.password);
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
    try {
      const result = await UserService.updateProfile(ctx.state.user.id, ctx.request.body);
      Response.success(ctx, result, "更新用户信息成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async changePassword(ctx) {
    try {
      await UserService.changePassword(
        ctx.state.user.id,
        ctx.request.body.currentPassword,
        ctx.request.body.newPassword
      );
      Response.success(ctx, null, "密码修改成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  // 新增用户管理相关方法
  async listUsers(ctx) {
    try {
      const result = await UserService.listUsers(ctx.query);
      Response.page(ctx, result.list, result.total, ctx.query.page, ctx.query.limit, "获取用户列表成功");
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
