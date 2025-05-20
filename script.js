// Definición de la base de datos
let db = {
    pets: [],
    events: [],
    nextPetId: 1,
    nextEventId: 1
};

// Íconos para los tipos de mascotas
const petIcons = {
    dog: '<i class="fas fa-dog"></i>',
    cat: '<i class="fas fa-cat"></i>',
    bird: '<i class="fas fa-dove"></i>',
    rabbit: '<i class="fas fa-rabbit"></i>',
    other: '<i class="fas fa-paw"></i>'
};

// Íconos para los tipos de eventos
const eventIcons = {
    vaccine: '<i class="fas fa-syringe"></i>',
    bath: '<i class="fas fa-shower"></i>',
    walk: '<i class="fas fa-walking"></i>',
    food: '<i class="fas fa-utensils"></i>',
    vet: '<i class="fas fa-stethoscope"></i>'
};

// Nombres de eventos en español
const eventNames = {
    vaccine: 'Vacuna',
    bath: 'Baño',
    walk: 'Paseo',
    food: 'Comida',
    vet: 'Veterinario'
};

// Elementos DOM
const elements = {
    petList: document.getElementById('petList'),
    petDetails: document.getElementById('petDetails'),
    addPetBtn: document.getElementById('addPetBtn'),
    addPetModal: document.getElementById('addPetModal'),
    addEventModal: document.getElementById('addEventModal'),
    newPetForm: document.getElementById('newPetForm'),
    newEventForm: document.getElementById('newEventForm'),
    petPhoto: document.getElementById('petPhoto'),
    photoPreview: document.getElementById('photoPreview'),
    notificationContainer: document.getElementById('notification-container')
};

// Inicializar la aplicación
function init() {
    loadFromLocalStorage();
    renderPetList();
    setupEventListeners();
    checkPendingEvents();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón para añadir mascota
    elements.addPetBtn.addEventListener('click', () => {
        openModal(elements.addPetModal);
    });

    // Botones para cerrar modales
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Formulario para añadir mascota
    elements.newPetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewPet();
    });

    // Formulario para añadir evento
    elements.newEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewEvent();
    });

    // Vista previa de la foto
    elements.petPhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                elements.photoPreview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Abrir modal
function openModal(modal) {
    modal.style.display = 'block';
}

// Cerrar modal
function closeModal(modal) {
    modal.style.display = 'none';
    
    // Resetear formularios
    if (modal.id === 'addPetModal') {
        elements.newPetForm.reset();
        elements.photoPreview.innerHTML = '';
    } else if (modal.id === 'addEventModal') {
        elements.newEventForm.reset();
    }
}

// Renderizar lista de mascotas
function renderPetList() {
    elements.petList.innerHTML = '';
    
    if (db.pets.length === 0) {
        elements.petList.innerHTML = '<p class="no-pets">No tienes mascotas agregadas</p>';
        return;
    }

    db.pets.forEach(pet => {
        const petEl = document.createElement('div');
        petEl.className = 'pet-item';
        petEl.dataset.id = pet.id;
        
        let avatar;
        if (pet.photo) {
            avatar = `<img src="${pet.photo}" alt="${pet.name}">`;
        } else {
            avatar = petIcons[pet.type];
        }

        petEl.innerHTML = `
            <div class="pet-avatar">${avatar}</div>
            <div class="pet-info">
                <div class="pet-name">${pet.name}</div>
                <div class="pet-type">${getPetTypeName(pet.type)}</div>
            </div>
        `;
        
        petEl.addEventListener('click', () => {
            document.querySelectorAll('.pet-item').forEach(item => {
                item.classList.remove('active');
            });
            petEl.classList.add('active');
            showPetDetails(pet.id);
        });
        
        elements.petList.appendChild(petEl);
    });
}

// Obtener nombre del tipo de mascota en español
function getPetTypeName(type) {
    const typeNames = {
        dog: 'Perro',
        cat: 'Gato',
        bird: 'Ave',
        rabbit: 'Conejo',
        other: 'Otro'
    };
    return typeNames[type] || 'Otro';
}

// Mostrar detalles de la mascota
function showPetDetails(petId) {
    const pet = db.pets.find(p => p.id === petId);
    if (!pet) return;
    
    let avatar;
    if (pet.photo) {
        avatar = `<img src="${pet.photo}" alt="${pet.name}">`;
    } else {
        avatar = petIcons[pet.type];
    }
    
    const petEvents = db.events.filter(e => e.petId === petId);
    const upcomingEvents = petEvents.filter(e => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
    const pastEvents = petEvents.filter(e => new Date(e.date) <= new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let birthdayInfo = '';
    if (pet.birthday) {
        const birthDate = new Date(pet.birthday);
        const age = calculateAge(birthDate);
        birthdayInfo = `<p>Edad: ${age}</p>`;
    }
    
    elements.petDetails.innerHTML = `
        <div class="pet-header">
            <div class="pet-profile">${avatar}</div>
            <div class="pet-profile-info">
                <h2>${pet.name}</h2>
                <p>${getPetTypeName(pet.type)}</p>
                ${birthdayInfo}
            </div>
        </div>
        
        <div class="pet-actions">
            <button class="btn-action" onclick="openAddEventModal(${pet.id})">
                <i class="fas fa-calendar-plus"></i> Añadir Evento
            </button>
            <button class="btn-action btn-delete" onclick="deletePet(${pet.id})">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
        
        <div class="events-section">
            <h3>Próximos Eventos</h3>
            <div class="event-list" id="upcomingEvents">
                ${renderEventList(upcomingEvents)}
            </div>
            
            <h3 style="margin-top: 30px;">Historial de Eventos</h3>
            <div class="event-list" id="pastEvents">
                ${renderEventList(pastEvents)}
            </div>
        </div>
    `;
}

// Calcular edad
function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return `${age} años`;
}

// Renderizar lista de eventos
function renderEventList(events) {
    if (events.length === 0) {
        return '<p class="no-events">No hay eventos</p>';
    }
    
    return events.map(event => {
        const date = new Date(event.date);
        const formattedDate = date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `
            <div class="event-card ${event.type}">
                <div class="event-icon">${eventIcons[event.type]}</div>
                <div class="event-title">${event.name}</div>
                <div class="event-date">${formattedDate}</div>
                ${event.notes ? `<div class="event-notes">${event.notes}</div>` : ''}
                <div class="event-actions">
                    <button class="btn-event" onclick="deleteEvent(${event.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Abrir modal para añadir evento
function openAddEventModal(petId) {
    document.getElementById('eventPetId').value = petId;
    openModal(elements.addEventModal);
}

// Añadir nueva mascota
function addNewPet() {
    const name = document.getElementById('petName').value;
    const type = document.getElementById('petType').value;
    const birthday = document.getElementById('petBirthday').value;
    const photoFile = document.getElementById('petPhoto').files[0];
    
    // Procesar foto
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photo = e.target.result;
            saveNewPet(name, type, birthday, photo);
        };
        reader.readAsDataURL(photoFile);
    } else {
        saveNewPet(name, type, birthday);
    }
}

// Guardar nueva mascota
function saveNewPet(name, type, birthday, photo = null) {
    const pet = {
        id: db.nextPetId++,
        name,
        type,
        birthday,
        photo
    };
    
    db.pets.push(pet);
    saveToLocalStorage();
    renderPetList();
    closeModal(elements.addPetModal);
    showNotification('Mascota agregada', `${name} ha sido añadido correctamente`, 'success');
    
    // Seleccionar automáticamente la nueva mascota
    showPetDetails(pet.id);
}

// Añadir nuevo evento
function addNewEvent() {
    const petId = parseInt(document.getElementById('eventPetId').value);
    const type = document.getElementById('eventType').value;
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const notes = document.getElementById('eventNotes').value;
    const reminder = document.getElementById('eventReminder').checked;
    
    const event = {
        id: db.nextEventId++,
        petId,
        type,
        name,
        date,
        notes,
        reminder
    };
    
    db.events.push(event);
    saveToLocalStorage();
    closeModal(elements.addEventModal);
    showPetDetails(petId);
    showNotification('Evento agregado', `El evento ${name} ha sido añadido correctamente`, 'success');
}

// Eliminar mascota
function deletePet(petId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta mascota? Se eliminarán también todos sus eventos.')) {
        // Eliminar mascota y sus eventos
        db.pets = db.pets.filter(p => p.id !== petId);
        db.events = db.events.filter(e => e.petId !== petId);
        
        saveToLocalStorage();
        renderPetList();
        
        // Mostrar mensaje vacío si no hay mascotas
        if (db.pets.length === 0) {
            elements.petDetails.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dog empty-icon"></i>
                    <p>Selecciona una mascota o añade una nueva</p>
                </div>
            `;
        } else {
            // Seleccionar la primera mascota
            showPetDetails(db.pets[0].id);
        }
        
        showNotification('Mascota eliminada', 'La mascota ha sido eliminada correctamente', 'success');
    }
}

// Eliminar evento
function deleteEvent(eventId) {
    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
        const event = db.events.find(e => e.id === eventId);
        if (!event) return;
        
        const petId = event.petId;
        db.events = db.events.filter(e => e.id !== eventId);
        
        saveToLocalStorage();
        showPetDetails(petId);
        showNotification('Evento eliminado', 'El evento ha sido eliminado correctamente', 'success');
    }
}

// Mostrar notificación
function showNotification(title, message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    elements.notificationContainer.appendChild(notification);
    
    // Eliminar después de 4 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Comprobar eventos pendientes
function checkPendingEvents() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingEvents = db.events.filter(event => {
        const eventDate = new Date(event.date);
        return event.reminder && eventDate > now && eventDate <= tomorrow;
    });
    
    if (upcomingEvents.length > 0) {
        upcomingEvents.forEach(event => {
            const pet = db.pets.find(p => p.id === event.petId);
            if (pet) {
                showNotification(
                    'Recordatorio', 
                    `${pet.name} tiene ${eventNames[event.type]} "${event.name}" mañana`, 
                    'success'
                );
            }
        });
    }
}

// Guardar en localStorage
function saveToLocalStorage() {
    localStorage.setItem('petCareApp', JSON.stringify(db));
}

// Cargar desde localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('petCareApp');
    if (savedData) {
        db = JSON.parse(savedData);
    }
}

// Iniciar la aplicación cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', init);