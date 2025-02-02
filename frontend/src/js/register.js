document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            identificacion: document.getElementById('identificacion').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/personas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Registro completado exitosamente');
                window.location.href = 'index.html';
            } else {
                alert('Error al registrar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar el registro');
        }
    });
});