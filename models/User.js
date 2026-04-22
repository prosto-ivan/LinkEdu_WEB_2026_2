const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    defaultValue: 2
  },

  is_email_confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  failed_login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  lock_until: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;