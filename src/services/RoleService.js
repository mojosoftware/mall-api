const RoleRepository = require('../repositories/RoleRepository');
const PermissionRepository = require('../repositories/PermissionRepository');
const UserRepository = require('../repositories/UserRepository');

class RoleService {
  async createRole(roleData) {
    // 检查角色编码是否已存在
    const existingRole = await RoleRepository.findByCode(roleData.code);
    if (existingRole) {
      throw new Error('角色编码已存在');
    }
    
    return await RoleRepository.create(roleData);
  }

  async getRoleById(id) {
    const role = await RoleRepository.findById(id);
    if (!role) {
      throw new Error('角色不存在');
    }
    return role;
  }

  async getRoles(options = {}) {
    return await RoleRepository.findAll(options);
  }

  async updateRole(id, updateData) {
    // 如果更新编码，检查是否重复
    if (updateData.code) {
      const existingRole = await RoleRepository.findByCode(updateData.code);
      if (existingRole && existingRole.id !== parseInt(id)) {
        throw new Error('角色编码已存在');
      }
    }
    
    const role = await RoleRepository.update(id, updateData);
    if (!role) {
      throw new Error('角色不存在');
    }
    return role;
  }

  async deleteRole(id) {
    try {
      const result = await RoleRepository.delete(id);
      if (!result) {
        throw new Error('角色不存在');
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async assignPermissions(roleId, permissionIds) {
    // 验证角色是否存在
    const role = await RoleRepository.findById(roleId);
    if (!role) {
      throw new Error('角色不存在');
    }
    
    // 验证权限是否都存在
    for (const permissionId of permissionIds) {
      const permission = await PermissionRepository.findById(permissionId);
      if (!permission) {
        throw new Error(`权限ID ${permissionId} 不存在`);
      }
    }
    
    return await RoleRepository.assignPermissions(roleId, permissionIds);
  }

  async getRolePermissions(roleId) {
    const role = await RoleRepository.findById(roleId);
    if (!role) {
      throw new Error('角色不存在');
    }
    
    return await RoleRepository.getRolePermissions(roleId);
  }

  async getUsersByRole(roleId, options = {}) {
    const role = await RoleRepository.findById(roleId);
    if (!role) {
      throw new Error('角色不存在');
    }
    
    return await RoleRepository.getUsersByRole(roleId, options);
  }

  async assignRolesToUser(userId, roleIds) {
    // 验证用户是否存在
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证角色是否都存在
    for (const roleId of roleIds) {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw new Error(`角色ID ${roleId} 不存在`);
      }
    }
    
    // 使用Sequelize的关联方法设置用户角色
    await user.setRoles(roleIds);
    return true;
  }

  async getUserRoles(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const userWithRoles = await UserRepository.findById(userId);
    return userWithRoles.roles || [];
  }
}

module.exports = new RoleService();