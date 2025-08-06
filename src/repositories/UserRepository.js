const User = require('../models/User');
const { Op } = require('sequelize');

class UserRepository {
  async create(userData) {
    return await User.create(userData);
  }

  async findById(id) {
    return await User.findByPk(id);
  }

  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  async findByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  async update(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return await user.update(updateData);
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  async findAll(options = {}) {
    const { page = 1, limit = 10, search, role, status } = options;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    return await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });
  }

  async count(options = {}) {
    const where = {};
    if (options.role) {
      where.role = options.role;
    }
    if (options.status) {
      where.status = options.status;
    }
    return await User.count({ where });
  }

  async updateLastLogin(id) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return await user.update({ lastLoginAt: new Date() });
  }
}

module.exports = new UserRepository(); 