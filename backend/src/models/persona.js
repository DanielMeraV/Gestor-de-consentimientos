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
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'Nombre',
    },
    Apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'Apellido',
    },
    Identificacion: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'Identificacion',
        unique: true
    },
    FechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'FechaNacimiento',
    },
    Telefono: {
        type: DataTypes.STRING(15),
        allowNull: true,
        field: 'Telefono',
    },
    Correo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'Correo',
    },
    Direccion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'Direccion',
    }
};

module.exports = { Persona, PersonaSchema };