const Router = require("@koa/router");
const CategoryController = require("../controllers/CategoryController");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { validateSchema, categorySchemas } = require("../utils/validator");

const router = new Router({
  prefix: "/api/categories",
});

// 公开路由
router.get("/", validateSchema(categorySchemas.query, 'query'), CategoryController.getCategories);
router.get("/:id", CategoryController.getCategoryById);

// 需要管理员权限的路由
router.use(authMiddleware);
router.use(adminAuth);
router.post("/", validateSchema(categorySchemas.create), CategoryController.createCategory);
router.put("/:id", validateSchema(categorySchemas.update), CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

module.exports = router;
