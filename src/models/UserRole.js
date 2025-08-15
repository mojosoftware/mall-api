const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '角色ID'
  }
}, {
  tableName: 'user_roles',
  timestamps: true,
  comment: '用户角色关联表',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'roleId']
    }
  ]
});

module.exports = UserRole;