const PermissionService = require('../services/PermissionService');
const Response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 权限检查中间件
 * @param {string|Array} permissions - 权限编码或权限编码数组
 * @param {string} mode - 检查模式: 'all' 需要所有权限, 'any' 需要任一权限
 * @returns {Function} Koa中间件
 */
function checkPermission(permissions, mode = 'any') {
  return async (ctx, next) => {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        logger.logAuth(ctx, '权限检查失败 - 用户未登录', 'warn');
        Response.error(ctx, '用户未登录', 401, 401);
        return;
      }

      // 超级管理员跳过权限检查
      if (user.role === 'super_admin') {
        await next();
        return;
      }

      const permissionCodes = Array.isArray(permissions) ? permissions : [permissions];
      const userId = user.id;
      
      let hasPermission = false;
      
      if (mode === 'all') {
        // 需要所有权限
        hasPermission = true;
        for (const code of permissionCodes) {
          const result = await PermissionService.checkUserPermission(userId, code);
          if (!result) {
            hasPermission = false;
            break;
          }
        }
      } else {
        // 需要任一权限
        for (const code of permissionCodes) {
          const result = await PermissionService.checkUserPermission(userId, code);
          if (result) {
            hasPermission = true;
            break;
          }
        }
      }
      
      if (!hasPermission) {
        logger.logAuth(ctx, `权限不足: 用户${userId} 缺少权限 ${permissionCodes.join(', ')}`, 'warn');
        Response.error(ctx, '权限不足', 403, 403);
        return;
      }
      
      logger.logAuth(ctx, `权限检查通过: 用户${userId} 拥有权限 ${permissionCodes.join(', ')}`);
      await next();
    } catch (err) {
      logger.logError(ctx, err, '权限检查异常');
      Response.error(ctx, '权限检查过程中发生错误', 500, 500);
    }
  };
}

/**
 * API权限检查中间件
 * 根据请求方法和路径自动检查权限
 */
function checkApiPermission() {
  return async (ctx, next) => {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        logger.logAuth(ctx, 'API权限检查失败 - 用户未登录', 'warn');
        Response.error(ctx, '用户未登录', 401, 401);
        return;
      }

      // 超级管理员跳过权限检查
      if (user.role === 'super_admin') {
        await next();
        return;
      }

      const method = ctx.method;
      const url = ctx.path;
      const userId = user.id;
      
      // 获取用户的所有API权限
      const userPermissions = await PermissionService.getUserPermissions(userId);
      const apiPermissions = userPermissions.filter(p => p.type === 'api');
      
      // 检查是否有匹配的API权限
      const hasPermission = apiPermissions.some(permission => {
        const permissionMethod = permission.method?.toUpperCase();
        const permissionUrl = permission.url;
        
        // 方法匹配
        if (permissionMethod && permissionMethod !== method) {
          return false;
        }
        
        // URL匹配（支持通配符）
        if (permissionUrl) {
          const regex = new RegExp(permissionUrl.replace(/\*/g, '.*'));
          return regex.test(url);
        }
        
        return false;
      });
      
      if (!hasPermission) {
        logger.logAuth(ctx, `API权限不足: 用户${userId} 访问 ${method} ${url}`, 'warn');
        Response.error(ctx, 'API权限不足', 403, 403);
        return;
      }
      
      logger.logAuth(ctx, `API权限检查通过: 用户${userId} 访问 ${method} ${url}`);
      await next();
    } catch (err) {
      logger.logError(ctx, err, 'API权限检查异常');
      Response.error(ctx, 'API权限检查过程中发生错误', 500, 500);
    }
  };
}

/**
 * 角色检查中间件
 * @param {string|Array} roles - 角色编码或角色编码数组
 * @returns {Function} Koa中间件
 */
function checkRole(roles) {
  return async (ctx, next) => {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        logger.logAuth(ctx, '角色检查失败 - 用户未登录', 'warn');
        Response.error(ctx, '用户未登录', 401, 401);
        return;
      }

      const roleCodes = Array.isArray(roles) ? roles : [roles];
      
      // 获取用户角色
      const RoleService = require('../services/RoleService');
      const userRoles = await RoleService.getUserRoles(user.id);
      const userRoleCodes = userRoles.map(role => role.code);
      
      // 检查是否有匹配的角色
      const hasRole = roleCodes.some(code => userRoleCodes.includes(code));
      
      if (!hasRole) {
        logger.logAuth(ctx, `角色不足: 用户${user.id} 需要角色 ${roleCodes.join(', ')}`, 'warn');
        Response.error(ctx, '角色权限不足', 403, 403);
        return;
      }
      
      logger.logAuth(ctx, `角色检查通过: 用户${user.id} 拥有角色 ${userRoleCodes.join(', ')}`);
      await next();
    } catch (err) {
      logger.logError(ctx, err, '角色检查异常');
      Response.error(ctx, '角色检查过程中发生错误', 500, 500);
    }
  };
}

module.exports = {
  checkPermission,
  checkApiPermission,
  checkRole
};