const Router = require("@koa/router");
const CategoryController = require("../controllers/CategoryController");
const authMiddleware = require("../middleware/auth");

const router = new Router({
  prefix: "/api/categories",
});

// 公开路由
router.get("/", CategoryController.getCategories);
router.get("/:id", CategoryController.getCategoryById);

// 需要管理员权限的路由
router.use(authMiddleware);
router.use(adminAuth);
router.post("/", CategoryController.createCategory);
router.put("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

module.exports = router;
