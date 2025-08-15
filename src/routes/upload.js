const Router = require("@koa/router");
const { upload, compressImage } = require("../middleware/upload");
const authMiddleware = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");
const Response = require("../utils/response");

const router = new Router();

// 上传图片接口
router.post(
  "/api/upload",
  authMiddleware,
  createRateLimiter('upload'),
  upload.single("file"),
  compressImage,
  async (ctx) => {
    // multer 挂载单文件到 ctx.file
    if (!ctx.file) {
      Response.error(ctx, "未检测到上传文件", -1, 400);
      return;
    }
    Response.success(ctx, {
      url: `/api/uploads/${ctx.file.filename}`,
    }, "文件上传成功");
  }
);
module.exports = router;
