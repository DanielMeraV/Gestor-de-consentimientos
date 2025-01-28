const { sequelize } = require('../config/database');
const { sequelizeAudit } = require('../config/adutoriadb');

const { Consentimiento, ConsentimientoSchema } = require('./consentimiento');
const { Persona, PersonaSchema } = require('./persona');
const { RegistroConsentimiento, RegistroConsentimientoSchema } = require('./registroConsentimiento');
const { AuditoriaPersona, AuditoriaPersonaSchema } = require('./auditoriaPersona');
const { AuditoriaConsentimiento, AuditoriaConsentimientoSchema } = require('./auditoriaConsentimientos');

function setupModels() {
    // Inicialización de modelos principales
    Consentimiento.init(ConsentimientoSchema, Consentimiento.config(sequelize));
    Persona.init(PersonaSchema, Persona.config(sequelize));
    RegistroConsentimiento.init(RegistroConsentimientoSchema, RegistroConsentimiento.config(sequelize));

    // Inicialización de modelos de auditoría
    AuditoriaPersona.init(AuditoriaPersonaSchema, AuditoriaPersona.config(sequelizeAudit));
    AuditoriaConsentimiento.init(AuditoriaConsentimientoSchema, AuditoriaConsentimiento.config(sequelizeAudit));

    // Relaciones principales
    Persona.hasMany(RegistroConsentimiento, { foreignKey: 'PersonaID', as: 'RegistroConsentimientos' });
    RegistroConsentimiento.belongsTo(Persona, { foreignKey: 'PersonaID', as: 'Persona' });
    Consentimiento.hasMany(RegistroConsentimiento, { foreignKey: 'ConsentimientoID', as: 'RegistrosConsentimiento' });
    RegistroConsentimiento.belongsTo(Consentimiento, { foreignKey: 'ConsentimientoID', as: 'Consentimiento' });

    // Relaciones de auditoría
    Persona.hasMany(AuditoriaPersona, { foreignKey: 'PersonaID', as: 'Auditorias' });
    AuditoriaPersona.belongsTo(Persona, { foreignKey: 'PersonaID', as: 'Persona' });
}

async function initializeModels() {
    try {
        setupModels();

        // Sincronizar modelos principales
        await sequelize.sync({ force: false });
        // Sincronizar modelos de auditoría
        await sequelizeAudit.sync({ force: false });
        
        console.log('Modelos sincronizados correctamente con la base de datos');
    } catch (error) {
        console.error('Error al sincronizar los modelos:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    sequelizeAudit,
    Consentimiento,
    Persona,
    RegistroConsentimiento,
    AuditoriaPersona,
    AuditoriaConsentimiento,
    initializeModels
};