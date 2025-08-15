const Router = require("@koa/router");
const PermissionController = require("../controllers/PermissionController");
const authMiddleware = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission");
const { createRateLimiter } = require("../middleware/rateLimiter");

const router = new Router({
  prefix: "/api/permissions",
});

// 需要认证的路由
router.use(authMiddleware);
router.use(createRateLimiter('admin'));

// 权限管理路由
router.get("/", 
  checkPermission('permission:list'), 
  PermissionController.getPermissions
);

router.get("/tree", 
  checkPermission('permission:list'), 
  PermissionController.getPermissionTree
);

router.get("/type/:type", 
  checkPermission('permission:list'), 
  PermissionController.getPermissionsByType
);

router.get("/:id", 
  checkPermission('permission:view'), 
  PermissionController.getPermissionById
);

router.post("/", 
  checkPermission('permission:create'), 
  PermissionController.createPermission
);

router.put("/:id", 
  checkPermission('permission:update'), 
  PermissionController.updatePermission
);

router.delete("/:id", 
  checkPermission('permission:delete'), 
  PermissionController.deletePermission
);

// 用户权限相关路由
router.get("/user/menus", PermissionController.getUserMenus);
router.get("/user/permissions", PermissionController.getUserPermissions);
router.get("/user/check/:code", PermissionController.checkPermission);

module.exports = router;