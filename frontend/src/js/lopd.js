document.addEventListener('DOMContentLoaded', () => {
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    const registerButton = document.getElementById('btnRegister');
    const cancelButton = document.getElementById('btnCancel');

    // Habilitar/deshabilitar botón de registro
    acceptTermsCheckbox.addEventListener('change', () => {
        registerButton.disabled = !acceptTermsCheckbox.checked;
    });

    // Botón cancelar
    cancelButton.addEventListener('click', () => {
        if(confirm('¿Está seguro que desea cancelar el proceso?')) {
            window.location.href = '../../index.html';
        }
    });

    // Botón registrar
    registerButton.addEventListener('click', () => {
        if(acceptTermsCheckbox.checked) {
            window.location.href = '../views/auth/register.html';
           // window.location.href = './consent.html';
        } else {
            alert('Debe aceptar los términos y condiciones para continuar');
        }
    });

    // Verificar scroll de términos
    const termsContent = document.querySelector('.terms-content');
    termsContent.addEventListener('scroll', () => {
        const isBottom = termsContent.scrollHeight - termsContent.scrollTop === termsContent.clientHeight;
        if(isBottom) {
            acceptTermsCheckbox.disabled = false;
        }
    });
});