const Category = require('../models/Category');
const Product = require('../models/Product');

class CategoryRepository {
  async create(categoryData) {
    return await Category.create(categoryData);
  }

  async findById(id) {
    return await Category.findByPk(id);
  }

  async findAll(options = {}) {
    const { status } = options;
    const where = {};
    
    if (status) {
      where.status = status;
    }

    return await Category.findAll({
      where,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']]
    });
  }

  async update(id, updateData) {
    const category = await Category.findByPk(id);
    if (!category) return null;
    return await category.update(updateData);
  }

  async delete(id) {
    const category = await Category.findByPk(id);
    if (!category) return false;
    
    // 检查是否有商品使用此分类
    const productCount = await Product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new Error('该分类下还有商品，无法删除');
    }
    
    await category.destroy();
    return true;
  }

  async getCategoryWithProducts(id) {
    return await Category.findByPk(id, {
      include: [{ model: Product, as: 'products' }]
    });
  }
}

module.exports = new CategoryRepository(); 