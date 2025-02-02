document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarUsuarios();
    cargarAuditoriaPersonas();
    cargarAuditoriaConsentimientos();

    // Configurar el formulario de consentimientos
    document.getElementById('consentimientoForm').addEventListener('submit', agregarConsentimiento);
});

// Función para cargar usuarios
async function cargarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/personas');
        const usuarios = await response.json();
        const tbody = document.querySelector('#usuariosTable tbody');
        tbody.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>${usuario.PersonaID}</td>
                <td>${usuario.Nombre}</td>
                <td>${usuario.Apellido}</td>
                <td>${usuario.Identificacion}</td>
                <td>${usuario.Correo}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

// Función para cargar auditoría de personas
async function cargarAuditoriaPersonas() {
    try {
        const response = await fetch('http://localhost:3000/api/auditoria-personas');
        const auditorias = await response.json();
        const tbody = document.querySelector('#auditoriaPersonasTable tbody');
        tbody.innerHTML = auditorias.map(auditoria => `
            <tr>
                <td>${auditoria.AuditoriaID}</td>
                <td>${auditoria.PersonaID}</td>
                <td>${auditoria.Accion}</td>
                <td>${new Date(auditoria.Fecha).toLocaleString()}</td>
                <td>${auditoria.Detalles}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar auditoría de personas:', error);
    }
}

// Función para cargar auditoría de consentimientos
async function cargarAuditoriaConsentimientos() {
    try {
        const response = await fetch('http://localhost:3000/api/auditoria-consentimientos');
        const auditorias = await response.json();
        const tbody = document.querySelector('#auditoriaConsentimientosTable tbody');
        tbody.innerHTML = auditorias.map(auditoria => `
            <tr>
                <td>${auditoria.AuditoriaID}</td>
                <td>${auditoria.RegistroID}</td>
                <td>${auditoria.PersonaID}</td>
                <td>${auditoria.ConsentimientoID}</td>
                <td>${auditoria.Accion}</td>
                <td>${new Date(auditoria.Fecha).toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar auditoría de consentimientos:', error);
    }
}

// Función para agregar un nuevo consentimiento
async function agregarConsentimiento(event) {
    event.preventDefault();
    
    const consentimiento = {
        NombreConsentimiento: document.getElementById('nombreConsentimiento').value,
        Descripcion: document.getElementById('descripcionConsentimiento').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/consentimientos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(consentimiento)
        });

        if (response.ok) {
            alert('Consentimiento agregado exitosamente');
            document.getElementById('consentimientoForm').reset();
        } else {
            alert('Error al agregar el consentimiento');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar el consentimiento');
    }
}