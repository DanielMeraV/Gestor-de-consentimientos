const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crear instancia de Sequelize
const sequelize = new Sequelize(
    process.env.DB_DATABASE, 
    process.env.DB_USER,     
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_SERVER,
        port: process.env.DB_PORT,
        dialect: 'mssql',
        dialectOptions: {
            options: {
                trustServerCertificate: true,
                encrypt: false, // 🔥 Desactiva encriptación si no se requiere
                enableArithAbort: true, // 🔥 Previene errores en SQL Server
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
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos principal establecida correctamente.');
        return true;
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    testConnection
};
