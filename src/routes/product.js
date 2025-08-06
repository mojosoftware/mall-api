const Router = require('koa-router');
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middleware/auth');

const router = new Router({
  prefix: '/api/products'
});

// 公开路由
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);

// 需要管理员权限的路由
router.post('/', authMiddleware, ProductController.createProduct);
router.put('/:id', authMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, ProductController.deleteProduct);

module.exports = router; 