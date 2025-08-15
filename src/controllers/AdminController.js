const UserRepository = require('../repositories/UserRepository');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { resetRateLimit } = require('../middleware/rateLimiter');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
  async getUsers(ctx) {
    try {
      const { page, limit, search } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search
      };
      
      const result = await UserRepository.findAll(options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取用户列表成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async updateUserStatus(ctx) {
    try {
      const { id } = ctx.params;
      const user = await UserRepository.update(parseInt(id), { status: ctx.request.body.status });
      if (!user) {
        Response.error(ctx, "用户不存在", -1, 404);
        return;
      }
      
      Response.success(ctx, user, "更新用户状态成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getOrders(ctx) {
    try {
      const { page, limit, status, userId } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status,
        userId: userId ? parseInt(userId) : undefined
      };
      
      const result = await OrderRepository.findAll(options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取订单列表成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async updateOrderStatus(ctx) {
    try {
      const { id } = ctx.params;
      const order = await OrderRepository.updateStatus(parseInt(id), ctx.request.body.status);
      if (!order) {
        Response.error(ctx, "订单不存在", -1, 404);
        return;
      }
      
      Response.success(ctx, order, "更新订单状态成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getStats(ctx) {
    try {
      const userCount = await UserRepository.count();
      const productCount = await ProductRepository.count();
      const orderCount = await OrderRepository.count();
      
      // 获取今日订单数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrderCount = await OrderRepository.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: today
          }
        }
      });
      
      Response.success(ctx, {
        userCount,
        productCount,
        orderCount,
        todayOrderCount
      }, "获取统计信息成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  // 新增：重置用户限流状态
  async resetUserRateLimit(ctx) {
    try {
      const { userId, type = 'api' } = ctx.request.body;
      
      if (!userId) {
        Response.error(ctx, "用户ID不能为空", -1, 400);
        return;
      }

      // 验证用户是否存在
      const user = await UserRepository.findById(userId);
      if (!user) {
        Response.error(ctx, "用户不存在", -1, 404);
        return;
      }

      // 重置不同类型的限流
      const rateLimitKeys = [
        `${user.id}`, // 基于用户ID的限流
        `127.0.0.1:${user.id}`, // 基于IP+用户ID的限流
        user.email // 基于邮箱的限流
      ];

      for (const key of rateLimitKeys) {
        try {
          await resetRateLimit(key, type);
        } catch (error) {
          logger.warn('重置限流失败', { key, type, error: error.message });
        }
      }

      logger.logAdmin(ctx, `重置用户限流状态`, { userId, type });
      Response.success(ctx, null, "重置限流状态成功");
    } catch (err) {
      logger.logError(ctx, err, '重置用户限流状态失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  // 新增：重置IP限流状态
  async resetIpRateLimit(ctx) {
    try {
      const { ip, type = 'api' } = ctx.request.body;
      
      if (!ip) {
        Response.error(ctx, "IP地址不能为空", -1, 400);
        return;
      }

      await resetRateLimit(ip, type);
      
      logger.logAdmin(ctx, `重置IP限流状态`, { ip, type });
      Response.success(ctx, null, "重置IP限流状态成功");
    } catch (err) {
      logger.logError(ctx, err, '重置IP限流状态失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }
}

module.exports = new AdminController();