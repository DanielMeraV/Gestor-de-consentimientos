-- ========================================
-- Creación de Bases de Datos
-- ========================================
CREATE DATABASE ConsentManagerDB;
GO
CREATE DATABASE ConsentManagerAuditDB;
GO

USE ConsentManagerDB;
GO

-- ========================================
-- Creación de clave maestra y certificado
-- ========================================
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'PruebaSwSeguroIIB2024B';
GO

CREATE CERTIFICATE MyCertificate WITH SUBJECT = 'CertificadoSwSeguro';
GO

CREATE SYMMETRIC KEY MySymmetricKey
WITH ALGORITHM = AES_256
ENCRYPTION BY CERTIFICATE MyCertificate;
GO

-- ========================================
-- Creación de Tablas con nueva estructura
-- ========================================
CREATE TABLE Personas (
    PersonaID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARBINARY(MAX) NOT NULL,
    Apellido VARBINARY(MAX) NOT NULL,
    Identificacion VARBINARY(MAX) NOT NULL,
    PasswordHash VARBINARY(256) NOT NULL,  -- Almacena el hash PBKDF2
    PasswordSalt VARBINARY(32) NOT NULL,   -- Salt único por usuario
    FechaNacimiento VARBINARY(MAX) NOT NULL,
    Telefono VARBINARY(MAX),
    Correo VARBINARY(MAX),
    Direccion VARBINARY(MAX),
    TipoUsuario NVARCHAR(20) CHECK(TipoUsuario IN ('administrador', 'cliente')) DEFAULT 'cliente',
	IntentosLogin INT DEFAULT 0,
    BloqueoHasta DATETIME NULL
);
CREATE TABLE Consentimientos (
    ConsentimientoID INT IDENTITY(1,1) PRIMARY KEY,
    NombreConsentimiento NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255) NOT NULL
);

CREATE TABLE RegistroConsentimientos (
    RegistroID INT IDENTITY(1,1) PRIMARY KEY,
    PersonaID INT NOT NULL,
    ConsentimientoID INT NOT NULL,
    Aceptado BIT NOT NULL,
    VersionConsentimiento NVARCHAR(10) NOT NULL,
    FechaOtorgamiento DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PersonaID) REFERENCES Personas(PersonaID),
    FOREIGN KEY (ConsentimientoID) REFERENCES Consentimientos(ConsentimientoID)
);

-- ========================================
-- Uso de la Base de Datos de Auditoría
-- ========================================
USE ConsentManagerAuditDB;
GO

-- ========================================
-- Creación de Tablas en ConsentManagerAuditDB
-- ========================================
CREATE TABLE AuditoriaPersonas (
    AuditoriaID INT IDENTITY(1,1) PRIMARY KEY,
    PersonaID INT NOT NULL,
    Accion NVARCHAR(50) NOT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    Detalles NVARCHAR(255)
);

CREATE TABLE AuditoriaConsentimientos (
    AuditoriaID INT IDENTITY(1,1) PRIMARY KEY,
    RegistroID INT NOT NULL,
    PersonaID INT NOT NULL,
    ConsentimientoID INT NOT NULL,
    Accion NVARCHAR(50) NOT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    Detalles NVARCHAR(255)
);

-- ========================================
-- Creación de Triggers en ConsentManagerDB
-- ========================================
USE ConsentManagerDB;
GO

-- Trigger para Personas
CREATE TRIGGER trg_AuditoriaPersonas
ON Personas
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate;

    -- Inserciones
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT 
            PersonaID, 
            'Creación', 
            GETDATE(), 
            CONCAT('Persona creada: ', 
                CAST(DecryptByKey(Nombre) AS NVARCHAR(100)), ' ',
                CAST(DecryptByKey(Apellido) AS NVARCHAR(100)))
        FROM inserted;
    END

    -- Actualizaciones
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT 
            i.PersonaID, 
            'Modificación', 
            GETDATE(),
            CONCAT('Antes: ', 
                CAST(DecryptByKey(d.Nombre) AS NVARCHAR(100)), ' ',
                CAST(DecryptByKey(d.Apellido) AS NVARCHAR(100)),
                '. Ahora: ',
                CAST(DecryptByKey(i.Nombre) AS NVARCHAR(100)), ' ',
                CAST(DecryptByKey(i.Apellido) AS NVARCHAR(100)))
        FROM inserted i
        INNER JOIN deleted d ON i.PersonaID = d.PersonaID;
    END

    -- Eliminaciones
    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT 
            PersonaID, 
            'Eliminación', 
            GETDATE(),
            CONCAT('Persona eliminada: ',
                CAST(DecryptByKey(Nombre) AS NVARCHAR(100)), ' ',
                CAST(DecryptByKey(Apellido) AS NVARCHAR(100)))
        FROM deleted;
    END

    CLOSE SYMMETRIC KEY MySymmetricKey;
END;
GO

-- [El trigger de RegistroConsentimientos se mantiene igual]
CREATE TRIGGER trg_AuditoriaRegistroConsentimientos
ON RegistroConsentimientos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Inserciones
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaConsentimientos (RegistroID, PersonaID, ConsentimientoID, Accion, Fecha, Detalles)
        SELECT RegistroID, PersonaID, ConsentimientoID, 'Creación', GETDATE(), CONCAT('Consentimiento otorgado. Aceptado: ', Aceptado)
        FROM inserted;
    END

    -- Actualizaciones y Eliminaciones [se mantienen igual]
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaConsentimientos (RegistroID, PersonaID, ConsentimientoID, Accion, Fecha, Detalles)
        SELECT i.RegistroID, i.PersonaID, i.ConsentimientoID, 'Modificación', GETDATE(),
               CONCAT('Antes: Aceptado = ', d.Aceptado, '. Ahora: Aceptado = ', i.Aceptado)
        FROM inserted i
        INNER JOIN deleted d ON i.RegistroID = d.RegistroID;
    END

    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaConsentimientos (RegistroID, PersonaID, ConsentimientoID, Accion, Fecha, Detalles)
        SELECT RegistroID, PersonaID, ConsentimientoID, 'Eliminación', GETDATE(), 'Consentimiento eliminado'
        FROM deleted;
    END
END;
GO

-- ========================================
-- Inserción de Datos de Prueba
-- ========================================
USE ConsentManagerDB;
GO

-- Abrir la clave para inserción
OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate;


CLOSE SYMMETRIC KEY MySymmetricKey;

-- Datos para Consentimientos
INSERT INTO Consentimientos (NombreConsentimiento, Descripcion)
VALUES 
('Términos y Condiciones', 'Aceptación de términos para usar el sistema'),
('Política de Privacidad', 'Consentimiento para el tratamiento de datos personales'),
('Cookies', 'Autorización para el uso de cookies en la aplicación'),
('Notificaciones Promocionales', 'Consentimiento para recibir mensajes promocionales'),
('Compartición de Datos', 'Aceptación para compartir datos con terceros');

-- ========================================
-- Creación y configuración del usuario
-- ========================================
USE [master];
GO

-- Crear login
CREATE LOGIN SwSeguro WITH PASSWORD = 'SwSeguro123';
GO

-- Crear usuario en ConsentManagerDB
USE ConsentManagerDB;
GO

CREATE USER SwSeguro FOR LOGIN SwSeguro;
GO

-- Dar permisos en ConsentManagerDB
GRANT CONTROL ON DATABASE::ConsentManagerDB TO SwSeguro;
GRANT VIEW DEFINITION ON SYMMETRIC KEY::MySymmetricKey TO SwSeguro;
GRANT VIEW DEFINITION ON CERTIFICATE::MyCertificate TO SwSeguro;
GRANT CONTROL ON SCHEMA::dbo TO SwSeguro;

-- Crear usuario en ConsentManagerAuditDB
USE ConsentManagerAuditDB;
GO

CREATE USER SwSeguro FOR LOGIN SwSeguro;
GO

-- Dar permisos en ConsentManagerAuditDB
GRANT CONTROL ON DATABASE::ConsentManagerAuditDB TO SwSeguro;
GRANT CONTROL ON SCHEMA::dbo TO SwSeguro;

-- ========================================
-- Consulta de prueba para verificar la encriptación
-- ========================================
USE ConsentManagerDB;
GO

-- Consultar datos encriptados
SELECT * FROM Personas;


-- Abrir la clave para consulta
OPEN SYMMETRIC KEY MySymmetricKey DECRYPTION BY CERTIFICATE MyCertificate;

-- Consultar datos desencriptados
SELECT 
    PersonaID,
    CAST(DecryptByKey(Nombre) AS NVARCHAR(100)) AS Nombre,
    CAST(DecryptByKey(Apellido) AS NVARCHAR(100)) AS Apellido,
    CAST(DecryptByKey(Identificacion) AS NVARCHAR(20)) AS Identificacion,
    PasswordHash,
	PasswordSalt,
    CAST(DecryptByKey(FechaNacimiento) AS NVARCHAR(10)) AS FechaNacimiento,
    CAST(DecryptByKey(Telefono) AS NVARCHAR(15)) AS Telefono,
    CAST(DecryptByKey(Correo) AS NVARCHAR(100)) AS Correo,
    CAST(DecryptByKey(Direccion) AS NVARCHAR(255)) AS Direccion,
    TipoUsuario,
	IntentosLogin,
    BloqueoHasta
FROM Personas;

CLOSE SYMMETRIC KEY MySymmetricKey;

-- Consultar consentimientos y registroConsentimientos
select * from dbo.Consentimientos;
select * from dbo.RegistroConsentimientos;

-- Consultar tablas auditoria
USE ConsentManagerAuditDB;
GO

select * from dbo.AuditoriaPersonas;
select * from dbo.AuditoriaConsentimientos;


------Erik-----------------------------------------
-----------------------------

-- 🔥 Creación del Procedimiento Almacenado
CREATE PROCEDURE sp_InsertarRegistroConsentimiento
    @PersonaID INT,
    @ConsentimientoID INT,
    @Aceptado BIT,
    @VersionConsentimiento NVARCHAR(10),
    @FechaOtorgamiento DATETIME,
    @RegistroID INT OUTPUT -- Parámetro de salida para devolver el ID insertado
AS
BEGIN
    SET NOCOUNT ON;

    -- Insertar el registro en la tabla
    INSERT INTO RegistroConsentimientos (PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento, FechaOtorgamiento)
    VALUES (@PersonaID, @ConsentimientoID, @Aceptado, @VersionConsentimiento, @FechaOtorgamiento);

    -- Obtener el ID generado
    SET @RegistroID = SCOPE_IDENTITY();
END;
GO

------------------------------------

USE ConsentManagerDB;
GO

-- 🔹 Abre la clave simétrica
OPEN SYMMETRIC KEY MySymmetricKey 
DECRYPTION BY CERTIFICATE MyCertificate;
GO

-- 🔹 Verifica si la clave está abierta correctamente
SELECT * FROM sys.openkeys;
GO

-- 🔹 Si la clave está abierta, ejecuta la actualización
UPDATE Personas
SET TipoUsuario = 'administrador' -- Cambiar a 'cliente' o 'administrador'
WHERE PersonaID = 3; -- Cambia este ID según el usuario que deseas actualizar
GO

-- 🔹 Cierra la clave después de la operación
CLOSE SYMMETRIC KEY MySymmetricKey;
GO


CREATE PROCEDURE sp_ActualizarRegistroConsentimiento
    @RegistroID INT,
    @Aceptado BIT,
    @FechaOtorgamiento DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE RegistroConsentimientos 
    SET Aceptado = @Aceptado,
        FechaOtorgamiento = @FechaOtorgamiento
    WHERE RegistroID = @RegistroID;

    -- Devolver el registro actualizado
    SELECT * FROM RegistroConsentimientos WHERE RegistroID = @RegistroID;
END;
GO
