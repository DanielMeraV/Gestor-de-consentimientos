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
       document.getElementById('totalConsents').textContent = consentimientos.length || '0';

       // Contador de Usuarios
       const respUsuarios = await fetch('http://localhost:3000/api/personas', {
           headers: {'Authorization': `Bearer ${token}`}
       });
       const usuarios = await respUsuarios.json();
       document.getElementById('totalUsers').textContent = usuarios.length || '0';

       // Contador últimas 24h
       const respAuditorias = await fetch('http://localhost:3000/api/auditoria-personas', {
           headers: {'Authorization': `Bearer ${token}`}
       });
       const auditorias = await respAuditorias.json();
       
       const ahora = new Date();
       const hace24h = new Date(ahora - 24 * 60 * 60 * 1000);
       const actividadesRecientes = auditorias.filter(auditoria => {
           return new Date(auditoria.Fecha) >= hace24h;
       });

       document.getElementById('last24hActivity').textContent = actividadesRecientes.length || '0';

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
       console.error('Error:', error);
       mostrarError('Error al cargar usuarios');
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
       
       await Promise.all([
           actualizarContadores(),
           cargarAuditoriaConsentimientos()
       ]);

       mostrarExito('Consentimiento agregado exitosamente');

   } catch (error) {
       console.error('Error:', error);
       mostrarError(error.message);
   } finally {
       submitButton.disabled = false;
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

function mostrarError(mensaje) {
   // Implementar notificación de error
   console.error(mensaje);
}

function mostrarExito(mensaje) {
   // Implementar notificación de éxito
   console.log(mensaje);
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