/**
 * Модель Resource (таблиця Resources)
 * Відповідає навчальним ресурсам у каталозі LinkEduHub
 * Зв'язок: User hasMany Resource (One-to-Many)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Resource = sequelize.define('Resource', {
  resource_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    // 'video', 'article', 'course'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'none',
    // 'none', 'planned', 'learning', 'learned'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // Зовнішній ключ — вказує на Users.user_id
  },
}, {
  tableName: 'Resources',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

module.exports = Resource;