const Router = require("@koa/router");
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { createRateLimiter, userRateLimit } = require("../middleware/rateLimiter");
const { validateSchema, userSchemas } = require("../utils/validator");

const router = new Router({
  prefix: "/api/users",
});

// 公开路由
router.post(
  "/register",
  createRateLimiter('register'),
  validateSchema(userSchemas.register),
  UserController.register
);
router.post("/login", 
  createRateLimiter('login'),
  validateSchema(userSchemas.login),
  UserController.login
);
router.post("/logout", authMiddleware, UserController.logout);
router.get("/verify-email", UserController.verifyEmail);

// 需要认证的路由
router.use(authMiddleware);

// 普通用户路由
router.get("/profile", UserController.getProfile);
router.put("/profile", validateSchema(userSchemas.updateProfile), UserController.updateProfile);
router.post("/change-password", 
  userRateLimit('strict'),
  validateSchema(userSchemas.changePassword), 
  UserController.changePassword
);

// 管理员路由
router.use(adminAuth);
router.use(createRateLimiter('admin'));
router.get("/", validateSchema(userSchemas.listUsers, 'query'), UserController.listUsers); // 获取用户列表
router.put("/:id/disable", UserController.disableUser); // 禁用用户
router.put("/:id/enable", UserController.enableUser); // 启用用户
router.get("/:id", UserController.getUserById); // 获取指定用户信息

module.exports = router;
