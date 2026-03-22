const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,    // ВАЖЛИВО: CamelCase
    autoIncrement: true  // Тільки один автоінкремент на модель
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
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // Тут НЕ має бути autoIncrement
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;