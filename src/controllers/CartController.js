const Joi = require('joi');
const CartService = require('../services/CartService');

class CartController {
  async getCart(ctx) {
    try {
      const cart = await CartService.getCart(ctx.state.user.id);
      ctx.body = { success: true, data: cart };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async addToCart(ctx) {
    const schema = Joi.object({
      productId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().default(1)
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const cartItem = await CartService.addToCart(
        ctx.state.user.id,
        value.productId,
        value.quantity
      );
      ctx.body = { success: true, data: cartItem };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateCartItem(ctx) {
    const schema = Joi.object({
      quantity: Joi.number().integer().positive().required()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const { itemId } = ctx.params;
      const cartItem = await CartService.updateCartItem(
        ctx.state.user.id,
        parseInt(itemId),
        value.quantity
      );
      ctx.body = { success: true, data: cartItem };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async removeFromCart(ctx) {
    try {
      const { itemId } = ctx.params;
      await CartService.removeFromCart(ctx.state.user.id, parseInt(itemId));
      ctx.body = { success: true, message: '商品已从购物车移除' };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async clearCart(ctx) {
    try {
      await CartService.clearCart(ctx.state.user.id);
      ctx.body = { success: true, message: '购物车已清空' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getCartCount(ctx) {
    try {
      const count = await CartService.getCartCount(ctx.state.user.id);
      ctx.body = { success: true, data: { count } };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new CartController(); 