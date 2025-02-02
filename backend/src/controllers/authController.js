const { Persona } = require("../models");
const { sequelize } = require("../config/database");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
require("dotenv").config();

const openSymmetricKey = async () => {
  await sequelize.query(
    "OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate"
  );
};

const closeSymmetricKey = async () => {
  await sequelize.query("CLOSE SYMMETRIC KEY MySymmetricKey");
};

// Función para derivar clave usando PBKDF2
const deriveKey = (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });
};

const login = async (req, res) => {
  let keyOpened = false;
  try {
    const { identificacion, password } = req.body;
    console.log("Intentando login con identificación:", identificacion);

    await openSymmetricKey();
    keyOpened = true;

    const query = `
      SELECT 
        PersonaID,
        CAST(DecryptByKey(Nombre) AS NVARCHAR(100)) AS Nombre,
        CAST(DecryptByKey(Apellido) AS NVARCHAR(100)) AS Apellido,
        PasswordHash,
        PasswordSalt,
        TipoUsuario,
        IntentosLogin,
        BloqueoHasta
      FROM Personas
      WHERE CAST(DecryptByKey(Identificacion) AS NVARCHAR(20)) = :identificacion
    `;

    const [persona] = await sequelize.query(query, {
      replacements: { identificacion },
      type: sequelize.QueryTypes.SELECT
    });

    console.log("Usuario encontrado:", persona ? {
        id: persona.PersonaID,
        nombre: persona.Nombre,
        identificacion: persona.DecryptedIdentificacion,
        tipoUsuario: persona.TipoUsuario,
        tieneHash: !!persona.PasswordHash,
        tieneSalt: !!persona.PasswordSalt
      } : 'No encontrado');

      if (!persona) {
        console.log("Usuario no encontrado");
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

    // Verificar si la cuenta está bloqueada
    if (persona.BloqueoHasta && new Date() < new Date(persona.BloqueoHasta)) {
        const tiempoRestante = Math.ceil((new Date(persona.BloqueoHasta) - new Date()) / 1000 / 60);
        return res.status(403).json({ 
          error: `Cuenta bloqueada. Intente nuevamente en ${tiempoRestante} minutos.` 
        });
      }
  
      // Si ya pasó el tiempo de bloqueo, reiniciamos los intentos
      if (persona.BloqueoHasta && new Date() >= new Date(persona.BloqueoHasta)) {
        await sequelize.query(`
          UPDATE Personas 
          SET IntentosLogin = 0, BloqueoHasta = NULL 
          WHERE PersonaID = :personaId
        `, {
          replacements: { personaId: persona.PersonaID }
        });
        persona.IntentosLogin = 0;
      }

    const inputHash = await deriveKey(password, persona.PasswordSalt);
    
    if (!crypto.timingSafeEqual(inputHash, persona.PasswordHash)) {
        // Incrementar contador de intentos
        const nuevosIntentos = (persona.IntentosLogin || 0) + 1;
        let bloqueoHasta = null;
  
        if (nuevosIntentos >= 3) {
          // Bloquear por 15 minutos
          bloqueoHasta = new Date(Date.now() + 15 * 60000);
        }
  
        await sequelize.query(`
          UPDATE Personas 
          SET IntentosLogin = :intentos, 
              BloqueoHasta = :bloqueoHasta
          WHERE PersonaID = :personaId
        `, {
          replacements: { 
            intentos: nuevosIntentos,
            bloqueoHasta: bloqueoHasta,
            personaId: persona.PersonaID
          }
        });
  
        if (nuevosIntentos >= 3) {
          return res.status(403).json({ 
            error: "Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos." 
          });
        }
  
        return res.status(401).json({ 
          error: `Credenciales inválidas. Intentos restantes: ${3 - nuevosIntentos}` 
        });
      }
  
      // Resetear intentos después de login exitoso
      await sequelize.query(`
        UPDATE Personas 
        SET IntentosLogin = 0, BloqueoHasta = NULL 
        WHERE PersonaID = :personaId
      `, {
        replacements: { personaId: persona.PersonaID }
      });

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado');
      }

    const token = jwt.sign(
      {
        id: persona.PersonaID,
        tipo: persona.TipoUsuario,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("Login exitoso");
    
    res.json({
      token,
      user: {
        id: persona.PersonaID,
        nombre: persona.Nombre,
        apellido: persona.Apellido,
        tipoUsuario: persona.TipoUsuario,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  } finally {
    if (keyOpened) {
      try {
        await closeSymmetricKey();
      } catch (err) {
        console.error("Error al cerrar la clave simétrica:", err);
      }
    }
  }
};

module.exports = { login };