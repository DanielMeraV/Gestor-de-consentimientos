-- ========================================
-- Creación de Bases de Datos
-- ========================================
CREATE DATABASE ConsentManagerDB;
GO

CREATE DATABASE ConsentManagerAuditDB;
GO

-- ========================================
-- Uso de la Base de Datos Principal
-- ========================================
USE ConsentManagerDB;
GO

-- ========================================
-- Creación de Tablas en ConsentManagerDB
-- ========================================
CREATE TABLE Personas ( --Información básica de cualquier persona que interactúe con el sistema.
    PersonaID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Identificacion NVARCHAR(20) UNIQUE NOT NULL,
    FechaNacimiento DATE NOT NULL,
    Telefono NVARCHAR(15),
    Correo NVARCHAR(100),
    Direccion NVARCHAR(255)
);

CREATE TABLE Consentimientos ( --Define los tipos de consentimientos disponibles
    ConsentimientoID INT IDENTITY(1,1) PRIMARY KEY,
    NombreConsentimiento NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255) NOT NULL
);

CREATE TABLE RegistroConsentimientos ( --Relaciona una persona con un consentimiento otorgado.
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
CREATE TABLE AuditoriaPersonas ( --Rastrea cambios o eventos relacionados con el registro de consentimientos
    AuditoriaID INT IDENTITY(1,1) PRIMARY KEY,
    PersonaID INT NOT NULL,
    Accion NVARCHAR(50) NOT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    Detalles NVARCHAR(255)
);

CREATE TABLE AuditoriaConsentimientos ( --Rastrea cualquier modificación de registros en la tabla Personas.
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
-- Registra en AuditoriaPersonas cualquier acción de inserción, actualización o eliminación en la tabla Personas.
CREATE TRIGGER trg_AuditoriaPersonas
ON Personas
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Inserciones
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT PersonaID, 'Creación', GETDATE(), CONCAT('Persona creada: ', Nombre, ' ', Apellido)
        FROM inserted;
    END

    -- Actualizaciones
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT i.PersonaID, 'Modificación', GETDATE(), 
               CONCAT('Antes: ', d.Nombre, ' ', d.Apellido, '. Ahora: ', i.Nombre, ' ', i.Apellido)
        FROM inserted i
        INNER JOIN deleted d ON i.PersonaID = d.PersonaID;
    END

    -- Eliminaciones
    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT PersonaID, 'Eliminación', GETDATE(), CONCAT('Persona eliminada: ', Nombre, ' ', Apellido)
        FROM deleted;
    END
END;
GO

-- Trigger para RegistroConsentimientos
-- Guarda auditoría para inserciones, actualizaciones o eliminaciones en RegistroConsentimientos.
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

    -- Actualizaciones
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaConsentimientos (RegistroID, PersonaID, ConsentimientoID, Accion, Fecha, Detalles)
        SELECT i.RegistroID, i.PersonaID, i.ConsentimientoID, 'Modificación', GETDATE(),
               CONCAT('Antes: Aceptado = ', d.Aceptado, '. Ahora: Aceptado = ', i.Aceptado)
        FROM inserted i
        INNER JOIN deleted d ON i.RegistroID = d.RegistroID;
    END

    -- Eliminaciones
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

-- Datos para Personas
INSERT INTO Personas (Nombre, Apellido, Identificacion, FechaNacimiento, Telefono, Correo, Direccion)
VALUES 
('Juan', 'Pérez', '1234567890', '1990-05-20', '0987654321', 'juan.perez@mail.com', 'Calle 1, Ciudad A'),
('Ana', 'García', '0987654321', '1985-08-15', '0976543210', 'ana.garcia@mail.com', 'Calle 2, Ciudad B'),
('Carlos', 'Lopez', '1122334455', '1995-02-10', '0998765432', 'carlos.lopez@mail.com', 'Calle 3, Ciudad C'),
('María', 'Martínez', '2233445566', '2000-12-25', '0965432109', 'maria.martinez@mail.com', 'Calle 4, Ciudad D'),
('Lucía', 'Hernández', '3344556677', '1992-07-30', '0954321098', 'lucia.hernandez@mail.com', 'Calle 5, Ciudad E');

-- Datos para Consentimientos
INSERT INTO Consentimientos (NombreConsentimiento, Descripcion)
VALUES 
('Términos y Condiciones', 'Aceptación de términos para usar el sistema'),
('Política de Privacidad', 'Consentimiento para el tratamiento de datos personales'),
('Cookies', 'Autorización para el uso de cookies en la aplicación'),
('Notificaciones Promocionales', 'Consentimiento para recibir mensajes promocionales'),
('Compartición de Datos', 'Aceptación para compartir datos con terceros');

-- Datos para RegistroConsentimientos
INSERT INTO RegistroConsentimientos (PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento)
VALUES 
(1, 1, 1, '1.0'),
(1, 2, 1, '1.0'),
(2, 1, 0, '1.0'),
(3, 3, 1, '2.0'),
(4, 4, 1, '1.1');


-- ========================================
-- Verificación de las tablas
-- ========================================
USE ConsentManagerDB;
GO

select * from dbo.Personas;
select * from dbo.Consentimientos;
select * from dbo.RegistroConsentimientos;

USE ConsentManagerAuditDB;
GO

select * from dbo.AuditoriaPersonas;
select * from dbo.AuditoriaConsentimientos;


-- ========================================
-- Creación de un nuevo usuario
-- ========================================
-- Paso 1: Crear un nuevo login para SQL Server
USE [master]; -- Usamos la base de datos 'master' para crear el login
GO

CREATE LOGIN SwSeguro WITH PASSWORD = 'SwSeguro123'; 
GO

-- Paso 2: Crear el usuario en la base de datos principal
USE [ConsentManagerDB]; -- Cambia por el nombre de tu base de datos principal
GO

CREATE USER SwSeguro FOR LOGIN SwSeguro;
GO

-- Asignar permisos de lectura y escritura en la base de datos principal
ALTER ROLE db_owner ADD MEMBER SwSeguro; 
GO

-- Paso 3: Crear el usuario en la base de datos de auditoría
USE [ConsentManagerAuditDB]; -- Cambia por el nombre de tu base de datos de auditoría
GO

CREATE USER SwSeguro FOR LOGIN SwSeguro;
GO

-- Asignar permisos de lectura y escritura en la base de datos de auditoría
ALTER ROLE db_owner ADD MEMBER SwSeguro;
GO
