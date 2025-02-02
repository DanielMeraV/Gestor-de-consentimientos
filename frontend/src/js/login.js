document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const password = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (password.type === 'password') {
            password.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            password.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    function showError(message, elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    function hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.style.display = 'none';
    }

    function validateForm() {
        let isValid = true;
        const identificacion = document.getElementById('identificacion').value.trim();
        const password = document.getElementById('password').value;

        // Validar identificación
        if (!identificacion) {
            showError('La identificación es requerida', 'identificacionError');
            isValid = false;
        } else if (identificacion.length !== 10 || !/^\d+$/.test(identificacion)) {
            showError('La identificación debe tener 10 dígitos numéricos', 'identificacionError');
            isValid = false;
        } else {
            hideError('identificacionError');
        }

        // Validar contraseña
        if (!password) {
            showError('La contraseña es requerida', 'passwordError');
            isValid = false;
        } else if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres', 'passwordError');
            isValid = false;
        } else {
            hideError('passwordError');
        }

        return isValid;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const formData = {
            identificacion: document.getElementById('identificacion').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const submitButton = document.querySelector('.btn-submit');
            submitButton.disabled = true;
            submitButton.textContent = 'Iniciando sesión...';

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                if (data.user.TipoUsuario === 'administrador') {
                    window.location.href = '../admin/dashboard.html';
                } else {
                    window.location.href = '../client/dashboard.html';
                }
            } else {
                showError(data.error || 'Credenciales inválidas', 'identificacionError');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al iniciar sesión', 'identificacionError');
        } finally {
            const submitButton = document.querySelector('.btn-submit');
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar Sesión';
        }
    });
});