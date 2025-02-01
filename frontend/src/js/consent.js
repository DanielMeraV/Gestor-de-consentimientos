// src/js/consent.js
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
    }
}

async function guardarConsentimientos(personaId) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const registros = Array.from(checkboxes).map(checkbox => ({
        PersonaID: personaId,
        ConsentimientoID: parseInt(checkbox.name.split('_')[1]),
        Aceptado: checkbox.checked,
        VersionConsentimiento: '1.0'
    }));

    try {
        const response = await fetch('http://localhost:3000/api/registros-consentimiento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registros)
        });

        if (response.ok) {
            alert('Consentimientos guardados exitosamente');
        } else {
            throw new Error('Error al guardar los consentimientos');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los consentimientos');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarConsentimientos();

    document.getElementById('consentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Aquí deberías obtener el PersonaID de alguna manera (sesión, localStorage, etc.)
        const personaId = 1; // Por ahora hardcodeado para pruebas
        await guardarConsentimientos(personaId);
    });
});