const API_URL = 'http://localhost:3000/api';

async function cargarConsentimientosUsuario() {
    try {
        // Obtener datos del usuario logueado del token
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!token || !userData) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Obtener los registros actuales
        const responseRegistros = await fetch(`${API_URL}/registros-consentimiento`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const registros = await responseRegistros.json();
        const misRegistros = registros.filter(r => r.PersonaID === userData.id);

        // Obtener la lista de consentimientos disponibles
        const responseConsentimientos = await fetch(`${API_URL}/consentimientos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const consentimientos = await responseConsentimientos.json();

        const container = document.getElementById('consentimientos-container');
        if (!container) return;

        container.innerHTML = consentimientos.map(consentimiento => {
            const registro = misRegistros.find(r => r.ConsentimientoID === consentimiento.ConsentimientoID);
            const estaAceptado = registro ? Number(registro.Aceptado) === 1 : false;

            return `
                <div class="consent-card" data-id="${consentimiento.ConsentimientoID}">
                    <div class="consent-header">
                        <div class="consent-info">
                            <h2>${consentimiento.NombreConsentimiento}</h2>
                            <p>${consentimiento.Descripcion}</p>
                        </div>
                        <div class="consent-controls">
                            <span class="status-text">${estaAceptado ? 'ON' : 'OFF'}</span>
                            <label class="switch">
                                <input type="checkbox" 
                                    ${estaAceptado ? 'checked' : ''}
                                    onchange="actualizarConsentimiento(event, 
                                        ${consentimiento.ConsentimientoID},
                                        ${registro ? registro.RegistroID : null})">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="consent-meta">
                        <p>Versión: ${registro ? registro.VersionConsentimiento : '1.0'}</p>
                        <p>Última actualización: ${registro ? new Date(registro.FechaOtorgamiento).toLocaleDateString() : 'No registrado'}</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar consentimientos:', error);
        mostrarMensaje('Error al cargar los consentimientos', 'error');
    }
}

async function actualizarConsentimiento(event, consentimientoId, registroId) {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!token || !userData) {
        window.location.href = '../auth/login.html';
        return;
    }

    const switchElement = event.target;
    const aceptado = switchElement.checked ? 1 : 0;
    const consentCard = event.target.closest('.consent-card');

    try {
        const requestData = {
            PersonaID: userData.id,
            ConsentimientoID: consentimientoId,
            Aceptado: aceptado,
            VersionConsentimiento: '1.0'
        };

        // Determinar si es actualización o nuevo registro
        const method = registroId && registroId !== 'null' && registroId !== 'undefined' 
            ? 'PUT' 
            : 'POST';
        
        const endpoint = method === 'PUT'
            ? `${API_URL}/registros-consentimiento/${registroId}`
            : `${API_URL}/registros-consentimiento`;

        console.log('Enviando solicitud:', {
            method,
            endpoint,
            data: requestData
        });

        const response = await fetch(endpoint, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la solicitud');
        }

        // Actualizar la UI
        const statusText = consentCard.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = aceptado === 1 ? 'ON' : 'OFF';
        }

        // Recargar los consentimientos para mostrar datos actualizados
        await cargarConsentimientosUsuario();
        mostrarMensaje('Consentimiento actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error:', error);
        // Revertir el switch si hubo error
        switchElement.checked = !switchElement.checked;
        mostrarMensaje('Error al actualizar el consentimiento: ' + error.message, 'error');
    }
}

function mostrarMensaje(mensaje, tipo) {
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje ${tipo}`;
    mensajeElement.textContent = mensaje;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
        mensajeElement.remove();
    }, 3000);
}

// Verificar autenticación y cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!token || !userData) {
        window.location.href = '../auth/login.html';
        return;
    }

    console.log('Cargando consentimientos para usuario:', userData.id);
    cargarConsentimientosUsuario();
});