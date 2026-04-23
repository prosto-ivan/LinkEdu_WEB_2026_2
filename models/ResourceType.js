const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceType = sequelize.define('ResourceType', {
    type_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type_name: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'ResourceTypes',
    timestamps: false
});

module.exports = ResourceType;