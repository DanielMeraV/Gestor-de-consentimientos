
// editarInformacion.js
const API_URL = 'http://localhost:3000/api';
const USUARIO_ID = 1; // El mismo ID que usas en dashboardUser.js

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje ${tipo}`;
    mensajeElement.textContent = mensaje;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
        mensajeElement.remove();
    }, 3000);
}

// Función para cargar los datos del usuario
async function cargarDatosUsuario() {
    try {
        const response = await fetch(`${API_URL}/personas/${USUARIO_ID}`);
        if (!response.ok) throw new Error('Error al obtener datos del usuario');

        const usuario = await response.json();

        // Llenar el formulario con los datos actuales
        document.getElementById('nombre').value = usuario.Nombre;
        document.getElementById('apellido').value = usuario.Apellido;
        document.getElementById('identificacion').value = usuario.Identificacion;
        document.getElementById('fechaNacimiento').value = usuario.FechaNacimiento.split('T')[0];
        document.getElementById('telefono').value = usuario.Telefono;
        document.getElementById('correo').value = usuario.Correo;
        document.getElementById('direccion').value = usuario.Direccion;

    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar los datos del usuario', 'error');
    }
}

// Función para actualizar los datos del usuario
async function actualizarDatosUsuario(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const datosActualizados = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/personas/${USUARIO_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosActualizados)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar los datos');
        }

        mostrarMensaje('Datos actualizados correctamente', 'success');
        setTimeout(() => {
            window.location.href = 'dashboardUser.html';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(error.message, 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', cargarDatosUsuario);
document.getElementById('editarForm').addEventListener('submit', actualizarDatosUsuario);
