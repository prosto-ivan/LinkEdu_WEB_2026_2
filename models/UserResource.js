const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserResource = sequelize.define('UserResource', {
    user_resource_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    resource_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'none'
    },
    last_visited_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'UserResources',
    timestamps: false
});

module.exports = UserResource;