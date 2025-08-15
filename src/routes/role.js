const Router = require("@koa/router");
const RoleController = require("../controllers/RoleController");
const authMiddleware = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission");
const { createRateLimiter } = require("../middleware/rateLimiter");
const { validateSchema } = require("../utils/validator");

const router = new Router({
  prefix: "/api/roles",
});

// 需要认证的路由
router.use(authMiddleware);
router.use(createRateLimiter('admin'));

// 角色管理路由
router.get("/", 
  checkPermission('role:list'), 
  RoleController.getRoles
);

router.get("/:id", 
  checkPermission('role:view'), 
  RoleController.getRoleById
);

router.post("/", 
  checkPermission('role:create'), 
  RoleController.createRole
);

router.put("/:id", 
  checkPermission('role:update'), 
  RoleController.updateRole
);

router.delete("/:id", 
  checkPermission('role:delete'), 
  RoleController.deleteRole
);

// 角色权限管理
router.post("/:id/permissions", 
  checkPermission('role:assign_permission'), 
  RoleController.assignPermissions
);

router.get("/:id/permissions", 
  checkPermission('role:view_permission'), 
  RoleController.getRolePermissions
);

router.get("/:id/users", 
  checkPermission('role:view_users'), 
  RoleController.getUsersByRole
);

// 用户角色管理
router.post("/users/:userId/roles", 
  checkPermission('user:assign_role'), 
  RoleController.assignRolesToUser
);

router.get("/users/:userId/roles", 
  checkPermission('user:view_role'), 
  RoleController.getUserRoles
);

module.exports = router;