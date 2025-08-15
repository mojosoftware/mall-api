const Permission = require('../models/Permission');
const Role = require('../models/Role');
const { Op } = require('sequelize');

class PermissionRepository {
  async create(permissionData) {
    return await Permission.create(permissionData);
  }

  async findById(id) {
    return await Permission.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'parent'
        },
        {
          model: Permission,
          as: 'children'
        }
      ]
    });
  }

  async findByCode(code) {
    return await Permission.findOne({ where: { code } });
  }

  async findAll(options = {}) {
    const { page, limit, name, type, status, parentId } = options;
    
    const where = {};
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const queryOptions = {
      where,
      include: [
        {
          model: Permission,
          as: 'parent'
        },
        {
          model: Permission,
          as: 'children'
        }
      ],
      order: [['sort', 'ASC'], ['createdAt', 'DESC']]
    };

    // 如果指定了分页参数
    if (page && limit) {
      const offset = (page - 1) * limit;
      queryOptions.limit = limit;
      queryOptions.offset = offset;
      return await Permission.findAndCountAll(queryOptions);
    }

    // 不分页，返回所有数据
    const permissions = await Permission.findAll(queryOptions);
    return {
      rows: permissions,
      count: permissions.length
    };
  }

  async findTree(options = {}) {
    const { status = 'active' } = options;
    
    const permissions = await Permission.findAll({
      where: { status },
      order: [['sort', 'ASC'], ['createdAt', 'DESC']]
    });

    return this.buildTree(permissions);
  }

  buildTree(permissions, parentId = null) {
    const tree = [];
    
    for (const permission of permissions) {
      if (permission.parentId === parentId) {
        const children = this.buildTree(permissions, permission.id);
        const node = {
          ...permission.toJSON(),
          children: children.length > 0 ? children : undefined
        };
        tree.push(node);
      }
    }
    
    return tree;
  }

  async update(id, updateData) {
    const permission = await Permission.findByPk(id);
    if (!permission) return null;
    return await permission.update(updateData);
  }

  async delete(id) {
    const permission = await Permission.findByPk(id);
    if (!permission) return false;
    
    // 检查是否为系统权限
    if (permission.isSystem) {
      throw new Error('系统权限不能删除');
    }
    
    // 检查是否有子权限
    const childCount = await Permission.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new Error('该权限下还有子权限，无法删除');
    }
    
    // 检查是否有角色使用此权限
    const roleCount = await Role.count({
      include: [{
        model: Permission,
        as: 'permissions',
        where: { id }
      }]
    });
    
    if (roleCount > 0) {
      throw new Error('该权限被角色使用，无法删除');
    }
    
    await permission.destroy();
    return true;
  }

  async getMenuPermissions(userId) {
    // 获取用户的所有菜单权限
    const permissions = await Permission.findAll({
      where: {
        type: 'menu',
        status: 'active'
      },
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        include: [{
          model: User,
          as: 'users',
          where: { id: userId },
          through: { attributes: [] }
        }]
      }],
      order: [['sort', 'ASC']]
    });

    return this.buildTree(permissions);
  }

  async getUserPermissions(userId) {
    // 获取用户的所有权限
    return await Permission.findAll({
      where: { status: 'active' },
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        include: [{
          model: User,
          as: 'users',
          where: { id: userId },
          through: { attributes: [] }
        }]
      }]
    });
  }

  async checkUserPermission(userId, permissionCode) {
    const permission = await Permission.findOne({
      where: { 
        code: permissionCode,
        status: 'active'
      },
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        include: [{
          model: User,
          as: 'users',
          where: { id: userId },
          through: { attributes: [] }
        }]
      }]
    });

    return !!permission;
  }
}

module.exports = new PermissionRepository();