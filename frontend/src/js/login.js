document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            Identificacion: document.getElementById('identificacion').value,
            Correo: document.getElementById('correo').value
        };

        try {
            const submitButton = document.querySelector('.btn-submit');
            submitButton.disabled = true;
            submitButton.textContent = 'Iniciando sesión...';

            // Primero verificamos si el usuario existe
            const verificacionResponse = await fetch(`http://localhost:3000/api/personas/verificar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!verificacionResponse.ok) {
                throw new Error('Usuario no encontrado. Por favor, verifique sus credenciales.');
            }

            // Si el usuario existe, procedemos con el login
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (loginResponse.ok) {
                const userData = await loginResponse.json();
                
                // Guardamos los datos del usuario en localStorage
                localStorage.setItem('userToken', userData.token);
                localStorage.setItem('userId', userData.PersonaID);
                localStorage.setItem('userType', userData.TipoUsuario);

                // Redirigimos según el tipo de usuario
                if (userData.TipoUsuario === 'administrador') {
                    window.location.href = '../views/admin/dashboard.html';
                } else if (userData.TipoUsuario === 'cliente') {
                    window.location.href = '../views/client/dashboard.html';
                }
            } else {
                const errorData = await loginResponse.json();
                throw new Error(errorData.message || 'Error en el inicio de sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            // Crear y mostrar mensaje de error
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.style.display = 'block';
            errorMessage.style.color = '#dc3545';
            errorMessage.style.padding = '10px';
            errorMessage.style.marginTop = '10px';
            errorMessage.style.backgroundColor = '#ffe6e6';
            errorMessage.style.borderRadius = '4px';
            errorMessage.style.textAlign = 'center';
            errorMessage.textContent = error.message || 'Error al iniciar sesión';

            // Insertar mensaje de error después del formulario
            const form = document.getElementById('loginForm');
            form.parentNode.insertBefore(errorMessage, form.nextSibling);

            // Remover mensaje después de 3 segundos
            setTimeout(() => {
                errorMessage.remove();
            }, 3000);
        } finally {
            const submitButton = document.querySelector('.btn-submit');
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar Sesión';
        }
    });

    // Validación en tiempo real
    const inputs = loginForm.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (!input.value.trim()) {
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
            }
        });
    });
});