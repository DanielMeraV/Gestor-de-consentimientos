const express = require('express');
const cors = require('cors');
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
const authRoutes = require('./routes/authRoutes');

const app = express();

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:5173', // URL de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS - solo una vez y antes de las rutas
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request body:', req.body);
    next();
});

// Rutas
app.use('/api/consentimientos', consentimientoRoutes);  
app.use('/api/personas', personaRoutes);                
app.use('/api/registros-consentimiento', registroConsentimientoRoutes);
app.use('/api/auditoria-personas', auditoriaPersonaRoutes);
app.use('/api/auditoria-consentimientos', auditoriaConsentimientoRoutes);
app.use('/api/auth', authRoutes);

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
});

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