const path = require("path");
const fs = require("fs");
const multer = require("@koa/multer");
const sharp = require("sharp");
const config = require("../config");

// 设置存储方式
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // 对中文等特殊字符进行 URL 编码
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// 过滤文件类型和大小
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"));
    }
  },
});

// 压缩图片中间件（仅对图片类型处理）
async function compressImage(ctx, next) {
  if (ctx.file && config.upload.allowedTypes.includes(ctx.file.mimetype)) {
    const filePath = ctx.file.path;
    const ext = path.extname(ctx.file.filename).toLowerCase();
    const outputPath = filePath; // 覆盖原图
    try {
      // 只对jpg/png/webp压缩，gif不压缩
      if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        await sharp(filePath)
          .resize({ width: 1200, withoutEnlargement: true }) // 限宽1200px
          .toFormat(ext === ".png" ? "png" : "jpeg", { quality: 80 })
          .toFile(outputPath + ".tmp");
        fs.renameSync(outputPath + ".tmp", outputPath);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("图片压缩失败:", err);
    }
  }
  await next();
}

module.exports = { upload, compressImage };
