// Manejo de autenticación y formularios
document.addEventListener('DOMContentLoaded', function() {

    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Verificar si el usuario ya está logueado
    checkAuthStatus();

    // Manejar formulario de login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);

        // Autocompletar campos cuando se selecciona un tipo de usuario
        const userTypeSelect = document.getElementById('userType');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        userTypeSelect.addEventListener('change', function() {
            if (this.value === 'admin') {
                emailInput.value = 'admin@patitasfelices.org';
                passwordInput.value = 'admin123';
            } else if (this.value === 'socio') {
                emailInput.value = 'socio@email.com';
                passwordInput.value = 'socio123';
            } else {
                emailInput.value = '';
                passwordInput.value = '';
            }
        });
    }

    // Manejar formulario de registro
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Función para manejar login
    function handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        // Validar campos
        if (!email || !password) {
            showError('Por favor completa todos los campos');
            return;
        }

        // Mostrar loading
        showLoading(true);

        // Simular delay de autenticación
        setTimeout(() => {
            const user = db.authenticate(email, password, userType);

            showLoading(false);

            if (user) {
                showSuccess('¡Bienvenido/a ' + user.name + '!');

                // Redirigir según el tipo de usuario
                setTimeout(() => {
                    if (user.type === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (user.type === 'socio') {
                        window.location.href = 'socio.html';
                    }
                }, 1500);
            } else {
                showError('Credenciales incorrectas. Verifica tu email, contraseña y tipo de usuario.');
            }
        }, 1000);
    }

    // Función para manejar validación de password
    function validatePassword(password) {
        const minLength = 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSymbol;
    }
    
    // // Uso en la validación:
    // if (!validatePassword(userData.password)) {
    //     showError('La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo');
    //     return;
    // }

    // Función para manejar registro
    function handleRegister(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            password: formData.get('password'),
            type: 'socio'
        };

        const confirmPassword = formData.get('confirmPassword');

        // Validaciones
        if (!userData.name || !userData.email || !userData.phone || !userData.password) {
            showError('Por favor completa todos los campos obligatorios');
            return;
        }

        if (userData.password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (!validatePassword(userData.password)) {
            showError('La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo');
            return;
        }

        // Verificar si el email ya existe
        if (db.getUserByEmail(userData.email)) {
            showError('Ya existe un usuario con este email');
            return;
        }

        // Mostrar loading
        showLoading(true);

        // Simular delay de registro
        setTimeout(() => {
            const newUser = db.addUser(userData);

            showLoading(false);

            if (newUser) {
                showSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');

                // Limpiar formulario
                e.target.reset();

                // Redirigir al login después de un delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showError('Error al registrar usuario. Inténtalo de nuevo.');
            }
        }, 1000);
    }

    // Función para verificar estado de autenticación
    function checkAuthStatus() {
        const currentUser = db.getCurrentUser();
    
        // Si estamos en login y ya hay un usuario logueado, redirigir
        if (currentUser && window.location.pathname.includes('login.html')) {
            if (currentUser.type === 'admin') {
                window.location.href = 'admin.html';
            } else if (currentUser.type === 'socio') {
                window.location.href = 'socio.html';
            }
        }
        
        // Si estamos en admin o socio y no hay usuario logueado, redirigir al login
        if (!currentUser && (window.location.pathname.includes('admin.html') || window.location.pathname.includes('socio.html'))) {
            window.location.href = 'login.html';
        }
    
        // Si estamos en admin pero el usuario no es admin, redirigir
        if (currentUser && window.location.pathname.includes('admin.html') && currentUser.type !== 'admin') {
            window.location.href = 'socio.html';
        }
    }

    // Función para mostrar loading
    function showLoading(show) {
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    // Función para mostrar errores
    function showError(message) {
        // Remover mensajes anteriores
        removeMessages();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

        // Insertar antes del botón de submit
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
        }

        // Remover después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Función para mostrar mensajes de éxito
    function showSuccess(message) {
        // Remover mensajes anteriores
        removeMessages();

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

        // Insertar antes del botón de submit
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(successDiv, submitBtn);
        }

        // Remover después de 3 segundos
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    // Función para remover mensajes existentes
    function removeMessages() {
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }

    // Función global para logout
    window.logout = function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            db.logout();
            window.location.href = 'index.html';
        }
    };

    // Validación en tiempo real para formularios
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();

        // Remover clases de error anteriores
        field.parentElement.classList.remove('error');

        // Validaciones específicas
        if (field.required && !value) {
            field.parentElement.classList.add('error');
            return;
        }

        if (field.type === 'email' && value && !isValidEmail(value)) {
            field.parentElement.classList.add('error');
            return;
        }

        if (field.name === 'confirmPassword') {
            const password = document.querySelector('input[name="password"]');
            if (password && value !== password.value) {
                field.parentElement.classList.add('error');
                return;
            }
        }
    }

    function clearFieldError(e) {
        e.target.parentElement.classList.remove('error');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Auto-focus en el primer campo del formulario
    const firstInput = document.querySelector('input[type="email"], input[type="text"]');
    if (firstInput) {
        firstInput.focus();
    }

});
