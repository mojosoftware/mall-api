const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const Product = require('../models/Product');

class OrderRepository {
  async create(orderData) {
    return await Order.create(orderData);
  }

  async findById(id) {
    return await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user' }
      ]
    });
  }

  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    const where = { userId };
    if (status) {
      where.status = status;
    }

    return await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  async findAll(options = {}) {
    const { page = 1, limit = 10, status, userId } = options;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }

    return await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user' },
        { model: OrderItem, as: 'items' }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  async update(id, updateData) {
    const order = await Order.findByPk(id);
    if (!order) return null;
    return await order.update(updateData);
  }

  async updateStatus(id, status) {
    const order = await Order.findByPk(id);
    if (!order) return null;
    return await order.update({ status });
  }

  async createOrderItems(orderId, items) {
    return await OrderItem.bulkCreate(
      items.map(item => ({ ...item, orderId }))
    );
  }
}

module.exports = new OrderRepository(); 