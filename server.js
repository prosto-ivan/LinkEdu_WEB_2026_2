const sequelize = require('./config/database');
const User = require('./models/User');
const Resource = require('./models/resource');

// One-to-Many: Адмін створює багато ресурсів
User.hasMany(Resource, { foreignKey: 'created_by', as: 'createdResources' });
Resource.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

async function runLab() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected ');
        await sequelize.sync({ force: false });

        // INSERT
        const admin = await User.create({
            username: 'IvanAdmin',
            email: `admin_${Date.now()}@linkedu.ua`,
            password_hash: 'hash123',
            role_id: 1 // admin
        });

        const res = await Resource.create({
            title: 'Advanced SQL Server Guide',
            url: 'https://microsoft.com',
            type_id: 2, // article
            created_by: admin.user_id
        });
        console.log('➕ Записи створено');

        // Пошук зі зв'язками
        const adminData = await User.findOne({
            where: { user_id: admin.user_id },
            include: [{ model: Resource, as: 'createdResources' }]
        });
        console.log(`📖 У адміна знайдено ресурсів: ${adminData.createdResources.length}`);

        // 3. UPDATE
        await Resource.update({ title: 'SQL Server Deep Dive' }, { where: { resource_id: res.resource_id } });
        console.log('🆙 Ресурс оновлено');

        // 4. DELETE
        await Resource.destroy({ where: { resource_id: res.resource_id } });

    } catch (err) {
        console.error('❌ Помилка:', err.message);
    } finally {
        await sequelize.close();
    }
}

runLab();