

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'LinkEduHub',  // database name
  'lab_user',    // login
  'Vanygar.962', // password
  {
    host: 'localhost',
    port: 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000,
      }
    },
    logging: console.log,
  }
);

module.exports = sequelize;