const RoleService = require('../services/RoleService');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class RoleController {
  async getRoles(ctx) {
    try {
      const { page, limit, name, status, isSystem } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        name,
        status,
        isSystem: isSystem !== undefined ? isSystem === 'true' : undefined
      };
      
      const result = await RoleService.getRoles(options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取角色列表成功");
    } catch (err) {
      logger.logError(ctx, err, '获取角色列表失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async getRoleById(ctx) {
    try {
      const { id } = ctx.params;
      const role = await RoleService.getRoleById(parseInt(id));
      Response.success(ctx, role, "获取角色详情成功");
    } catch (err) {
      logger.logError(ctx, err, '获取角色详情失败');
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async createRole(ctx) {
    try {
      const role = await RoleService.createRole(ctx.request.body);
      logger.logAdmin(ctx, '创建角色', { roleId: role.id, roleName: role.name });
      Response.success(ctx, role, "创建角色成功");
    } catch (err) {
      logger.logError(ctx, err, '创建角色失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async updateRole(ctx) {
    try {
      const { id } = ctx.params;
      const role = await RoleService.updateRole(parseInt(id), ctx.request.body);
      logger.logAdmin(ctx, '更新角色', { roleId: id, roleName: role.name });
      Response.success(ctx, role, "更新角色成功");
    } catch (err) {
      logger.logError(ctx, err, '更新角色失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async deleteRole(ctx) {
    try {
      const { id } = ctx.params;
      await RoleService.deleteRole(parseInt(id));
      logger.logAdmin(ctx, '删除角色', { roleId: id });
      Response.success(ctx, null, "角色删除成功");
    } catch (err) {
      logger.logError(ctx, err, '删除角色失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async assignPermissions(ctx) {
    try {
      const { id } = ctx.params;
      const { permissionIds } = ctx.request.body;
      
      await RoleService.assignPermissions(parseInt(id), permissionIds);
      logger.logAdmin(ctx, '分配角色权限', { roleId: id, permissionIds });
      Response.success(ctx, null, "权限分配成功");
    } catch (err) {
      logger.logError(ctx, err, '分配角色权限失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async getRolePermissions(ctx) {
    try {
      const { id } = ctx.params;
      const permissions = await RoleService.getRolePermissions(parseInt(id));
      Response.success(ctx, permissions, "获取角色权限成功");
    } catch (err) {
      logger.logError(ctx, err, '获取角色权限失败');
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async getUsersByRole(ctx) {
    try {
      const { id } = ctx.params;
      const { page, limit } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };
      
      const result = await RoleService.getUsersByRole(parseInt(id), options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取角色用户列表成功");
    } catch (err) {
      logger.logError(ctx, err, '获取角色用户列表失败');
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async assignRolesToUser(ctx) {
    try {
      const { userId } = ctx.params;
      const { roleIds } = ctx.request.body;
      
      await RoleService.assignRolesToUser(parseInt(userId), roleIds);
      logger.logAdmin(ctx, '分配用户角色', { userId, roleIds });
      Response.success(ctx, null, "用户角色分配成功");
    } catch (err) {
      logger.logError(ctx, err, '分配用户角色失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async getUserRoles(ctx) {
    try {
      const { userId } = ctx.params;
      const roles = await RoleService.getUserRoles(parseInt(userId));
      Response.success(ctx, roles, "获取用户角色成功");
    } catch (err) {
      logger.logError(ctx, err, '获取用户角色失败');
      Response.error(ctx, err.message, -1, 404);
    }
  }
}

module.exports = new RoleController();