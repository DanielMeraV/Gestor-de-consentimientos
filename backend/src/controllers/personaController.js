const { Persona } = require('../models');

const crearPersona = async (req, res) => {
    try {
        const { Nombre, Apellido, Identificacion, FechaNacimiento, Telefono, Correo, Direccion } = req.body;
        const persona = await Persona.create({ Nombre, Apellido, Identificacion, FechaNacimiento, Telefono, Correo, Direccion });
        res.status(201).json(persona);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la persona' });
    }
};

const obtenerPersonas = async (req, res) => {
    try {
        const personas = await Persona.findAll();
        res.status(200).json(personas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las personas' });
    }
};

const obtenerPersonaPorId = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.status(200).json(persona);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la persona' });
    }
};

const actualizarPersona = async (req, res) => {
    try {
        const { Nombre, Apellido, Identificacion, FechaNacimiento, Telefono, Correo, Direccion } = req.body;
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        await persona.update({ Nombre, Apellido, Identificacion, FechaNacimiento, Telefono, Correo, Direccion });
        res.status(200).json(persona);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la persona' });
    }
};

const eliminarPersona = async (req, res) => {
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        await persona.destroy();
        res.status(200).json({ message: 'Persona eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la persona' });
    }
};

module.exports = {
    crearPersona,
    obtenerPersonas,
    obtenerPersonaPorId,
    actualizarPersona,
    eliminarPersona
};
