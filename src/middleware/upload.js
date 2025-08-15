const path = require("path");
const fs = require("fs");
const multer = require("@koa/multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const logger = require("../utils/logger");
const Response = require("../utils/response");

// 文件类型配置
const FILE_TYPES = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    compress: true
  },
  document: {
    mimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    extensions: [".pdf", ".doc", ".docx"],
    maxSize: 10 * 1024 * 1024, // 10MB
    compress: false
  },
  video: {
    mimeTypes: ["video/mp4", "video/avi", "video/mov"],
    extensions: [".mp4", ".avi", ".mov"],
    maxSize: 50 * 1024 * 1024, // 50MB
    compress: false
  }
};

// 创建上传目录
function ensureUploadDir(subDir = '') {
  const uploadDir = path.join(__dirname, "../../public/uploads", subDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info('创建上传目录', { path: uploadDir });
  }
  return uploadDir;
}

// 生成文件名
function generateFileName(originalName, userId = null) {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = uuidv4();
  const timestamp = Date.now();
  const userPrefix = userId ? `user${userId}_` : '';
  return `${userPrefix}${timestamp}_${uuid}${ext}`;
}

// 文件类型检查
function getFileType(mimetype) {
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(mimetype)) {
      return type;
    }
  }
  return null;
}

// 文件大小检查
function checkFileSize(size, fileType) {
  const maxSize = FILE_TYPES[fileType]?.maxSize || config.upload.maxSize;
  return size <= maxSize;
}

// 文件扩展名检查
function checkFileExtension(filename, fileType) {
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = FILE_TYPES[fileType]?.extensions || [];
  return allowedExts.includes(ext);
}

// 创建存储配置
function createStorage(options = {}) {
  const { subDir = '', fileType = 'image' } = options;
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = ensureUploadDir(subDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      try {
        // 文件名安全检查
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const userId = req.ctx?.state?.user?.id;
        const filename = generateFileName(originalName, userId);
        
        logger.info('生成上传文件名', {
          original: originalName,
          generated: filename,
          userId: userId,
          mimetype: file.mimetype
        });
        
        cb(null, filename);
      } catch (error) {
        logger.error('文件名生成失败', { error: error.message, originalName: file.originalname });
        cb(error);
      }
    },
  });
}

// 文件过滤器
function createFileFilter(options = {}) {
  const { fileType = 'image', allowedTypes = null } = options;
  
  return (req, file, cb) => {
    try {
      const ctx = req.ctx;
      
      // 检查文件类型
      const detectedType = getFileType(file.mimetype);
      if (!detectedType) {
        logger.warn('不支持的文件类型', {
          mimetype: file.mimetype,
          originalName: file.originalname,
          userId: ctx?.state?.user?.id,
          ip: ctx?.ip
        });
        return cb(new Error(`不支持的文件类型: ${file.mimetype}`));
      }
      
      // 检查是否为允许的类型
      const allowedFileTypes = allowedTypes || [fileType];
      if (!allowedFileTypes.includes(detectedType)) {
        logger.warn('文件类型不被允许', {
          detectedType,
          allowedTypes: allowedFileTypes,
          originalName: file.originalname,
          userId: ctx?.state?.user?.id
        });
        return cb(new Error(`只允许上传 ${allowedFileTypes.join(', ')} 类型的文件`));
      }
      
      // 检查文件扩展名
      if (!checkFileExtension(file.originalname, detectedType)) {
        logger.warn('文件扩展名不匹配', {
          originalName: file.originalname,
          detectedType,
          userId: ctx?.state?.user?.id
        });
        return cb(new Error('文件扩展名与文件类型不匹配'));
      }
      
      // 将文件类型附加到文件对象
      file.detectedType = detectedType;
      cb(null, true);
    } catch (error) {
      logger.error('文件过滤器错误', { error: error.message });
      cb(error);
    }
  };
}

// 创建上传中间件
function createUploadMiddleware(options = {}) {
  const {
    fieldName = 'file',
    maxFiles = 1,
    fileType = 'image',
    subDir = '',
    allowedTypes = null,
    maxSize = null
  } = options;
  
  const storage = createStorage({ subDir, fileType });
  const fileFilter = createFileFilter({ fileType, allowedTypes });
  
  // 动态计算文件大小限制
  const limits = {
    fileSize: maxSize || FILE_TYPES[fileType]?.maxSize || config.upload.maxSize,
    files: maxFiles
  };
  
  const upload = multer({
    storage,
    fileFilter,
    limits
  });
  
  // 返回适配的中间件
  return async (ctx, next) => {
    // 将 ctx 附加到 req 对象，供 multer 回调使用
    ctx.req.ctx = ctx;
    
    try {
      // 根据上传类型选择处理方式
      let uploadHandler;
      if (maxFiles === 1) {
        uploadHandler = upload.single(fieldName);
      } else {
        uploadHandler = upload.array(fieldName, maxFiles);
      }
      
      await new Promise((resolve, reject) => {
        uploadHandler(ctx.req, ctx.res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // 将文件信息附加到 ctx
      ctx.file = ctx.req.file;
      ctx.files = ctx.req.files;
      
      await next();
    } catch (error) {
      // 处理上传错误
      if (error instanceof multer.MulterError) {
        let message = '文件上传失败';
        switch (error.code) {
          case 'LIMIT_FILE_SIZE':
            message = `文件大小超过限制 (${Math.round(limits.fileSize / 1024 / 1024)}MB)`;
            break;
          case 'LIMIT_FILE_COUNT':
            message = `文件数量超过限制 (最多${maxFiles}个)`;
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            message = `意外的文件字段: ${error.field}`;
            break;
          default:
            message = error.message;
        }
        
        logger.warn('文件上传失败', {
          error: error.code,
          message: error.message,
          userId: ctx.state.user?.id,
          ip: ctx.ip
        });
        
        Response.error(ctx, message, -1, 400);
        return;
      }
      
      logger.error('文件上传异常', {
        error: error.message,
        stack: error.stack,
        userId: ctx.state.user?.id,
        ip: ctx.ip
      });
      
      Response.error(ctx, error.message || '文件上传失败', -1, 400);
    }
  };
}

// 图片压缩中间件
async function compressImage(ctx, next) {
  if (ctx.file && ctx.file.detectedType === 'image') {
    const filePath = ctx.file.path;
    const ext = path.extname(ctx.file.filename).toLowerCase();
    
    try {
      // 只对特定格式进行压缩
      if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        const tempPath = filePath + ".tmp";
        
        await sharp(filePath)
          .resize({ 
            width: 1200, 
            height: 1200, 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 80, progressive: true })
          .png({ quality: 80, compressionLevel: 8 })
          .webp({ quality: 80 })
          .toFile(tempPath);
        
        // 检查压缩后的文件大小
        const originalStats = fs.statSync(filePath);
        const compressedStats = fs.statSync(tempPath);
        
        // 如果压缩后文件更小，则替换原文件
        if (compressedStats.size < originalStats.size) {
          fs.renameSync(tempPath, filePath);
          logger.info('图片压缩成功', {
            filename: ctx.file.filename,
            originalSize: originalStats.size,
            compressedSize: compressedStats.size,
            reduction: Math.round((1 - compressedStats.size / originalStats.size) * 100) + '%'
          });
        } else {
          // 删除压缩后的文件，保留原文件
          fs.unlinkSync(tempPath);
          logger.info('图片压缩跳过', {
            filename: ctx.file.filename,
            reason: '压缩后文件更大'
          });
        }
      }
    } catch (err) {
      logger.error('图片压缩失败', {
        filename: ctx.file.filename,
        error: err.message
      });
      // 压缩失败不影响上传流程
    }
  }
  
  await next();
}

// 文件删除工具
async function deleteFile(filePath) {
  try {
    const fullPath = path.join(__dirname, "../../public", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info('文件删除成功', { path: filePath });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('文件删除失败', { path: filePath, error: error.message });
    return false;
  }
}

// 获取文件信息
function getFileInfo(filePath) {
  try {
    const fullPath = path.join(__dirname, "../../public", filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    }
    return { exists: false };
  } catch (error) {
    logger.error('获取文件信息失败', { path: filePath, error: error.message });
    return { exists: false, error: error.message };
  }
}

// 预定义的上传中间件
const uploadMiddlewares = {
  // 单个图片上传
  singleImage: createUploadMiddleware({
    fieldName: 'file',
    fileType: 'image',
    maxFiles: 1
  }),
  
  // 多个图片上传
  multipleImages: createUploadMiddleware({
    fieldName: 'files',
    fileType: 'image',
    maxFiles: 5
  }),
  
  // 头像上传
  avatar: createUploadMiddleware({
    fieldName: 'avatar',
    fileType: 'image',
    subDir: 'avatars',
    maxSize: 2 * 1024 * 1024 // 2MB
  }),
  
  // 商品图片上传
  productImage: createUploadMiddleware({
    fieldName: 'image',
    fileType: 'image',
    subDir: 'products',
    maxFiles: 1
  }),
  
  // 文档上传
  document: createUploadMiddleware({
    fieldName: 'document',
    fileType: 'document',
    subDir: 'documents'
  })
};

module.exports = {
  // 主要导出
  createUploadMiddleware,
  compressImage,
  uploadMiddlewares,
  
  // 工具函数
  deleteFile,
  getFileInfo,
  ensureUploadDir,
  
  // 向后兼容
  upload: uploadMiddlewares.singleImage
};