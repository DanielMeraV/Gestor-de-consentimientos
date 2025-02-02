const { RegistroConsentimiento, Persona, Consentimiento } = require('../models');
const { sequelize } = require('../config/database'); // 🔥 Importación correcta

const obtenerFechaSQL = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    
    return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`; // 🔥 Sin milisegundos ni zona horaria
};

// ✅ Crear un nuevo registro de consentimiento utilizando el procedimiento almacenado
const crearRegistroConsentimiento = async (req, res) => {
    try {
        console.log("📥 Datos recibidos en el backend (POST):", req.body);

        const { PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento } = req.body;
        const FechaOtorgamiento = obtenerFechaSQL(); // Generamos la fecha corregida

        console.log("🕒 Fecha enviada a SQL Server:", FechaOtorgamiento); // 🔍 Depuración

        // 🔥 Llamamos al procedimiento almacenado `sp_InsertarRegistroConsentimiento`
        const resultado = await sequelize.query(
            `DECLARE @RegistroID INT;
            EXEC sp_InsertarRegistroConsentimiento 
                :PersonaID, 
                :ConsentimientoID, 
                :Aceptado, 
                :VersionConsentimiento, 
                :FechaOtorgamiento, 
                @RegistroID OUTPUT;
            SELECT @RegistroID AS RegistroID;`, 
            {
                replacements: { PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento, FechaOtorgamiento },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!resultado || resultado.length === 0) {
            throw new Error("No se pudo obtener el RegistroID");
        }

        console.log("✅ Registro creado correctamente:", resultado[0]);

        res.status(201).json({
            message: "Registro creado exitosamente",
            registroID: resultado[0].RegistroID
        });

    } catch (error) {
        console.error("❌ Error al crear el consentimiento:", error);
        res.status(500).json({ error: "Error al crear el registro de consentimiento" });
    }
};

// ✅ Obtener todos los registros de consentimiento
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
        console.error("❌ Error al obtener registros de consentimiento:", error);
        res.status(500).json({ error: "Error al obtener los registros de consentimiento" });
    }
};

// ✅ Obtener un solo registro por ID
const obtenerRegistroConsentimientoPorId = async (req, res) => {
    try {
        const registro = await RegistroConsentimiento.findByPk(req.params.id, {
            include: [
                { model: Persona, as: 'Persona' },
                { model: Consentimiento, as: 'Consentimiento' }
            ]
        });

        if (!registro) {
            return res.status(404).json({ error: "Registro de consentimiento no encontrado" });
        }

        res.status(200).json(registro);
    } catch (error) {
        console.error("❌ Error al obtener el registro de consentimiento:", error);
        res.status(500).json({ error: "Error al obtener el registro de consentimiento" });
    }
};

// ✅ Actualizar un registro de consentimiento
const actualizarRegistroConsentimiento = async (req, res) => {
    try {
        console.log("📥 Datos recibidos en el backend (PUT):", req.body);

        const { PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento } = req.body;
        const { id } = req.params;
        const FechaOtorgamiento = obtenerFechaSQL(); // Convertimos la fecha al formato correcto

        let registro = await RegistroConsentimiento.findByPk(id);

        if (!registro) {
            return res.status(404).json({ error: "Registro de consentimiento no encontrado" });
        }

        await registro.update({ PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento, FechaOtorgamiento });

        res.status(200).json(registro);
    } catch (error) {
        console.error("❌ Error al actualizar el consentimiento:", error);
        res.status(500).json({ error: "Error al actualizar el registro de consentimiento" });
    }
};

// ✅ Eliminar un registro de consentimiento
const eliminarRegistroConsentimiento = async (req, res) => {
    try {
        const registro = await RegistroConsentimiento.findByPk(req.params.id);

        if (!registro) {
            return res.status(404).json({ error: "Registro de consentimiento no encontrado" });
        }

        await registro.destroy();
        res.status(200).json({ message: "Registro de consentimiento eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar el consentimiento:", error);
        res.status(500).json({ error: "Error al eliminar el registro de consentimiento" });
    }
};

// ✅ Exportamos todas las funciones correctamente después de su declaración
module.exports = {
    crearRegistroConsentimiento,
    obtenerRegistrosConsentimiento,
    obtenerRegistroConsentimientoPorId,
    actualizarRegistroConsentimiento,
    eliminarRegistroConsentimiento
};