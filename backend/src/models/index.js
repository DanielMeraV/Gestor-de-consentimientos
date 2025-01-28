// src/models/index.js
/*const { sequelize } = require('../config/database');
const Consentimiento = require('./consentimiento');
const Persona = require('./persona');
const RegistroConsentimiento = require('./registroConsentimiento');


// Define las relaciones entre modelos aquí
function setupAssociations() {
    // Relación Persona - RegistroConsentimiento
    Persona.hasMany(RegistroConsentimiento, {
        foreignKey: 'PersonaID',
        sourceKey: 'PersonaID'
    });
    RegistroConsentimiento.belongsTo(Persona, {
        foreignKey: 'PersonaID',
        targetKey: 'PersonaID'
    });

    // Relación Consentimiento - RegistroConsentimiento
    Consentimiento.hasMany(RegistroConsentimiento, {
        foreignKey: 'ConsentimientoID',
        sourceKey: 'ConsentimientoID'
    });
    RegistroConsentimiento.belongsTo(Consentimiento, {
        foreignKey: 'ConsentimientoID',
        targetKey: 'ConsentimientoID'
    });
}

// Función para sincronizar todos los modelos
async function initializeModels() {
    try {
        // Configurar las relaciones
        setupAssociations();

        await sequelize.sync({ force: false });
        console.log('Modelos sincronizados correctamente con la base de datos');
    } catch (error) {
        console.error('Error al sincronizar los modelos:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    Consentimiento,
    Persona,
    RegistroConsentimiento,
    initializeModels
};*/

const { sequelize } = require('../config/database');

const { Consentimiento, ConsentimientoSchema } = require('./consentimiento');
const {Persona, PersonaSchema} = require('./persona');
const { RegistroConsentimiento, RegistroConsentimientoSchema } = require('./registroConsentimiento');

function setupModels() {
    Consentimiento.init(ConsentimientoSchema, Consentimiento.config(sequelize));
    Persona.init(PersonaSchema, Persona.config(sequelize));
    RegistroConsentimiento.init(RegistroConsentimientoSchema, RegistroConsentimiento.config(sequelize));

    // Definir las relaciones entre los modelos
    Persona.hasMany(RegistroConsentimiento, { foreignKey: 'PersonaID', as: 'RegistroConsentimientos' });
    RegistroConsentimiento.belongsTo(Persona, { foreignKey: 'PersonaID', as: 'Persona' });
    Consentimiento.hasMany(RegistroConsentimiento, { foreignKey: 'ConsentimientoID', as: 'RegistrosConsentimiento' });
    RegistroConsentimiento.belongsTo(Consentimiento, { foreignKey: 'ConsentimientoID', as: 'Consentimiento' });
}

async function initializeModels() {
    try {
        setupModels();

        await sequelize.sync({ force: false });
        console.log('Modelos sincronizados correctamente con la base de datos');
    } catch (error) {
        console.error('Error al sincronizar los modelos:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    Consentimiento,
    Persona,
    RegistroConsentimiento,
    initializeModels
};