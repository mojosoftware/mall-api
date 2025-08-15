const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '角色ID'
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '权限ID'
  }
}, {
  tableName: 'role_permissions',
  timestamps: true,
  comment: '角色权限关联表',
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'permissionId']
    }
  ]
});

module.exports = RolePermission;