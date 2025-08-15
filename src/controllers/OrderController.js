const Joi = require('joi');
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
    const schema = Joi.object({
      items: Joi.array().items(
        Joi.object({
          productId: Joi.number().integer().positive().required(),
          quantity: Joi.number().integer().positive().required()
        })
      ).min(1).required(),
      address: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        province: Joi.string().required(),
        city: Joi.string().required(),
        district: Joi.string().required(),
        detail: Joi.string().required()
      }).required(),
      paymentMethod: Joi.string().optional(),
      remark: Joi.string().optional()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const order = await OrderService.createOrder(ctx.state.user.id, value);
      Response.success(ctx, order, "创建订单成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updateOrderStatus(ctx) {
    const schema = Joi.object({
      status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').required()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const { id } = ctx.params;
      const order = await OrderService.updateOrderStatus(parseInt(id), value.status);
      Response.success(ctx, order, "更新订单状态成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }
}

module.exports = new OrderController(); 