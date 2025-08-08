const { User, Category, Product } = require('../models');
const logger = require('../utils/logger');

async function initializeTestData() {
  try {
    // 检查是否已有数据
    const userCount = await User.count();
    if (userCount === 0) {
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


if (require.main === module) {
  const sequelize = require('../database/connection');
  require('../models');
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ force: false });
      await initializeTestData();
      process.exit(0);
    } catch (err) {
      // 打印错误并退出
      // eslint-disable-next-line no-console
      console.error('初始化测试数据失败:', err);
      process.exit(1);
    }
  })();
}

module.exports = initializeTestData;
