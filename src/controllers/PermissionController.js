const PermissionService = require('../services/PermissionService');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class PermissionController {
  async getPermissions(ctx) {
    try {
      const { page, limit, name, type, status, parentId } = ctx.query;
      const options = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        name,
        type,
        status,
        parentId: parentId ? parseInt(parentId) : undefined
      };
      
      const result = await PermissionService.getPermissions(options);
      
      if (page && limit) {
        Response.page(ctx, result.rows, result.count, parseInt(page), parseInt(limit), "获取权限列表成功");
      } else {
        Response.success(ctx, result.rows, "获取权限列表成功");
      }
    } catch (err) {
      logger.logError(ctx, err, '获取权限列表失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getPermissionTree(ctx) {
    try {
      const { status } = ctx.query;
      const tree = await PermissionService.getPermissionTree({ status });
      Response.success(ctx, tree, "获取权限树成功");
    } catch (err) {
      logger.logError(ctx, err, '获取权限树失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getPermissionById(ctx) {
    try {
      const { id } = ctx.params;
      const permission = await PermissionService.getPermissionById(parseInt(id));
      Response.success(ctx, permission, "获取权限详情成功");
    } catch (err) {
      logger.logError(ctx, err, '获取权限详情失败');
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async createPermission(ctx) {
    try {
      const permission = await PermissionService.createPermission(ctx.request.body);
      logger.logAdmin(ctx, '创建权限', { permissionId: permission.id, permissionName: permission.name });
      Response.success(ctx, permission, "创建权限成功");
    } catch (err) {
      logger.logError(ctx, err, '创建权限失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updatePermission(ctx) {
    try {
      const { id } = ctx.params;
      const permission = await PermissionService.updatePermission(parseInt(id), ctx.request.body);
      logger.logAdmin(ctx, '更新权限', { permissionId: id, permissionName: permission.name });
      Response.success(ctx, permission, "更新权限成功");
    } catch (err) {
      logger.logError(ctx, err, '更新权限失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async deletePermission(ctx) {
    try {
      const { id } = ctx.params;
      await PermissionService.deletePermission(parseInt(id));
      logger.logAdmin(ctx, '删除权限', { permissionId: id });
      Response.success(ctx, null, "权限删除成功");
    } catch (err) {
      logger.logError(ctx, err, '删除权限失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async getUserMenus(ctx) {
    try {
      const userId = ctx.state.user.id;
      const menus = await PermissionService.getUserMenus(userId);
      Response.success(ctx, menus, "获取用户菜单成功");
    } catch (err) {
      logger.logError(ctx, err, '获取用户菜单失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getUserPermissions(ctx) {
    try {
      const userId = ctx.state.user.id;
      const permissions = await PermissionService.getUserPermissions(userId);
      Response.success(ctx, permissions, "获取用户权限成功");
    } catch (err) {
      logger.logError(ctx, err, '获取用户权限失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async checkPermission(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { code } = ctx.params;
      const hasPermission = await PermissionService.checkUserPermission(userId, code);
      Response.success(ctx, { hasPermission }, "权限检查完成");
    } catch (err) {
      logger.logError(ctx, err, '权限检查失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getPermissionsByType(ctx) {
    try {
      const { type } = ctx.params;
      const { page, limit, status } = ctx.query;
      const options = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        status
      };
      
      const result = await PermissionService.getPermissionsByType(type, options);
      
      if (page && limit) {
        Response.page(ctx, result.rows, result.count, parseInt(page), parseInt(limit), `获取${type}权限列表成功`);
      } else {
        Response.success(ctx, result.rows, `获取${type}权限列表成功`);
      }
    } catch (err) {
      logger.logError(ctx, err, '获取权限列表失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }
}

module.exports = new PermissionController();