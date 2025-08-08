const Router = require("@koa/router");
const CartController = require("../controllers/CartController");
const authMiddleware = require("../middleware/auth");

const router = new Router({
  prefix: "/api/cart",
});

// 需要认证的路由
router.use(authMiddleware);

router.get("/", CartController.getCart);
router.post("/add", CartController.addToCart);
router.put("/update/:itemId", CartController.updateCartItem);
router.delete("/remove/:itemId", CartController.removeFromCart);
router.delete("/clear", CartController.clearCart);

module.exports = router;
