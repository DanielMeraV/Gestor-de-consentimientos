const { Persona } = require("../models");
const { sequelize } = require("../config/database");
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Función para abrir la clave simétrica
const openSymmetricKey = async () => {
  await sequelize.query(
    "OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate"
  );
};

// Función para cerrar la clave simétrica
const closeSymmetricKey = async () => {
  await sequelize.query("CLOSE SYMMETRIC KEY MySymmetricKey");
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
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Generar salt aleatorio
    const salt = generateSalt();
    // Generar hash usando PBKDF2
    const passwordHash = await deriveKey(Password, salt);

    console.log("Hash generado:", {
      length: passwordHash.length,
      sample: passwordHash.toString('hex').substring(0, 10)
    });

    
    // Consulta SQL directa para insertar los datos
    const query = `
    INSERT INTO Personas (
        Nombre, Apellido, Identificacion, PasswordHash, PasswordSalt, FechaNacimiento, 
        Telefono, Correo, Direccion, TipoUsuario
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
`;

    // Abrir la clave simétrica antes de encriptar
    await openSymmetricKey();

    // Ejecutar la consulta
    await sequelize.query(query, {
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

    res.status(201).json({ message: "Persona creada correctamente" });

    // Cerrar la clave simétrica después de encriptar
    //await closeSymmetricKey();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la persona" });
  }
};

const obtenerPersonas = async (req, res) => {
  try {
    // Abrir la clave siméwtrica antes de desencriptar
    await openSymmetricKey();

    const personas = await Persona.findAll({
      attributes: [
        "PersonaID",
        [
          sequelize.literal(`CAST(DecryptByKey(Nombre) AS NVARCHAR(100))`),
          "Nombre",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Apellido) AS NVARCHAR(100))`),
          "Apellido",
        ],
        [
          sequelize.literal(
            `CAST(DecryptByKey(Identificacion) AS NVARCHAR(20))`
          ),
          "Identificacion",
        ],
        [
          sequelize.literal(
            `CAST(DecryptByKey(FechaNacimiento) AS NVARCHAR(10))`
          ),
          "FechaNacimiento",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Telefono) AS NVARCHAR(15))`),
          "Telefono",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Correo) AS NVARCHAR(100))`),
          "Correo",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Direccion) AS NVARCHAR(255))`),
          "Direccion",
        ],
        "TipoUsuario",
      ],
    });

    res.status(200).json(personas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las personas" });
  } finally {
    await closeSymmetricKey();
  }
};

const obtenerPersonaPorId = async (req, res) => {
  try {
    // Abrir la clave simétrica antes de desencriptar
    await openSymmetricKey();

    const persona = await Persona.findByPk(req.params.id, {
      attributes: [
        "PersonaID",
        [
          sequelize.literal(`CAST(DecryptByKey(Nombre) AS NVARCHAR(100))`),
          "Nombre",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Apellido) AS NVARCHAR(100))`),
          "Apellido",
        ],
        [
          sequelize.literal(
            `CAST(DecryptByKey(Identificacion) AS NVARCHAR(20))`
          ),
          "Identificacion",
        ],
        [
          sequelize.literal(
            `CAST(DecryptByKey(FechaNacimiento) AS NVARCHAR(10))`
          ),
          "FechaNacimiento",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Telefono) AS NVARCHAR(15))`),
          "Telefono",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Correo) AS NVARCHAR(100))`),
          "Correo",
        ],
        [
          sequelize.literal(`CAST(DecryptByKey(Direccion) AS NVARCHAR(255))`),
          "Direccion",
        ],
        "TipoUsuario",
      ],
    });

    if (!persona) {
      return res.status(404).json({ error: "Persona no encontrada" });
    }
    res.status(200).json(persona);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la persona" });
  } finally {
    await closeSymmetricKey();
  }
};

const actualizarPersona = async (req, res) => {
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
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Consulta SQL directa para actualizar los datos
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

    // Abrir la clave simétrica antes de encriptar
    await openSymmetricKey();

    // Ejecutar la consulta
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
  }
};

const eliminarPersona = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
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
