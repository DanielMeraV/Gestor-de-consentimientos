const express = require('express');
const router = express.Router();
const registroConsentimientoController = require('../controllers/registroConsentimientoController');

router.post('/', registroConsentimientoController.crearRegistroConsentimiento);
router.get('/', registroConsentimientoController.obtenerRegistrosConsentimiento);
router.get('/:id', registroConsentimientoController.obtenerRegistroConsentimientoPorId);
router.put('/:id', registroConsentimientoController.actualizarRegistroConsentimiento);
router.delete('/:id', registroConsentimientoController.eliminarRegistroConsentimiento);

module.exports = router;
