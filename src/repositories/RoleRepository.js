const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { Op } = require('sequelize');

class RoleRepository {
  async create(roleData) {
    return await Role.create(roleData);
  }

  async findById(id) {
    return await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });
  }

  async findByCode(code) {
    return await Role.findOne({ where: { code } });
  }

  async findAll(options = {}) {
    const { page = 1, limit = 10, name, status, isSystem } = options;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (status) {
      where.status = status;
    }
    if (isSystem !== undefined) {
      where.isSystem = isSystem;
    }

    return await Role.findAndCountAll({
      where,
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ],
      limit,
      offset,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']]
    });
  }

  async update(id, updateData) {
    const role = await Role.findByPk(id);
    if (!role) return null;
    return await role.update(updateData);
  }

  async delete(id) {
    const role = await Role.findByPk(id);
    if (!role) return false;
    
    // 检查是否为系统角色
    if (role.isSystem) {
      throw new Error('系统角色不能删除');
    }
    
    // 检查是否有用户使用此角色
    const userCount = await User.count({
      include: [{
        model: Role,
        as: 'roles',
        where: { id }
      }]
    });
    
    if (userCount > 0) {
      throw new Error('该角色下还有用户，无法删除');
    }
    
    await role.destroy();
    return true;
  }

  async assignPermissions(roleId, permissionIds) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('角色不存在');
    }
    
    await role.setPermissions(permissionIds);
    return true;
  }

  async getRolePermissions(roleId) {
    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });
    
    return role ? role.permissions : [];
  }

  async getUsersByRole(roleId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    return await User.findAndCountAll({
      include: [{
        model: Role,
        as: 'roles',
        where: { id: roleId },
        through: { attributes: [] }
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new RoleRepository();