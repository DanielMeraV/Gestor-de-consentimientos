-- ========================================
-- Creaci�n de Bases de Datos
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
-- Creaci�n de Tablas en ConsentManagerDB
-- ========================================
CREATE TABLE Personas ( --Informaci�n b�sica de cualquier persona que interact�e con el sistema.
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
-- Uso de la Base de Datos de Auditor�a
-- ========================================
USE ConsentManagerAuditDB;
GO

-- ========================================
-- Creaci�n de Tablas en ConsentManagerAuditDB
-- ========================================
CREATE TABLE AuditoriaPersonas ( --Rastrea cambios o eventos relacionados con el registro de consentimientos
    AuditoriaID INT IDENTITY(1,1) PRIMARY KEY,
    PersonaID INT NOT NULL,
    Accion NVARCHAR(50) NOT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    Detalles NVARCHAR(255)
);

CREATE TABLE AuditoriaConsentimientos ( --Rastrea cualquier modificaci�n de registros en la tabla Personas.
    AuditoriaID INT IDENTITY(1,1) PRIMARY KEY,
    RegistroID INT NOT NULL,
    PersonaID INT NOT NULL,
    ConsentimientoID INT NOT NULL,
    Accion NVARCHAR(50) NOT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    Detalles NVARCHAR(255)
);

-- ========================================
-- Creaci�n de Triggers en ConsentManagerDB
-- ========================================
USE ConsentManagerDB;
GO

-- Trigger para Personas
-- Registra en AuditoriaPersonas cualquier acci�n de inserci�n, actualizaci�n o eliminaci�n en la tabla Personas.
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
        SELECT PersonaID, 'Creaci�n', GETDATE(), CONCAT('Persona creada: ', Nombre, ' ', Apellido)
        FROM inserted;
    END

    -- Actualizaciones
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT i.PersonaID, 'Modificaci�n', GETDATE(), 
               CONCAT('Antes: ', d.Nombre, ' ', d.Apellido, '. Ahora: ', i.Nombre, ' ', i.Apellido)
        FROM inserted i
        INNER JOIN deleted d ON i.PersonaID = d.PersonaID;
    END

    -- Eliminaciones
    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaPersonas (PersonaID, Accion, Fecha, Detalles)
        SELECT PersonaID, 'Eliminaci�n', GETDATE(), CONCAT('Persona eliminada: ', Nombre, ' ', Apellido)
        FROM deleted;
    END
END;
GO

-- Trigger para RegistroConsentimientos
-- Guarda auditor�a para inserciones, actualizaciones o eliminaciones en RegistroConsentimientos.
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
        SELECT RegistroID, PersonaID, ConsentimientoID, 'Creaci�n', GETDATE(), CONCAT('Consentimiento otorgado. Aceptado: ', Aceptado)
        FROM inserted;
    END

    -- Actualizaciones
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaConsentimientos (RegistroID, PersonaID, ConsentimientoID, Accion, Fecha, Detalles)
        SELECT i.RegistroID, i.PersonaID, i.ConsentimientoID, 'Modificaci�n', GETDATE(),
               CONCAT('Antes: Aceptado = ', d.Aceptado, '. Ahora: Aceptado = ', i.Aceptado)
        FROM inserted i
        INNER JOIN deleted d ON i.RegistroID = d.RegistroID;
    END

    -- Eliminaciones
    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ConsentManagerAuditDB.dbo.AuditoriaConsentimientos (RegistroID, PersonaID, ConsentimientoID, Accion, Fecha, Detalles)
        SELECT RegistroID, PersonaID, ConsentimientoID, 'Eliminaci�n', GETDATE(), 'Consentimiento eliminado'
        FROM deleted;
    END
END;
GO

-- ========================================
-- Inserci�n de Datos de Prueba
-- ========================================
USE ConsentManagerDB;
GO

-- Datos para Personas
INSERT INTO Personas (Nombre, Apellido, Identificacion, FechaNacimiento, Telefono, Correo, Direccion)
VALUES 
('Juan', 'P�rez', '1234567890', '1990-05-20', '0987654321', 'juan.perez@mail.com', 'Calle 1, Ciudad A'),
('Ana', 'Garc�a', '0987654321', '1985-08-15', '0976543210', 'ana.garcia@mail.com', 'Calle 2, Ciudad B'),
('Carlos', 'Lopez', '1122334455', '1995-02-10', '0998765432', 'carlos.lopez@mail.com', 'Calle 3, Ciudad C'),
('Mar�a', 'Mart�nez', '2233445566', '2000-12-25', '0965432109', 'maria.martinez@mail.com', 'Calle 4, Ciudad D'),
('Luc�a', 'Hern�ndez', '3344556677', '1992-07-30', '0954321098', 'lucia.hernandez@mail.com', 'Calle 5, Ciudad E');

-- Datos para Consentimientos
INSERT INTO Consentimientos (NombreConsentimiento, Descripcion)
VALUES 
('T�rminos y Condiciones', 'Aceptaci�n de t�rminos para usar el sistema'),
('Pol�tica de Privacidad', 'Consentimiento para el tratamiento de datos personales'),
('Cookies', 'Autorizaci�n para el uso de cookies en la aplicaci�n'),
('Notificaciones Promocionales', 'Consentimiento para recibir mensajes promocionales'),
('Compartici�n de Datos', 'Aceptaci�n para compartir datos con terceros');

-- Datos para RegistroConsentimientos
INSERT INTO RegistroConsentimientos (PersonaID, ConsentimientoID, Aceptado, VersionConsentimiento)
VALUES 
(1, 1, 1, '1.0'),
(1, 2, 1, '1.0'),
(2, 1, 0, '1.0'),
(3, 3, 1, '2.0'),
(4, 4, 1, '1.1');


-- ========================================
-- Verificaci�n de las tablas
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
-- Creaci�n de un nuevo usuario
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

-- Paso 3: Crear el usuario en la base de datos de auditor�a
USE [ConsentManagerAuditDB]; -- Cambia por el nombre de tu base de datos de auditor�a
GO

CREATE USER SwSeguro FOR LOGIN SwSeguro;
GO

-- Asignar permisos de lectura y escritura en la base de datos de auditor�a
ALTER ROLE db_owner ADD MEMBER SwSeguro;
GO
