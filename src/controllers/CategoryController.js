const CategoryService = require('../services/CategoryService');
const Response = require('../utils/response');

class CategoryController {
  async getCategories(ctx) {
    try {
      const { status } = ctx.query;
      const categories = await CategoryService.getCategories({ status });
      Response.success(ctx, categories, "获取分类列表成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getCategoryById(ctx) {
    try {
      const { id } = ctx.params;
      const category = await CategoryService.getCategoryById(parseInt(id));
      Response.success(ctx, category, "获取分类详情成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async createCategory(ctx) {
    try {
      const category = await CategoryService.createCategory(ctx.request.body);
      Response.success(ctx, category, "创建分类成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updateCategory(ctx) {
    try {
      const { id } = ctx.params;
      const category = await CategoryService.updateCategory(parseInt(id), ctx.request.body);
      Response.success(ctx, category, "更新分类成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async deleteCategory(ctx) {
    try {
      const { id } = ctx.params;
      await CategoryService.deleteCategory(parseInt(id));
      Response.success(ctx, null, "分类删除成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async getCategoryWithProducts(ctx) {
    try {
      const { id } = ctx.params;
      const category = await CategoryService.getCategoryWithProducts(parseInt(id));
      Response.success(ctx, category, "获取分类及商品成功");
    } catch (err) {
      Response.error(ctx, err.message, -1, 404);
    }
  }
}

module.exports = new CategoryController(); 