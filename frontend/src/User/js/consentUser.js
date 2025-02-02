const API_URL = 'http://localhost:3000/api';
const USUARIO_ID = 1; // Usuario actual (Juan Pérez)

async function cargarConsentimientosUsuario() {
    try {
        // Obtener los registros de consentimiento del usuario
        const responseRegistros = await fetch(`${API_URL}/registros-consentimiento`);
        if (!responseRegistros.ok) throw new Error('Error al obtener registros de consentimiento');
        
        const registros = await responseRegistros.json();
        const consentimientosUsuario = registros.filter(registro => 
            registro.PersonaID === USUARIO_ID
        );

        // Obtener todos los consentimientos disponibles
        const responseConsentimientos = await fetch(`${API_URL}/consentimientos`);
        if (!responseConsentimientos.ok) throw new Error('Error al obtener consentimientos');
        
        const todosConsentimientos = await responseConsentimientos.json();

        // Generar el HTML para cada consentimiento
        const container = document.getElementById('consentimientos-container');
        container.innerHTML = todosConsentimientos.map(consentimiento => {
            const registro = consentimientosUsuario.find(r => 
                r.ConsentimientoID === consentimiento.ConsentimientoID
            );

            return `
                <div class="consent-card">
                    <div class="consent-header">
                        <h2 class="consent-title">${consentimiento.NombreConsentimiento}</h2>
                        <span class="status ${registro ? (registro.Aceptado ? 'accepted' : 'pending') : 'pending'}">
                            ${registro ? (registro.Aceptado ? 'Aceptado' : 'Pendiente') : 'Pendiente'}
                        </span>
                    </div>
                    <div class="consent-details">
                        ${consentimiento.Descripcion}
                    </div>
                    <div class="consent-meta">
                        ${registro ? `
                            <p>Versión: ${registro.VersionConsentimiento}</p>
                            <p>Última actualización: ${new Date(registro.FechaOtorgamiento).toLocaleDateString()}</p>
                        ` : '<p>No registrado</p>'}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los consentimientos');
    }
}

document.addEventListener('DOMContentLoaded', cargarConsentimientosUsuario);