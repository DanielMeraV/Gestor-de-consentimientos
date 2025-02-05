document.addEventListener("DOMContentLoaded", () => {
  const registroForm = document.getElementById("registroForm");
  const togglePasswordButtons = document.querySelectorAll(".toggle-password");

  // Toggle password visibility
  togglePasswordButtons.forEach((button) => {
      button.addEventListener("click", function () {
          const input = this.previousElementSibling;
          const icon = this.querySelector("i");

          if (input.type === "password") {
              input.type = "text";
              icon.classList.remove("fa-eye");
              icon.classList.add("fa-eye-slash");
          } else {
              input.type = "password";
              icon.classList.remove("fa-eye-slash");
              icon.classList.add("fa-eye");
          }
      });
  });

  function showError(message, elementId) {
      const errorElement = document.getElementById(elementId);
      errorElement.textContent = message;
      errorElement.style.display = "block";
  }

  function hideError(elementId) {
      const errorElement = document.getElementById(elementId);
      errorElement.style.display = "none";
  }

  function validatePassword(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      return (
          password.length >= minLength &&
          hasUpperCase &&
          hasLowerCase &&
          hasNumbers &&
          hasSpecialChar
      );
  }

  function validateForm() {
      let isValid = true;
      const nombre = document.getElementById("nombre").value.trim();
      const apellido = document.getElementById("apellido").value.trim();
      const identificacion = document.getElementById("identificacion").value.trim();
      const fechaNacimiento = document.getElementById("fechaNacimiento").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const telefono = document.getElementById("telefono").value.trim();
      const correo = document.getElementById("correo").value.trim();
      const direccion = document.getElementById("direccion").value.trim();

      // Validar nombre
      if (!nombre) {
          showError("El nombre es requerido", "nombreError");
          isValid = false;
      } else {
          hideError("nombreError");
      }

      // Validar apellido
      if (!apellido) {
          showError("El apellido es requerido", "apellidoError");
          isValid = false;
      } else {
          hideError("apellidoError");
      }

      // Validar identificación
      if (!identificacion) {
          showError("La identificación es requerida", "identificacionError");
          isValid = false;
      } else if (identificacion.length !== 10 || !/^\d+$/.test(identificacion)) {
          showError(
              "La identificación debe tener 10 dígitos numéricos",
              "identificacionError"
          );
          isValid = false;
      } else {
          hideError("identificacionError");
      }

      // Validar fecha de nacimiento
      if (!fechaNacimiento) {
          showError("La fecha de nacimiento es requerida", "fechaNacimientoError");
          isValid = false;
      } else {
          const fechaNac = new Date(fechaNacimiento);
          if (fechaNac > new Date()) {
              showError(
                  "La fecha de nacimiento no puede ser futura",
                  "fechaNacimientoError"
              );
              isValid = false;
          } else {
              hideError("fechaNacimientoError");
          }
      }

      // Validar contraseña
      if (!password) {
          showError("La contraseña es requerida", "passwordError");
          isValid = false;
      } else if (!validatePassword(password)) {
          showError("La contraseña no cumple con los requisitos", "passwordError");
          isValid = false;
      } else {
          hideError("passwordError");
      }

      // Validar confirmación de contraseña
      if (password !== confirmPassword) {
          showError("Las contraseñas no coinciden", "confirmPasswordError");
          isValid = false;
      } else {
          hideError("confirmPasswordError");
      }

      // Validar teléfono
      if (!telefono) {
          showError("El teléfono es requerido", "telefonoError");
          isValid = false;
      } else if (!/^\d{10}$/.test(telefono)) {
          showError("El teléfono debe tener 10 dígitos", "telefonoError");
          isValid = false;
      } else {
          hideError("telefonoError");
      }

      // Validar correo
      if (!correo) {
          showError("El correo electrónico es requerido", "correoError");
          isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
          showError("Formato de correo electrónico inválido", "correoError");
          isValid = false;
      } else {
          hideError("correoError");
      }

      // Validar dirección
      if (!direccion) {
          showError("La dirección es requerida", "direccionError");
          isValid = false;
      } else {
          hideError("direccionError");
      }

      return isValid;
  }

  registroForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validateForm()) {
          return;
      }

      const formData = {
          Nombre: document.getElementById("nombre").value.trim(),
          Apellido: document.getElementById("apellido").value.trim(),
          Identificacion: document.getElementById("identificacion").value.trim(),
          Password: document.getElementById("password").value,
          FechaNacimiento: document.getElementById("fechaNacimiento").value,
          Telefono: document.getElementById("telefono").value.trim(),
          Correo: document.getElementById("correo").value.trim(),
          Direccion: document.getElementById("direccion").value.trim(),
      };

      try {
          const submitButton = document.querySelector(".btn-submit");
          submitButton.disabled = true;
          submitButton.textContent = "Registrando...";

          const response = await fetch("http://localhost:3000/api/personas", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(formData),
          });

          const data = await response.json();

          if (response.status === 409) {
            showError("Ya existe un usuario con esta identificación", "identificacionError");
            document.getElementById("identificacion").focus();
            return;
        }

          if (response.ok) {
              // Guardar datos del usuario registrado
              const registroData = {
                  id: data.personaId,
                  nombre: formData.Nombre,
                  apellido: formData.Apellido
              };

              
              localStorage.setItem('registroData', JSON.stringify(registroData));

              alert("Registro completado exitosamente. A continuación seleccione sus preferencias de consentimiento.");
              window.location.href = "../../LOPDP/consent.html";
          } else {
              throw new Error(data.error || "Error en el registro");
          }
      } catch (error) {
          console.error("Error detallado:", error);
          showError(
              error.message || "Error al procesar el registro",
              "identificacionError"
          );
      } finally {
          const submitButton = document.querySelector(".btn-submit");
          submitButton.disabled = false;
          submitButton.textContent = "Registrarse";
      }
  });
});