async function cargarConsentimientos() {
    try {
        const response = await fetch('http://localhost:3000/api/consentimientos');
        const consentimientos = await response.json();
       
        const container = document.getElementById('consentimientosList');
        container.innerHTML = '';
        consentimientos.forEach(consent => {
            const div = document.createElement('div');
            div.className = 'consent-item';
            div.innerHTML = `
                <div class="consent-text">
                    <h3>${consent.NombreConsentimiento}</h3>
                    <p>${consent.Descripcion}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" name="consent_${consent.ConsentimientoID}">
                    <span class="slider"></span>
                </label>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar consentimientos:', error);
        alert('Error al cargar los consentimientos. Por favor, intente nuevamente.');
    }
}

async function guardarConsentimientos(personaId) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const registros = Array.from(checkboxes).map(checkbox => ({
        PersonaID: personaId,
        ConsentimientoID: parseInt(checkbox.name.split('_')[1]),
        Aceptado: checkbox.checked ? 1 : 0, // Convertir a 1 o 0 para SQL Server
        VersionConsentimiento: '1.0'
    }));

    try {
        // Realizar una petición por cada consentimiento
        for (const registro of registros) {
            const response = await fetch('http://localhost:3000/api/registros-consentimiento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registro) // Enviar un solo registro
            });

            if (!response.ok) {
                throw new Error(`Error al guardar el consentimiento ${registro.ConsentimientoID}`);
            }
        }

        alert('Consentimientos guardados exitosamente. Por favor, inicie sesión.');
        // Redirigir al login después de guardar los consentimientos
        window.location.href = '../views/auth/login.html';

    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los consentimientos');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Obtener el ID del usuario del localStorage
    const registroData = JSON.parse(localStorage.getItem('registroData'));
    
    if (!registroData || !registroData.id) {
        alert('Error: No se encontró información del usuario registrado');
        window.location.href = '../views/auth/login.html';
        return;
    }

    cargarConsentimientos();

    document.getElementById('consentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        try {
            const personaId = registroData.id; // Obtener el ID del usuario del localStorage
            await guardarConsentimientos(personaId);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar los consentimientos');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar preferencias';
        }
    });
});