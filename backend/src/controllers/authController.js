const { Persona } = require("../models");
const { sequelize } = require("../config/database");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Función mejorada para verificar y abrir la clave simétrica
const openSymmetricKey = async () => {
  try {
    // Primero verifica si la clave ya está abierta
    const [keyStatus] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM sys.openkeys 
      WHERE key_name = 'MySymmetricKey'
    `);

    // Si la clave no está abierta, ábrela
    if (keyStatus[0].count === 0) {
      await sequelize.query(
        "OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate"
      );
    }
  } catch (error) {
    console.error("Error al abrir la clave simétrica:", error);
    throw error;
  }
};

// Función mejorada para verificar y cerrar la clave simétrica
const closeSymmetricKey = async () => {
  try {
    // Verifica si la clave está abierta antes de cerrarla
    const [keyStatus] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM sys.openkeys 
      WHERE key_name = 'MySymmetricKey'
    `);

    // Solo cierra la clave si está abierta
    if (keyStatus[0].count > 0) {
      await sequelize.query("CLOSE SYMMETRIC KEY MySymmetricKey");
    }
  } catch (error) {
    console.error("Error al cerrar la clave simétrica:", error);
    // No lanzamos el error para evitar interrumpir el flujo
  }
};

// Función para derivar clave usando PBKDF2
const deriveKey = (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });
};

const login = async (req, res) => {
  try {
    const { identificacion, password } = req.body;
    console.log("Intentando login con identificación:", identificacion);

    // Abre la clave simétrica con manejo de errores mejorado
    await openSymmetricKey();

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
      type: sequelize.QueryTypes.SELECT,
    });

    console.log(
      "Usuario encontrado:",
      persona
        ? {
            id: persona.PersonaID,
            nombre: persona.Nombre,
            identificacion: persona.DecryptedIdentificacion,
            tipoUsuario: persona.TipoUsuario,
            tieneHash: !!persona.PasswordHash,
            tieneSalt: !!persona.PasswordSalt,
          }
        : "No encontrado"
    );

    if (!persona) {
      console.log("Usuario no encontrado");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

// Verificar si la cuenta está bloqueada
if (persona.BloqueoHasta) {
  const fechaBloqueo = new Date(persona.BloqueoHasta);
  const ahora = new Date();
  
  if (ahora < fechaBloqueo) {
      // La cuenta aún está bloqueada
      const tiempoRestante = Math.ceil((fechaBloqueo - ahora) / 1000);
      console.log('Cuenta bloqueada:', {
          bloqueoHasta: fechaBloqueo,
          tiempoRestante
      });
      
      return res.status(403).json({ 
          error: `Cuenta bloqueada. Intente nuevamente en ${tiempoRestante} segundos.`,
          tiempoRestante: tiempoRestante
      });
  } else {
      // El bloqueo ya expiró, limpiar el estado
      try {
          await sequelize.query(`
              UPDATE Personas 
              SET IntentosLogin = 0, 
                  BloqueoHasta = NULL 
              WHERE PersonaID = :personaId
          `, {
              replacements: { personaId: persona.PersonaID }
          });
          
          // Actualizar el objeto persona en memoria
          persona.IntentosLogin = 0;
          persona.BloqueoHasta = null;
          
          console.log('Bloqueo expirado, estado limpiado');
      } catch (error) {
          console.error('Error al limpiar estado de bloqueo:', error);
          throw error;
      }
  }
}
  
  const inputHash = await deriveKey(password, persona.PasswordSalt);

// Después de derivar la clave
console.log('Verificando credenciales:', {
  tieneInputHash: !!inputHash,
  tienePasswordHash: !!persona.PasswordHash,
  intentosActuales: persona.IntentosLogin
});

if (!crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(persona.PasswordHash))) {
  // Incrementar contador de intentos
  const nuevosIntentos = (parseInt(persona.IntentosLogin) || 0) + 1;
  console.log('Intento fallido número:', nuevosIntentos);

  try {
      if (nuevosIntentos >= 3) {
          // Bloquear por 10 segundos
          const bloqueoQuery = `
              UPDATE Personas 
              SET IntentosLogin = ${nuevosIntentos},
                  BloqueoHasta = DATEADD(second, 10, GETDATE())
              WHERE PersonaID = ${persona.PersonaID}
          `;
          
          await sequelize.query(bloqueoQuery);
          
          return res.status(403).json({ 
              error: "Cuenta bloqueada por 10 segundos debido a múltiples intentos fallidos.",
              tiempoBloqueo: 10
          });
      } 

      // Actualizar intentos y mostrar mensaje desde el primer intento
      const updateQuery = `
          UPDATE Personas 
          SET IntentosLogin = ${nuevosIntentos}
          WHERE PersonaID = ${persona.PersonaID}
      `;
      
      await sequelize.query(updateQuery);
      
      // Mensaje para el primer intento también
      const intentosRestantes = 3 - nuevosIntentos;
      const mensaje = `Credenciales inválidas. Intento ${nuevosIntentos} de 3.${intentosRestantes > 0 ? ` Te ${intentosRestantes === 1 ? 'queda' : 'quedan'} ${intentosRestantes} ${intentosRestantes === 1 ? 'intento' : 'intentos'}.` : ''}`;
      
      return res.status(401).json({ 
          error: mensaje,
          intentoActual: nuevosIntentos,
          intentosRestantes: intentosRestantes
      });

  } catch (updateError) {
      console.error("Error al actualizar intentos:", updateError);
      throw new Error("Error al actualizar el estado de la cuenta");
  }
}
    // Resetear intentos después de login exitoso
    await sequelize.query(
      `
      UPDATE Personas 
      SET IntentosLogin = 0, BloqueoHasta = NULL 
      WHERE PersonaID = :personaId
    `,
      {
        replacements: { personaId: persona.PersonaID },
      }
    );

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no está configurado");
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
    console.error("Error detallado en login:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      error: "Error en el servidor",
      mensaje:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    try {
      await closeSymmetricKey();
    } catch (closeError) {
      console.error("Error al cerrar la clave simétrica:", closeError);
    }
  }
};

module.exports = { login };
