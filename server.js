const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const userResourceRoutes = require('./routes/userResourceRoutes');
const metaRoutes = require('./routes/metaRoutes');

const Role = require('./models/Role');
const ResourceType = require('./models/ResourceType');
const User = require('./models/User');
const Resource = require('./models/Resource');
const UserResource = require('./models/UserResource');

const app = express();
const PORT = 3000;

// Зв'язки

User.belongsToMany(Resource, {
    through: UserResource,
    foreignKey: 'user_id',
    otherKey: 'resource_id',
    as: 'learningResources'
});

Resource.belongsToMany(User, {
    through: UserResource,
    foreignKey: 'resource_id',
    otherKey: 'user_id',
    as: 'usersLearning'
});

Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

ResourceType.hasMany(Resource, { foreignKey: 'type_id', as: 'resources' });
Resource.belongsTo(ResourceType, { foreignKey: 'type_id', as: 'resourceType' });

User.hasMany(UserResource, { foreignKey: 'user_id', as: 'resourceStatuses' });
UserResource.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Resource.hasMany(UserResource, { foreignKey: 'resource_id', as: 'userStatuses' });
UserResource.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });
User.hasMany(Resource, { foreignKey: 'created_by', as: 'createdResources' });
Resource.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Маршрути
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/user-resources', userResourceRoutes);
app.use('/api/meta', metaRoutes);

// Тестовий маршрут
app.get('/', (req, res) => {
    res.send('REST API працює');
});

// Запуск сервера
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Підключення до БД успішне');

        await sequelize.sync({ alter: false });
        console.log('✅ Таблиці синхронізовано');

        app.listen(PORT, () => {
            console.log(`✅ Сервер запущено: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Помилка запуску сервера:', error);
    }
}

startServer();