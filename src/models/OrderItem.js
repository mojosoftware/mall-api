const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  productImage: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  hooks: {
    beforeCreate: (item) => {
      item.subtotal = item.price * item.quantity;
    },
    beforeUpdate: (item) => {
      if (item.changed('price') || item.changed('quantity')) {
        item.subtotal = item.price * item.quantity;
      }
    }
  }
});

module.exports = OrderItem; 