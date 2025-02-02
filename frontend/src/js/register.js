document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const fechaNacimientoInput = document.getElementById('fechaNacimiento');
    const fechaNacimientoError = document.getElementById('fechaNacimientoError');

    // Establecer la fecha máxima como la fecha actual
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaMaxima = `${año}-${mes}-${dia}`;
    
    fechaNacimientoInput.setAttribute('max', fechaMaxima);

    // Validación de fecha de nacimiento
    fechaNacimientoInput.addEventListener('change', (e) => {
        const fechaSeleccionada = new Date(e.target.value);
        const hoy = new Date();

        if (fechaSeleccionada > hoy) {
            fechaNacimientoError.textContent = 'La fecha no puede ser posterior a la actual';
            fechaNacimientoError.style.display = 'block';
            fechaNacimientoInput.classList.add('invalid');
            e.target.value = ''; // Limpiar el campo
        } else {
            fechaNacimientoError.style.display = 'none';
            fechaNacimientoInput.classList.remove('invalid');
        }
    });

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar fecha antes de enviar
        const fechaNacimiento = new Date(fechaNacimientoInput.value);
        const hoy = new Date();
        
        if (fechaNacimiento > hoy) {
            fechaNacimientoError.textContent = 'La fecha no puede ser posterior a la actual';
            fechaNacimientoError.style.display = 'block';
            fechaNacimientoInput.classList.add('invalid');
            return;
        }

        const formData = {
            Nombre: document.getElementById('nombre').value,
            Apellido: document.getElementById('apellido').value,
            Identificacion: document.getElementById('identificacion').value,
            FechaNacimiento: document.getElementById('fechaNacimiento').value,
            Telefono: document.getElementById('telefono').value,
            Correo: document.getElementById('correo').value,
            Direccion: document.getElementById('direccion').value,
            TipoUsuario: 'cliente'
        };

        try {
            const submitButton = document.querySelector('.btn-submit');
            submitButton.disabled = true;
            submitButton.textContent = 'Registrando...';

            const response = await fetch('http://localhost:3000/api/personas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Registro completado exitosamente');
                window.location.href = 'login.html';
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error en el registro');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al procesar el registro');
        } finally {
            const submitButton = document.querySelector('.btn-submit');
            submitButton.disabled = false;
            submitButton.textContent = 'Completar Registro';
        }
    });

    // Validación de campos en tiempo real
    const inputs = registroForm.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
            }
        });
    });
});