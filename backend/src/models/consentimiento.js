const { Model, DataTypes } = require('sequelize');

const Consentimientos_TB = 'Consentimientos';

class Consentimiento extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: Consentimientos_TB,
            modelName: 'Consentimiento',
            timestamps: false
        };
    }
}

const ConsentimientoSchema = {
    ConsentimientoID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'ConsentimientoID',
    },
    NombreConsentimiento: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'NombreConsentimiento',
    },
    Descripcion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'Descripcion',
    }
};

module.exports = { Consentimiento, ConsentimientoSchema };