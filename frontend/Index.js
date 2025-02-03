// Versión más concisa usando arrow functions y sintaxis moderna
document.addEventListener('DOMContentLoaded', () => {
    // Menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle?.addEventListener('click', () => navLinks.classList.toggle('active'));

    // Botones de registro e inicio de sesión
    document.getElementById('btnRegistro')?.addEventListener('click', () => 
        window.location.href = './src/LOPDP/lopd.html'
    );

    document.getElementById('btnLogin')?.addEventListener('click', () => 
        window.location.href = './src/views/auth/login.html'
    );

    // Cerrar menú móvil
    document.querySelectorAll('.nav-links a').forEach(link => 
        link.addEventListener('click', () => navLinks.classList.remove('active'))
    );
});