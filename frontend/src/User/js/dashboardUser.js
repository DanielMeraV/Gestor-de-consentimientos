// Variables globales
const API_URL = 'http://localhost:3000/api';
const USUARIO_ID = 1; // Usuario actual (Juan Pérez)

// Funciones auxiliares
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
};

// Función para cargar los datos del usuario
async function cargarDatosUsuario() {
    try {
        const response = await fetch(`${API_URL}/personas/${USUARIO_ID}`);
        if (!response.ok) throw new Error('Error al obtener datos del usuario');
        
        const usuario = await response.json();
        
        // Actualizar nombre de usuario en el sidebar
        document.getElementById('userName').textContent = `${usuario.Nombre} ${usuario.Apellido}`;
        
        // Actualizar información del usuario
        document.getElementById('userInfo').innerHTML = `
            <p><strong>Nombre:</strong> ${usuario.Nombre} ${usuario.Apellido}</p>
            <p><strong>Identificación:</strong> ${usuario.Identificacion}</p>
            <p><strong>Fecha Nacimiento:</strong> ${formatDate(usuario.FechaNacimiento)}</p>
            <p><strong>Correo:</strong> ${usuario.Correo || 'No especificado'}</p>
            <p><strong>Teléfono:</strong> ${usuario.Telefono || 'No especificado'}</p>
            <p><strong>Dirección:</strong> ${usuario.Direccion || 'No especificada'}</p>
        `;

        // Actualizar nombre en las tarjetas
        document.querySelectorAll('.card-holder').forEach(element => {
            element.textContent = `${usuario.Nombre.toUpperCase()} ${usuario.Apellido.toUpperCase()}`;
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos del usuario');
    }
}

// Función para cargar los consentimientos del usuario
async function cargarConsentimientos() {
    try {
        // Obtener todos los registros de consentimiento
        const response = await fetch(`${API_URL}/registros-consentimiento`);
        if (!response.ok) throw new Error('Error al obtener consentimientos');
        
        const registros = await response.json();
        
        // Filtrar solo los consentimientos del usuario actual
        const consentimientosUsuario = registros.filter(registro => 
            registro.PersonaID === USUARIO_ID
        );

        const tbody = document.getElementById('consentimientosTable');
        tbody.innerHTML = consentimientosUsuario.map(registro => `
            <tr>
                <td>${registro.Consentimiento?.NombreConsentimiento || 'No especificado'}</td>
                <td>
                    <span class="status ${registro.Aceptado ? 'accepted' : 'rejected'}">
                        ${registro.Aceptado ? 'Aceptado' : 'Rechazado'}
                    </span>
                </td>
                <td>${formatDate(registro.FechaOtorgamiento)}</td>
                <td>${registro.VersionConsentimiento}</td>
            </tr>
        `).join('');

        if (consentimientosUsuario.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No hay consentimientos registrados</td>
                </tr>
            `;
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los consentimientos');
    }
}

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
    // Aquí podrías implementar una mejor UI para mostrar errores
    alert(mensaje);
}

// Función de inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    cargarConsentimientos();

    // Event Listeners para los botones de navegación
    document.getElementById('btnConsent').addEventListener('click', () => {
        window.location.href = 'consent.html';
    });

    document.getElementById('btnRegister').addEventListener('click', () => {
        window.location.href = 'register.html';
    });
});

// Función para cerrar sesión
function cerrarSesion() {
    // Aquí implementarías la lógica de cierre de sesión
    window.location.href = 'index.html';
}