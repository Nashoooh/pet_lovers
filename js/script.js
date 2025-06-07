// JavaScript principal para la página de inicio
document.addEventListener('DOMContentLoaded', function() {

    // Elementos del DOM
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const contactForm = document.getElementById('contactForm');
    const eventsGrid = document.getElementById('eventsGrid');

    // Menú hamburguesa para móviles
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Cerrar menú al hacer click en un enlace
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    // Navegación suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Cargar eventos dinámicamente
    loadEvents();

    // Manejar formulario de contacto
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Animaciones al hacer scroll
    setupScrollAnimations();

    // Función para cargar eventos
    function loadEvents() {
        if (!eventsGrid) return;

        const events = db.getEvents();
        const upcomingEvents = events.filter(event => !db.isEventPast(event.date));

        if (upcomingEvents.length === 0) {
            eventsGrid.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No hay eventos próximos</h3>
                    <p>Mantente atento a nuestras redes sociales para conocer futuros eventos</p>
                </div>
            `;
            return;
        }

        eventsGrid.innerHTML = upcomingEvents.map(event => `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${db.formatDate(event.date)}
                </div>
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-meta">
                    <div class="event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${event.location}
                    </div>
                    <div class="event-participants">
                        <i class="fas fa-users"></i>
                        ${event.participants.length}/${event.maxParticipants}
                    </div>
                </div>
                <div class="event-time">
                    <i class="fas fa-clock"></i>
                    ${event.time}
                </div>
            </div>
        `).join('');
    }

    // Función para manejar formulario de contacto
    function handleContactForm(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name') || e.target.querySelector('input[type="text"]').value,
            email: formData.get('email') || e.target.querySelector('input[type="email"]').value,
            message: formData.get('message') || e.target.querySelector('textarea').value
        };

        // Validar campos
        if (!contactData.name || !contactData.email || !contactData.message) {
            showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        // Simular envío
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // Simular éxito
            showNotification('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
            e.target.reset();

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        // Remover notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' : 'info-circle';

        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Mostrar notificación
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Permitir cerrar manualmente
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Configurar animaciones de scroll
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        // Observar elementos que queremos animar
        document.querySelectorAll('.stat, .feature, .event-card, .pet-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Efectos hover en las tarjetas de mascotas
    document.querySelectorAll('.pet-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Contador animado para estadísticas
    function animateCounters() {
        document.querySelectorAll('.stat h3').forEach(counter => {
            const target = parseInt(counter.textContent.replace(/\D/g, ''));
            const suffix = counter.textContent.replace(/\d/g, '');
            let current = 0;
            const increment = target / 100;

            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + suffix;
                }
            };

            // Iniciar animación cuando el elemento sea visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });

            observer.observe(counter.parentElement);
        });
    }

    // Inicializar contadores animados
    animateCounters();

    // Cambiar color del header al hacer scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Lazy loading para imágenes (si las hubiera)
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});
