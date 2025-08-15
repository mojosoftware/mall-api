const Koa = require("koa");
const cors = require("koa-cors");
const bodyParser = require("koa-bodyparser");
const helmet = require("koa-helmet");
const static = require("koa-static");
const path = require("path");

const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { createRateLimiter } = require("./middleware/rateLimiter");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");

const app = new Koa();

// 请求日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  
  try {
    await next();
    
    const duration = Date.now() - start;
    
    // 记录访问日志
    logger.info('请求完成', {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      duration: `${duration}ms`,
      ip: ctx.ip,
      userAgent: ctx.headers['user-agent'],
      userId: ctx.state.user?.id
    });
  } catch (error) {
    const duration = Date.now() - start;
    
    // 记录错误请求
    logger.error('请求异常', {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status || 500,
      duration: `${duration}ms`,
      ip: ctx.ip,
      error: error.message,
      userId: ctx.state.user?.id
    });
    
    throw error;
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(bodyParser());
app.use(createRateLimiter('api'));
app.use(static(path.join(__dirname, "../public")));
app.use(errorHandler);

// 路由注册
app.use(uploadRoutes.routes());
app.use(uploadRoutes.allowedMethods());

app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

app.use(productRoutes.routes());
app.use(productRoutes.allowedMethods());

app.use(categoryRoutes.routes());
app.use(categoryRoutes.allowedMethods());

app.use(cartRoutes.routes());
app.use(cartRoutes.allowedMethods());

app.use(orderRoutes.routes());
app.use(orderRoutes.allowedMethods());

app.use(adminRoutes.routes());
app.use(adminRoutes.allowedMethods());

// 404处理
app.use(async (ctx) => {
  logger.warn('404 - 路由未找到', {
    method: ctx.method,
    url: ctx.url,
    ip: ctx.ip
  });
  
  ctx.status = 404;
  ctx.body = {
    code: -1,
    message: '请求的资源不存在',
    data: null,
    timestamp: new Date().toISOString()
  };
});

module.exports = app;
