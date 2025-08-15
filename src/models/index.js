const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Cart = require('./Cart');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const UserRole = require('./UserRole');

// 用户与订单的一对多关系
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 用户与购物车的一对多关系
User.hasMany(Cart, { foreignKey: 'userId', as: 'cartItems' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 分类与商品的一对多关系
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// 订单与订单项的一对多关系
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// 商品与订单项的一对多关系
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// 商品与购物车的一对多关系
Product.hasMany(Cart, { foreignKey: 'productId', as: 'cartItems' });
Cart.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// RBAC权限关系
// 用户与角色的多对多关系
User.belongsToMany(Role, { 
  through: UserRole, 
  foreignKey: 'userId', 
  otherKey: 'roleId',
  as: 'roles' 
});
Role.belongsToMany(User, { 
  through: UserRole, 
  foreignKey: 'roleId', 
  otherKey: 'userId',
  as: 'users' 
});

// 角色与权限的多对多关系
Role.belongsToMany(Permission, { 
  through: RolePermission, 
  foreignKey: 'roleId', 
  otherKey: 'permissionId',
  as: 'permissions' 
});
Permission.belongsToMany(Role, { 
  through: RolePermission, 
  foreignKey: 'permissionId', 
  otherKey: 'roleId',
  as: 'roles' 
});

// 权限的自关联关系（父子权限）
Permission.hasMany(Permission, { foreignKey: 'parentId', as: 'children' });
Permission.belongsTo(Permission, { foreignKey: 'parentId', as: 'parent' });
module.exports = {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Cart,
  Role,
  Permission,
  RolePermission,
  UserRole
}; 