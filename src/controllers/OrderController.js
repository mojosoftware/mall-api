const Joi = require('joi');
const OrderService = require('../services/OrderService');

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

  async getOrderById(ctx) {
    try {
      const { id } = ctx.params;
      const order = await OrderService.getOrderById(parseInt(id), ctx.state.user.id);
      ctx.body = { success: true, data: order };
    } catch (err) {
      ctx.status = 404;
      ctx.body = { success: false, message: err.message };
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
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const order = await OrderService.createOrder(ctx.state.user.id, value);
      ctx.status = 201;
      ctx.body = { success: true, data: order };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateOrderStatus(ctx) {
    const schema = Joi.object({
      status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').required()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const { id } = ctx.params;
      const order = await OrderService.updateOrderStatus(parseInt(id), value.status);
      ctx.body = { success: true, data: order };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new OrderController(); 