const { Model, DataTypes } = require('sequelize');

const AuditoriaPersonas_TB = 'AuditoriaPersonas';

class AuditoriaPersona extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: AuditoriaPersonas_TB,
            modelName: 'AuditoriaPersona',
            timestamps: false
        };
    }
}

const AuditoriaPersonaSchema = {
    AuditoriaID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'AuditoriaID',
    },
    PersonaID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'PersonaID',
    },
    Accion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'Accion',
    },
    Fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'Fecha',
    },
    Detalles: {
        type: DataTypes.STRING(255),
        field: 'Detalles',
    }
};

module.exports = { AuditoriaPersona, AuditoriaPersonaSchema };