// JavaScript para el panel de administrador
document.addEventListener('DOMContentLoaded', function() {

    // Verificar autenticación
    const currentUser = db.getCurrentUser();
    if (!currentUser || currentUser.type !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar la interfaz
    initializeAdmin();

    // Elementos del DOM
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const eventModal = document.getElementById('eventModal');
    const participantsModal = document.getElementById('participantsModal');
    const eventForm = document.getElementById('eventForm');
    const socioSearch = document.getElementById('socioSearch');

    // Event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
        // Opcional: cerrar el menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }

    if (socioSearch) {
        socioSearch.addEventListener('input', handleSocioSearch);
    }

    // Cerrar modales al hacer click fuera
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeEventModal();
            closeParticipantsModal();
        }
    });

    // Función para inicializar el admin
    function initializeAdmin() {
        // Mostrar nombre del admin
        const adminName = document.getElementById('adminName');
        if (adminName && currentUser) {
            adminName.textContent = currentUser.name;
        }

        // Cargar estadísticas
        loadStats();

        // Cargar contenido inicial
        loadDashboard();
        loadEvents();
        loadSocios();
        loadPets();
    }

    // Función para manejar navegación
    function handleNavigation(e) {
        e.preventDefault();

        const targetSection = e.target.getAttribute('data-section') ||
                             e.target.parentElement.getAttribute('data-section');

        if (!targetSection) return;

        // Actualizar navegación activa
        navLinks.forEach(link => link.parentElement.classList.remove('active'));
        e.target.closest('.nav-item').classList.add('active');

        // Mostrar sección correspondiente
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetSection).classList.add('active');

        // Actualizar título
        const pageTitle = document.getElementById('pageTitle');
        const titles = {
            'dashboard': 'Dashboard',
            'events': 'Gestión de Eventos',
            'socios': 'Gestión de Socios',
            'pets': 'Mascotas Registradas'
        };
        pageTitle.textContent = titles[targetSection] || 'Dashboard';
    }

    // Función para toggle del sidebar en móvil
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    // Función para cargar estadísticas
    function loadStats() {
        const stats = db.getStats();

        document.getElementById('totalSocios').textContent = stats.totalSocios;
        document.getElementById('totalEvents').textContent = stats.totalEvents;
        document.getElementById('totalPets').textContent = stats.totalPets;
        document.getElementById('totalParticipants').textContent = stats.totalParticipants;
    }

    // Función para cargar dashboard
    function loadDashboard() {
        const events = db.getEvents();
        const users = db.getUsers().filter(user => user.type === 'socio');

        // Eventos recientes
        const recentEvents = events.slice(-3).reverse();
        const recentEventsContainer = document.getElementById('recentEvents');

        if (recentEvents.length === 0) {
            recentEventsContainer.innerHTML = '<p class="no-data">No hay eventos recientes</p>';
        } else {
            recentEventsContainer.innerHTML = recentEvents.map(event => `
                <div class="recent-event">
                    <i class="fas fa-calendar"></i>
                    <div class="recent-content">
                        <h4>${event.title}</h4>
                        <p>${db.formatDate(event.date)} - ${event.participants.length} participantes</p>
                    </div>
                </div>
            `).join('');
        }

        // Socios recientes
        const recentSocios = users.slice(-3).reverse();
        const recentSociosContainer = document.getElementById('recentSocios');

        if (recentSocios.length === 0) {
            recentSociosContainer.innerHTML = '<p class="no-data">No hay socios recientes</p>';
        } else {
            recentSociosContainer.innerHTML = recentSocios.map(socio => `
                <div class="recent-socio">
                    <i class="fas fa-user"></i>
                    <div class="recent-content">
                        <h4>${socio.name}</h4>
                        <p>Registrado el ${db.formatDate(socio.createdAt)}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    // Función para cargar eventos
    function loadEvents() {
        const events = db.getEvents();
        const eventsTableBody = document.getElementById('eventsTableBody');

        if (events.length === 0) {
            eventsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">
                        No hay eventos registrados
                    </td>
                </tr>
            `;
            return;
        }

        eventsTableBody.innerHTML = events.map(event => `
            <tr>
                <td>
                    <strong>${event.title}</strong><br>
                    <small style="color: var(--text-light);">${event.description.substring(0, 50)}...</small>
                </td>
                <td>${db.formatDate(event.date)}<br><small>${event.time}</small></td>
                <td>${event.location}</td>
                <td>${event.participants.length}/${event.maxParticipants}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-sm btn-view" onclick="viewParticipants('${event.id}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-sm btn-edit" onclick="editEvent('${event.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-sm btn-delete" onclick="deleteEvent('${event.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Función para cargar socios
    function loadSocios() {
        const users = db.getUsers().filter(user => user.type === 'socio');
        const sociosGrid = document.getElementById('sociosGrid');

        if (users.length === 0) {
            sociosGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-light);">
                    No hay socios registrados
                </div>
            `;
            return;
        }

        sociosGrid.innerHTML = users.map(socio => {
            const pets = db.getPetsByOwner(socio.id);
            const events = db.getEvents().filter(event => event.participants.includes(socio.id));

            return `
                <div class="socio-card">
                    <div class="socio-header">
                        <div class="socio-avatar">
                            ${socio.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="socio-info">
                            <h4>${socio.name}</h4>
                            <p>${socio.email}</p>
                        </div>
                    </div>
                    <div class="socio-details">
                        <div class="socio-detail">
                            <i class="fas fa-phone"></i>
                            <span>${socio.phone}</span>
                        </div>
                        ${socio.address ? `
                            <div class="socio-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${socio.address}</span>
                            </div>
                        ` : ''}
                        <div class="socio-detail">
                            <i class="fas fa-calendar"></i>
                            <span>Registrado el ${db.formatDate(socio.createdAt)}</span>
                        </div>
                    </div>
                    <div class="socio-stats">
                        <div class="socio-stat">
                            <span class="number">${pets.length}</span>
                            <span class="label">Mascotas</span>
                        </div>
                        <div class="socio-stat">
                            <span class="number">${events.length}</span>
                            <span class="label">Eventos</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Función para cargar mascotas
    function loadPets() {
        const pets = db.getPets();
        const users = db.getUsers();
        const petsTableBody = document.getElementById('petsTableBody');

        if (pets.length === 0) {
            petsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-light);">
                        No hay mascotas registradas
                    </td>
                </tr>
            `;
            return;
        }

        petsTableBody.innerHTML = pets.map(pet => {
            const owner = users.find(user => user.id === pet.ownerId);
            return `
                <tr>
                    <td>
                        <strong>${pet.name}</strong><br>
                        <small style="color: var(--text-light);">${pet.color}</small>
                    </td>
                    <td>${owner ? owner.name : 'N/A'}</td>
                    <td>${pet.type}</td>
                    <td>${pet.breed}</td>
                    <td>${pet.age} año${pet.age !== 1 ? 's' : ''}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <span class="badge ${pet.vaccinated ? 'badge-vaccinated' : 'badge-not-vaccinated'}">
                                ${pet.vaccinated ? 'Vacunado' : 'No vacunado'}
                            </span>
                            <span class="badge ${pet.sterilized ? 'badge-sterilized' : 'badge-not-sterilized'}">
                                ${pet.sterilized ? 'Esterilizado' : 'No esterilizado'}
                            </span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Función para buscar socios
    function handleSocioSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const socioCards = document.querySelectorAll('.socio-card');

        socioCards.forEach(card => {
            const name = card.querySelector('.socio-info h4').textContent.toLowerCase();
            const email = card.querySelector('.socio-info p').textContent.toLowerCase();

            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Función para manejar submit del evento
    function handleEventSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            maxParticipants: parseInt(formData.get('maxParticipants')),
            createdBy: currentUser.id
        };

        const eventId = formData.get('eventId');

        if (eventId) {
            // Editar evento existente
            db.updateEvent(eventId, eventData);
            showNotification('Evento actualizado correctamente', 'success');
        } else {
            // Crear nuevo evento
            db.addEvent(eventData);
            showNotification('Evento creado correctamente', 'success');
        }

        closeEventModal();
        loadEvents();
        loadStats();
        loadDashboard();
    }

    // Funciones globales
    window.openEventModal = function(eventId = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const title = document.getElementById('eventModalTitle');

        if (eventId) {
            // Editar evento
            const event = db.getEvents().find(e => e.id === eventId);
            if (event) {
                title.textContent = 'Editar Evento';
                document.getElementById('eventId').value = event.id;
                document.getElementById('eventTitle').value = event.title;
                document.getElementById('eventDescription').value = event.description;
                document.getElementById('eventDate').value = event.date;
                document.getElementById('eventTime').value = event.time;
                document.getElementById('eventLocation').value = event.location;
                document.getElementById('eventMaxParticipants').value = event.maxParticipants;
            }
        } else {
            // Nuevo evento
            title.textContent = 'Nuevo Evento';
            form.reset();
            document.getElementById('eventId').value = '';
        }

        modal.classList.add('show');
    };

    window.closeEventModal = function() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('show');
    };

    window.editEvent = function(eventId) {
        openEventModal(eventId);
    };

    window.deleteEvent = function(eventId) {
        const event = db.getEvents().find(e => e.id === eventId);
        if (event && confirm(`¿Estás seguro de que quieres eliminar el evento "${event.title}"?`)) {
            db.deleteEvent(eventId);
            loadEvents();
            loadStats();
            loadDashboard();
            showNotification('Evento eliminado correctamente', 'success');
        }
    };

    window.viewParticipants = function(eventId) {
        const participants = db.getEventParticipants(eventId);
        const event = db.getEvents().find(e => e.id === eventId);

        const modal = document.getElementById('participantsModal');
        const title = document.getElementById('participantsModalTitle');
        const list = document.getElementById('participantsList');

        title.textContent = `Participantes - ${event.title}`;

        if (participants.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay participantes registrados</p>';
        } else {
            list.innerHTML = participants.map(participant => `
                <div class="participant-item">
                    <div class="participant-avatar">
                        ${participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="participant-info">
                        <h4>${participant.name}</h4>
                        <p>${participant.email} • ${participant.phone}</p>
                    </div>
                </div>
            `).join('');
        }

        modal.classList.add('show');
    };

    window.closeParticipantsModal = function() {
        const modal = document.getElementById('participantsModal');
        modal.classList.remove('show');
    };

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
});
