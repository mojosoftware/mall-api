const PermissionRepository = require('../repositories/PermissionRepository');

class PermissionService {
  async createPermission(permissionData) {
    // 检查权限编码是否已存在
    const existingPermission = await PermissionRepository.findByCode(permissionData.code);
    if (existingPermission) {
      throw new Error('权限编码已存在');
    }
    
    // 如果有父权限，验证父权限是否存在
    if (permissionData.parentId) {
      const parentPermission = await PermissionRepository.findById(permissionData.parentId);
      if (!parentPermission) {
        throw new Error('父权限不存在');
      }
    }
    
    return await PermissionRepository.create(permissionData);
  }

  async getPermissionById(id) {
    const permission = await PermissionRepository.findById(id);
    if (!permission) {
      throw new Error('权限不存在');
    }
    return permission;
  }

  async getPermissions(options = {}) {
    return await PermissionRepository.findAll(options);
  }

  async getPermissionTree(options = {}) {
    return await PermissionRepository.findTree(options);
  }

  async updatePermission(id, updateData) {
    // 如果更新编码，检查是否重复
    if (updateData.code) {
      const existingPermission = await PermissionRepository.findByCode(updateData.code);
      if (existingPermission && existingPermission.id !== parseInt(id)) {
        throw new Error('权限编码已存在');
      }
    }
    
    // 如果更新父权限，验证父权限是否存在且不是自己
    if (updateData.parentId) {
      if (updateData.parentId === parseInt(id)) {
        throw new Error('不能将自己设为父权限');
      }
      
      const parentPermission = await PermissionRepository.findById(updateData.parentId);
      if (!parentPermission) {
        throw new Error('父权限不存在');
      }
    }
    
    const permission = await PermissionRepository.update(id, updateData);
    if (!permission) {
      throw new Error('权限不存在');
    }
    return permission;
  }

  async deletePermission(id) {
    try {
      const result = await PermissionRepository.delete(id);
      if (!result) {
        throw new Error('权限不存在');
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getUserMenus(userId) {
    return await PermissionRepository.getMenuPermissions(userId);
  }

  async getUserPermissions(userId) {
    return await PermissionRepository.getUserPermissions(userId);
  }

  async checkUserPermission(userId, permissionCode) {
    return await PermissionRepository.checkUserPermission(userId, permissionCode);
  }

  async getPermissionsByType(type, options = {}) {
    return await PermissionRepository.findAll({
      ...options,
      type
    });
  }
}

module.exports = new PermissionService();