const Joi = require('joi');
const CartService = require('../services/CartService');
const Response = require('../utils/response');

class CartController {
  async getCart(ctx) {
    try {
      const cart = await CartService.getCart(ctx.state.user.id);
      Response.success(ctx, cart, "获取购物车成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async addToCart(ctx) {
    const schema = Joi.object({
      productId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().default(1)
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const cartItem = await CartService.addToCart(
        ctx.state.user.id,
        value.productId,
        value.quantity
      );
      Response.success(ctx, cartItem, "添加到购物车成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updateCartItem(ctx) {
    const schema = Joi.object({
      quantity: Joi.number().integer().positive().required()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      Response.error(ctx, error.details[0].message, -1, 400);
      return;
    }

    try {
      const { itemId } = ctx.params;
      const cartItem = await CartService.updateCartItem(
        ctx.state.user.id,
        parseInt(itemId),
        value.quantity
      );
      Response.success(ctx, cartItem, "更新购物车成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async removeFromCart(ctx) {
    try {
      const { itemId } = ctx.params;
      await CartService.removeFromCart(ctx.state.user.id, parseInt(itemId));
      Response.success(ctx, null, "商品已从购物车移除");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async clearCart(ctx) {
    try {
      await CartService.clearCart(ctx.state.user.id);
      Response.success(ctx, null, "购物车已清空");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getCartCount(ctx) {
    try {
      const count = await CartService.getCartCount(ctx.state.user.id);
      Response.success(ctx, { count }, "获取购物车数量成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }
}

module.exports = new CartController();