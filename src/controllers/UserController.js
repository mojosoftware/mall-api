const Joi = require('joi');
const UserService = require('../services/UserService');

class UserController {
  async register(ctx) {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      phone: Joi.string().optional()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const result = await UserService.register(value);
      ctx.status = 201;
      ctx.body = { success: true, data: result };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async login(ctx) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
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
      phone: Joi.string().optional(),
      avatar: Joi.string().optional()
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

  async logout(ctx) {
    try {
      const sessionId = ctx.headers['x-session-id'];
      await UserService.logout(ctx.state.user.id, sessionId);
      ctx.body = { success: true, message: '退出登录成功' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async changePassword(ctx) {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      await UserService.changePassword(ctx.state.user.id, value.currentPassword, value.newPassword);
      ctx.body = { success: true, message: '密码修改成功' };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getActiveSessions(ctx) {
    try {
      const sessions = await UserService.getActiveSessions(ctx.state.user.id);
      ctx.body = { success: true, data: sessions };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async logoutAllSessions(ctx) {
    try {
      await UserService.deleteAllUserSessions(ctx.state.user.id);
      ctx.body = { success: true, message: '所有设备已退出登录' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async logoutSession(ctx) {
    try {
      const { sessionId } = ctx.params;
      await UserService.deleteSession(sessionId);
      ctx.body = { success: true, message: '指定设备已退出登录' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async validateSession(ctx) {
    try {
      const { sessionId } = ctx.params;
      const user = await UserService.validateSession(sessionId);
      
      if (!user) {
        ctx.status = 401;
        ctx.body = { success: false, message: 'Session无效或已过期' };
        return;
      }
      
      ctx.body = { success: true, data: user };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new UserController(); 