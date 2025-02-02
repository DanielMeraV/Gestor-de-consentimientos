document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');

    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const password = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (password.type === 'password') {
                password.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                password.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();
            
            if (!validateForm()) return;
            
            const identificacion = document.getElementById('identificacion').value.trim();
            const password = document.getElementById('password').value;
            
            try {
                showLoading(true);

                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        identificacion: identificacion,
                        password: password 
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error en el servidor');
                }

                // Login exitoso
                localStorage.setItem('token', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Redirección basada en tipo de usuario
                const redirectPath = data.user.tipoUsuario === 'administrador' 
                    ? '../admin/dashboard.html' 
                    : '../client/dashboard.html';
                
                window.location.href = redirectPath;
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message, 'loginError');
            } finally {
                showLoading(false);
            }
        });
    }
});

function validateForm() {
    let isValid = true;
    const identificacion = document.getElementById('identificacion').value.trim();
    const password = document.getElementById('password').value;

    if (!identificacion) {
        showError('La identificación es obligatoria', 'identificacionError');
        isValid = false;
    }
    
    if (!password) {
        showError('La contraseña es obligatoria', 'passwordError');
        isValid = false;
    }

    return isValid;
}

function showError(message, elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
        element.textContent = '';
    });
}

function showLoading(show) {
    const submitButton = document.querySelector('.btn-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const spinner = submitButton.querySelector('.spinner');

    submitButton.disabled = show;
    buttonText.style.display = show ? 'none' : 'inline-block';
    spinner.style.display = show ? 'inline-block' : 'none';
}