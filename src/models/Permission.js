const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '权限名称'
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '权限编码'
  },
  type: {
    type: DataTypes.ENUM('menu', 'button', 'api'),
    allowNull: false,
    comment: '权限类型'
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '父级权限ID'
  },
  path: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '路由路径'
  },
  component: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '组件路径'
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '图标'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'HTTP方法'
  },
  url: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'API路径'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '权限描述'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '权限状态'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否系统权限'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  comment: '权限表'
});

module.exports = Permission;