const express = require('express');
const router = express.Router();
const auditoriaPersonaController = require('../controllers/auditoriaPersonaController');

router.post('/', auditoriaPersonaController.crearAuditoriaPersona);
router.get('/', auditoriaPersonaController.obtenerAuditoriasPersona);
router.get('/:id', auditoriaPersonaController.obtenerAuditoriaPersonaPorId);
router.put('/:id', auditoriaPersonaController.actualizarAuditoriaPersona);
router.delete('/:id', auditoriaPersonaController.eliminarAuditoriaPersona);

module.exports = router;