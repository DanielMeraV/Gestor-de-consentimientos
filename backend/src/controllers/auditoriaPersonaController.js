const { AuditoriaPersona } = require('../models');

const crearAuditoriaPersona = async (req, res) => {
    try {
        const nuevaAuditoria = await AuditoriaPersona.create(req.body);
        res.status(201).json(nuevaAuditoria);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la auditoría', error });
    }
};

const obtenerAuditoriasPersona = async (req, res) => {
    try {
        const auditorias = await AuditoriaPersona.findAll();
        res.json(auditorias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las auditorías', error });
    }
};

const obtenerAuditoriaPersonaPorId = async (req, res) => {
    try {
        const auditoria = await AuditoriaPersona.findByPk(req.params.id);
        if (!auditoria) {
            return res.status(404).json({ message: 'Auditoría no encontrada' });
        }
        res.json(auditoria);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la auditoría', error });
    }
};

const actualizarAuditoriaPersona = async (req, res) => {
    try {
        const auditoria = await AuditoriaPersona.findByPk(req.params.id);
        if (!auditoria) {
            return res.status(404).json({ message: 'Auditoría no encontrada' });
        }
        await auditoria.update(req.body);
        res.json(auditoria);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la auditoría', error });
    }
};

const eliminarAuditoriaPersona = async (req, res) => {
    try {
        const auditoria = await AuditoriaPersona.findByPk(req.params.id);
        if (!auditoria) {
            return res.status(404).json({ message: 'Auditoría no encontrada' });
        }
        await auditoria.destroy();
        res.json({ message: 'Auditoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la auditoría', error });
    }
};

module.exports = {
    crearAuditoriaPersona,
    obtenerAuditoriasPersona,
    obtenerAuditoriaPersonaPorId,
    actualizarAuditoriaPersona,
    eliminarAuditoriaPersona
};