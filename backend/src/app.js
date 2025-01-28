const express = require('express');
require('dotenv').config();
const { initializeModels } = require('./models');
const { testConnection } = require('./config/database');
const { testConnectionAudit } = require('./config/adutoriadb');

// Importar las rutas
const consentimientoRoutes = require('./routes/consentimientoRoutes');
const personaRoutes = require('./routes/personaRoutes');
const registroConsentimientoRoutes = require('./routes/registroConsentimientoRoutes');
const auditoriaPersonaRoutes = require('./routes/auditoriaPersonaRoutes');
const auditoriaConsentimientoRoutes = require('./routes/auditoriaConsentimientoRoutes');


const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/consentimientos', consentimientoRoutes);  
app.use('/api/personas', personaRoutes);                
app.use('/api/registros-consentimiento', registroConsentimientoRoutes);
app.use('/api/auditoria-personas', auditoriaPersonaRoutes);
app.use('/api/auditoria-consentimientos', auditoriaConsentimientoRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
async function startServer() {
    try {
        // Inicializar y sincronizar modelos
        await testConnection();
        await testConnectionAudit();
        await initializeModels();

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();

module.exports = app;