const Joi = require('joi');
const CategoryService = require('../services/CategoryService');

class CategoryController {
  async getCategories(ctx) {
    try {
      const { status } = ctx.query;
      const categories = await CategoryService.getCategories({ status });
      ctx.body = { success: true, data: categories };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getCategoryById(ctx) {
    try {
      const { id } = ctx.params;
      const category = await CategoryService.getCategoryById(parseInt(id));
      ctx.body = { success: true, data: category };
    } catch (err) {
      ctx.status = 404;
      ctx.body = { success: false, message: err.message };
    }
  }

  async createCategory(ctx) {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string().optional(),
      image: Joi.string().optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      sort: Joi.number().integer().optional()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const category = await CategoryService.createCategory(value);
      ctx.status = 201;
      ctx.body = { success: true, data: category };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateCategory(ctx) {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      description: Joi.string().optional(),
      image: Joi.string().optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      sort: Joi.number().integer().optional()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const { id } = ctx.params;
      const category = await CategoryService.updateCategory(parseInt(id), value);
      ctx.body = { success: true, data: category };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async deleteCategory(ctx) {
    try {
      const { id } = ctx.params;
      await CategoryService.deleteCategory(parseInt(id));
      ctx.body = { success: true, message: '分类删除成功' };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getCategoryWithProducts(ctx) {
    try {
      const { id } = ctx.params;
      const category = await CategoryService.getCategoryWithProducts(parseInt(id));
      ctx.body = { success: true, data: category };
    } catch (err) {
      ctx.status = 404;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new CategoryController(); 