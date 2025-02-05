document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
 
    if (!token || !userData) {
        window.location.href = '../../auth/login.html';
        return;
    }
 
    updateDateTime();
    setInterval(updateDateTime, 1000);
 
    // Cargar datos y actualizar contadores
    await Promise.all([
        cargarUsuarios(),
        cargarAuditoriaPersonas(),
        cargarAuditoriaConsentimientos(),
        cargarConsentimientos(), // añadido aquí
        actualizarContadores()
    ]);
 
    // Event Listeners para navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.dataset.section) {
                showSection(this.dataset.section);
            }
        });
    });
 
    // Agregar event listener al formulario de consentimientos
    const consentimientoForm = document.getElementById('consentimientoForm');
    if (consentimientoForm) {
        consentimientoForm.addEventListener('submit', agregarConsentimiento);
    }
 
    setupSearchListeners();
    setInterval(actualizarContadores, 60000); // Actualizar contadores cada minuto
 });

function updateDateTime() {
   const now = new Date();
   document.getElementById('currentDateTime').textContent = now.toLocaleString();
}

async function actualizarContadores() {
    try {
        const token = localStorage.getItem('token');

        // Contador de Consentimientos
        const respConsentimientos = await fetch('http://localhost:3000/api/consentimientos', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const consentimientos = await respConsentimientos.json();
        
        // Actualizar inmediatamente el contador
        if (consentimientos && Array.isArray(consentimientos)) {
            document.getElementById('totalConsents').textContent = consentimientos.length;
        }

        // Contador de Usuarios
        const respUsuarios = await fetch('http://localhost:3000/api/personas', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const usuarios = await respUsuarios.json();
        
        if (usuarios && Array.isArray(usuarios)) {
            document.getElementById('totalUsers').textContent = usuarios.length;
        }

        // Contador últimas 24h
        const respAuditorias = await fetch('http://localhost:3000/api/auditoria-personas', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const auditorias = await respAuditorias.json();
        
        if (auditorias && Array.isArray(auditorias)) {
            const ahora = new Date();
            const hace24h = new Date(ahora - 24 * 60 * 60 * 1000);
            const actividadesRecientes = auditorias.filter(auditoria => 
                new Date(auditoria.Fecha) >= hace24h
            );
            document.getElementById('last24hActivity').textContent = actividadesRecientes.length;
        }

    } catch (error) {
        console.error('Error al actualizar contadores:', error);
    }
}


async function cargarUsuarios() {
   try {
       const token = localStorage.getItem('token');
       const response = await fetch('http://localhost:3000/api/personas', {
           headers: {'Authorization': `Bearer ${token}`}
       });
       const usuarios = await response.json();

       const tbody = document.querySelector('#usuariosTable tbody');
       tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>${usuario.PersonaID}</td>
            <td>${usuario.Nombre || 'N/A'}</td>
            <td>${usuario.Apellido || 'N/A'}</td>
            <td>${anonimizarIdentificacion(usuario.Identificacion) || 'N/A'}</td>
            <td>${usuario.Correo || 'N/A'}</td>
            <td>
                <button class="btn-action view" onclick="verDetallesUsuario(${usuario.PersonaID})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action delete" onclick="confirmarEliminarUsuario(${usuario.PersonaID})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
   } catch (error) {
       console.error('Error:', error);
       mostrarError('Error al cargar usuarios');
   }
}

function anonimizarIdentificacion(identificacion) {
    if (!identificacion) return 'N/A';
    return identificacion.slice(0, 3) + '*'.repeat(identificacion.length - 6) + identificacion.slice(-3);
}

// Función para confirmación antes de eliminar
function confirmarEliminarUsuario(personaId) {
    if (confirm('¿Está seguro que desea eliminar este usuario? Esta acción no se puede deshacer.')) {
        eliminarUsuario(personaId);
    }
}

// Función para eliminar usuario con manejo de errores mejorado
async function eliminarUsuario(personaId) {
    try {
        const token = localStorage.getItem('token');
        
        // Verificar que tenemos el token
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        // Hacer la petición DELETE
        const response = await fetch(`http://localhost:3000/api/personas/${personaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Verificar la respuesta
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar usuario');
        }

        // Recargar datos después de eliminar
        await Promise.all([
            cargarUsuarios(),
            actualizarContadores(),
            cargarAuditoriaPersonas()
        ]);

        mostrarExito('Usuario eliminado exitosamente');

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        mostrarError(`Error al eliminar usuario: ${error.message}`);
    }
}

async function cargarAuditoriaPersonas() {
   try {
       const token = localStorage.getItem('token');
       const response = await fetch('http://localhost:3000/api/auditoria-personas', {
           headers: {'Authorization': `Bearer ${token}`}
       });
       const auditorias = await response.json();

       const tbody = document.querySelector('#auditoriaPersonasTable tbody');
       tbody.innerHTML = auditorias.map(auditoria => `
           <tr>
               <td>${auditoria.AuditoriaID}</td>
               <td>${auditoria.PersonaID}</td>
               <td><span class="badge ${getBadgeClass(auditoria.Accion)}">${auditoria.Accion}</span></td>
               <td>${formatDate(auditoria.Fecha)}</td>
               <td>${auditoria.Detalles || 'N/A'}</td>
           </tr>
       `).join('');
   } catch (error) {
       console.error('Error:', error);
       mostrarError('Error al cargar auditoría');
   }
}

async function cargarAuditoriaConsentimientos() {
   try {
       const token = localStorage.getItem('token');
       const response = await fetch('http://localhost:3000/api/auditoria-consentimientos', {
           headers: {'Authorization': `Bearer ${token}`}
       });
       const auditorias = await response.json();

       const tbody = document.querySelector('#auditoriaConsentimientosTable tbody');
       tbody.innerHTML = auditorias.map(auditoria => `
           <tr>
               <td>${auditoria.AuditoriaID}</td>
               <td>${auditoria.RegistroID}</td>
               <td>${auditoria.PersonaID}</td>
               <td>${auditoria.ConsentimientoID}</td>
               <td><span class="badge ${getBadgeClass(auditoria.Accion)}">${auditoria.Accion}</span></td>
               <td>${formatDate(auditoria.Fecha)}</td>
           </tr>
       `).join('');
   } catch (error) {
       console.error('Error:', error);
       mostrarError('Error al cargar auditoría de consentimientos');
   }
}

async function agregarConsentimiento(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    
    try {
        const token = localStorage.getItem('token');
        const consentimiento = {
            NombreConsentimiento: document.getElementById('nombreConsentimiento').value.trim(),
            Descripcion: document.getElementById('descripcionConsentimiento').value.trim()
        };
 
        const response = await fetch('http://localhost:3000/api/consentimientos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(consentimiento)
        });
 
        if (!response.ok) throw new Error('Error al crear el consentimiento');
 
        closeModal('newConsentModal');
        document.getElementById('consentimientoForm').reset();
        
        // Actualizar inmediatamente los contadores y tablas
        await Promise.all([
            actualizarContadores(),
            cargarAuditoriaConsentimientos()
        ]);
 
        mostrarExito('Consentimiento agregado exitosamente');
        // Recargar la página para asegurar actualización
        location.reload();
 
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    } finally {
        submitButton.disabled = false;
    }
 }

 async function cargarConsentimientos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/consentimientos', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const consentimientos = await response.json();

        console.log('Consentimientos cargados:', consentimientos); // Debug

        const tbody = document.querySelector('#consentimientosTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de consentimientos');
            return;
        }

        tbody.innerHTML = consentimientos.map(consentimiento => `
            <tr>
                <td>${consentimiento.ConsentimientoID}</td>
                <td>${consentimiento.NombreConsentimiento}</td>
                <td>${consentimiento.Descripcion}</td>
                <td>
                    <button class="btn-action edit" onclick="editarConsentimiento(${consentimiento.ConsentimientoID})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="confirmarEliminarConsentimiento(${consentimiento.ConsentimientoID})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar consentimientos:', error);
        mostrarError('Error al cargar la lista de consentimientos');
    }
}

function confirmarEliminarConsentimiento(consentimientoId) {
    const confirmar = window.confirm('¿Está seguro que desea eliminar este consentimiento? Esta acción no se puede deshacer.');
    if (confirmar) {
        eliminarConsentimiento(consentimientoId);
    }
}

async function eliminarConsentimiento(consentimientoId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/consentimientos/${consentimientoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar el consentimiento');

        await Promise.all([
            cargarConsentimientos(),
            actualizarContadores(),
            cargarAuditoriaConsentimientos()
        ]);

        mostrarExito('Consentimiento eliminado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al eliminar el consentimiento');
    }
}

async function editarConsentimiento(consentimientoId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/consentimientos/${consentimientoId}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (!response.ok) throw new Error('Error al obtener el consentimiento');
        
        const consentimiento = await response.json();
        
        const modalHtml = `
            <div class="modal-content">
                <span class="close-modal" onclick="closeModal('editConsentimientoModal')">&times;</span>
                <h2>Editar Consentimiento</h2>
                <form id="editConsentimientoForm">
                    <input type="hidden" id="editConsentimientoId" value="${consentimientoId}">
                    <div class="form-group">
                        <label for="editNombreConsentimiento">Nombre del Consentimiento</label>
                        <input type="text" id="editNombreConsentimiento" value="${consentimiento.NombreConsentimiento}" required>
                    </div>
                    <div class="form-group">
                        <label for="editDescripcionConsentimiento">Descripción</label>
                        <textarea id="editDescripcionConsentimiento" required>${consentimiento.Descripcion}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="closeModal('editConsentimientoModal')" class="btn-secondary">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        `;

        let modal = document.getElementById('editConsentimientoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editConsentimientoModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = modalHtml;
        modal.style.display = 'flex';

        const form = document.getElementById('editConsentimientoForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await actualizarConsentimiento(consentimientoId);
        };
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar el consentimiento');
    }
}

async function actualizarConsentimiento(consentimientoId) {
    try {
        const token = localStorage.getItem('token');
        const datosActualizados = {
            NombreConsentimiento: document.getElementById('editNombreConsentimiento').value.trim(),
            Descripcion: document.getElementById('editDescripcionConsentimiento').value.trim()
        };

        const response = await fetch(`http://localhost:3000/api/consentimientos/${consentimientoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosActualizados)
        });

        if (!response.ok) throw new Error('Error al actualizar el consentimiento');

        closeModal('editConsentimientoModal');
        await Promise.all([
            cargarConsentimientos(),
            actualizarContadores(),
            cargarAuditoriaConsentimientos()
        ]);

        mostrarExito('Consentimiento actualizado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al actualizar el consentimiento');
    }
}

// Funciones auxiliares
function setupSearchListeners() {
    // Búsqueda de usuarios
    document.getElementById('searchUsers').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const table = document.querySelector('#usuariosTable tbody');
        const rows = table.getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Búsqueda en auditoría
    document.querySelector('input[placeholder="Buscar en auditoría..."]')?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const table = document.querySelector('#auditoriaPersonasTable tbody');
        const rows = table.getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function filterTable(tableId, searchTerm) {
   const table = document.getElementById(tableId);
   const rows = table.getElementsByTagName('tr');

   for (let i = 1; i < rows.length; i++) {
       const text = rows[i].textContent.toLowerCase();
       rows[i].style.display = text.includes(searchTerm) ? '' : 'none';
   }
}

function showSection(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${sectionId}"]`)?.classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`)?.classList.add('active');

    // Recargar datos si es necesario
    if (sectionId === 'consentimientos') {
        cargarConsentimientos();
    }
}

async function verDetallesUsuario(personaId) {
   try {
       const token = localStorage.getItem('token');
       const response = await fetch(`http://localhost:3000/api/personas/${personaId}`, {
           headers: {'Authorization': `Bearer ${token}`}
       });
       
       const usuario = await response.json();

       const modalHtml = `
           <div class="modal-content">
               <span class="close-modal">&times;</span>
               <h2>Detalles del Usuario</h2>
               <div class="user-details">
                   <p><strong>ID:</strong> ${usuario.PersonaID}</p>
                   <p><strong>Nombre:</strong> ${usuario.Nombre}</p>
                   <p><strong>Apellido:</strong> ${usuario.Apellido}</p>
                   <p><strong>Identificación:</strong> ${usuario.Identificacion}</p>
                   <p><strong>Correo:</strong> ${usuario.Correo}</p>
                   <p><strong>Teléfono:</strong> ${usuario.Telefono || 'No especificado'}</p>
                   <p><strong>Dirección:</strong> ${usuario.Direccion || 'No especificada'}</p>
               </div>
           </div>
       `;

       let modal = document.getElementById('userDetailsModal');
       if (!modal) {
           modal = document.createElement('div');
           modal.id = 'userDetailsModal';
           modal.className = 'modal';
           document.body.appendChild(modal);
       }

       modal.innerHTML = modalHtml;
       modal.style.display = 'flex';

       modal.querySelector('.close-modal').onclick = () => {
           modal.style.display = 'none';
       };

   } catch (error) {
       console.error('Error:', error);
       mostrarError('Error al obtener detalles del usuario');
   }
}

function formatDate(dateString) {
   return new Date(dateString).toLocaleString();
}

function getBadgeClass(accion) {
   return {
       'Creación': 'badge-success',
       'Modificación': 'badge-warning',
       'Eliminación': 'badge-danger'
   }[accion] || 'badge-info';
}

// Función para mostrar mensajes de error mejorada
function mostrarError(mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.textContent = mensaje;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Función para mostrar mensajes de éxito mejorada
function mostrarExito(mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    alertDiv.textContent = mensaje;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function showModal(modalId) {
   document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
   document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
   if (event.target.classList.contains('modal')) {
       event.target.style.display = 'none';
   }
};