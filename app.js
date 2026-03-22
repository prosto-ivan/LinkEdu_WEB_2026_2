const { User, Resource, sequelize } = require('./models');

async function runLab() {
    try {
        // Синхронізація з базою даних
        await sequelize.authenticate();
        console.log('✅ Підключення до SQL Server успішне!');
        await sequelize.sync({ force: false });

        // 1. INSERT: Створення користувача та ресурсів (One-to-Many)
        const admin = await User.create({ 
            username: 'IvanAdmin', 
            email: 'ivan@kpi.ua' 
        });

        await Resource.create({ 
            title: 'Node.js для початківців', 
            type: 'Course', 
            created_by: admin.user_id 
        });

        // 2. SELECT: Отримання користувача разом з його ресурсами
        const userData = await User.findOne({
            where: { username: 'IvanAdmin' },
            include: 'myResources'
        });
        console.log('📖 Знайдено ресурсів користувача:', userData.myResources.length);

        // 3. UPDATE: Зміна статусу ресурсу
        await Resource.update(
            { status: 'learning' },
            { where: { title: 'Node.js для початківців' } }
        );
        console.log('🆙 Статус ресурсу оновлено.');

        // 4. DELETE: Видалення (приклад)
        // await Resource.destroy({ where: { id: 1 } });

    } catch (error) {
        console.error('❌ Помилка:', error.message);
    } finally {
        await sequelize.close();
    }
}

runLab();