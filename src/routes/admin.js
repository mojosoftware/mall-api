const Router = require("@koa/router");
const AdminController = require("../controllers/AdminController");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { validateSchema, adminSchemas } = require("../utils/validator");

const router = new Router({
  prefix: "/api/admin",
});

// 需要管理员权限的路由
router.use(authMiddleware);
router.use(adminAuth);
// 用户管理
router.get("/users", validateSchema(adminSchemas.queryUsers, 'query'), AdminController.getUsers);
router.put("/users/:id/status", validateSchema(adminSchemas.updateUserStatus), AdminController.updateUserStatus);

// 订单管理
router.get("/orders", validateSchema(adminSchemas.queryOrders, 'query'), AdminController.getOrders);
router.put("/orders/:id/status", validateSchema(adminSchemas.updateOrderStatus), AdminController.updateOrderStatus);

// 统计信息
router.get("/stats", AdminController.getStats);

module.exports = router;
