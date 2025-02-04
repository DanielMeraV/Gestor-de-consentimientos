const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // 🔥 Importación correcta

const RegistroConsentimiento_TB = 'RegistroConsentimientos';

class RegistroConsentimiento extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: RegistroConsentimiento_TB,
            modelName: 'RegistroConsentimiento',
            timestamps: false
        };
    }
}

const RegistroConsentimientoSchema = {
    RegistroID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'RegistroID',
    },
    PersonaID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Personas',
            key: 'PersonaID'
        },
        field: 'PersonaID',
    },
    ConsentimientoID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Consentimientos',
            key: 'ConsentimientoID'
        },
        field: 'ConsentimientoID',
    },
    Aceptado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: 'Aceptado',
    },
    VersionConsentimiento: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'VersionConsentimiento',
    },
    FechaOtorgamiento: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // ✅ Alternativa para evitar problemas con GETDATE()
        field: 'FechaOtorgamiento',
    }
    
};

module.exports = { RegistroConsentimiento, RegistroConsentimientoSchema };
