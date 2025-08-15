const Router = require("@koa/router");
const ProductController = require("../controllers/ProductController");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { validateSchema, productSchemas } = require("../utils/validator");

const router = new Router({
  prefix: "/api/products",
});

// 公开路由
router.get("/", validateSchema(productSchemas.query, 'query'), ProductController.getProducts);
router.get("/:id", ProductController.getProductById);

// 需要管理员权限的路由
router.use(authMiddleware);
router.use(adminAuth);
router.post("/", validateSchema(productSchemas.create), ProductController.createProduct);
router.put("/:id", validateSchema(productSchemas.update), ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

module.exports = router;
