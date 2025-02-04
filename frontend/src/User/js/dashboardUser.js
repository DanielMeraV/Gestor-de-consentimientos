const API_URL = 'http://localhost:3000/api';

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
};

async function cargarDatosUsuario() {
    try {
        // Obtener el token y datos del usuario del localStorage
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!token || !userData) {
            console.error('No hay token o userData');
            window.location.href = '../../auth/login.html';
            return;
        }

        console.log('UserData del localStorage:', userData); // Debug

        // Hacer la petición para obtener datos frescos del usuario
        const response = await fetch(`${API_URL}/personas/${userData.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener datos del usuario');
        }

        const usuario = await response.json();
        console.log('Datos del usuario de la BD:', usuario); // Debug

        // Actualizar nombre de usuario en el sidebar
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${usuario.Nombre} ${usuario.Apellido}`;
        }

        // Actualizar información del usuario en el modal
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <p><strong>Nombre:</strong> ${usuario.Nombre} ${usuario.Apellido}</p>
                <p><strong>Identificación:</strong> ${usuario.Identificacion}</p>
                <p><strong>Correo:</strong> ${usuario.Correo || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> ${usuario.Telefono || 'No especificado'}</p>
                <p><strong>Dirección:</strong> ${usuario.Direccion || 'No especificada'}</p>
            `;
        }

        // Actualizar nombre en las tarjetas
        const cardHolders = document.querySelectorAll('#cardHolder');
        cardHolders.forEach(element => {
            element.textContent = `${usuario.Nombre.toUpperCase()} ${usuario.Apellido.toUpperCase()}`;
        });

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        mostrarError('Error al cargar los datos del usuario');
    }
}

async function cargarConsentimientos() {
    try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!token || !userData) {
            console.error('No hay token o userData');
            return;
        }

        // Obtener los registros de consentimiento del usuario
        const responseRegistros = await fetch(`${API_URL}/registros-consentimiento`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!responseRegistros.ok) {
            throw new Error('Error al obtener consentimientos');
        }

        const registros = await responseRegistros.json();

        // Obtener los tipos de consentimiento
        const responseConsentimientos = await fetch(`${API_URL}/consentimientos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!responseConsentimientos.ok) {
            throw new Error('Error al obtener tipos de consentimientos');
        }

        const consentimientos = await responseConsentimientos.json();

        // Filtrar y mapear los consentimientos del usuario
        const consentimientosUsuario = registros
            .filter(registro => registro.PersonaID === userData.id)
            .map(registro => {
                const consentimiento = consentimientos.find(c => c.ConsentimientoID === registro.ConsentimientoID);
                return {
                    ...registro,
                    NombreConsentimiento: consentimiento?.NombreConsentimiento || 'No especificado'
                };
            });

        console.log('Consentimientos del usuario:', consentimientosUsuario); // Debug

        // Actualizar la tabla de consentimientos
        const tbody = document.getElementById('consentimientosTable');
        if (tbody) {
            tbody.innerHTML = consentimientosUsuario.map(consent => `
                <tr>
                    <td>${consent.NombreConsentimiento}</td>
                    <td>
                        <span class="status ${consent.Aceptado ? 'accepted' : 'rejected'}">
                            ${consent.Aceptado ? 'Aceptado' : 'Rechazado'}
                        </span>
                    </td>
                    <td>${formatDate(consent.FechaOtorgamiento)}</td>
                    <td>${consent.VersionConsentimiento}</td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error al cargar consentimientos:', error);
        mostrarError('Error al cargar los consentimientos');
    }
}

function mostrarError(mensaje) {
    console.error(mensaje); // Debug
    const mensajeElement = document.createElement('div');
    mensajeElement.className = 'mensaje error';
    mensajeElement.textContent = mensaje;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
        mensajeElement.remove();
    }, 3000);
}

// Manejar el cierre de sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '../../index.html';
}

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!token || !userData) {
        console.log('No hay sesión activa, redirigiendo a login');
        window.location.href = '../../auth/login.html';
        return;
    }

    console.log('Iniciando carga de datos...'); // Debug

    // Cargar datos
    cargarDatosUsuario();
    cargarConsentimientos();

    // Configurar botón de cerrar sesión
    const logoutButton = document.querySelector('.nav-item a[href="../../index.html"]');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }
});