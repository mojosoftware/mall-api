const Router = require("@koa/router");
const { uploadMiddlewares, compressImage, deleteFile, getFileInfo } = require("../middleware/upload");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { createRateLimiter } = require("../middleware/rateLimiter");
const Response = require("../utils/response");
const logger = require("../utils/logger");

const router = new Router();

// 通用文件上传接口
router.post(
  "/api/upload",
  authMiddleware,
  createRateLimiter('upload'),
  uploadMiddlewares.singleImage,
  compressImage,
  async (ctx) => {
    if (!ctx.file) {
      Response.error(ctx, "未检测到上传文件", -1, 400);
      return;
    }
    
    logger.info('文件上传成功', {
      filename: ctx.file.filename,
      originalName: ctx.file.originalname,
      size: ctx.file.size,
      mimetype: ctx.file.mimetype,
      userId: ctx.state.user.id
    });
    
    Response.success(ctx, {
      url: `/uploads/${ctx.file.filename}`,
      filename: ctx.file.filename,
      originalName: ctx.file.originalname,
      size: ctx.file.size,
      mimetype: ctx.file.mimetype
    }, "文件上传成功");
  }
);

// 头像上传接口
router.post(
  "/api/upload/avatar",
  authMiddleware,
  createRateLimiter('upload'),
  uploadMiddlewares.avatar,
  compressImage,
  async (ctx) => {
    if (!ctx.file) {
      Response.error(ctx, "未检测到头像文件", -1, 400);
      return;
    }
    
    Response.success(ctx, {
      url: `/uploads/avatars/${ctx.file.filename}`,
      filename: ctx.file.filename
    }, "头像上传成功");
  }
);

// 商品图片上传接口
router.post(
  "/api/upload/product",
  authMiddleware,
  adminAuth,
  createRateLimiter('upload'),
  uploadMiddlewares.productImage,
  compressImage,
  async (ctx) => {
    if (!ctx.file) {
      Response.error(ctx, "未检测到商品图片", -1, 400);
      return;
    }
    
    Response.success(ctx, {
      url: `/uploads/products/${ctx.file.filename}`,
      filename: ctx.file.filename
    }, "商品图片上传成功");
  }
);

// 多文件上传接口
router.post(
  "/api/upload/multiple",
  authMiddleware,
  createRateLimiter('upload'),
  uploadMiddlewares.multipleImages,
  compressImage,
  async (ctx) => {
    if (!ctx.files || ctx.files.length === 0) {
      Response.error(ctx, "未检测到上传文件", -1, 400);
      return;
    }
    
    const files = ctx.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    Response.success(ctx, { files }, `成功上传 ${files.length} 个文件`);
  }
);

// 文件删除接口
router.delete(
  "/api/upload/:filename",
  authMiddleware,
  createRateLimiter('upload'),
  async (ctx) => {
    const { filename } = ctx.params;
    
    if (!filename) {
      Response.error(ctx, "文件名不能为空", -1, 400);
      return;
    }
    
    const filePath = `/uploads/${filename}`;
    const success = await deleteFile(filePath);
    
    if (success) {
      logger.info('用户删除文件', {
        filename,
        userId: ctx.state.user.id
      });
      Response.success(ctx, null, "文件删除成功");
    } else {
      Response.error(ctx, "文件删除失败或文件不存在", -1, 404);
    }
  }
);

// 文件信息查询接口
router.get(
  "/api/upload/:filename/info",
  authMiddleware,
  async (ctx) => {
    const { filename } = ctx.params;
    
    if (!filename) {
      Response.error(ctx, "文件名不能为空", -1, 400);
      return;
    }
    
    const filePath = `/uploads/${filename}`;
    const fileInfo = getFileInfo(filePath);
    
    if (fileInfo.exists) {
      Response.success(ctx, {
        filename,
        ...fileInfo
      }, "获取文件信息成功");
    } else {
      Response.error(ctx, "文件不存在", -1, 404);
    }
  }
);
module.exports = router;
