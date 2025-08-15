const Router = require('@koa/router');
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../middleware/auth');
const { validateSchema, orderSchemas } = require('../utils/validator');

const router = new Router({
  prefix: '/api/orders'
});

// 需要认证的路由
router.use(authMiddleware);

router.get('/', validateSchema(orderSchemas.query, 'query'), OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/', validateSchema(orderSchemas.create), OrderController.createOrder);
router.put('/:id/status', validateSchema(orderSchemas.updateStatus), OrderController.updateOrderStatus);

module.exports = router; 