const { Role, Permission, RolePermission, User } = require('../models');
const logger = require('../utils/logger');
const sequelize = require('../database/connection');

async function initializeRbacData() {
  try {
    logger.info('开始初始化RBAC权限数据...');
    
    // 创建默认角色
    const roles = [
      {
        name: '超级管理员',
        code: 'super_admin',
        description: '系统超级管理员，拥有所有权限',
        isSystem: true,
        sort: 1
      },
      {
        name: '管理员',
        code: 'admin',
        description: '系统管理员，拥有大部分管理权限',
        isSystem: true,
        sort: 2
      },
      {
        name: '普通用户',
        code: 'user',
        description: '普通用户，拥有基本功能权限',
        isSystem: true,
        sort: 3
      }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ where: { code: roleData.code } });
      if (!existingRole) {
        await Role.create(roleData);
        logger.info(`创建角色: ${roleData.name}`);
      }
    }

    // 创建默认权限
    const permissions = [
      // 系统管理
      {
        name: '系统管理',
        code: 'system',
        type: 'menu',
        icon: 'system',
        isSystem: true,
        sort: 1
      },
      
      // 用户管理
      {
        name: '用户管理',
        code: 'user_management',
        type: 'menu',
        parentId: null, // 将在创建后设置
        path: '/admin/users',
        component: 'UserManagement',
        icon: 'user',
        isSystem: true,
        sort: 10
      },
      {
        name: '用户列表',
        code: 'user:list',
        type: 'button',
        parentId: null, // 将在创建后设置
        isSystem: true,
        sort: 11
      },
      {
        name: '用户详情',
        code: 'user:view',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 12
      },
      {
        name: '创建用户',
        code: 'user:create',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 13
      },
      {
        name: '更新用户',
        code: 'user:update',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 14
      },
      {
        name: '删除用户',
        code: 'user:delete',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 15
      },
      {
        name: '分配角色',
        code: 'user:assign_role',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 16
      },
      
      // 角色管理
      {
        name: '角色管理',
        code: 'role_management',
        type: 'menu',
        parentId: null,
        path: '/admin/roles',
        component: 'RoleManagement',
        icon: 'role',
        isSystem: true,
        sort: 20
      },
      {
        name: '角色列表',
        code: 'role:list',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 21
      },
      {
        name: '角色详情',
        code: 'role:view',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 22
      },
      {
        name: '创建角色',
        code: 'role:create',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 23
      },
      {
        name: '更新角色',
        code: 'role:update',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 24
      },
      {
        name: '删除角色',
        code: 'role:delete',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 25
      },
      {
        name: '分配权限',
        code: 'role:assign_permission',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 26
      },
      
      // 权限管理
      {
        name: '权限管理',
        code: 'permission_management',
        type: 'menu',
        parentId: null,
        path: '/admin/permissions',
        component: 'PermissionManagement',
        icon: 'permission',
        isSystem: true,
        sort: 30
      },
      {
        name: '权限列表',
        code: 'permission:list',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 31
      },
      {
        name: '权限详情',
        code: 'permission:view',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 32
      },
      {
        name: '创建权限',
        code: 'permission:create',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 33
      },
      {
        name: '更新权限',
        code: 'permission:update',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 34
      },
      {
        name: '删除权限',
        code: 'permission:delete',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 35
      },
      
      // 商品管理
      {
        name: '商品管理',
        code: 'product_management',
        type: 'menu',
        path: '/admin/products',
        component: 'ProductManagement',
        icon: 'product',
        isSystem: true,
        sort: 40
      },
      {
        name: '商品列表',
        code: 'product:list',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 41
      },
      {
        name: '商品详情',
        code: 'product:view',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 42
      },
      {
        name: '创建商品',
        code: 'product:create',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 43
      },
      {
        name: '更新商品',
        code: 'product:update',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 44
      },
      {
        name: '删除商品',
        code: 'product:delete',
        type: 'button',
        parentId: null,
        isSystem: true,
        sort: 45
      },
      
      // API权限
      {
        name: '用户API',
        code: 'api:users',
        type: 'api',
        method: '*',
        url: '/api/users/*',
        description: '用户相关API权限',
        isSystem: true,
        sort: 100
      },
      {
        name: '角色API',
        code: 'api:roles',
        type: 'api',
        method: '*',
        url: '/api/roles/*',
        description: '角色相关API权限',
        isSystem: true,
        sort: 101
      },
      {
        name: '权限API',
        code: 'api:permissions',
        type: 'api',
        method: '*',
        url: '/api/permissions/*',
        description: '权限相关API权限',
        isSystem: true,
        sort: 102
      },
      {
        name: '商品API',
        code: 'api:products',
        type: 'api',
        method: '*',
        url: '/api/products/*',
        description: '商品相关API权限',
        isSystem: true,
        sort: 103
      }
    ];

    // 创建权限并设置父子关系
    const createdPermissions = {};
    
    for (const permissionData of permissions) {
      const existingPermission = await Permission.findOne({ where: { code: permissionData.code } });
      if (!existingPermission) {
        const permission = await Permission.create(permissionData);
        createdPermissions[permissionData.code] = permission;
        logger.info(`创建权限: ${permissionData.name}`);
      } else {
        createdPermissions[permissionData.code] = existingPermission;
      }
    }

    // 设置父子关系
    const parentChildRelations = [
      { parent: 'system', children: ['user_management', 'role_management', 'permission_management', 'product_management'] },
      { parent: 'user_management', children: ['user:list', 'user:view', 'user:create', 'user:update', 'user:delete', 'user:assign_role'] },
      { parent: 'role_management', children: ['role:list', 'role:view', 'role:create', 'role:update', 'role:delete', 'role:assign_permission'] },
      { parent: 'permission_management', children: ['permission:list', 'permission:view', 'permission:create', 'permission:update', 'permission:delete'] },
      { parent: 'product_management', children: ['product:list', 'product:view', 'product:create', 'product:update', 'product:delete'] }
    ];

    for (const relation of parentChildRelations) {
      const parentPermission = createdPermissions[relation.parent];
      if (parentPermission) {
        for (const childCode of relation.children) {
          const childPermission = createdPermissions[childCode];
          if (childPermission && !childPermission.parentId) {
            await childPermission.update({ parentId: parentPermission.id });
          }
        }
      }
    }

    // 分配权限给角色
    const superAdminRole = await Role.findOne({ where: { code: 'super_admin' } });
    const adminRole = await Role.findOne({ where: { code: 'admin' } });
    const userRole = await Role.findOne({ where: { code: 'user' } });

    if (superAdminRole) {
      // 超级管理员拥有所有权限
      const allPermissions = await Permission.findAll();
      await superAdminRole.setPermissions(allPermissions);
      logger.info('为超级管理员分配所有权限');
    }

    if (adminRole) {
      // 管理员拥有大部分权限（除了用户管理的删除权限）
      const adminPermissions = await Permission.findAll({
        where: {
          code: {
            [sequelize.Sequelize.Op.notIn]: ['user:delete']
          }
        }
      });
      await adminRole.setPermissions(adminPermissions);
      logger.info('为管理员分配权限');
    }

    if (userRole) {
      // 普通用户只有基本权限
      const userPermissions = await Permission.findAll({
        where: {
          code: {
            [sequelize.Sequelize.Op.in]: ['product:list', 'product:view']
          }
        }
      });
      await userRole.setPermissions(userPermissions);
      logger.info('为普通用户分配权限');
    }

    // 为现有用户分配默认角色
    const existingUsers = await User.findAll();
    for (const user of existingUsers) {
      const userRoles = await user.getRoles();
      if (userRoles.length === 0) {
        if (user.role === 'admin') {
          await user.setRoles([adminRole.id]);
          logger.info(`为管理员用户 ${user.email} 分配管理员角色`);
        } else {
          await user.setRoles([userRole.id]);
          logger.info(`为普通用户 ${user.email} 分配用户角色`);
        }
      }
    }

    logger.info('RBAC权限数据初始化完成');
  } catch (error) {
    logger.error('初始化RBAC权限数据失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ force: false });
      await initializeRbacData();
      process.exit(0);
    } catch (err) {
      console.error('初始化RBAC数据失败:', err);
      process.exit(1);
    }
  })();
}

module.exports = initializeRbacData;