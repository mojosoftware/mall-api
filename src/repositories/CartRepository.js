const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartRepository {
  async findByUserId(userId) {
    return await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: 'product' }],
      order: [['createdAt', 'DESC']]
    });
  }

  async findByUserIdAndProductId(userId, productId) {
    return await Cart.findOne({
      where: { userId, productId }
    });
  }

  async create(cartData) {
    return await Cart.create(cartData);
  }

  async update(id, updateData) {
    const cart = await Cart.findByPk(id);
    if (!cart) return null;
    return await cart.update(updateData);
  }

  async delete(id) {
    const cart = await Cart.findByPk(id);
    if (!cart) return false;
    await cart.destroy();
    return true;
  }

  async deleteByUserId(userId) {
    return await Cart.destroy({ where: { userId } });
  }

  async deleteByUserIdAndProductId(userId, productId) {
    return await Cart.destroy({ 
      where: { userId, productId } 
    });
  }

  async getCartCount(userId) {
    return await Cart.count({ where: { userId } });
  }
}

module.exports = new CartRepository(); 