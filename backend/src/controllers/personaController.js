const { Persona } = require("../models");
const { sequelize } = require("../config/database");
const crypto = require('crypto');
require("dotenv").config();

// Función para abrir la clave simétrica
const openSymmetricKey = async () => {
  try {
    const [keyStatus] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM sys.openkeys 
      WHERE key_name = 'MySymmetricKey'
    `);
    
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

// Función para cerrar la clave simétrica
const closeSymmetricKey = async () => {
  try {
    const [keyStatus] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM sys.openkeys 
      WHERE key_name = 'MySymmetricKey'
    `);
    
    if (keyStatus[0].count > 0) {
      await sequelize.query("CLOSE SYMMETRIC KEY MySymmetricKey");
    }
  } catch (error) {
    console.error("Error al cerrar la clave simétrica:", error);
  }
};

// Función para generar salt
function generateSalt() {
  return crypto.randomBytes(32);
}

// Función para derivar clave usando PBKDF2
function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });
}

const crearPersona = async (req, res) => {
  let keyOpened = false;
  try {
    const {
      Nombre,
      Apellido,
      Identificacion,
      Password,
      FechaNacimiento,
      Telefono,
      Correo,
      Direccion,
      TipoUsuario = "cliente",
    } = req.body;

    // Validar campos requeridos
    if (
      !Nombre ||
      !Apellido ||
      !Identificacion ||
      !Password ||
      !FechaNacimiento ||
      !Telefono ||
      !Correo ||
      !Direccion
    ) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Generar salt y hash para la contraseña
    const salt = generateSalt();
    const passwordHash = await deriveKey(Password, salt);

    await openSymmetricKey();
    keyOpened = true;

    // Query modificado para retornar el ID insertado
    const query = `
      DECLARE @NewPersonaID INT;

      INSERT INTO Personas (
          Nombre, Apellido, Identificacion, PasswordHash, PasswordSalt, 
          FechaNacimiento, Telefono, Correo, Direccion, TipoUsuario
      )
      VALUES (
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Nombre AS NVARCHAR(100))),
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Apellido AS NVARCHAR(100))),
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Identificacion AS NVARCHAR(20))),
          :passwordHash,
          :salt,
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:FechaNacimiento AS NVARCHAR(10))),
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Telefono AS NVARCHAR(15))),
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Correo AS NVARCHAR(100))),
          EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Direccion AS NVARCHAR(255))),
          :TipoUsuario
      );
      
      SET @NewPersonaID = SCOPE_IDENTITY();
      SELECT @NewPersonaID as personaId;
    `;

    const [result] = await sequelize.query(query, {
      replacements: {
        Nombre,
        Apellido,
        Identificacion,
        passwordHash: Buffer.from(passwordHash),
        salt: Buffer.from(salt),
        FechaNacimiento,
        Telefono,
        Correo,
        Direccion,
        TipoUsuario: TipoUsuario || "cliente",
      },
      type: sequelize.QueryTypes.INSERT,
    });

    // Asegurarse de que tenemos un ID válido
    if (!result || !result[0] || !result[0].personaId) {
      throw new Error("No se pudo obtener el ID de la persona creada");
    }

    // Enviar respuesta con el ID de la persona creada
    res.status(201).json({
      message: "Persona creada correctamente",
      personaId: result[0].personaId
    });

  } catch (error) {
    console.error("Error al crear la persona:", error);
    res.status(500).json({ error: "Error al crear la persona" });
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

// Los demás métodos permanecen igual...
const obtenerPersonas = async (req, res) => {
  let keyOpened = false;
  try {
    await openSymmetricKey();
    keyOpened = true;

    const query = `
      SELECT 
        PersonaID,
        CAST(DecryptByKey(Nombre) AS NVARCHAR(100)) AS Nombre,
        CAST(DecryptByKey(Apellido) AS NVARCHAR(100)) AS Apellido,
        CAST(DecryptByKey(Identificacion) AS NVARCHAR(20)) AS Identificacion,
        CAST(DecryptByKey(FechaNacimiento) AS NVARCHAR(10)) AS FechaNacimiento,
        CAST(DecryptByKey(Telefono) AS NVARCHAR(15)) AS Telefono,
        CAST(DecryptByKey(Correo) AS NVARCHAR(100)) AS Correo,
        CAST(DecryptByKey(Direccion) AS NVARCHAR(255)) AS Direccion,
        TipoUsuario
      FROM Personas
    `;

    const personas = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    res.status(200).json(personas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las personas" });
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

const obtenerPersonaPorId = async (req, res) => {
  let keyOpened = false;
  try {
    await openSymmetricKey();
    keyOpened = true;

    const query = `
      SELECT 
        PersonaID,
        CAST(DecryptByKey(Nombre) AS NVARCHAR(100)) AS Nombre,
        CAST(DecryptByKey(Apellido) AS NVARCHAR(100)) AS Apellido,
        CAST(DecryptByKey(Identificacion) AS NVARCHAR(20)) AS Identificacion,
        CAST(DecryptByKey(FechaNacimiento) AS NVARCHAR(10)) AS FechaNacimiento,
        CAST(DecryptByKey(Telefono) AS NVARCHAR(15)) AS Telefono,
        CAST(DecryptByKey(Correo) AS NVARCHAR(100)) AS Correo,
        CAST(DecryptByKey(Direccion) AS NVARCHAR(255)) AS Direccion,
        TipoUsuario
      FROM Personas
      WHERE PersonaID = :id
    `;

    const [persona] = await sequelize.query(query, {
      replacements: { id: req.params.id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!persona) {
      return res.status(404).json({ error: "Persona no encontrada" });
    }
    res.status(200).json(persona);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la persona" });
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

const actualizarPersona = async (req, res) => {
  let keyOpened = false;
  try {
    const {
      Nombre,
      Apellido,
      Identificacion,
      FechaNacimiento,
      Telefono,
      Correo,
      Direccion,
    } = req.body;
    const personaId = req.params.id;

    if (
      !Nombre ||
      !Apellido ||
      !Identificacion ||
      !FechaNacimiento ||
      !Telefono ||
      !Correo ||
      !Direccion
    ) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const query = `
      UPDATE Personas
      SET 
          Nombre = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Nombre AS NVARCHAR(100))),
          Apellido = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Apellido AS NVARCHAR(100))),
          Identificacion = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Identificacion AS NVARCHAR(20))),
          FechaNacimiento = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:FechaNacimiento AS NVARCHAR(10))),
          Telefono = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Telefono AS NVARCHAR(15))),
          Correo = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Correo AS NVARCHAR(100))),
          Direccion = EncryptByKey(Key_GUID('MySymmetricKey'), CAST(:Direccion AS NVARCHAR(255)))
      WHERE PersonaID = :personaId;
    `;

    await openSymmetricKey();
    keyOpened = true;

    await sequelize.query(query, {
      replacements: {
        Nombre,
        Apellido,
        Identificacion,
        FechaNacimiento,
        Telefono,
        Correo,
        Direccion,
        personaId,
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    res.status(200).json({ message: "Persona actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la persona" });
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

const eliminarPersona = async (req, res) => {
  try {
      const personaId = req.params.id;
      
      // Primero, eliminar los registros de consentimiento asociados
      await sequelize.query(`
          DELETE FROM RegistroConsentimientos 
          WHERE PersonaID = :personaId
      `, {
          replacements: { personaId }
      });

      // Luego, eliminar la persona
      const persona = await Persona.findByPk(personaId);
      if (!persona) {
          return res.status(404).json({ error: "Persona no encontrada" });
      }
      
      await persona.destroy();
      res.status(200).json({ message: "Persona eliminada correctamente" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al eliminar la persona" });
  }
};

module.exports = {
  crearPersona,
  obtenerPersonas,
  obtenerPersonaPorId,
  actualizarPersona,
  eliminarPersona,
};