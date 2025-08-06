const Product = require('../models/Product');
const Category = require('../models/Category');
const { Op } = require('sequelize');

class ProductRepository {
  async create(productData) {
    return await Product.create(productData);
  }

  async findById(id) {
    return await Product.findByPk(id, {
      include: [{ model: Category, as: 'category' }]
    });
  }

  async findAll(options = {}) {
    const { page = 1, limit = 10, search, categoryId, status } = options;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (status) {
      where.status = status;
    }

    return await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  async update(id, updateData) {
    const product = await Product.findByPk(id);
    if (!product) return null;
    return await product.update(updateData);
  }

  async delete(id) {
    const product = await Product.findByPk(id);
    if (!product) return false;
    await product.destroy();
    return true;
  }

  async updateStock(id, quantity) {
    const product = await Product.findByPk(id);
    if (!product) return null;
    
    const newStock = product.stock - quantity;
    if (newStock < 0) {
      throw new Error('库存不足');
    }
    
    return await product.update({ stock: newStock });
  }

  async getHotProducts(limit = 10) {
    return await Product.findAll({
      where: { status: 'active' },
      order: [['sales', 'DESC']],
      limit
    });
  }
}

module.exports = new ProductRepository(); 