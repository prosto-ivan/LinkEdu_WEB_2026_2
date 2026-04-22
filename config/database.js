const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'LinkEduHub',  
  'lab_user',    
  'Vanygar.962', 
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
    logging: false,
  }
);

module.exports = sequelize;