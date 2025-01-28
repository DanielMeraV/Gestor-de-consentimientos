const { Model, DataTypes } = require('sequelize');

const AuditoriaConsentimientos_TB = 'AuditoriaConsentimientos';

class AuditoriaConsentimiento extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: AuditoriaConsentimientos_TB,
            modelName: 'AuditoriaConsentimiento',
            timestamps: false
        };
    }
}

const AuditoriaConsentimientoSchema = {
    AuditoriaID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'AuditoriaID',
    },
    RegistroID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'RegistroID',
    },
    PersonaID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'PersonaID',
    },
    ConsentimientoID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ConsentimientoID',
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

module.exports = { AuditoriaConsentimiento, AuditoriaConsentimientoSchema };