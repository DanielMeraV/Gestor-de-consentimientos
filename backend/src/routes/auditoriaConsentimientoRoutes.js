const express = require('express');
const router = express.Router();
const auditoriaConsentimientoController = require('../controllers/auditoriaConsentimientoController');

router.post('/', auditoriaConsentimientoController.crearAuditoriaConsentimiento);
router.get('/', auditoriaConsentimientoController.obtenerAuditoriasConsentimiento);
router.get('/:id', auditoriaConsentimientoController.obtenerAuditoriaConsentimientoPorId);
router.put('/:id', auditoriaConsentimientoController.actualizarAuditoriaConsentimiento);
router.delete('/:id', auditoriaConsentimientoController.eliminarAuditoriaConsentimiento);

module.exports = router;