    const express = require('express');
    const router = express.Router();
    const consentimientoController = require('../controllers/consentimientoController');

    router.post('/', consentimientoController.crearConsentimiento);
    router.get('/', consentimientoController.obtenerConsentimientos);
    router.get('/:id', consentimientoController.obtenerConsentimientoPorId);
    router.put('/:id', consentimientoController.actualizarConsentimiento);
    router.delete('/:id', consentimientoController.eliminarConsentimiento);

    module.exports = router;
