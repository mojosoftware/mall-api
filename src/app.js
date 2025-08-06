const Koa = require('koa');
const cors = require('koa-cors');
const bodyParser = require('koa-bodyparser');
const helmet = require('koa-helmet');
const static = require('koa-static');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
// const authMiddleware = require('./middleware/auth');
const sessionMiddleware = require('./middleware/session');
// const rateLimiter = require('./middleware/rateLimiter');

// 数据库连接
const sequelize = require('./database/connection');

// 引入模型关联
require('./models');

// 业务逻辑层
const UserService = require('./services/UserService');
// const ProductService = require('./services/ProductService');
// const CategoryService = require('./services/CategoryService');
// const OrderService = require('./services/OrderService');
// const CartService = require('./services/CartService');

// 控制器层
const UserController = require('./controllers/UserController');
// const ProductController = require('./controllers/ProductController');
// const CategoryController = require('./controllers/CategoryController');
// const OrderController = require('./controllers/OrderController');
// const CartController = require('./controllers/CartController');
// const AdminController = require('./controllers/AdminController');

// 路由定义
const userRoutes = require('./routes/user');
// const productRoutes = require('./routes/product');
// const categoryRoutes = require('./routes/category');
// const orderRoutes = require('./routes/order');
// const cartRoutes = require('./routes/cart');
// const adminRoutes = require('./routes/admin');

const app = new Koa();

// 中间件
app.use(helmet());
app.use(cors());
app.use(bodyParser());
app.use(static(path.join(__dirname, '../public')));
app.use(errorHandler);
app.use(rateLimiter);
app.use(sessionMiddleware);

// 路由
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());
// app.use(productRoutes.routes());
// app.use(productRoutes.allowedMethods());
// app.use(categoryRoutes.routes());
// app.use(categoryRoutes.allowedMethods());
// app.use(orderRoutes.routes());
// app.use(orderRoutes.allowedMethods());
// app.use(cartRoutes.routes());
// app.use(cartRoutes.allowedMethods());
// app.use(adminRoutes.routes());
// app.use(adminRoutes.allowedMethods());

// 数据库同步和初始化数据
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');
    
    // 同步模型到数据库
    await sequelize.sync({ force: false });
    logger.info('数据库模型同步完成');
    
    // 初始化测试数据
    await initializeTestData();
    
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 初始化测试数据
async function initializeTestData() {
  try {
    const { User, Category, Product } = require('./models');
    
    // 检查是否已有数据
    const userCount = await User.count();
    if (userCount === 0) {
      // 创建测试用户
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'user123',
        role: 'user'
      });
      
      logger.info('测试用户创建完成');
    }
    
    // 创建测试分类
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      const categories = [
        { name: '电子产品', description: '手机、电脑等电子产品' },
        { name: '服装', description: '男装、女装、童装' },
        { name: '食品', description: '零食、饮料、生鲜' },
        { name: '家居', description: '家具、装饰品' }
      ];
      
      for (const category of categories) {
        await Category.create(category);
      }
      
      logger.info('测试分类创建完成');
    }
    
    // 创建测试商品
    const productCount = await Product.count();
    if (productCount === 0) {
      const products = [
        {
          name: 'iPhone 15',
          description: '苹果最新手机',
          price: 5999.00,
          originalPrice: 6999.00,
          stock: 100,
          categoryId: 1,
          images: ['iphone15-1.jpg', 'iphone15-2.jpg']
        },
        {
          name: 'MacBook Pro',
          description: '专业级笔记本电脑',
          price: 12999.00,
          originalPrice: 14999.00,
          stock: 50,
          categoryId: 1,
          images: ['macbook-1.jpg', 'macbook-2.jpg']
        },
        {
          name: 'Nike运动鞋',
          description: '舒适透气的运动鞋',
          price: 299.00,
          originalPrice: 399.00,
          stock: 200,
          categoryId: 2,
          images: ['nike-shoes.jpg']
        }
      ];
      
      for (const product of products) {
        await Product.create(product);
      }
      
      logger.info('测试商品创建完成');
    }
    
  } catch (error) {
    logger.error('初始化测试数据失败:', error);
  }
}

const PORT = config.port || 3000;

// 启动服务器
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    logger.info(`商城API服务启动成功，端口: ${PORT}`);
    logger.info(`API文档: http://localhost:${PORT}/api`);
  });
}

startServer().catch(error => {
  logger.error('服务器启动失败:', error);
  process.exit(1);
});

module.exports = app; 