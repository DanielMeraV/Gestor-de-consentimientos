document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!token || !userData) {
        window.location.href = '../../auth/login.html';
        return;
    }

    // Inicializar contadores
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Cargar datos iniciales
    await Promise.all([
        cargarUsuarios(),
        cargarAuditoriaPersonas(),
        cargarAuditoriaConsentimientos()
    ]);

    // Event Listeners para navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.dataset.section) {
                showSection(this.dataset.section);
            }
        });
    });

    // Event Listeners para búsqueda
    setupSearchListeners();

    // Configurar formulario de consentimientos
    document.getElementById('consentimientoForm').addEventListener('submit', agregarConsentimiento);
});

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDateTime').textContent = now.toLocaleString();
}

function showSection(sectionId) {
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${sectionId}"]`)?.classList.add('active');

    // Mostrar sección correspondiente
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`)?.classList.add('active');
}

function setupSearchListeners() {
    // Búsqueda de usuarios
    document.getElementById('searchUsers').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterTable('usuariosTable', searchTerm);
    });

    // Búsqueda en auditoría de personas
    document.getElementById('searchAuditPersonas').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterTable('auditoriaPersonasTable', searchTerm);
    });

    // Búsqueda en auditoría de consentimientos
    document.getElementById('searchAuditConsent').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterTable('auditoriaConsentimientosTable', searchTerm);
    });
}

function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

async function cargarUsuarios() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/personas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const usuarios = await response.json();

        // Actualizar contador
        document.getElementById('totalUsers').textContent = usuarios.length;

        // Actualizar tabla
        const tbody = document.querySelector('#usuariosTable tbody');
        tbody.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>${usuario.PersonaID}</td>
                <td>${usuario.Nombre || 'N/A'}</td>
                <td>${usuario.Apellido || 'N/A'}</td>
                <td>${usuario.Identificacion || 'N/A'}</td>
                <td>${usuario.Correo || 'N/A'}</td>
                <td>
                    <button class="btn-action view" onclick="verDetallesUsuario(${usuario.PersonaID})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarError('Error al cargar la lista de usuarios');
    }
}

async function cargarAuditoriaPersonas() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/auditoria-personas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const auditorias = await response.json();

        // Actualizar contador de actividad últimas 24h
        const last24h = auditorias.filter(a => {
            return new Date(a.Fecha) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        }).length;
        document.getElementById('last24hActivity').textContent = last24h;

        // Actualizar tabla
        const tbody = document.querySelector('#auditoriaPersonasTable tbody');
        tbody.innerHTML = auditorias.map(auditoria => `
            <tr>
                <td>${auditoria.AuditoriaID}</td>
                <td>${auditoria.PersonaID}</td>
                <td>
                    <span class="badge ${getBadgeClass(auditoria.Accion)}">
                        ${auditoria.Accion}
                    </span>
                </td>
                <td>${formatDate(auditoria.Fecha)}</td>
                <td>${auditoria.Detalles || 'N/A'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar auditoría de personas:', error);
        mostrarError('Error al cargar la auditoría de personas');
    }
}

async function cargarAuditoriaConsentimientos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/auditoria-consentimientos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const auditorias = await response.json();

        // Actualizar contador
        document.getElementById('totalConsents').textContent = 
            new Set(auditorias.map(a => a.ConsentimientoID)).size;

        // Actualizar tabla
        const tbody = document.querySelector('#auditoriaConsentimientosTable tbody');
        tbody.innerHTML = auditorias.map(auditoria => `
            <tr>
                <td>${auditoria.AuditoriaID}</td>
                <td>${auditoria.RegistroID}</td>
                <td>${auditoria.PersonaID}</td>
                <td>${auditoria.ConsentimientoID}</td>
                <td>
                    <span class="badge ${getBadgeClass(auditoria.Accion)}">
                        ${auditoria.Accion}
                    </span>
                </td>
                <td>${formatDate(auditoria.Fecha)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar auditoría de consentimientos:', error);
        mostrarError('Error al cargar la auditoría de consentimientos');
    }
}

async function agregarConsentimiento(event) {
    event.preventDefault();
    
    // Obtener los valores
    const nombreConsentimiento = document.getElementById('nombreConsentimiento').value.trim();
    const descripcionConsentimiento = document.getElementById('descripcionConsentimiento').value.trim();

    // Validaciones
    if (!nombreConsentimiento) {
        alert('El nombre del consentimiento es requerido');
        return;
    }
    if (!descripcionConsentimiento) {
        alert('La descripción del consentimiento es requerida');
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    try {
        // Obtener token de autenticación
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        const consentimiento = {
            NombreConsentimiento: nombreConsentimiento,
            Descripcion: descripcionConsentimiento
        };

        console.log('Enviando consentimiento:', consentimiento); // Debug

        const response = await fetch('http://localhost:3000/api/consentimientos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(consentimiento)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al agregar el consentimiento');
        }

        console.log('Respuesta del servidor:', data); // Debug

        // Cerrar el modal
        const modal = document.getElementById('newConsentModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Limpiar el formulario
        document.getElementById('consentimientoForm').reset();

        // Mostrar mensaje de éxito
        alert('Consentimiento agregado exitosamente');

        // Opcional: Recargar la lista de consentimientos si la tienes
        if (typeof cargarAuditoriaConsentimientos === 'function') {
            await cargarAuditoriaConsentimientos();
        }

    } catch (error) {
        console.error('Error detallado:', error);
        alert(error.message || 'Error al agregar el consentimiento');
    } finally {
        // Restaurar el botón
        submitButton.disabled = false;
        submitButton.textContent = 'Guardar Consentimiento';
    }
}

// Funciones de utilidad
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function getBadgeClass(accion) {
    const clases = {
        'Creación': 'badge-success',
        'Modificación': 'badge-warning',
        'Eliminación': 'badge-danger'
    };
    return clases[accion] || 'badge-info';
}

function mostrarError(mensaje) {
    // Implementar notificación de error
    console.error(mensaje);
}

function mostrarExito(mensaje) {
    // Implementar notificación de éxito
    console.log(mensaje);
}

// Funciones modales
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Event listener para cerrar modales
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};