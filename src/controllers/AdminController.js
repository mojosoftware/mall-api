const UserRepository = require('../repositories/UserRepository');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');
const Response = require('../utils/response');

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
      const { status } = ctx.request.body;
      
      if (!['active', 'inactive'].includes(status)) {
        Response.error(ctx, "状态值无效", -1, 400);
        return;
      }
      
      const user = await UserRepository.update(parseInt(id), { status });
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
      const { status } = ctx.request.body;
      
      if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        Response.error(ctx, "状态值无效", -1, 400);
        return;
      }
      
      const order = await OrderRepository.updateStatus(parseInt(id), status);
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
}

module.exports = new AdminController(); 