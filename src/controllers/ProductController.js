const Joi = require('joi');
const ProductService = require('../services/ProductService');

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
      ctx.body = {
        success: true,
        data: {
          products: result.rows,
          total: result.count,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(result.count / options.limit)
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getProductById(ctx) {
    try {
      const { id } = ctx.params;
      const product = await ProductService.getProductById(parseInt(id));
      ctx.body = { success: true, data: product };
    } catch (err) {
      ctx.status = 404;
      ctx.body = { success: false, message: err.message };
    }
  }

  async createProduct(ctx) {
    const schema = Joi.object({
      name: Joi.string().min(1).max(200).required(),
      description: Joi.string().optional(),
      price: Joi.number().positive().required(),
      originalPrice: Joi.number().positive().optional(),
      stock: Joi.number().integer().min(0).required(),
      categoryId: Joi.number().integer().positive().required(),
      images: Joi.array().items(Joi.string()).optional(),
      status: Joi.string().valid('active', 'inactive').optional()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const product = await ProductService.createProduct(value);
      ctx.status = 201;
      ctx.body = { success: true, data: product };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async updateProduct(ctx) {
    const schema = Joi.object({
      name: Joi.string().min(1).max(200).optional(),
      description: Joi.string().optional(),
      price: Joi.number().positive().optional(),
      originalPrice: Joi.number().positive().optional(),
      stock: Joi.number().integer().min(0).optional(),
      categoryId: Joi.number().integer().positive().optional(),
      images: Joi.array().items(Joi.string()).optional(),
      status: Joi.string().valid('active', 'inactive').optional()
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.details[0].message };
      return;
    }

    try {
      const { id } = ctx.params;
      const product = await ProductService.updateProduct(parseInt(id), value);
      ctx.body = { success: true, data: product };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async deleteProduct(ctx) {
    try {
      const { id } = ctx.params;
      await ProductService.deleteProduct(parseInt(id));
      ctx.body = { success: true, message: '商品删除成功' };
    } catch (err) {
      ctx.status = 400;
      ctx.body = { success: false, message: err.message };
    }
  }

  async getHotProducts(ctx) {
    try {
      const { limit } = ctx.query;
      const products = await ProductService.getHotProducts(parseInt(limit) || 10);
      ctx.body = { success: true, data: products };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  }
}

module.exports = new ProductController(); 