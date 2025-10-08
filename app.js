// ===== SESIÓN Y AUTENTICACIÓN =====
let session = {
    user: null  // { email: '...' }
};

const AUTH_DEMO_USERS = [
    { email: 'demo@demo.com', password: 'demo123' }
];

function loadSession() {
    try {
        const raw = localStorage.getItem('calendarSession');
        session = raw ? JSON.parse(raw) : { user: null };
    } catch (e) {
        console.error('Error loading session:', e);
        session = { user: null };
    }
}

function saveSession() {
    try {
        localStorage.setItem('calendarSession', JSON.stringify(session));
    } catch (e) {
        console.error('Error saving session:', e);
    }
}

function isAuthenticated() {
    return !!(session && session.user);
}

function requireAuth() {
    if (!isAuthenticated()) {
        showNotification('Inicia sesión para continuar', 'error');
        return false;
    }
    return true;
}

// Estado de la aplicación
let state = {
    workSchedule: {
        start: '08:00',
        end: '17:30'
    },
    locations: {
        home: {
            address: '',
            lat: null,
            lng: null
        },
        work: {
            address: '',
            lat: null,
            lng: null
        },
        commute: {
            homeToWork: null,
            workToHome: null
        }
    },
    transport: {
        mode: 'driving',  // driving, transit, bicycling, walking
        maxDetour: 10      // minutos de desvío máximo aceptable
    },
    poiTypes: ['supermercado', 'farmacia', 'banco'],
    tasks: [],
    currentWeekStart: new Date()
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadSession();
    mountNavHandlers();
    mountHelpModal();
    if (isAuthenticated()) {
        showApp();
        initApp();
    } else {
        showAuth();
        mountLoginForm();
    }
});

// Inicializar la aplicación (después de autenticar)
function initApp() {
    loadFromStorage();
    initializeWeek();
    setupEventListeners();
    updateScheduleInfo();
    updateLocationInfo();
    renderCalendar();
    renderTasks();
    generateSuggestions();
    updateDashboard();
}

// ===== VISTAS AUTH / APP =====
function showAuth() {
    document.getElementById('authView').style.display = 'flex';
    document.getElementById('appView').style.display = 'none';
}

function showApp() {
    document.getElementById('authView').style.display = 'none';
    document.getElementById('appView').style.display = 'flex';
    const emailEl = document.getElementById('userEmail');
    if (emailEl && session.user) {
        emailEl.textContent = session.user.email;
    }
}

// ===== LOGIN =====
function mountLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const user = AUTH_DEMO_USERS.find(u => u.email === email && u.password === password);
        if (user) {
            session.user = { email: user.email };
            saveSession();
            showNotification('Bienvenido!', 'success');
            showApp();
            initApp();
        } else {
            showNotification('Credenciales incorrectas', 'error');
        }
    });
}

// ===== LOGOUT =====
function logout() {
    session.user = null;
    saveSession();
    showNotification('Sesión cerrada', 'info');
    showAuth();
}

// ===== NAVEGACIÓN =====
function mountNavHandlers() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logoutButton');
    const navItems = document.querySelectorAll('.nav-item');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            if (view) {
                switchView(view);
            }
        });
    });

    // Atajos de teclado
    let keyBuffer = '';
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === '?') {
            document.getElementById('helpButton')?.click();
            return;
        }

        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 2) keyBuffer = keyBuffer.slice(-2);

        if (keyBuffer === 'gd') switchView('dashboard');
        if (keyBuffer === 'gc') switchView('calendar');
        if (keyBuffer === 'gt') switchView('tasks');
        if (keyBuffer === 'gs') switchView('settings');

        setTimeout(() => { keyBuffer = ''; }, 1000);
    });
}

function switchView(viewName) {
    if (!isAuthenticated()) return;

    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const view = document.getElementById('view' + viewName.charAt(0).toUpperCase() + viewName.slice(1));
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (view) view.classList.add('active');
    if (navItem) navItem.classList.add('active');

    if (viewName === 'dashboard') updateDashboard();
}

// ===== DASHBOARD =====
function updateDashboard() {
    const unassignedEl = document.getElementById('dashboardUnassignedTasks');
    const suggestionsEl = document.getElementById('dashboardSuggestions');

    if (!unassignedEl || !suggestionsEl) return;

    const unassignedTasks = state.tasks.filter(t => !t.assignedDate);

    if (unassignedTasks.length === 0) {
        unassignedEl.innerHTML = '<p class="empty-state">No hay tareas pendientes</p>';
    } else {
        unassignedEl.innerHTML = unassignedTasks.slice(0, 5).map(task => `
            <div class="task-item priority-${task.priority}">
                <div class="task-name">${task.name}</div>
                <div class="task-details">
                    <span>⏱️ ${task.duration}h</span>
                    <span>📍 ${task.location}</span>
                </div>
            </div>
        `).join('');
    }

    suggestionsEl.innerHTML = '<p class="empty-state">Cargando sugerencias...</p>';
    setTimeout(() => {
        const suggestions = generateSuggestions();
        if (suggestions.length === 0) {
            suggestionsEl.innerHTML = '<p class="empty-state">No hay sugerencias disponibles</p>';
        } else {
            suggestionsEl.innerHTML = suggestions.slice(0, 3).map(s => `
                <div class="suggestion-item">
                    <div class="suggestion-title">${s.title}</div>
                    <div class="suggestion-body">${s.reason}</div>
                </div>
            `).join('');
        }
    }, 100);
}

// ===== HELP MODAL =====
function mountHelpModal() {
    const modal = document.getElementById('helpModal');
    const btn = document.getElementById('helpButton');
    const closeBtn = modal?.querySelector('.close');

    if (!modal || !btn) return;

    btn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });
}

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2200);

    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 2800);
}

// Event Listeners
function setupEventListeners() {
    // Ubicaciones
    document.getElementById('detectHome').addEventListener('click', () => detectLocation('home'));
    document.getElementById('detectWork').addEventListener('click', () => detectLocation('work'));
    document.getElementById('calculateCommute').addEventListener('click', calculateCommuteTime);
    document.getElementById('saveLocations').addEventListener('click', saveLocations);

    // Horario
    document.getElementById('saveWorkSchedule').addEventListener('click', saveWorkSchedule);

    // Tareas
    document.getElementById('taskForm').addEventListener('submit', addTask);

    // Calendario
    document.getElementById('prevWeek').addEventListener('click', () => navigateWeek(-1));
    document.getElementById('nextWeek').addEventListener('click', () => navigateWeek(1));

    // Autocompletado de direcciones
    setupAddressAutocomplete('homeAddress', 'homeAddressSuggestions', 'home');
    setupAddressAutocomplete('workAddress', 'workAddressSuggestions', 'work');
    setupAddressAutocomplete('taskAddress', 'taskAddressSuggestions', 'task');

    // Transporte
    document.getElementById('saveTransport')?.addEventListener('click', saveTransportPreferences);

    // Planificador de rutas
    document.getElementById('calculateRoute')?.addEventListener('click', calculateOptimalRoute);
}

// ===== FUNCIONES DE AUTOCOMPLETADO =====

let autocompleteTimers = {};
let selectedSuggestionIndex = {};

function setupAddressAutocomplete(inputId, suggestionsId, type) {
    const input = document.getElementById(inputId);
    const suggestionsContainer = document.getElementById(suggestionsId);

    if (!input || !suggestionsContainer) return;

    selectedSuggestionIndex[inputId] = -1;

    // Evento de escritura
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length < 3) {
            hideSuggestions(suggestionsId);
            return;
        }

        // Debounce: esperar 500ms después de que el usuario deje de escribir
        clearTimeout(autocompleteTimers[inputId]);
        autocompleteTimers[inputId] = setTimeout(() => {
            searchAddresses(query, suggestionsId, inputId, type);
        }, 500);
    });

    // Navegación con teclado
    input.addEventListener('keydown', (e) => {
        const suggestions = suggestionsContainer.querySelectorAll('.autocomplete-suggestion-item');

        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex[inputId] = Math.min(
                selectedSuggestionIndex[inputId] + 1,
                suggestions.length - 1
            );
            updateSelectedSuggestion(suggestionsId, inputId);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex[inputId] = Math.max(
                selectedSuggestionIndex[inputId] - 1,
                0
            );
            updateSelectedSuggestion(suggestionsId, inputId);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggestionIndex[inputId] >= 0) {
                suggestions[selectedSuggestionIndex[inputId]].click();
            }
        } else if (e.key === 'Escape') {
            hideSuggestions(suggestionsId);
        }
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            hideSuggestions(suggestionsId);
        }
    });
}

async function searchAddresses(query, suggestionsId, inputId, type) {
    const suggestionsContainer = document.getElementById(suggestionsId);

    // Mostrar indicador de carga
    suggestionsContainer.innerHTML = '<div class="autocomplete-loading">🔍 Buscando direcciones...</div>';
    suggestionsContainer.classList.add('active');

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CalendarioInteligente/1.0'
                }
            }
        );

        const data = await response.json();

        if (data && data.length > 0) {
            displaySuggestions(data, suggestionsId, inputId, type);
        } else {
            suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">No se encontraron direcciones</div>';
        }
    } catch (error) {
        console.error('Error buscando direcciones:', error);
        suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">Error al buscar direcciones</div>';
    }
}

function displaySuggestions(suggestions, suggestionsId, inputId, type) {
    const container = document.getElementById(suggestionsId);
    selectedSuggestionIndex[inputId] = -1;

    container.innerHTML = suggestions.map((suggestion, index) => {
        const address = suggestion.display_name;
        const parts = address.split(',');
        const main = parts.slice(0, 2).join(',');
        const detail = parts.slice(2).join(',');

        return `
            <div class="autocomplete-suggestion-item" data-index="${index}" data-lat="${suggestion.lat}" data-lng="${suggestion.lon}" data-address="${address}">
                <div class="suggestion-main">${main}</div>
                ${detail ? `<div class="suggestion-detail">${detail}</div>` : ''}
            </div>
        `;
    }).join('');

    container.classList.add('active');

    // Agregar eventos de clic
    container.querySelectorAll('.autocomplete-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectSuggestion(item, inputId, type);
        });

        item.addEventListener('mouseenter', () => {
            selectedSuggestionIndex[inputId] = parseInt(item.dataset.index);
            updateSelectedSuggestion(suggestionsId, inputId);
        });
    });
}

function selectSuggestion(item, inputId, type) {
    const input = document.getElementById(inputId);
    const address = item.dataset.address;
    const lat = parseFloat(item.dataset.lat);
    const lng = parseFloat(item.dataset.lng);

    input.value = address;

    // Guardar coordenadas según el tipo
    if (type === 'home' || type === 'work') {
        state.locations[type].address = address;
        state.locations[type].lat = lat;
        state.locations[type].lng = lng;
        updateLocationDisplay(type);
        saveToStorage();
    }

    hideSuggestions(inputId + 'Suggestions');
}

function updateSelectedSuggestion(suggestionsId, inputId) {
    const container = document.getElementById(suggestionsId);
    const items = container.querySelectorAll('.autocomplete-suggestion-item');

    items.forEach((item, index) => {
        if (index === selectedSuggestionIndex[inputId]) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function hideSuggestions(suggestionsId) {
    const container = document.getElementById(suggestionsId);
    if (container) {
        container.classList.remove('active');
        container.innerHTML = '';
    }
}

// ===== FUNCIONES DE GEOLOCALIZACIÓN =====

// Detectar ubicación actual
function detectLocation(type) {
    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización');
        return;
    }

    const button = document.getElementById(type === 'home' ? 'detectHome' : 'detectWork');
    button.disabled = true;
    button.textContent = '📍 Detectando...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            state.locations[type].lat = lat;
            state.locations[type].lng = lng;

            // Usar geocodificación inversa para obtener dirección
            reverseGeocode(lat, lng, type);

            button.disabled = false;
            button.textContent = '✅ Ubicación detectada';

            setTimeout(() => {
                button.textContent = '📍 Detectar mi ubicación actual';
            }, 3000);

            updateLocationDisplay(type);
            saveToStorage();
        },
        (error) => {
            alert('Error al detectar ubicación: ' + error.message);
            button.disabled = false;
            button.textContent = '📍 Detectar mi ubicación actual';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Geocodificación inversa (coordenadas a dirección)
async function reverseGeocode(lat, lng, type) {
    try {
        // Usar la API gratuita de Nominatim (OpenStreetMap)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CalendarioInteligente/1.0'
                }
            }
        );

        const data = await response.json();

        if (data && data.display_name) {
            state.locations[type].address = data.display_name;
            document.getElementById(type === 'home' ? 'homeAddress' : 'workAddress').value = data.display_name;
        }

        updateLocationDisplay(type);
        saveToStorage();
    } catch (error) {
        console.error('Error en geocodificación inversa:', error);
    }
}

// Geocodificación directa (dirección a coordenadas)
async function geocodeAddress(address, type) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'CalendarioInteligente/1.0'
                }
            }
        );

        const data = await response.json();

        if (data && data.length > 0) {
            state.locations[type].lat = parseFloat(data[0].lat);
            state.locations[type].lng = parseFloat(data[0].lon);
            state.locations[type].address = address;

            updateLocationDisplay(type);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error en geocodificación:', error);
        return false;
    }
}

// Actualizar display de ubicación
function updateLocationDisplay(type) {
    const coordsDiv = document.getElementById(type === 'home' ? 'homeCoords' : 'workCoords');
    const location = state.locations[type];

    if (location.lat && location.lng) {
        coordsDiv.innerHTML = `
            📍 Coordenadas: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}<br>
            <a href="https://www.google.com/maps?q=${location.lat},${location.lng}" target="_blank" style="color: #667eea;">
                Ver en Google Maps
            </a>
        `;
    } else {
        coordsDiv.innerHTML = '';
    }
}

// Calcular tiempo de traslado automáticamente
async function calculateCommuteTime() {
    const home = state.locations.home;
    const work = state.locations.work;

    if (!home.lat || !home.lng || !work.lat || !work.lng) {
        alert('Primero debes configurar las ubicaciones de casa y trabajo');
        return;
    }

    const button = document.getElementById('calculateCommute');
    button.disabled = true;
    button.textContent = '🚗 Calculando...';

    try {
        // Usar OSRM (Open Source Routing Machine) - API gratuita
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${home.lng},${home.lat};${work.lng},${work.lat}?overview=false`
        );

        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const durationSeconds = data.routes[0].duration;
            const durationMinutes = Math.ceil(durationSeconds / 60);

            state.locations.commute.homeToWork = durationMinutes;
            state.locations.commute.workToHome = durationMinutes + 5; // Añadir 5 min por tráfico

            document.getElementById('homeToWork').value = durationMinutes;
            document.getElementById('workToHome').value = durationMinutes + 5;

            saveToStorage();
            updateLocationInfo();

            showNotification(`Tiempo calculado: ${durationMinutes} minutos aproximadamente`, 'success');
        } else {
            throw new Error('No se pudo calcular la ruta');
        }
    } catch (error) {
        console.error('Error calculando tiempo de traslado:', error);
        alert('No se pudo calcular automáticamente. Por favor, ingresa los tiempos manualmente.');
    } finally {
        button.disabled = false;
        button.textContent = '🚗 Calcular automáticamente';
    }
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // en kilómetros
}

// Estimar tiempo de traslado basado en distancia (si no hay coordenadas exactas)
function estimateTravelTime(distance) {
    // Asumir velocidad promedio de 30 km/h en ciudad
    const avgSpeed = 30;
    const timeHours = distance / avgSpeed;
    const timeMinutes = Math.ceil(timeHours * 60);
    return timeMinutes;
}

// Guardar ubicaciones
async function saveLocations() {
    // Guardar direcciones
    const homeAddress = document.getElementById('homeAddress').value;
    const workAddress = document.getElementById('workAddress').value;
    const homeToWork = parseInt(document.getElementById('homeToWork').value) || null;
    const workToHome = parseInt(document.getElementById('workToHome').value) || null;

    // Si hay direcciones pero no coordenadas, geocodificar
    if (homeAddress && !state.locations.home.lat) {
        await geocodeAddress(homeAddress, 'home');
    }

    if (workAddress && !state.locations.work.lat) {
        await geocodeAddress(workAddress, 'work');
    }

    // Actualizar direcciones si fueron modificadas manualmente
    if (homeAddress) state.locations.home.address = homeAddress;
    if (workAddress) state.locations.work.address = workAddress;

    // Guardar tiempos de traslado
    state.locations.commute.homeToWork = homeToWork;
    state.locations.commute.workToHome = workToHome;

    saveToStorage();
    updateLocationInfo();
    generateSuggestions(); // Regenerar sugerencias con nueva información

    showNotification('Ubicaciones guardadas correctamente', 'success');
}

// Actualizar información de ubicaciones
function updateLocationInfo() {
    const infoBox = document.getElementById('locationInfo');
    const { home, work, commute } = state.locations;

    let html = '<strong>Configuración actual:</strong><br>';

    if (home.address) {
        html += `🏠 Casa: ${home.address.substring(0, 60)}...<br>`;
    }

    if (work.address) {
        html += `💼 Trabajo: ${work.address.substring(0, 60)}...<br>`;
    }

    if (commute.homeToWork || commute.workToHome) {
        html += `<br><strong>Tiempos de traslado:</strong><br>`;
        if (commute.homeToWork) html += `Casa → Trabajo: ${commute.homeToWork} minutos<br>`;
        if (commute.workToHome) html += `Trabajo → Casa: ${commute.workToHome} minutos<br>`;
    }

    if (home.lat && work.lat) {
        const distance = calculateDistance(home.lat, home.lng, work.lat, work.lng);
        html += `📏 Distancia: ${distance.toFixed(2)} km<br>`;
    }

    infoBox.innerHTML = html || 'No hay ubicaciones configuradas';
}

// ===== FUNCIONES DE HORARIO Y TAREAS (Actualizadas) =====

// Guardar horario laboral
function saveWorkSchedule() {
    const start = document.getElementById('workStart').value;
    const end = document.getElementById('workEnd').value;

    state.workSchedule = { start, end };
    saveToStorage();
    updateScheduleInfo();
    renderCalendar();

    showNotification('Horario laboral guardado correctamente', 'success');
}

function updateScheduleInfo() {
    const { start, end } = state.workSchedule;
    const infoBox = document.getElementById('scheduleInfo');

    const startTime = parseTime(start);
    const endTime = parseTime(end);
    const workHours = (endTime - startTime) / 60;
    const freeHoursBefore = startTime / 60;
    const freeHoursAfter = (24 * 60 - endTime) / 60;

    let html = `
        <strong>Horario configurado:</strong><br>
        Trabajo: ${start} - ${end} (${workHours.toFixed(2)} horas)<br>
        Tiempo libre: Antes ${freeHoursBefore.toFixed(2)}h | Después ${freeHoursAfter.toFixed(2)}h
    `;

    // Añadir información de traslados si está disponible
    const commute = state.locations.commute;
    if (commute.homeToWork || commute.workToHome) {
        html += `<br><br><strong>Considerando traslados:</strong><br>`;
        if (commute.homeToWork) {
            const arrivalTime = formatMinutesToTime(startTime - commute.homeToWork);
            html += `Salir de casa a las ${arrivalTime} para llegar a tiempo<br>`;
        }
        if (commute.workToHome) {
            const homeArrival = formatMinutesToTime(endTime + commute.workToHome);
            html += `Llegada estimada a casa: ${homeArrival}<br>`;
        }
    }

    infoBox.innerHTML = html;
}

// Añadir tarea (actualizado con dirección y ventanas de tiempo)
function addTask(e) {
    e.preventDefault();

    // Obtener y validar deadline
    const deadlineInput = document.getElementById('taskDeadline').value;
    let deadline = null;
    if (deadlineInput) {
        deadline = parseDateInput(deadlineInput);
        if (!deadline) {
            alert('Formato de fecha límite inválido. Usa DD-MM-YYYY (ej: 15-10-2025)');
            return;
        }
    }

    // Obtener y validar ventana de tiempo
    const windowStartInput = document.getElementById('taskWindowStart').value;
    const windowEndInput = document.getElementById('taskWindowEnd').value;
    let windowStart = null;
    let windowEnd = null;

    if (windowStartInput || windowEndInput) {
        if (windowStartInput && windowEndInput) {
            windowStart = parseDateInput(windowStartInput);
            windowEnd = parseDateInput(windowEndInput);

            if (!windowStart || !windowEnd) {
                alert('Formato de ventana de tiempo inválido. Usa DD-MM-YYYY');
                return;
            }

            // Validar que windowStart < windowEnd
            if (new Date(windowStart) > new Date(windowEnd)) {
                alert('La fecha de inicio debe ser anterior a la fecha de fin');
                return;
            }
        } else {
            alert('Debes especificar tanto fecha de inicio como de fin para la ventana de tiempo');
            return;
        }
    }

    const task = {
        id: Date.now(),
        name: document.getElementById('taskName').value,
        duration: parseFloat(document.getElementById('taskDuration').value),
        location: document.getElementById('taskLocation').value,
        address: document.getElementById('taskAddress').value || null,
        priority: document.getElementById('taskPriority').value,
        deadline: deadline,
        windowStart: windowStart,
        windowEnd: windowEnd,
        assignedDate: null,
        assignedTime: null,
        lat: null,
        lng: null
    };

    // Intentar geocodificar la dirección si se proporcionó
    if (task.address) {
        geocodeTaskAddress(task);
    }

    state.tasks.push(task);
    saveToStorage();

    document.getElementById('taskForm').reset();
    document.getElementById('taskPriority').value = 'media';

    renderCalendar();
    renderTasks();
    generateSuggestions();

    showNotification('Tarea añadida correctamente', 'success');
}

// Geocodificar dirección de tarea
async function geocodeTaskAddress(task) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(task.address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'CalendarioInteligente/1.0'
                }
            }
        );

        const data = await response.json();

        if (data && data.length > 0) {
            task.lat = parseFloat(data[0].lat);
            task.lng = parseFloat(data[0].lon);
            saveToStorage();
        }
    } catch (error) {
        console.error('Error geocodificando tarea:', error);
    }
}

// Eliminar tarea
function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveToStorage();
        renderCalendar();
        renderTasks();
        generateSuggestions();
        showNotification('Tarea eliminada', 'success');
    }
}

// Asignar tarea a un día específico
function assignTask(taskId, dateStr) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const date = new Date(dateStr);
    const assignedTime = calculateBestTimeSlot(date, task.duration, task);

    task.assignedDate = dateStr;
    task.assignedTime = assignedTime;

    saveToStorage();
    renderCalendar();
    renderTasks();
    generateSuggestions();

    showNotification(`Tarea asignada a ${formatDate(date)}`, 'success');
}

// Desasignar tarea
function unassignTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.assignedDate = null;
    task.assignedTime = null;

    saveToStorage();
    renderCalendar();
    renderTasks();
    generateSuggestions();

    showNotification('Tarea desasignada', 'success');
}

// Asignar múltiples tareas al mismo día
function assignAllTasks(taskIds, dateStr) {
    let count = 0;
    taskIds.forEach(taskId => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && !task.assignedDate) {
            const date = new Date(dateStr);
            const assignedTime = calculateBestTimeSlot(date, task.duration, task);

            task.assignedDate = dateStr;
            task.assignedTime = assignedTime;
            count++;
        }
    });

    if (count > 0) {
        saveToStorage();
        renderCalendar();
        renderTasks();
        generateSuggestions();
        updateDashboard();

        showNotification(`${count} tarea(s) asignadas a ${formatDate(new Date(dateStr))}`, 'success');
    }
}

// Calcular mejor franja horaria disponible (mejorado con ubicaciones)
function calculateBestTimeSlot(date, duration, task = null) {
    const { start, end } = state.workSchedule;
    const workStart = parseTime(start);
    const workEnd = parseTime(end);
    const commute = state.locations.commute;

    // Preferir después del trabajo
    let afterWorkStart = workEnd;

    // Si tenemos tiempo de traslado trabajo->casa, añadirlo
    if (commute.workToHome) {
        afterWorkStart += commute.workToHome;
    }

    const dayEnd = 22 * 60; // Hasta las 10 PM

    if (afterWorkStart + duration * 60 <= dayEnd) {
        return formatMinutesToTime(afterWorkStart);
    }

    // Si no cabe después, intentar antes del trabajo
    let dayStart = 7 * 60; // Desde las 7 AM

    // Si tenemos tiempo de traslado casa->trabajo, considerarlo
    if (commute.homeToWork) {
        const minimumStart = workStart - commute.homeToWork - duration * 60;
        if (minimumStart >= dayStart) {
            return formatMinutesToTime(minimumStart);
        }
    }

    // Por defecto, justo después del trabajo
    return formatMinutesToTime(workEnd);
}

// Motor de sugerencias inteligentes (mejorado con ubicaciones)
function generateSuggestions() {
    const unassignedTasks = state.tasks.filter(t => !t.assignedDate);

    if (unassignedTasks.length === 0) {
        document.getElementById('suggestions').innerHTML = '<div class="empty-state">No hay tareas pendientes de asignar</div>';
        return;
    }

    const suggestions = [];

    // Agrupar tareas por proximidad geográfica (si tienen coordenadas)
    const tasksWithCoords = unassignedTasks.filter(t => t.lat && t.lng);
    if (tasksWithCoords.length > 1) {
        const proximityGroups = groupTasksByProximity(tasksWithCoords);

        proximityGroups.forEach(group => {
            if (group.length > 1) {
                const totalDuration = group.reduce((sum, t) => sum + t.duration, 0);
                const suggestedDay = findBestDayForTasks(group, totalDuration);

                suggestions.push({
                    type: 'proximity',
                    tasks: group,
                    day: suggestedDay,
                    reason: `Estas tareas están muy cerca una de otra (menos de 2km). Puedes ahorrar ${estimateTimeSaved(group)} minutos haciéndolas el mismo día.`,
                    totalDuration
                });
            }
        });
    }

    // Agrupar tareas por ubicación similar (nombre)
    const locationGroups = groupTasksByLocation(unassignedTasks);

    Object.entries(locationGroups).forEach(([locationKey, tasks]) => {
        if (tasks.length > 1) {
            const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
            const suggestedDay = findBestDayForTasks(tasks, totalDuration);

            suggestions.push({
                type: 'location-group',
                tasks: tasks,
                day: suggestedDay,
                reason: `Estas tareas están en ubicaciones similares (${tasks[0].location}). Puedes ahorrar tiempo haciéndolas el mismo día.`,
                totalDuration
            });
        }
    });

    // Sugerencias para tareas urgentes
    unassignedTasks
        .filter(t => t.priority === 'urgente')
        .forEach(task => {
            const suggestedDay = findBestDayForTasks([task], task.duration);
            suggestions.push({
                type: 'urgent',
                tasks: [task],
                day: suggestedDay,
                reason: 'Esta tarea es urgente y debería hacerse lo antes posible.',
                totalDuration: task.duration
            });
        });

    // Sugerencias para tareas con fecha límite
    unassignedTasks
        .filter(t => t.deadline)
        .forEach(task => {
            const deadline = new Date(task.deadline);
            const today = new Date();
            const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

            if (daysUntilDeadline <= 7) {
                suggestions.push({
                    type: 'deadline',
                    tasks: [task],
                    day: task.deadline,
                    reason: `Esta tarea tiene fecha límite el ${formatDate(deadline)} (en ${daysUntilDeadline} días).`,
                    totalDuration: task.duration
                });
            }
        });

    // Ordenar sugerencias por prioridad
    suggestions.sort((a, b) => {
        const priorityOrder = { urgent: 0, deadline: 1, proximity: 2, 'location-group': 3 };
        return priorityOrder[a.type] - priorityOrder[b.type];
    });

    renderSuggestions(suggestions);
    return suggestions;
}

// Agrupar tareas por proximidad geográfica
function groupTasksByProximity(tasks) {
    const groups = [];
    const used = new Set();
    const proximityThreshold = 2; // 2 km

    tasks.forEach((task, i) => {
        if (used.has(i)) return;

        const group = [task];
        used.add(i);

        tasks.forEach((otherTask, j) => {
            if (i !== j && !used.has(j)) {
                const distance = calculateDistance(
                    task.lat, task.lng,
                    otherTask.lat, otherTask.lng
                );

                if (distance <= proximityThreshold) {
                    group.push(otherTask);
                    used.add(j);
                }
            }
        });

        if (group.length > 0) {
            groups.push(group);
        }
    });

    return groups;
}

// Estimar tiempo ahorrado agrupando tareas
function estimateTimeSaved(tasks) {
    // Asumir 15 minutos de traslado ahorrado por cada tarea adicional
    return (tasks.length - 1) * 15;
}

// Agrupar tareas por ubicación similar (texto)
function groupTasksByLocation(tasks) {
    const groups = {};

    tasks.forEach(task => {
        const normalizedLocation = task.location
            .toLowerCase()
            .replace(/\d+/g, '')
            .replace(/\b(calle|avenida|av|número|centro|local)\b/g, '')
            .trim();

        const key = normalizedLocation.split(' ').slice(0, 2).join(' ');

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(task);
    });

    return groups;
}

// Encontrar mejor día para tareas (mejorado con ventanas de tiempo)
function findBestDayForTasks(tasks, totalDuration) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { start, end } = state.workSchedule;
    const workStart = parseTime(start);
    const workEnd = parseTime(end);
    const commute = state.locations.commute;

    const dayStart = 7 * 60;
    const dayEnd = 22 * 60;

    // Calcular tiempo disponible considerando traslados
    let availableTimePerDay = (dayEnd - dayStart) - (workEnd - workStart);
    if (commute.homeToWork) availableTimePerDay -= commute.homeToWork;
    if (commute.workToHome) availableTimePerDay -= commute.workToHome;

    const availableHours = availableTimePerDay / 60;

    // Determinar rango de fechas válido considerando ventanas de tiempo
    let searchStart = new Date(state.currentWeekStart);
    let searchEnd = new Date(state.currentWeekStart);
    searchEnd.setDate(searchEnd.getDate() + 13); // 2 semanas

    // Si hay tareas con ventanas de tiempo, ajustar rango de búsqueda
    const tasksWithWindows = tasks.filter(t => t.windowStart && t.windowEnd);
    if (tasksWithWindows.length > 0) {
        const earliestWindow = new Date(Math.min(...tasksWithWindows.map(t => new Date(t.windowStart))));
        const latestWindow = new Date(Math.max(...tasksWithWindows.map(t => new Date(t.windowEnd))));

        searchStart = earliestWindow > today ? earliestWindow : today;
        searchEnd = latestWindow;
    }

    if (totalDuration <= availableHours) {
        // Generar días candidatos dentro del rango de búsqueda
        const candidates = [];
        let currentDay = new Date(searchStart);

        while (currentDay <= searchEnd) {
            // Verificar si todas las tareas pueden agendarse en este día
            const dateStr = formatDateToString(currentDay);
            const isValidForAll = tasks.every(task => {
                // Si la tarea tiene ventana, verificar que este día esté dentro
                if (task.windowStart && task.windowEnd) {
                    const windowStart = new Date(task.windowStart);
                    const windowEnd = new Date(task.windowEnd);
                    windowStart.setHours(0, 0, 0, 0);
                    windowEnd.setHours(0, 0, 0, 0);

                    return currentDay >= windowStart && currentDay <= windowEnd;
                }
                return true;
            });

            if (isValidForAll) {
                const tasksThisDay = state.tasks.filter(t => t.assignedDate === dateStr).length;
                candidates.push({ day: new Date(currentDay), count: tasksThisDay });
            }

            currentDay.setDate(currentDay.getDate() + 1);
        }

        if (candidates.length === 0) {
            // No hay días válidos, retornar hoy
            return formatDateToString(today);
        }

        // Preferir días de semana (Lun-Vie)
        const weekdayOptions = candidates.filter(d => {
            const dayOfWeek = d.day.getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5;
        });

        if (weekdayOptions.length > 0) {
            weekdayOptions.sort((a, b) => a.count - b.count);
            return formatDateToString(weekdayOptions[0].day);
        }

        // Si no hay días de semana, usar cualquier día
        candidates.sort((a, b) => a.count - b.count);
        return formatDateToString(candidates[0].day);
    }

    return formatDateToString(today);
}

// Renderizar sugerencias
function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestions');

    if (!container) return; // Si no existe el contenedor, salir

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay sugerencias por el momento. Las sugerencias aparecen cuando tienes tareas pendientes.</div>';
        return;
    }

    container.innerHTML = suggestions.map(suggestion => {
        const suggestedDate = formatDate(new Date(suggestion.day));

        return `
        <div class="suggestion-item">
            <div class="suggestion-header">
                <div class="suggestion-title">
                    ${suggestion.type === 'proximity' ? '🗺️ Tareas cercanas' : ''}
                    ${suggestion.type === 'location-group' ? '📍 Agrupar por ubicación' : ''}
                    ${suggestion.type === 'urgent' ? '⚠️ Tarea urgente' : ''}
                    ${suggestion.type === 'deadline' ? '⏰ Fecha límite próxima' : ''}
                </div>
                <div style="background: rgba(124, 58, 237, 0.2); color: var(--brand); padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">
                    📅 ${suggestedDate}
                </div>
            </div>
            <div class="suggestion-body">${suggestion.reason}</div>
            <div class="suggestion-tasks">
                <strong>Tareas incluidas:</strong>
                <ul>
                    ${suggestion.tasks.map(t => `
                        <li>${t.name} (${t.duration}h)${t.location ? ' - ' + t.location : ''}</li>
                    `).join('')}
                </ul>
                <strong>Duración total:</strong> ${suggestion.totalDuration.toFixed(2)} horas
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                ${suggestion.tasks.map(t => `
                    <button class="btn btn-success btn-sm" onclick="assignTask(${t.id}, '${suggestion.day}')">
                        ✓ Asignar "${t.name}"
                    </button>
                `).join('')}
                ${suggestion.tasks.length > 1 ? `
                    <button class="btn btn-primary btn-sm" onclick="assignAllTasks([${suggestion.tasks.map(t => t.id).join(',')}], '${suggestion.day}')">
                        ✓✓ Asignar todas
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Renderizar tareas
function renderTasks() {
    const unassigned = state.tasks.filter(t => !t.assignedDate);
    const unassignedContainer = document.getElementById('unassignedTasks');

    if (unassigned.length === 0) {
        unassignedContainer.innerHTML = '<div class="empty-state">Todas las tareas están asignadas</div>';
    } else {
        unassignedContainer.innerHTML = unassigned.map(task => createTaskCard(task)).join('');
    }

    const allTasksContainer = document.getElementById('allTasks');

    if (state.tasks.length === 0) {
        allTasksContainer.innerHTML = '<div class="empty-state">No hay tareas creadas</div>';
    } else {
        const sortedTasks = [...state.tasks].sort((a, b) => {
            const priorityOrder = { urgente: 0, alta: 1, media: 2, baja: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        allTasksContainer.innerHTML = sortedTasks.map(task => createTaskCard(task, true)).join('');
    }
}

// Crear tarjeta de tarea
function createTaskCard(task, showAll = false) {
    const deadlineText = task.deadline ?
        `<div>📅 Límite: ${formatDate(task.deadline)}</div>` : '';

    const windowText = task.windowStart && task.windowEnd ?
        `<div>🗓️ Ventana: ${formatDate(task.windowStart)} al ${formatDate(task.windowEnd)}</div>` : '';

    const assignedText = task.assignedDate ?
        `<div>✅ Asignada: ${formatDate(task.assignedDate)} a las ${task.assignedTime}</div>` : '';

    const addressText = task.address ?
        `<div>🗺️ Dirección: ${task.address}</div>` : '';

    const distanceText = getTaskDistanceInfo(task);

    const priorityClass = `priority-${task.priority}`;

    return `
        <div class="task-item ${priorityClass}">
            <div class="task-header">
                <div class="task-title">${task.name}</div>
                <div class="task-priority ${priorityClass}">${task.priority}</div>
            </div>
            <div class="task-details">
                <div>⏱️ Duración: ${task.duration} hora(s)</div>
                <div>📍 Ubicación: ${task.location}</div>
                ${addressText}
                ${distanceText}
                ${windowText}
                ${deadlineText}
                ${assignedText}
            </div>
            <div class="task-actions">
                ${!task.assignedDate ? `
                    <button class="btn btn-success" onclick="suggestDayForTask(${task.id})">💡 Sugerir día</button>
                    <button class="btn btn-primary" onclick="assignTaskPrompt(${task.id})">📅 Asignar a día</button>
                ` : ''}
                ${task.assignedDate ? `
                    <button class="btn btn-secondary" onclick="unassignTask(${task.id})">🔄 Desasignar</button>
                ` : ''}
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `;
}

// Obtener información de distancia de una tarea
function getTaskDistanceInfo(task) {
    if (!task.lat || !task.lng) return '';

    const { home, work } = state.locations;
    let html = '<div>';

    if (home.lat && home.lng) {
        const distanceFromHome = calculateDistance(home.lat, home.lng, task.lat, task.lng);
        const travelTime = estimateTravelTime(distanceFromHome);
        html += `🏠→📍 ${distanceFromHome.toFixed(1)}km (≈${travelTime} min) | `;
    }

    if (work.lat && work.lng) {
        const distanceFromWork = calculateDistance(work.lat, work.lng, task.lat, task.lng);
        const travelTime = estimateTravelTime(distanceFromWork);
        html += `💼→📍 ${distanceFromWork.toFixed(1)}km (≈${travelTime} min)`;
    }

    html += '</div>';
    return html !== '<div></div>' ? html : '';
}

// Prompt para asignar tarea
function assignTaskPrompt(taskId) {
    const task = state.tasks.find(t => t.id === taskId);

    let promptMessage = `Ingresa la fecha para "${task.name}"\nFormato: DD-MM-YYYY (ej: 15-10-2025)`;

    // Si hay ventana de tiempo, mostrarla
    if (task.windowStart && task.windowEnd) {
        promptMessage += `\n\nVentana disponible: ${formatDate(task.windowStart)} al ${formatDate(task.windowEnd)}`;
    }

    const dateInput = prompt(promptMessage);

    if (dateInput) {
        // Convertir DD-MM-YYYY a YYYY-MM-DD
        const isoDate = parseDateInput(dateInput);

        if (!isoDate) {
            alert('Formato inválido. Usa DD-MM-YYYY (ej: 15-10-2025)');
            return;
        }

        // Validar si está dentro de la ventana de tiempo
        if (task.windowStart && task.windowEnd) {
            const selectedDate = new Date(isoDate);
            const windowStart = new Date(task.windowStart);
            const windowEnd = new Date(task.windowEnd);

            if (selectedDate < windowStart || selectedDate > windowEnd) {
                const confirmOutside = confirm(
                    `⚠️ La fecha seleccionada está fuera de la ventana disponible.\n` +
                    `Ventana: ${formatDate(task.windowStart)} al ${formatDate(task.windowEnd)}\n\n` +
                    `¿Deseas asignarla de todos modos?`
                );

                if (!confirmOutside) {
                    return;
                }
            }
        }

        assignTask(taskId, isoDate);
    }
}

// Sugerir día automáticamente para una tarea
function suggestDayForTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Encontrar el mejor día para esta tarea
    const suggestedDay = findBestDayForTasks([task], task.duration);

    if (!suggestedDay) {
        showNotification('No se pudo encontrar un día adecuado. Intenta asignar manualmente.', 'warning');
        return;
    }

    const suggestedDateObj = new Date(suggestedDay);
    const formattedDate = formatDate(suggestedDateObj);

    // Mostrar ventana de confirmación con la sugerencia
    let message = `💡 Se sugiere asignar "${task.name}" el día:\n\n📅 ${formattedDate}`;

    // Agregar razones de la sugerencia
    const reasons = [];

    if (task.priority === 'urgente') {
        reasons.push('⚠️ La tarea es urgente');
    }

    if (task.deadline) {
        const deadline = new Date(task.deadline);
        const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        reasons.push(`⏰ Quedan ${daysUntil} días hasta la fecha límite`);
    }

    if (task.windowStart && task.windowEnd) {
        reasons.push(`🗓️ Dentro de tu ventana disponible (${formatDate(task.windowStart)} - ${formatDate(task.windowEnd)})`);
    }

    // Buscar tareas cercanas ese día
    const tasksOnSameDay = state.tasks.filter(t =>
        t.assignedDate === suggestedDay && t.id !== taskId
    );

    if (tasksOnSameDay.length > 0 && task.lat && task.lng) {
        const nearbyTasks = tasksOnSameDay.filter(t => {
            if (!t.lat || !t.lng) return false;
            const distance = calculateDistance(task.lat, task.lng, t.lat, t.lng);
            return distance < 2; // Menos de 2km
        });

        if (nearbyTasks.length > 0) {
            reasons.push(`🗺️ Hay ${nearbyTasks.length} tarea(s) cercana(s) ese día`);
        }
    }

    if (reasons.length > 0) {
        message += '\n\n' + reasons.join('\n');
    }

    message += '\n\n¿Deseas asignar esta tarea a este día?';

    const confirmed = confirm(message);

    if (confirmed) {
        assignTask(taskId, suggestedDay);
        showNotification(`Tarea "${task.name}" asignada al ${formattedDate}`, 'success');
    }
}

// Navegación de semana
function navigateWeek(direction) {
    const newDate = new Date(state.currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    state.currentWeekStart = newDate;
    renderCalendar();
}

function initializeWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    state.currentWeekStart = new Date(today.setDate(diff));
}

function getWeekDays(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
}

// Renderizar calendario
function renderCalendar() {
    const weekDays = getWeekDays(state.currentWeekStart);
    const calendar = document.getElementById('calendar');
    const weekDisplay = document.getElementById('currentWeek');

    const startStr = formatDateShort(weekDays[0]);
    const endStr = formatDateShort(weekDays[6]);
    weekDisplay.textContent = `${startStr} - ${endStr}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    calendar.innerHTML = weekDays.map(day => {
        const dateStr = formatDateToString(day);
        const dayTasks = state.tasks.filter(t => t.assignedDate === dateStr);
        const isToday = day.getTime() === today.getTime();

        const dayNum = String(day.getDate()).padStart(2, '0');
        const monthNum = String(day.getMonth() + 1).padStart(2, '0');

        return `
            <div class="calendar-day">
                <div class="day-header ${isToday ? 'today' : ''}">
                    ${getDayName(day.getDay())}<br>
                    ${dayNum}-${monthNum}
                </div>
                <div class="day-tasks">
                    <div class="task-block work-block">
                        💼 Trabajo<br>
                        ${state.workSchedule.start} - ${state.workSchedule.end}
                    </div>
                    ${dayTasks.map(task => `
                        <div class="task-block priority-${task.priority}"
                             title="${task.name}\n${task.location}\n${task.duration}h"
                             onclick="unassignTask(${task.id})">
                            ${task.name}<br>
                            ${task.assignedTime} (${task.duration}h)
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Utilidades de tiempo
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Formato DD-MM-YYYY para mostrar
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Formato DD-MM-YYYY abreviado con día de semana
function formatDateShort(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${days[date.getDay()]} ${day}-${month}`;
}

// Convertir de DD-MM-YYYY a Date
function parseDateDDMMYYYY(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return null;
}

// Formato ISO para almacenar (YYYY-MM-DD)
function formatDateToString(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Convertir de YYYY-MM-DD a DD-MM-YYYY para input
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Convertir de input DD-MM-YYYY a YYYY-MM-DD para almacenar
function parseDateInput(inputStr) {
    if (!inputStr) return null;
    const parts = inputStr.split('-');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    return null;
}

function getDayName(dayNum) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNum];
}

// Almacenamiento
function saveToStorage() {
    localStorage.setItem('calendarApp', JSON.stringify(state));
}

function loadFromStorage() {
    const saved = localStorage.getItem('calendarApp');
    if (saved) {
        const loadedState = JSON.parse(saved);
        state.workSchedule = loadedState.workSchedule || state.workSchedule;
        state.locations = loadedState.locations || state.locations;
        state.tasks = loadedState.tasks || [];

        // Cargar valores en los formularios
        document.getElementById('workStart').value = state.workSchedule.start;
        document.getElementById('workEnd').value = state.workSchedule.end;

        if (state.locations.home.address) {
            document.getElementById('homeAddress').value = state.locations.home.address;
            updateLocationDisplay('home');
        }

        if (state.locations.work.address) {
            document.getElementById('workAddress').value = state.locations.work.address;
            updateLocationDisplay('work');
        }

        if (state.locations.commute.homeToWork) {
            document.getElementById('homeToWork').value = state.locations.commute.homeToWork;
        }

        if (state.locations.commute.workToHome) {
            document.getElementById('workToHome').value = state.locations.commute.workToHome;
        }
    }
}

// ===== PREFERENCIAS DE TRANSPORTE =====
function saveTransportPreferences() {
    const mode = document.getElementById('transportMode').value;
    const maxDetour = parseInt(document.getElementById('maxDetour').value);

    state.transport.mode = mode;
    state.transport.maxDetour = maxDetour;

    // Obtener tipos de POI seleccionados
    const poiCheckboxes = document.querySelectorAll('.poi-type:checked');
    state.poiTypes = Array.from(poiCheckboxes).map(cb => cb.value);

    saveToStorage();

    const infoEl = document.getElementById('transportInfo');
    infoEl.className = 'info-box success';
    infoEl.textContent = `✅ Preferencias guardadas: ${getModeLabel(mode)}, desvío máximo ${maxDetour} min`;

    showNotification('Preferencias de transporte guardadas', 'success');
}

function getModeLabel(mode) {
    const labels = {
        driving: '🚗 Auto',
        transit: '🚌 Transporte Público',
        bicycling: '🚴 Bicicleta',
        walking: '🚶 A pie'
    };
    return labels[mode] || mode;
}

// ===== PLANIFICADOR DE RUTAS =====
async function calculateOptimalRoute() {
    if (!requireAuth()) return;

    const origin = document.getElementById('routeOrigin').value;
    const destination = document.getElementById('routeDestination').value;
    const time = document.getElementById('routeTime').value;

    // Validar que las ubicaciones estén configuradas
    if (origin === 'home' && !state.locations.home.lat) {
        showNotification('Debes configurar la dirección de casa primero', 'error');
        return;
    }
    if ((origin === 'work' || destination === 'work') && !state.locations.work.lat) {
        showNotification('Debes configurar la dirección de trabajo primero', 'error');
        return;
    }

    showNotification('Calculando ruta optimizada...', 'info');

    try {
        // Obtener coordenadas de origen y destino
        const originCoords = await getLocationCoords(origin);
        const destCoords = await getLocationCoords(destination);

        if (!originCoords || !destCoords) {
            showNotification('No se pudieron obtener las coordenadas', 'error');
            return;
        }

        // Usar Google Maps si está habilitado, sino usar OSRM
        if (window.APP_CONFIG.useGoogleMaps && window.GoogleMapsAPI) {
            await calculateRouteWithGoogleMaps(originCoords, destCoords, time);
        } else {
            await calculateRouteWithOSRM(originCoords, destCoords, time);
        }

    } catch (error) {
        console.error('Error calculating route:', error);
        showNotification('Error al calcular la ruta: ' + error.message, 'error');
    }
}

// Calcular ruta usando Google Maps Platform
async function calculateRouteWithGoogleMaps(originCoords, destCoords, departureTime) {
    console.log('[Route] Using Google Maps Platform');

    // Convertir modo de transporte
    const googleMode = mapTransportModeToGoogle(state.transport.mode);

    // Obtener POI types seleccionados
    const selectedPOITypes = Array.from(document.querySelectorAll('input[name="poiType"]:checked'))
        .map(cb => cb.value);

    if (selectedPOITypes.length === 0) {
        showNotification('Selecciona al menos un tipo de lugar de interés', 'warning');
        selectedPOITypes.push('supermercado'); // Default
    }

    try {
        // Usar la función de planificación completa
        const result = await GoogleMapsAPI.planRouteWithStops(
            originCoords,
            destCoords,
            googleMode,
            selectedPOITypes,
            new Date().toISOString()
        );

        // Convertir formato de Google Maps a formato esperado
        const baseRoute = {
            distance: result.route.distanceMeters,
            duration: result.route.durationSeconds,
            geometry: { encodedPolyline: result.route.encodedPolyline },
            isGoogleMaps: true
        };

        // Convertir lugares a formato POI
        const poisOnRoute = result.places.map(place => ({
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            type: place.poiType,
            detour: place.detour ? place.detour.minutes : 0,
            crowdLevel: estimateCrowdLevel(departureTime, place.types),
            rating: place.rating,
            address: place.address,
            isOpen: place.isOpen
        }));

        // Encontrar tareas que se pueden hacer en el camino
        const tasksOnRoute = findTasksOnRoute(poisOnRoute);

        // Mostrar resultados
        displayRouteResults(baseRoute, poisOnRoute, tasksOnRoute, departureTime);

        showNotification(`Ruta calculada: ${result.route.distanceKm} km, ${result.route.durationMinutes} min`, 'success');

    } catch (error) {
        console.error('[Route] Google Maps error:', error);
        showNotification('Error con Google Maps, usando modo alternativo...', 'warning');
        // Fallback a OSRM
        await calculateRouteWithOSRM(originCoords, destCoords, departureTime);
    }
}

// Calcular ruta usando OSRM (fallback gratuito)
async function calculateRouteWithOSRM(originCoords, destCoords, departureTime) {
    console.log('[Route] Using OSRM (free alternative)');

    // Calcular ruta base
    const baseRoute = await calculateRoute(originCoords, destCoords);

    // Buscar POIs en la ruta
    const poisOnRoute = await findPOIsAlongRoute(baseRoute, originCoords, destCoords);

    // Encontrar tareas que se pueden hacer en el camino
    const tasksOnRoute = findTasksOnRoute(poisOnRoute);

    // Mostrar resultados
    displayRouteResults(baseRoute, poisOnRoute, tasksOnRoute, departureTime);

    showNotification('Ruta calculada (modo gratuito)', 'success');
}

// Convertir modo de transporte a formato de Google Maps
function mapTransportModeToGoogle(osrmMode) {
    const modeMap = {
        'driving': 'DRIVE',
        'car': 'DRIVE',
        'walking': 'WALK',
        'foot': 'WALK',
        'bicycling': 'BICYCLE',
        'bike': 'BICYCLE',
        'transit': 'TRANSIT'
    };
    return modeMap[osrmMode] || 'DRIVE';
}

async function getLocationCoords(locationType) {
    if (locationType === 'home') {
        return { lat: state.locations.home.lat, lng: state.locations.home.lng };
    } else if (locationType === 'work') {
        return { lat: state.locations.work.lat, lng: state.locations.work.lng };
    } else if (locationType === 'current') {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    err => reject(err)
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    }
}

async function calculateRoute(origin, dest) {
    // Usar OSRM para calcular la ruta
    const url = `https://router.project-osrm.org/route/v1/${state.transport.mode}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
        throw new Error('No se pudo calcular la ruta');
    }

    return {
        distance: data.routes[0].distance, // en metros
        duration: data.routes[0].duration, // en segundos
        geometry: data.routes[0].geometry,
        waypoints: data.waypoints
    };
}

async function findPOIsAlongRoute(route, origin, dest) {
    const pois = [];

    // Crear una caja delimitadora alrededor de la ruta
    const coords = route.geometry.coordinates;
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Expandir la caja un poco
    const buffer = 0.01; // ~1km

    // Buscar POIs en Nominatim para cada tipo seleccionado
    for (const poiType of state.poiTypes) {
        const amenityMap = {
            'supermercado': 'supermarket',
            'farmacia': 'pharmacy',
            'banco': 'bank',
            'gasolinera': 'fuel',
            'correo': 'post_office',
            'tienda': 'convenience'
        };

        const amenity = amenityMap[poiType];
        if (!amenity) continue;

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&amenity=${amenity}&bounded=1&viewbox=${minLng-buffer},${maxLat+buffer},${maxLng+buffer},${minLat-buffer}&limit=10`;

            const response = await fetch(url);
            const data = await response.json();

            for (const poi of data) {
                const poiCoords = { lat: parseFloat(poi.lat), lng: parseFloat(poi.lon) };

                // Verificar si el POI está cerca de la ruta (dentro del desvío máximo)
                const detourTime = await calculateDetourTime(origin, dest, poiCoords);

                if (detourTime <= state.transport.maxDetour) {
                    pois.push({
                        name: poi.display_name.split(',')[0],
                        type: poiType,
                        lat: poiCoords.lat,
                        lng: poiCoords.lng,
                        detour: detourTime,
                        address: poi.display_name,
                        crowdLevel: predictCrowdLevel(poiType, new Date())
                    });
                }
            }
        } catch (error) {
            console.error(`Error buscando ${poiType}:`, error);
        }
    }

    return pois;
}

async function calculateDetourTime(origin, dest, waypoint) {
    try {
        // Calcular ruta con parada intermedia
        const url = `https://router.project-osrm.org/route/v1/${state.transport.mode}/${origin.lng},${origin.lat};${waypoint.lng},${waypoint.lat};${dest.lng},${dest.lat}?overview=false`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok') return 999;

        const detourDuration = data.routes[0].duration;

        // Calcular ruta directa
        const directUrl = `https://router.project-osrm.org/route/v1/${state.transport.mode}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`;
        const directResponse = await fetch(directUrl);
        const directData = await directResponse.json();

        const directDuration = directData.routes[0].duration;

        // Retornar diferencia en minutos
        return Math.round((detourDuration - directDuration) / 60);
    } catch (error) {
        console.error('Error calculating detour:', error);
        return 999;
    }
}

function predictCrowdLevel(poiType, time) {
    // Predicción simple basada en hora y tipo de lugar
    const hour = time.getHours();
    const day = time.getDay(); // 0 = domingo, 6 = sábado

    // Supermercados
    if (poiType === 'supermercado') {
        if (day === 0 || day === 6) return 'high'; // Fin de semana
        if (hour >= 18 && hour <= 20) return 'high'; // Después del trabajo
        if (hour >= 12 && hour <= 14) return 'medium'; // Hora de almuerzo
        return 'low';
    }

    // Farmacias
    if (poiType === 'farmacia') {
        if (hour >= 9 && hour <= 11) return 'medium'; // Mañana
        if (hour >= 17 && hour <= 19) return 'medium'; // Tarde
        return 'low';
    }

    // Bancos
    if (poiType === 'banco') {
        if (hour >= 9 && hour <= 11) return 'high'; // Apertura
        if (hour >= 14 && hour <= 16) return 'medium';
        return 'low';
    }

    return 'low';
}

function getCrowdLabel(level) {
    const labels = {
        low: '🟢 Poco flujo',
        medium: '🟡 Flujo medio',
        high: '🔴 Alto flujo'
    };
    return labels[level] || level;
}

function estimateCrowdLevel(departureTime, googlePlaceTypes = []) {
    // Convertir departureTime a Date si es string
    const time = typeof departureTime === 'string' ? new Date(departureTime) : new Date();

    // Determinar tipo de lugar basado en Google Places types
    let poiType = 'general';

    if (googlePlaceTypes.includes('supermarket') || googlePlaceTypes.includes('grocery_store')) {
        poiType = 'supermercado';
    } else if (googlePlaceTypes.includes('pharmacy') || googlePlaceTypes.includes('drugstore')) {
        poiType = 'farmacia';
    } else if (googlePlaceTypes.includes('bank') || googlePlaceTypes.includes('atm')) {
        poiType = 'banco';
    } else if (googlePlaceTypes.includes('restaurant') || googlePlaceTypes.includes('cafe')) {
        poiType = 'restaurant';
    } else if (googlePlaceTypes.includes('gas_station')) {
        poiType = 'gasolinera';
    }

    // Usar función de predicción existente
    return predictCrowdLevel(poiType, time);
}

function findTasksOnRoute(pois) {
    const matchingTasks = [];

    // Buscar tareas pendientes que coincidan con POIs
    const unassignedTasks = state.tasks.filter(t => !t.assignedDate);

    for (const task of unassignedTasks) {
        const taskLocation = task.location.toLowerCase();

        // Buscar POIs que coincidan con la ubicación de la tarea
        const matchingPOIs = pois.filter(poi => {
            const poiName = poi.name.toLowerCase();
            const poiType = poi.type.toLowerCase();

            return taskLocation.includes(poiType) ||
                   taskLocation.includes(poiName) ||
                   poiName.includes(taskLocation);
        });

        if (matchingPOIs.length > 0) {
            matchingTasks.push({
                task: task,
                options: matchingPOIs.slice(0, 3) // Máximo 3 opciones
            });
        }
    }

    return matchingTasks;
}

function displayRouteResults(route, pois, tasks, departureTime) {
    const resultsDiv = document.getElementById('routeResults');
    const mapDiv = document.getElementById('routeMap');
    const summaryDiv = document.getElementById('routeSummary');
    const poisDiv = document.getElementById('poisOnRoute');
    const tasksDiv = document.getElementById('tasksOnRoute');

    // Mostrar resultados
    resultsDiv.style.display = 'block';

    // Resumen de la ruta
    const distanceKm = (route.distance / 1000).toFixed(1);
    const durationMin = Math.round(route.duration / 60);

    summaryDiv.innerHTML = `
        <div class="route-summary-item">
            <span class="route-summary-label">📏 Distancia:</span>
            <span class="route-summary-value">${distanceKm} km</span>
        </div>
        <div class="route-summary-item">
            <span class="route-summary-label">⏱️ Tiempo estimado:</span>
            <span class="route-summary-value">${durationMin} min</span>
        </div>
        <div class="route-summary-item">
            <span class="route-summary-label">🚗 Modo:</span>
            <span class="route-summary-value">${getModeLabel(state.transport.mode)}</span>
        </div>
        <div class="route-summary-item">
            <span class="route-summary-label">🕐 Hora de salida:</span>
            <span class="route-summary-value">${departureTime}</span>
        </div>
    `;

    // Visualización simple del mapa
    renderSimpleMap(mapDiv, route, pois);

    // Mostrar POIs
    if (pois.length === 0) {
        poisDiv.innerHTML = '<p class="empty-state">No se encontraron lugares de interés en la ruta</p>';
    } else {
        poisDiv.innerHTML = pois.map(poi => `
            <div class="poi-item">
                <div class="poi-info">
                    <div class="poi-name">${poi.name}</div>
                    <div class="poi-details">
                        <span>📍 ${poi.type}</span>
                        <span>🔄 +${poi.detour} min desvío</span>
                    </div>
                </div>
                <div class="poi-crowd ${poi.crowdLevel}">
                    ${getCrowdLabel(poi.crowdLevel)}
                </div>
            </div>
        `).join('');
    }

    // Mostrar tareas
    if (tasks.length === 0) {
        tasksDiv.innerHTML = '<p class="empty-state">No hay tareas pendientes para hacer en esta ruta</p>';
    } else {
        tasksDiv.innerHTML = tasks.map(item => `
            <div class="route-task-item">
                <div class="route-task-header">
                    <div class="route-task-name">${item.task.name}</div>
                    <div class="route-task-detour">⏱️ ${item.task.duration}h</div>
                </div>
                <div class="route-task-options">
                    ${item.options.map(poi => `
                        <div class="route-task-option" onclick="assignTaskToLocation(${item.task.id}, '${poi.name}')">
                            <div class="route-task-option-name">${poi.name}</div>
                            <div class="route-task-option-meta">
                                <span>+${poi.detour} min</span>
                                <span class="poi-crowd ${poi.crowdLevel}">${getCrowdLabel(poi.crowdLevel)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    showNotification('Ruta calculada exitosamente', 'success');
}

function renderSimpleMap(container, route, pois) {
    // Verificar si es ruta de Google Maps (encodedPolyline) o OSRM (GeoJSON)
    let coords = [];

    if (route.isGoogleMaps && route.geometry.encodedPolyline) {
        // Para Google Maps, mostrar mensaje simple (decodificar polyline requiere librería)
        container.innerHTML = `
            <div class="map-placeholder">
                <p>🗺️ Ruta calculada con Google Maps</p>
                <p class="map-note">Vista de mapa disponible con Google Maps JavaScript API</p>
                <p class="map-note">Polyline: ${route.geometry.encodedPolyline.substring(0, 50)}...</p>
            </div>
        `;
        return;
    } else if (route.geometry.coordinates) {
        coords = route.geometry.coordinates;
    } else {
        container.innerHTML = '<p>No se pudo generar el mapa</p>';
        return;
    }

    if (coords.length === 0) {
        container.innerHTML = '<p>No se pudo generar el mapa</p>';
        return;
    }

    // Calcular bounds
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const width = 800;
    const height = 400;

    // Escalar coordenadas a SVG
    const scaleX = (lng) => ((lng - minLng) / (maxLng - minLng)) * width;
    const scaleY = (lat) => height - ((lat - minLat) / (maxLat - minLat)) * height;

    // Crear path de la ruta
    const pathData = coords.map((c, i) =>
        `${i === 0 ? 'M' : 'L'} ${scaleX(c[0])} ${scaleY(c[1])}`
    ).join(' ');

    // Generar SVG
    const svg = `
        <svg class="route-map-svg" viewBox="0 0 ${width} ${height}">
            <!-- Ruta -->
            <path d="${pathData}" class="route-path" />

            <!-- Marcador de inicio -->
            <circle cx="${scaleX(coords[0][0])}" cy="${scaleY(coords[0][1])}" r="8" class="route-marker-start" />

            <!-- Marcador de fin -->
            <circle cx="${scaleX(coords[coords.length-1][0])}" cy="${scaleY(coords[coords.length-1][1])}" r="8" class="route-marker-end" />

            <!-- POIs -->
            ${pois.map(poi => `
                <circle cx="${scaleX(poi.lng)}" cy="${scaleY(poi.lat)}" r="6" class="route-poi-marker" />
            `).join('')}
        </svg>
    `;

    container.innerHTML = svg;
}

function assignTaskToLocation(taskId, locationName) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Por ahora solo actualizamos la ubicación
    task.location = locationName;
    saveToStorage();

    showNotification(`Tarea "${task.name}" actualizada con ubicación: ${locationName}`, 'success');
    updateDashboard();
    renderTasks();
}
