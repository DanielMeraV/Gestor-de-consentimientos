const API_URL = 'http://localhost:3000/api';

function mostrarMensaje(mensaje, tipo) {
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje ${tipo}`;
    mensajeElement.textContent = mensaje;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
        mensajeElement.remove();
    }, 3000);
}

async function cargarDatosUsuario() {
    try {
        // Obtener datos del localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            mostrarMensaje('Sesión no válida. Por favor, inicie sesión nuevamente.', 'error');
            window.location.href = '../../auth/login.html';
            return;
        }

        console.log('Cargando datos para usuario:', userData.id); // Debug

        const response = await fetch(`${API_URL}/personas/${userData.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al obtener datos del usuario');

        const usuario = await response.json();
        console.log('Datos obtenidos:', usuario); // Debug

        // Llenar el formulario con los datos actuales
        document.getElementById('nombre').value = usuario.Nombre || '';
        document.getElementById('apellido').value = usuario.Apellido || '';
        document.getElementById('identificacion').value = usuario.Identificacion || '';
        if (usuario.FechaNacimiento) {
            document.getElementById('fechaNacimiento').value = usuario.FechaNacimiento.split('T')[0];
        }
        document.getElementById('telefono').value = usuario.Telefono || '';
        document.getElementById('correo').value = usuario.Correo || '';
        document.getElementById('direccion').value = usuario.Direccion || '';

    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarMensaje('Error al cargar los datos del usuario', 'error');
    }
}

async function actualizarDatosUsuario(event) {
    event.preventDefault();

    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            mostrarMensaje('Sesión no válida', 'error');
            window.location.href = '../../auth/login.html';
            return;
        }

        const formData = new FormData(event.target);
        const datosActualizados = Object.fromEntries(formData.entries());

        console.log('Actualizando datos:', datosActualizados); // Debug

        const response = await fetch(`${API_URL}/personas/${userData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosActualizados)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar los datos');
        }

        mostrarMensaje('Datos actualizados correctamente', 'success');
        
        // Actualizar los datos en localStorage
        const dataActualizada = await response.json();
        if (dataActualizada) {
            const userDataActualizado = {
                ...userData,
                nombre: datosActualizados.Nombre,
                apellido: datosActualizados.Apellido
            };
            localStorage.setItem('userData', JSON.stringify(userDataActualizado));
        }

        setTimeout(() => {
            window.location.href = './dashboardUser.html';
        }, 2000);

    } catch (error) {
        console.error('Error al actualizar:', error);
        mostrarMensaje(error.message || 'Error al actualizar los datos', 'error');
    }
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        mostrarMensaje('Sesión no válida. Por favor, inicie sesión.', 'error');
        window.location.href = '../../auth/login.html';
        return;
    }

    cargarDatosUsuario();

    // Agregar event listener para el formulario
    const form = document.getElementById('editarForm');
    if (form) {
        form.addEventListener('submit', actualizarDatosUsuario);
    } else {
        console.error('No se encontró el formulario de edición');
    }
});