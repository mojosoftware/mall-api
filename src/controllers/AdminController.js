const UserRepository = require('../repositories/UserRepository');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');

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
      ctx.body = {
        success: true,
        data: {
          users: result.rows,
          total: result.count,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(result.count / options.limit)
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateUserStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;
      
      if (!['active', 'inactive'].includes(status)) {
        ctx.status = 400;
        ctx.body = { success: false, message: '状态值无效' };
        return;
      }
      
      const user = await UserRepository.update(parseInt(id), { status });
      if (!user) {
        ctx.status = 404;
        ctx.body = { success: false, message: '用户不存在' };
        return;
      }
      
      ctx.body = { success: true, data: user };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
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
      ctx.body = {
        success: true,
        data: {
          orders: result.rows,
          total: result.count,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(result.count / options.limit)
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateOrderStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;
      
      if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        ctx.status = 400;
        ctx.body = { success: false, message: '状态值无效' };
        return;
      }
      
      const order = await OrderRepository.updateStatus(parseInt(id), status);
      if (!order) {
        ctx.status = 404;
        ctx.body = { success: false, message: '订单不存在' };
        return;
      }
      
      ctx.body = { success: true, data: order };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
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
      
      ctx.body = {
        success: true,
        data: {
          userCount,
          productCount,
          orderCount,
          todayOrderCount
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new AdminController(); 