const Router = require("@koa/router");
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const router = new Router({
  prefix: "/api/users",
});

// 公开路由
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/verify-email", UserController.verifyEmail);

// 需要认证的路由
router.use(authMiddleware);

// 普通用户路由
router.get("/profile", UserController.getProfile);
router.put("/profile", UserController.updateProfile);
router.post("/change-password", UserController.changePassword);

// 管理员路由
router.use(adminAuth);
router.get("/", UserController.listUsers); // 获取用户列表
router.put("/:id/disable", UserController.disableUser); // 禁用用户
router.put("/:id/enable", UserController.enableUser); // 启用用户
router.get("/:id", UserController.getUserById); // 获取指定用户信息

module.exports = router;
