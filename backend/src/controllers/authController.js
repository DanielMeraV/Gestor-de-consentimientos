const { Persona } = require('../models');
const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const login = async (req, res) => {
    try {
        const { identificacion, password } = req.body;

        // Abrir la clave simétrica
        await sequelize.query('OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate');

        // Buscar persona por identificación
        const [persona] = await sequelize.query(`
            SELECT 
                PersonaID,
                CAST(DecryptByKey(Nombre) AS NVARCHAR(100)) AS Nombre,
                CAST(DecryptByKey(Apellido) AS NVARCHAR(100)) AS Apellido,
                CAST(DecryptByKey(Password) AS NVARCHAR(100)) AS Password,
                TipoUsuario
            FROM Personas
            WHERE CAST(DecryptByKey(Identificacion) AS NVARCHAR(20)) = :identificacion
        `, {
            replacements: { identificacion },
            type: sequelize.QueryTypes.SELECT
        });
        
        if (!persona) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, persona.Password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: persona.PersonaID,
                tipo: persona.TipoUsuario
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar respuesta
        res.json({
            token,
            user: {
                id: persona.PersonaID,
                nombre: persona.Nombre,
                apellido: persona.Apellido,
                TipoUsuario: persona.TipoUsuario
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        // Cerrar la clave simétrica
        await sequelize.query('CLOSE SYMMETRIC KEY MySymmetricKey');
    }
};

module.exports = {
    login
};