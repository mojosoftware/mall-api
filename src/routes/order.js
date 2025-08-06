const Router = require('koa-router');
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../middleware/auth');

const router = new Router({
  prefix: '/api/orders'
});

// 需要认证的路由
router.use(authMiddleware);

router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/', OrderController.createOrder);
router.put('/:id/status', OrderController.updateOrderStatus);

module.exports = router; 