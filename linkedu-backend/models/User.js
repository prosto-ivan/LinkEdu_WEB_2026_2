/**
 * Модель User (таблиця Users)
 * Відповідає таблиці Users у базі даних LinkEduHub
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user', // 'admin', 'user', 'guest'
  },
  settings_json: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Users',
  timestamps: true,               // Sequelize сам керує createdAt і updatedAt
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

module.exports = User;