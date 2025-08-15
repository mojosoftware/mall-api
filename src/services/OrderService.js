const OrderRepository = require('../repositories/OrderRepository');
const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/mailer');
const UserRepository = require('../repositories/UserRepository');

class OrderService {
  async createOrder(userId, orderData) {
    const { items, address, paymentMethod, remark } = orderData;
    
    // 验证商品库存
    for (const item of items) {
      const product = await ProductRepository.findById(item.productId);
      if (!product) {
        throw new Error(`商品 ${item.productId} 不存在`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`商品 ${product.name} 库存不足`);
      }
    }
    
    // 计算总金额
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await ProductRepository.findById(item.productId);
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productImage: product.images ? product.images[0] : null,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });
    }
    
    // 创建订单
    const order = await OrderRepository.create({
      userId,
      totalAmount,
      address,
      paymentMethod,
      remark
    });
    
    // 创建订单项
    await OrderRepository.createOrderItems(order.id, orderItems);
    
    // 更新库存
    for (const item of items) {
      await ProductRepository.updateStock(item.productId, item.quantity);
    }
    
    // 清空购物车
    for (const item of items) {
      await CartRepository.deleteByUserIdAndProductId(userId, item.productId);
    }
    
    const createdOrder = await OrderRepository.findById(order.id);
    
    // 发送订单确认邮件
    try {
      const user = await UserRepository.findById(userId);
      if (user && user.email) {
        await sendOrderConfirmation(user.email, {
          username: user.username,
          orderNo: createdOrder.orderNo,
          totalAmount: createdOrder.totalAmount,
          items: createdOrder.items,
          address: createdOrder.address,
          createdAt: createdOrder.createdAt
        });
      }
    } catch (emailError) {
      // 邮件发送失败不影响订单创建
      logger.warn('发送订单确认邮件失败', { 
        orderId: createdOrder.id,
        error: emailError.message 
      });
    }
    
    return createdOrder;
  }

  async getOrderById(id, userId) {
    const order = await OrderRepository.findById(id);
    if (!order) {
      throw new Error('订单不存在');
    }
    
    // 检查权限
    if (order.userId !== userId) {
      throw new Error('无权访问此订单');
    }
    
    return order;
  }

  async getOrdersByUserId(userId, options = {}) {
    return await OrderRepository.findByUserId(userId, options);
  }

  async getAllOrders(options = {}) {
    return await OrderRepository.findAll(options);
  }

  async updateOrderStatus(id, status) {
    const oldOrder = await OrderRepository.findById(id);
    if (!oldOrder) {
      throw new Error('订单不存在');
    }
    
    const order = await OrderRepository.updateStatus(id, status);
    if (!order) {
      throw new Error('订单不存在');
    }
    
    // 发送订单状态更新邮件
    try {
      const user = await UserRepository.findById(order.userId);
      if (user && user.email && oldOrder.status !== status) {
        await sendOrderStatusUpdate(user.email, {
          username: user.username,
          orderNo: order.orderNo,
          status: status
        });
      }
    } catch (emailError) {
      logger.warn('发送订单状态更新邮件失败', { 
        orderId: id,
        error: emailError.message 
      });
    }
    
    return order;
  }
}

module.exports = new OrderService(); 
 