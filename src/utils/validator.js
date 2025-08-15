const Joi = require('joi');

/**
 * 验证中间件生成器
 * @param {Object} schema - Joi验证模式
 * @param {String} source - 验证数据源 (body/query/params)
 * @returns {Function} Koa中间件函数
 */
function validateSchema(schema, source = 'body') {
  return async (ctx, next) => {
    try {
      const data = ctx.request[source] || ctx[source];
      const { error, value } = schema.validate(data, {
        allowUnknown: false,
        abortEarly: false
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        ctx.status = 400;
        ctx.body = {
          code: -1,
          message: '参数验证失败',
          errors: errorMessages,
          timestamp: new Date().toISOString()
        };
        return;
      }

      ctx.request[source] = value;
      await next();
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        code: -1,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      };
    }
  };
}

// 通用验证规则
const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),
  
  id: Joi.object({
    id: Joi.number().integer().min(1).required()
  })
};

// 用户相关验证规则
const userSchemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  
  updateProfile: Joi.object({
    username: Joi.string().min(3).max(50).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    avatar: Joi.string().uri({ allowRelative: true }).optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  listUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("active", "inactive").optional(),
    email: Joi.string().optional(),
    createdAtStart: Joi.date().iso().optional(),
    createdAtEnd: Joi.date().iso().optional(),
  }).unknown(true)
};

// 商品相关验证规则
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    originalPrice: Joi.number().positive().optional(),
    stock: Joi.number().integer().min(0).required(),
    categoryId: Joi.number().integer().positive().required(),
    images: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    originalPrice: Joi.number().positive().optional(),
    stock: Joi.number().integer().min(0).optional(),
    categoryId: Joi.number().integer().positive().optional(),
    images: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }),
  
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional(),
    categoryId: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }).unknown(true)
};

// 分类相关验证规则
const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    sort: Joi.number().integer().optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    sort: Joi.number().integer().optional()
  }),

  query: Joi.object({
    status: Joi.string().valid('active', 'inactive').optional()
  }).unknown(true)
};

// 购物车相关验证规则
const cartSchemas = {
  addToCart: Joi.object({
    productId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().default(1)
  }),
  
  updateCartItem: Joi.object({
    quantity: Joi.number().integer().positive().required()
  })
};

// 订单相关验证规则
const orderSchemas = {
  create: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required()
      })
    ).min(1).required(),
    address: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      province: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      detail: Joi.string().required()
    }).required(),
    paymentMethod: Joi.string().optional(),
    remark: Joi.string().optional()
  }),
  
  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').required()
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').optional()
  }).unknown(true)
};

// 管理员相关验证规则
const adminSchemas = {
  updateUserStatus: Joi.object({
    status: Joi.string().valid('active', 'inactive').required()
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').required()
  }),

  queryUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional()
  }).unknown(true),

  queryOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').optional(),
    userId: Joi.number().integer().positive().optional()
  }).unknown(true)
};

// 文件上传验证规则
const uploadSchemas = {
  singleFile: Joi.object({
    file: Joi.any().required()
  }),
  
  multipleFiles: Joi.object({
    files: Joi.array().items(Joi.any()).min(1).max(5).required()
  }),
  
  deleteFile: Joi.object({
    filename: Joi.string().required()
  })
};

// RBAC权限验证规则
const rbacSchemas = {
  // 角色相关
  createRole: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    code: Joi.string().min(1).max(50).required(),
    description: Joi.string().max(500).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    sort: Joi.number().integer().optional()
  }),
  
  updateRole: Joi.object({
    name: Joi.string().min(1).max(50).optional(),
    code: Joi.string().min(1).max(50).optional(),
    description: Joi.string().max(500).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    sort: Joi.number().integer().optional()
  }),
  
  assignPermissions: Joi.object({
    permissionIds: Joi.array().items(Joi.number().integer().positive()).required()
  }),
  
  assignRoles: Joi.object({
    roleIds: Joi.array().items(Joi.number().integer().positive()).required()
  }),
  
  // 权限相关
  createPermission: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    code: Joi.string().min(1).max(100).required(),
    type: Joi.string().valid('menu', 'button', 'api').required(),
    parentId: Joi.number().integer().positive().optional(),
    path: Joi.string().max(200).optional(),
    component: Joi.string().max(200).optional(),
    icon: Joi.string().max(100).optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
    url: Joi.string().max(200).optional(),
    description: Joi.string().max(500).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    sort: Joi.number().integer().optional()
  }),
  
  updatePermission: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    code: Joi.string().min(1).max(100).optional(),
    type: Joi.string().valid('menu', 'button', 'api').optional(),
    parentId: Joi.number().integer().positive().optional(),
    path: Joi.string().max(200).optional(),
    component: Joi.string().max(200).optional(),
    icon: Joi.string().max(100).optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
    url: Joi.string().max(200).optional(),
    description: Joi.string().max(500).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    sort: Joi.number().integer().optional()
  }),
  
  // 查询验证
  queryRoles: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    name: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    isSystem: Joi.string().valid('true', 'false').optional()
  }).unknown(true),
  
  queryPermissions: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    name: Joi.string().optional(),
    type: Joi.string().valid('menu', 'button', 'api').optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    parentId: Joi.number().integer().positive().optional()
  }).unknown(true)
};
module.exports = {
  validateSchema,
  commonSchemas,
  userSchemas,
  productSchemas,
  categorySchemas,
  cartSchemas,
  orderSchemas,
  adminSchemas,
  uploadSchemas,
  rbacSchemas
};