// database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crear instancia de Sequelize
const sequelizeAudit = new Sequelize(
    process.env.DB_AUDIT_DATABASE, 
    process.env.DB_USER,     
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_SERVER,
        port: process.env.DB_PORT,
        dialect: 'mssql',
        dialectOptions: {
            options: {
                trustServerCertificate: true,
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: false 
    }
);

// Función para probar la conexión
async function testConnectionAudit() {
    try {
        await sequelizeAudit.authenticate();
        console.log('Conexión a la base de datos de auditoria establecida correctamente.');
        return true;
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        return false;
    }
}

module.exports = {
    sequelizeAudit,
    testConnectionAudit
};