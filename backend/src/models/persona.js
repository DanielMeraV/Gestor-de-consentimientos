const { Model, DataTypes } = require('sequelize');

const Personas_TB = 'Personas';

class Persona extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: Personas_TB,
            modelName: 'Persona',
            timestamps: false
        };
    }
}

const PersonaSchema = {
    PersonaID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'PersonaID',
    },
    Nombre: {
        type: DataTypes.BLOB,
        allowNull: false,
        field: 'Nombre',
    },
    Apellido: {
        type: DataTypes.BLOB,
        allowNull: false,
        field: 'Apellido',
    },
    Identificacion: {
        type: DataTypes.BLOB,
        allowNull: false,
        field: 'Identificacion',
        unique: true
    },
    FechaNacimiento: {
        type: DataTypes.BLOB,
        allowNull: false,
        field: 'FechaNacimiento',
    },
    Telefono: {
        type: DataTypes.BLOB,
        allowNull: true,
        field: 'Telefono',
    },
    Correo: {
        type: DataTypes.BLOB,
        allowNull: true,
        field: 'Correo',
    },
    Direccion: {
        type: DataTypes.BLOB,
        allowNull: true,
        field: 'Direccion',
    },
    TipoUsuario: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'TipoUsuario',
        defaultValue: 'cliente',
        validate: {
            isIn: [['administrador', 'cliente']],
        },
    },
    PasswordHash: {
        type: DataTypes.BLOB,
        allowNull: false,
        field: 'PasswordHash',
    },
    PasswordSalt: {
        type: DataTypes.BLOB,
        allowNull: false,
        field: 'PasswordSalt',
    },
    IntentosLogin: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'IntentosLogin'
    },
    BloqueoHasta: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'BloqueoHasta'
    }

};

module.exports = { Persona, PersonaSchema };