const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '角色描述'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '角色状态'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否系统角色'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  comment: '角色表'
});

module.exports = Role;