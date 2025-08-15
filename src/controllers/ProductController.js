const ProductService = require('../services/ProductService');
const Response = require('../utils/response');

class ProductController {
  async getProducts(ctx) {
    try {
      const { page, limit, search, categoryId, status } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        status
      };
      
      const result = await ProductService.getProducts(options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取商品列表成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getProductById(ctx) {
    try {
      const { id } = ctx.params;
      const product = await ProductService.getProductById(parseInt(id));
      Response.success(ctx, product, "获取商品详情成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async createProduct(ctx) {
    try {
      const product = await ProductService.createProduct(ctx.request.body);
      Response.success(ctx, product, "创建商品成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updateProduct(ctx) {
    try {
      const { id } = ctx.params;
      const product = await ProductService.updateProduct(parseInt(id), ctx.request.body);
      Response.success(ctx, product, "更新商品成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async deleteProduct(ctx) {
    try {
      const { id } = ctx.params;
      await ProductService.deleteProduct(parseInt(id));
      Response.success(ctx, null, "商品删除成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async getHotProducts(ctx) {
    try {
      const { limit } = ctx.query;
      const products = await ProductService.getHotProducts(parseInt(limit) || 10);
      Response.success(ctx, products, "获取热门商品成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }
}

module.exports = new ProductController(); 