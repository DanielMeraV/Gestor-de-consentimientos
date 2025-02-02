// Variables globales
const API_URL = 'http://localhost:3000/api';
const USUARIO_ID = 3; // Asegúrate de que sea el mismo ID en todas partes

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
};

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
        document.querySelectorAll('#cardHolder').forEach(element => {
            element.textContent = `${usuario.Nombre.toUpperCase()} ${usuario.Apellido.toUpperCase()}`;
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos del usuario');
    }
}

async function cargarConsentimientos() {
    try {
        const responseRegistros = await fetch(`${API_URL}/registros-consentimiento`);
        if (!responseRegistros.ok) throw new Error('Error al obtener consentimientos');

        const registros = await responseRegistros.json();

        const responseConsentimientos = await fetch(`${API_URL}/consentimientos`);
        if (!responseConsentimientos.ok) throw new Error('Error al obtener tipos de consentimientos');

        const consentimientos = await responseConsentimientos.json();

        const consentimientosUsuario = registros.filter(registro => registro.PersonaID === USUARIO_ID)
            .map(registro => {
                const consentimiento = consentimientos.find(c => c.ConsentimientoID === registro.ConsentimientoID);
                return { ...registro, NombreConsentimiento: consentimiento?.NombreConsentimiento };
            });

        const tbody = document.getElementById('consentimientosTable');
        tbody.innerHTML = consentimientosUsuario.map(consent => `
            <tr>
                <td>${consent.NombreConsentimiento || 'No especificado'}</td>
                <td>
                    <span class="status ${Number(consent.Aceptado) === 1 ? 'accepted' : 'rejected'}">
                        ${Number(consent.Aceptado) === 1 ? 'Aceptado' : 'Rechazado'}
                    </span>
                </td>
                <td>${formatDate(consent.FechaOtorgamiento)}</td>
                <td>${consent.VersionConsentimiento}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los consentimientos');
    }
}

function mostrarError(mensaje) {
    const mensajeElement = document.createElement('div');
    mensajeElement.className = 'mensaje error';
    mensajeElement.textContent = mensaje;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
        mensajeElement.remove();
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    cargarConsentimientos();
});
