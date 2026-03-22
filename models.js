const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// Модель Користувача
const User = sequelize.define('User', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true }
}, { timestamps: true });

// Модель Ресурсу
const Resource = sequelize.define('Resource', {
    resource_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING }, // 'Video', 'Article', 'Course'
    status: { type: DataTypes.STRING, defaultValue: 'none' }
}, { timestamps: true });

// Реалізація зв'язку One-to-Many (1:N)
User.hasMany(Resource, { foreignKey: 'created_by', as: 'myResources' });
Resource.belongsTo(User, { foreignKey: 'created_by' });

module.exports = { User, Resource, sequelize };