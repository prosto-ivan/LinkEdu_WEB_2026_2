const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const User = require('./models/User');
const Resource = require('./models/Resource');

const app = express();
const PORT = 3000;

// Зв'язки
User.hasMany(Resource, { foreignKey: 'created_by', as: 'createdResources' });
Resource.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Маршрути
app.use('/api/auth', authRoutes);

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