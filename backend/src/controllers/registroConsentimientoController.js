const { RegistroConsentimiento, Persona, Consentimiento } = require('../models');

const crearRegistroConsentimiento = async (req, res) => {
    try {
        const { PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento } = req.body;
        const registro = await RegistroConsentimiento.create({ PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento });
        res.status(201).json(registro);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el registro de consentimiento' });
    }
};

const obtenerRegistrosConsentimiento = async (req, res) => {
    try {
        const registros = await RegistroConsentimiento.findAll({
            include: [
                { model: Persona, as: 'Persona' },
                { model: Consentimiento, as: 'Consentimiento' }
            ]
        });
        res.status(200).json(registros);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los registros de consentimiento' });
    }
};

const obtenerRegistroConsentimientoPorId = async (req, res) => {
    try {
        const registro = await RegistroConsentimiento.findByPk(req.params.id, {
            include: [
                { model: Persona, as: 'Persona' },
                { model: Consentimiento, as: 'Consentimiento' }
            ]
        });
        if (!registro) {
            return res.status(404).json({ error: 'Registro de consentimiento no encontrado' });
        }
        res.status(200).json(registro);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el registro de consentimiento' });
    }
};

const actualizarRegistroConsentimiento = async (req, res) => {
    try {
        const { PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento } = req.body;
        const registro = await RegistroConsentimiento.findByPk(req.params.id);
        if (!registro) {
            return res.status(404).json({ error: 'Registro de consentimiento no encontrado' });
        }
        await registro.update({ PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento });
        res.status(200).json(registro);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el registro de consentimiento' });
    }
};

const eliminarRegistroConsentimiento = async (req, res) => {
    try {
        const registro = await RegistroConsentimiento.findByPk(req.params.id);
        if (!registro) {
            return res.status(404).json({ error: 'Registro de consentimiento no encontrado' });
        }
        await registro.destroy();
        res.status(200).json({ message: 'Registro de consentimiento eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el registro de consentimiento' });
    }
};

module.exports = {
    crearRegistroConsentimiento,
    obtenerRegistrosConsentimiento,
    obtenerRegistroConsentimientoPorId,
    actualizarRegistroConsentimiento,
    eliminarRegistroConsentimiento
};
