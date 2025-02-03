const { Consentimiento } = require('../models');

const crearConsentimiento = async (req, res) => {
    try {
        const { NombreConsentimiento, Descripcion } = req.body;
        const consentimiento = await Consentimiento.create({ NombreConsentimiento, Descripcion });
        res.status(201).json(consentimiento);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el consentimiento' });
    }
};

const obtenerConsentimientos = async (req, res) => {
    try {
        const consentimientos = await Consentimiento.findAll();
        res.status(200).json(consentimientos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los consentimientos' });
    }
};

const obtenerConsentimientoPorId = async (req, res) => {
    try {
        const consentimiento = await Consentimiento.findByPk(req.params.id);
        if (!consentimiento) {
            return res.status(404).json({ error: 'Consentimiento no encontrado' });
        }
        res.status(200).json(consentimiento);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el consentimiento' });
    }
};

const actualizarConsentimiento = async (req, res) => {
    try {
        const { NombreConsentimiento, Descripcion } = req.body;
        const consentimiento = await Consentimiento.findByPk(req.params.id);
        if (!consentimiento) {
            return res.status(404).json({ error: 'Consentimiento no encontrado' });
        }
        await consentimiento.update({ NombreConsentimiento, Descripcion });
        res.status(200).json(consentimiento);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el consentimiento' });
    }
};

const eliminarConsentimiento = async (req, res) => {
    try {
        const consentimiento = await Consentimiento.findByPk(req.params.id);
        if (!consentimiento) {
            return res.status(404).json({ error: 'Consentimiento no encontrado' });
        }
        await consentimiento.destroy();
        res.status(200).json({ message: 'Consentimiento eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el consentimiento' });
    }
};

module.exports = {
    crearConsentimiento,
    obtenerConsentimientos,
    obtenerConsentimientoPorId,
    actualizarConsentimiento,
    eliminarConsentimiento
};