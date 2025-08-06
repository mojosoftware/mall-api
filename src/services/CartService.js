const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');

class CartService {
  async getCart(userId) {
    return await CartRepository.findByUserId(userId);
  }

  async addToCart(userId, productId, quantity = 1) {
    // 验证商品是否存在
    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw new Error('商品不存在');
    }
    
    if (product.status !== 'active') {
      throw new Error('商品已下架');
    }
    
    if (product.stock < quantity) {
      throw new Error('商品库存不足');
    }
    
    // 检查购物车是否已有此商品
    const existingCart = await CartRepository.findByUserIdAndProductId(userId, productId);
    
    if (existingCart) {
      // 更新数量
      const newQuantity = existingCart.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new Error('商品库存不足');
      }
      return await CartRepository.update(existingCart.id, { quantity: newQuantity });
    } else {
      // 新增购物车项
      return await CartRepository.create({
        userId,
        productId,
        quantity
      });
    }
  }

  async updateCartItem(userId, itemId, quantity) {
    const cartItem = await CartRepository.findById(itemId);
    if (!cartItem) {
      throw new Error('购物车项不存在');
    }
    
    if (cartItem.userId !== userId) {
      throw new Error('无权操作此购物车项');
    }
    
    // 验证库存
    const product = await ProductRepository.findById(cartItem.productId);
    if (product.stock < quantity) {
      throw new Error('商品库存不足');
    }
    
    return await CartRepository.update(itemId, { quantity });
  }

  async removeFromCart(userId, itemId) {
    const cartItem = await CartRepository.findById(itemId);
    if (!cartItem) {
      throw new Error('购物车项不存在');
    }
    
    if (cartItem.userId !== userId) {
      throw new Error('无权操作此购物车项');
    }
    
    return await CartRepository.delete(itemId);
  }

  async clearCart(userId) {
    return await CartRepository.deleteByUserId(userId);
  }

  async getCartCount(userId) {
    return await CartRepository.getCartCount(userId);
  }
}

module.exports = new CartService(); 