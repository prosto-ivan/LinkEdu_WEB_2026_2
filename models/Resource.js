const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resource = sequelize.define('Resource', {
  resource_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Resources',
  timestamps: true
});

module.exports = Resource;