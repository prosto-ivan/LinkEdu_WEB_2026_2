require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const userResourceRoutes = require('./routes/userResourceRoutes');
const metaRoutes = require('./routes/metaRoutes');
const performanceMiddleware = require('./middleware/performanceMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');
const { logger } = require('./utils/logger');

const Role = require('./models/Role');
const ResourceType = require('./models/ResourceType');
const User = require('./models/User');
const Resource = require('./models/Resource');
const UserResource = require('./models/UserResource');

const app = express();
const PORT = 3000;


if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'logs', 'access.log'),
    { flags: 'a' }
);

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

app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLogStream }));

app.use(performanceMiddleware);

app.use(passport.initialize());

// Маршрути
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/user-resources', userResourceRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api', uploadRoutes);
app.use('/api', statusRoutes);

async function startServer() {
    logger.info('Server started on port 3000');
    try {
        await sequelize.authenticate();
        console.log('✅ Підключення до БД успішне');

        await sequelize.sync({ alter: false });
        console.log('✅ Таблиці синхронізовано');

        app.listen(PORT, () => {
            logger.info('[logger] Server started on port 3000');
            console.log(`✅ Сервер запущено: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Помилка запуску сервера:', error);
    }
}
app.use(errorMiddleware);

startServer();