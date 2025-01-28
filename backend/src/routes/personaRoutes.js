const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');

router.post('/', personaController.crearPersona);
router.get('/', personaController.obtenerPersonas);
router.get('/:id', personaController.obtenerPersonaPorId);
router.put('/:id', personaController.actualizarPersona);
router.delete('/:id', personaController.eliminarPersona);

module.exports = router;
