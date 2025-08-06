const CategoryRepository = require('../repositories/CategoryRepository');

class CategoryService {
  async createCategory(categoryData) {
    return await CategoryRepository.create(categoryData);
  }

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new Error('分类不存在');
    }
    return category;
  }

  async getCategories(options = {}) {
    return await CategoryRepository.findAll(options);
  }

  async updateCategory(id, updateData) {
    const category = await CategoryRepository.update(id, updateData);
    if (!category) {
      throw new Error('分类不存在');
    }
    return category;
  }

  async deleteCategory(id) {
    try {
      const result = await CategoryRepository.delete(id);
      if (!result) {
        throw new Error('分类不存在');
      }
      return result;
    } catch (error) {
      if (error.message.includes('还有商品')) {
        throw new Error('该分类下还有商品，无法删除');
      }
      throw error;
    }
  }

  async getCategoryWithProducts(id) {
    const category = await CategoryRepository.getCategoryWithProducts(id);
    if (!category) {
      throw new Error('分类不存在');
    }
    return category;
  }
}

module.exports = new CategoryService(); 