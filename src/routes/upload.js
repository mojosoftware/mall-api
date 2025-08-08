const Router = require("@koa/router");
const { upload, compressImage } = require("../middleware/upload");
const authMiddleware = require("../middleware/auth");

const router = new Router();

// 上传图片接口
router.post(
  "/api/upload",
  authMiddleware,
  upload.single("file"),
  compressImage,
  async (ctx) => {
    // multer 挂载单文件到 ctx.file
    if (!ctx.file) {
      ctx.status = 400;
      ctx.body = { success: false, message: "未检测到上传文件" };
      return;
    }
    ctx.body = {
      success: true,
      url: `/uploads/${ctx.file.filename}`,
    };
  }
);
module.exports = router;
