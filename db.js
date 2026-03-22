const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('LinkEduHub', 'lab_user', 'Vanygar.962', {
    host: 'DESKTOP-VLAULDL\\SQLEXPRESS',
    dialect: 'mssql',
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    },
    logging: false // Вимкнено логування в консоль для економії ресурсів
});

module.exports = sequelize;