const OrderService = require('../services/OrderService');
const Response = require('../utils/response');

class OrderController {
  async getOrders(ctx) {
    try {
      const { page, limit, status } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status
      };
      
      const result = await OrderService.getOrdersByUserId(ctx.state.user.id, options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取订单列表成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getOrderById(ctx) {
    try {
      const { id } = ctx.params;
      const order = await OrderService.getOrderById(parseInt(id), ctx.state.user.id);
      Response.success(ctx, order, "获取订单详情成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async createOrder(ctx) {
    try {
      const order = await OrderService.createOrder(ctx.state.user.id, ctx.request.body);
      Response.success(ctx, order, "创建订单成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updateOrderStatus(ctx) {
    try {
      const { id } = ctx.params;
      const order = await OrderService.updateOrderStatus(parseInt(id), ctx.request.body.status);
      Response.success(ctx, order, "更新订单状态成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }
}

module.exports = new OrderController(); 