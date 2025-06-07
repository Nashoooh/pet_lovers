// JavaScript para el panel de socio
document.addEventListener('DOMContentLoaded', function() {

    // Verificar autenticación
    const currentUser = db.getCurrentUser();
    if (!currentUser || currentUser.type !== 'socio') {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar la interfaz
    initializeSocio();

    // Elementos del DOM
    const navBtns = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');
    const filterTabs = document.querySelectorAll('.tab-btn');
    const petModal = document.getElementById('petModal');
    const petForm = document.getElementById('petForm');
    const profileForm = document.getElementById('profileForm');

    // Event listeners
    navBtns.forEach(btn => {
        btn.addEventListener('click', handleNavigation);
    });

    filterTabs.forEach(tab => {
        tab.addEventListener('click', handleEventFilter);
    });

    if (petForm) {
        petForm.addEventListener('submit', handlePetSubmit);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closePetModal();
        }
    });

    // Función para inicializar el socio
    function initializeSocio() {
        // Mostrar información del socio
        document.getElementById('socioName').textContent = currentUser.name;
        document.getElementById('welcomeName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

        // Cargar datos del dashboard
        loadDashboardData();

        // Cargar contenido inicial
        loadEvents();
        loadMyPets();
        loadProfile();
    }

    // Función para manejar navegación
    function handleNavigation(e) {
        const targetSection = e.target.getAttribute('data-section') ||
                             e.target.parentElement.getAttribute('data-section');

        if (!targetSection) return;

        // Actualizar navegación activa
        navBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Mostrar sección correspondiente
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetSection).classList.add('active');
    }

    // Función para cargar datos del dashboard
    function loadDashboardData() {
        const myPets = db.getPetsByOwner(currentUser.id);
        const allEvents = db.getEvents();
        const myEvents = allEvents.filter(event => event.participants.includes(currentUser.id));

        // Actualizar contadores
        document.getElementById('myPetsCount').textContent = myPets.length;
        document.getElementById('myEventsCount').textContent = myEvents.length;

        // Cargar próximos eventos (preview)
        const upcomingEvents = allEvents.filter(event => !db.isEventPast(event.date)).slice(0, 3);
        const upcomingEventsContainer = document.getElementById('upcomingEvents');

        if (upcomingEvents.length === 0) {
            upcomingEventsContainer.innerHTML = '<p class="no-data">No hay eventos próximos</p>';
        } else {
            upcomingEventsContainer.innerHTML = upcomingEvents.map(event => `
                <div class="upcoming-event">
                    <div class="event-date-small">${db.formatDate(event.date)}</div>
                    <h4>${event.title}</h4>
                    <p>${event.location}</p>
                </div>
            `).join('');
        }

        // Cargar preview de mascotas
        const myPetsPreview = document.getElementById('myPetsPreview');

        if (myPets.length === 0) {
            myPetsPreview.innerHTML = '<p class="no-data">No tienes mascotas registradas</p>';
        } else {
            myPetsPreview.innerHTML = myPets.slice(0, 3).map(pet => `
                <div class="pet-preview">
                    <i class="fas fa-${pet.type === 'Perro' ? 'dog' : pet.type === 'Gato' ? 'cat' : 'paw'}"></i>
                    <span>${pet.name}</span>
                </div>
            `).join('');
        }
    }

    // Función para cargar eventos
    function loadEvents() {
        const events = db.getEvents();
        const eventsGrid = document.getElementById('eventsGrid');

        if (events.length === 0) {
            eventsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No hay eventos disponibles</h3>
                    <p>Mantente atento para futuros eventos</p>
                </div>
            `;
            return;
        }

        renderEvents(events);
    }

    // Función para renderizar eventos
    function renderEvents(events) {
        const eventsGrid = document.getElementById('eventsGrid');

        eventsGrid.innerHTML = events.map(event => {
            const isJoined = event.participants.includes(currentUser.id);
            const isFull = event.participants.length >= event.maxParticipants;
            const isPast = db.isEventPast(event.date);

            let statusClass = 'available';
            let statusText = 'Disponible';

            if (isPast) {
                statusClass = 'past';
                statusText = 'Finalizado';
            } else if (isJoined) {
                statusClass = 'joined';
                statusText = 'Apuntado';
            } else if (isFull) {
                statusClass = 'full';
                statusText = 'Completo';
            }

            return `
                <div class="event-card" data-filter="${isJoined ? 'joined' : 'available'}">
                    <div class="event-status ${statusClass}">${statusText}</div>
                    <div class="event-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${db.formatDate(event.date)}
                    </div>
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <div class="event-details">
                        <div class="event-detail">
                            <i class="fas fa-clock"></i>
                            <span>${event.time}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-users"></i>
                            <span>${event.participants.length}/${event.maxParticipants} participantes</span>
                        </div>
                    </div>
                    <div class="event-actions">
                        ${!isPast ? (isJoined ?
                            `<button class="btn-leave" onclick="leaveEvent('${event.id}')">
                                <i class="fas fa-sign-out-alt"></i> Salir del Evento
                            </button>` :
                            (isFull ?
                                '<button class="btn-join" disabled>Evento Completo</button>' :
                                `<button class="btn-join" onclick="joinEvent('${event.id}')">
                                    <i class="fas fa-sign-in-alt"></i> Unirse al Evento
                                </button>`
                            )
                        ) : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Función para filtrar eventos
    function handleEventFilter(e) {
        const filter = e.target.getAttribute('data-filter');

        // Actualizar tabs activos
        filterTabs.forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');

        // Filtrar eventos
        const eventCards = document.querySelectorAll('.event-card');

        eventCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else {
                const cardFilter = card.getAttribute('data-filter');
                card.style.display = cardFilter === filter ? 'block' : 'none';
            }
        });
    }

    // Función para cargar mis mascotas
    function loadMyPets() {
        const myPets = db.getPetsByOwner(currentUser.id);
        const petsGrid = document.getElementById('petsGrid');

        if (myPets.length === 0) {
            petsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paw"></i>
                    <h3>No tienes mascotas registradas</h3>
                    <p>Agrega tu primera mascota para comenzar</p>
                    <button class="btn btn-primary" onclick="openPetModal()">
                        <i class="fas fa-plus"></i> Agregar Mascota
                    </button>
                </div>
            `;
            return;
        }

        petsGrid.innerHTML = myPets.map(pet => `
            <div class="pet-card">
                <div class="pet-image">
                    <i class="fas fa-${pet.type === 'Perro' ? 'dog' : pet.type === 'Gato' ? 'cat' : 'paw'}"></i>
                </div>
                <h4>${pet.name}</h4>
                <div class="pet-info">
                    <div class="pet-detail">
                        <span class="label">Tipo:</span>
                        <span class="value">${pet.type}</span>
                    </div>
                    <div class="pet-detail">
                        <span class="label">Raza:</span>
                        <span class="value">${pet.breed}</span>
                    </div>
                    <div class="pet-detail">
                        <span class="label">Edad:</span>
                        <span class="value">${pet.age} año${pet.age !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="pet-detail">
                        <span class="label">Color:</span>
                        <span class="value">${pet.color}</span>
                    </div>
                </div>
                <div class="pet-badges">
                    <span class="badge ${pet.vaccinated ? 'badge-vaccinated' : 'badge-not-vaccinated'}">
                        ${pet.vaccinated ? 'Vacunado' : 'No vacunado'}
                    </span>
                    <span class="badge ${pet.sterilized ? 'badge-sterilized' : 'badge-not-sterilized'}">
                        ${pet.sterilized ? 'Esterilizado' : 'No esterilizado'}
                    </span>
                </div>
                ${pet.notes ? `<p class="pet-notes">${pet.notes}</p>` : ''}
                <div class="pet-actions">
                    <button class="btn-edit-pet" onclick="editPet('${pet.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete-pet" onclick="deletePet('${pet.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Función para cargar perfil
    function loadProfile() {
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        document.getElementById('memberSince').textContent = db.formatDate(currentUser.createdAt);

        // Llenar formulario
        document.getElementById('profileNameInput').value = currentUser.name || '';
        document.getElementById('profileEmailInput').value = currentUser.email || '';
        document.getElementById('profilePhoneInput').value = currentUser.phone || '';
        document.getElementById('profileAddressInput').value = currentUser.address || '';

        // Estadísticas de actividad
        const myPets = db.getPetsByOwner(currentUser.id);
        const myEvents = db.getEvents().filter(event => event.participants.includes(currentUser.id));

        document.getElementById('totalEventsJoined').textContent = myEvents.length;
        document.getElementById('totalPetsRegistered').textContent = myPets.length;
    }

    // Función para manejar submit de mascota
    function handlePetSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const petData = {
            name: formData.get('name'),
            type: formData.get('type'),
            breed: formData.get('breed'),
            age: parseInt(formData.get('age')),
            color: formData.get('color'),
            vaccinated: formData.has('vaccinated'),
            sterilized: formData.has('sterilized'),
            notes: formData.get('notes') || '',
            ownerId: currentUser.id
        };

        const petId = formData.get('petId');

        if (petId) {
            // Editar mascota existente
            db.updatePet(petId, petData);
            showNotification('Mascota actualizada correctamente', 'success');
        } else {
            // Agregar nueva mascota
            db.addPet(petData);
            showNotification('Mascota agregada correctamente', 'success');
        }

        closePetModal();
        loadMyPets();
        loadDashboardData();
    }

    // Función para manejar submit de perfil
    function handleProfileSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        // Verificar si el email ya existe (excepto el propio)
        const existingUser = db.getUserByEmail(userData.email);
        if (existingUser && existingUser.id !== currentUser.id) {
            showNotification('Ya existe un usuario con este email', 'error');
            return;
        }

        db.updateUser(currentUser.id, userData);
        showNotification('Perfil actualizado correctamente', 'success');

        // Actualizar la interfaz
        const updatedUser = db.getCurrentUser();
        document.getElementById('socioName').textContent = updatedUser.name;
        document.getElementById('welcomeName').textContent = updatedUser.name;
        document.getElementById('userAvatar').textContent = updatedUser.name.charAt(0).toUpperCase();
        loadProfile();
    }

    // Funciones globales
    window.switchSection = function(section) {
        const navBtn = document.querySelector(`[data-section="${section}"]`);
        if (navBtn) {
            navBtn.click();
        }
    };

    window.joinEvent = function(eventId) {
        if (db.joinEvent(eventId, currentUser.id)) {
            showNotification('Te has unido al evento correctamente', 'success');
            loadEvents();
            loadDashboardData();
        } else {
            showNotification('No se pudo unir al evento. Puede estar completo.', 'error');
        }
    };

    window.leaveEvent = function(eventId) {
        const event = db.getEvents().find(e => e.id === eventId);
        if (event && confirm(`¿Estás seguro de que quieres salir del evento "${event.title}"?`)) {
            db.leaveEvent(eventId, currentUser.id);
            showNotification('Has salido del evento', 'success');
            loadEvents();
            loadDashboardData();
        }
    };

    window.openPetModal = function(petId = null) {
        const modal = document.getElementById('petModal');
        const form = document.getElementById('petForm');
        const title = document.getElementById('petModalTitle');

        if (petId) {
            // Editar mascota
            const pet = db.getPets().find(p => p.id === petId);
            if (pet) {
                title.textContent = 'Editar Mascota';
                document.getElementById('petId').value = pet.id;
                document.getElementById('petName').value = pet.name;
                document.getElementById('petType').value = pet.type;
                document.getElementById('petBreed').value = pet.breed;
                document.getElementById('petAge').value = pet.age;
                document.getElementById('petColor').value = pet.color;
                document.getElementById('petVaccinated').checked = pet.vaccinated;
                document.getElementById('petSterilized').checked = pet.sterilized;
                document.getElementById('petNotes').value = pet.notes;
            }
        } else {
            // Nueva mascota
            title.textContent = 'Agregar Mascota';
            form.reset();
            document.getElementById('petId').value = '';
        }

        modal.classList.add('show');
    };

    window.closePetModal = function() {
        const modal = document.getElementById('petModal');
        modal.classList.remove('show');
    };

    window.editPet = function(petId) {
        openPetModal(petId);
    };

    window.deletePet = function(petId) {
        const pet = db.getPets().find(p => p.id === petId);
        if (pet && confirm(`¿Estás seguro de que quieres eliminar a ${pet.name}?`)) {
            db.deletePet(petId);
            loadMyPets();
            loadDashboardData();
            showNotification('Mascota eliminada correctamente', 'success');
        }
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
