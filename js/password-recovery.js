// Manejo de recuperación de contraseña
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del DOM
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Inicializar funcionalidad según la página
    if (forgotPasswordForm) {
        initForgotPassword();
    }
    
    if (resetPasswordForm) {
        initResetPassword();
    }

    // ============= FORGOT PASSWORD PAGE =============
    function initForgotPassword() {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    function handleForgotPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim();

        // Validar email
        if (!email) {
            showError('Por favor ingresa tu correo electrónico');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Por favor ingresa un correo electrónico válido');
            return;
        }

        // Mostrar loading
        showLoading(true);

        // Simular delay de verificación
        setTimeout(() => {
            // Verificar si el email existe en la base de datos
            const user = db.getUserByEmail(email);
            
            showLoading(false);

            if (user) {
                showSuccess('¡Email encontrado! Redirigiendo al formulario de nueva contraseña...');
                
                // Guardar email en sessionStorage para el siguiente paso
                sessionStorage.setItem('resetEmail', email);
                
                // Redirigir después de un delay
                setTimeout(() => {
                    window.location.href = 'reset-password.html';
                }, 2000);
            } else {
                showError('No encontramos una cuenta asociada a este correo electrónico');
            }
        }, 1000);
    }

    // ============= RESET PASSWORD PAGE =============
    function initResetPassword() {
        // Verificar que tengamos un email en sessionStorage
        const resetEmail = sessionStorage.getItem('resetEmail');
        if (!resetEmail) {
            showError('Sesión expirada. Por favor inicia el proceso nuevamente.');
            setTimeout(() => {
                window.location.href = 'forgot-password.html';
            }, 2000);
            return;
        }

        // Mostrar el email en el campo oculto
        document.getElementById('userEmail').value = resetEmail;

        // Agregar event listeners
        resetPasswordForm.addEventListener('submit', handleResetPassword);
        
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const resetBtn = document.getElementById('resetBtn');

        // Validación en tiempo real de la contraseña
        newPasswordInput.addEventListener('input', function() {
            validatePassword(this.value);
            checkFormValidity();
        });

        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordConfirmation();
            checkFormValidity();
        });

        // Función para validar contraseña
        function validatePassword(password) {
            const requirements = {
                'length-req': password.length >= 6,
                'uppercase-req': /[A-Z]/.test(password),
                'lowercase-req': /[a-z]/.test(password),
                'number-req': /\d/.test(password),
                'symbol-req': /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
            };

            // Actualizar visual de cada requisito
            Object.keys(requirements).forEach(reqId => {
                const element = document.getElementById(reqId);
                const icon = element.querySelector('i');
                
                if (requirements[reqId]) {
                    element.classList.remove('invalid');
                    element.classList.add('valid');
                    icon.className = 'fas fa-check';
                } else {
                    element.classList.remove('valid');
                    element.classList.add('invalid');
                    icon.className = 'fas fa-times';
                }
            });

            return Object.values(requirements).every(req => req);
        }

        function validatePasswordConfirmation() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const formGroup = confirmPasswordInput.parentElement;

            // Remover clases anteriores
            formGroup.classList.remove('error');

            if (confirmPassword && newPassword !== confirmPassword) {
                formGroup.classList.add('error');
                return false;
            }

            return true;
        }

        function checkFormValidity() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            const isPasswordValid = validatePassword(newPassword);
            const isConfirmValid = confirmPassword && newPassword === confirmPassword;
            
            // Habilitar/deshabilitar botón
            resetBtn.disabled = !(isPasswordValid && isConfirmValid);
        }
    }

    function handleResetPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('userEmail');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        // Validaciones finales
        if (!newPassword || !confirmPassword) {
            showError('Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (!isValidPassword(newPassword)) {
            showError('La contraseña no cumple con todos los requisitos de seguridad');
            return;
        }

        // Mostrar loading
        showLoading(true);

        // Simular delay de actualización
        setTimeout(() => {
            // Actualizar contraseña en la base de datos
            const success = db.updateUserPassword(email, newPassword);
            
            showLoading(false);

            if (success) {
                showSuccess('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
                
                // Limpiar sessionStorage
                sessionStorage.removeItem('resetEmail');
                
                // Redirigir al login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showError('Error al actualizar la contraseña. Inténtalo de nuevo.');
            }
        }, 1000);
    }

    // ============= UTILITY FUNCTIONS =============
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPassword(password) {
        return password.length >= 6 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /\d/.test(password) &&
               /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    }

    function showLoading(show) {
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    function showError(message) {
        removeMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
        }
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    function showSuccess(message) {
        removeMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(successDiv, submitBtn);
        }
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    function removeMessages() {
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }

    // Auto-focus en el primer campo
    const firstInput = document.querySelector('input[type="email"], input[type="password"]');
    if (firstInput) {
        firstInput.focus();
    }
});