const ProductRepository = require('../repositories/ProductRepository');
const CategoryRepository = require('../repositories/CategoryRepository');

class ProductService {
  async createProduct(productData) {
    // 验证分类是否存在
    const category = await CategoryRepository.findById(productData.categoryId);
    if (!category) {
      throw new Error('分类不存在');
    }
    
    return await ProductRepository.create(productData);
  }

  async getProductById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new Error('商品不存在');
    }
    return product;
  }

  async getProducts(options = {}) {
    return await ProductRepository.findAll(options);
  }

  async updateProduct(id, updateData) {
    if (updateData.categoryId) {
      const category = await CategoryRepository.findById(updateData.categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
    }
    
    const product = await ProductRepository.update(id, updateData);
    if (!product) {
      throw new Error('商品不存在');
    }
    return product;
  }

  async deleteProduct(id) {
    const result = await ProductRepository.delete(id);
    if (!result) {
      throw new Error('商品不存在');
    }
    return result;
  }

  async getHotProducts(limit = 10) {
    return await ProductRepository.getHotProducts(limit);
  }

  async updateStock(id, quantity) {
    return await ProductRepository.updateStock(id, quantity);
  }
}

module.exports = new ProductService(); 