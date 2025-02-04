document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.querySelector(".toggle-password");

  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      const password = document.getElementById("password");
      const icon = this.querySelector("i");

      if (password.type === "password") {
        password.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        password.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      if (!validateForm()) return;

      const identificacion = document
        .getElementById("identificacion")
        .value.trim();
      const password = document.getElementById("password").value;

      try {
        showLoading(true);
        console.log("Enviando solicitud de login:", { identificacion }); // No logues la contraseña

        const response = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            identificacion: identificacion,
            password: password,
          }),
        });

        console.log("Estado de la respuesta:", response.status);

        const data = await response.json();
        console.log("Datos de la respuesta:", {
          status: response.status,
          error: data.error,
          data: data,
        });

        if (response.status === 500) {
          console.error("Error del servidor:", data);
          showError(
            "Error en el servidor. Por favor, intente más tarde.",
            "loginError"
          );
          return;
        }

        if (!response.ok) {
            console.log("Respuesta no exitosa:", response.status, data);
            if (response.status === 403) {
                // Cuenta bloqueada
                showError(data.error, "loginError");
                if (data.tiempoBloqueo) {
                    startBlockTimer(data.tiempoBloqueo);
                    document.querySelector('.btn-submit').disabled = true;
                }
            } else if (response.status === 401) {
                // Credenciales inválidas con contador de intentos
                showError(data.error, "loginError");
                // Efecto visual de shake
                const form = document.getElementById("loginForm");
                form.classList.add("shake");
                setTimeout(() => form.classList.remove("shake"), 500);
                
                console.log('Intentos:', {
                    actual: data.intentoActual,
                    restantes: data.intentosRestantes
                });
            } else {
                showError(data.error || "Error desconocido", "loginError");
            }
            return;
        }
        // Login exitoso
        localStorage.setItem("token", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));

        const redirectPath =
          data.user.tipoUsuario === "administrador"
            ? "../../Admin/dashboardAdmin.html"
            : "../../User/dashboardUser.html";

        window.location.href = redirectPath;
      } catch (error) {
        console.error("Error detallado:", error);
        showError("Error de conexión con el servidor", "loginError");
      } finally {
        showLoading(false);
      }
    });
  }
});

function handleBlockedAccount(errorMessage) {
  const loginError = document.getElementById("loginError");
  showError(errorMessage, "loginError");

  // Si el mensaje contiene información sobre tiempo de bloqueo
  if (errorMessage.includes("minutos")) {
    const minutes = parseInt(errorMessage.match(/\d+/)?.[0] || 0);
    if (minutes > 0) {
      startBlockTimer(minutes);
    }
  }
}

function handleInvalidCredentials(errorMessage) {
  showError(errorMessage, "loginError");

  // Agregar clase para efecto visual
  const loginForm = document.getElementById("loginForm");
  loginForm.classList.add("shake");
  setTimeout(() => loginForm.classList.remove("shake"), 500);
}

function toggleFormInputs(disabled) {
  const identificacionInput = document.getElementById('identificacion');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.querySelector('.toggle-password');
  
  identificacionInput.disabled = disabled;
  passwordInput.disabled = disabled;
  if (togglePasswordButton) {
      togglePasswordButton.disabled = disabled;
  }
}

// Modificar la función startBlockTimer
function startBlockTimer(seconds) {
  const loginError = document.getElementById('loginError');
  const loginButton = document.querySelector('.login-btn');
  let timeLeft = seconds;
  
  loginButton.disabled = true;
  toggleFormInputs(true);
  
  if (window.blockTimer) clearInterval(window.blockTimer);
  
  window.blockTimer = setInterval(() => {
      loginError.textContent = `Cuenta bloqueada. Intente nuevamente en ${timeLeft} segundos`;
      
      if (timeLeft <= 0) {
          clearInterval(window.blockTimer);
          loginError.textContent = 'Ya puede intentar iniciar sesión nuevamente';
          loginButton.disabled = false;
          toggleFormInputs(false);
          window.blockTimer = null;
      }
      timeLeft--;
  }, 1000);
}

function updateBlockTimer(seconds, element) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  element.textContent = `Cuenta bloqueada. Intente nuevamente en ${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function handleFailedAttempt(errorMessage) {
  showError(errorMessage, "loginError");
  // Opcional: Añadir efectos visuales para alertar al usuario
  const loginForm = document.getElementById("loginForm");
  loginForm.classList.add("shake");
  setTimeout(() => loginForm.classList.remove("shake"), 500);
}

function validateForm() {
  let isValid = true;
  const identificacion = document.getElementById("identificacion").value.trim();
  const password = document.getElementById("password").value;

  if (!identificacion) {
    showError("La identificación es obligatoria", "identificacionError");
    isValid = false;
  }

  if (!password) {
    showError("La contraseña es obligatoria", "passwordError");
    isValid = false;
  }

  return isValid;
}

function showError(message, elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}

function clearErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((element) => {
    element.style.display = "none";
    element.textContent = "";
  });
}

function showLoading(show) {
  const submitButton = document.querySelector(".btn-submit");
  const buttonText = submitButton.querySelector(".button-text");
  const spinner = submitButton.querySelector(".spinner");

  submitButton.disabled = show;
  buttonText.style.display = show ? "none" : "inline-block";
  spinner.style.display = show ? "inline-block" : "none";
}
