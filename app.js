// ===== SEGURIDAD - PREVENCIÓN DE XSS =====
/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string} - Texto escapado y seguro para insertar en HTML
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitiza una URL para prevenir javascript: y data: URIs
 * @param {string} url - URL a sanitizar
 * @returns {string} - URL segura o cadena vacía
 */
function sanitizeUrl(url) {
    if (!url) return '';
    const lower = url.toLowerCase().trim();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
        return '';
    }
    return url;
}

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

// FullCalendar instance
let fullCalendar = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicación...');
    loadSession();
    console.log('📝 Sesión cargada:', session);

    mountNavHandlers();
    mountHelpModal();

    // Auto-login en desarrollo si está habilitado en config
    const autoLoginEnabled = window.APP_CONFIG && window.APP_CONFIG.authDemoEnabled;
    console.log('🔐 Auto-login habilitado:', autoLoginEnabled);
    console.log('🔐 Usuario autenticado:', isAuthenticated());

    if (autoLoginEnabled && !isAuthenticated()) {
        console.log('🔓 Ejecutando auto-login demo...');
        session.user = { email: 'demo@demo.com' };
        saveSession();
        console.log('✅ Auto-login completado');
    }

    if (isAuthenticated()) {
        console.log('✅ Mostrando app...');
        showApp();
        initApp();
    } else {
        console.log('⚠️ Mostrando pantalla de login...');
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
    const authView = document.getElementById('authView');
    const appView = document.getElementById('appView');

    // Forzar ocultamiento completo
    authView.style.display = 'none';
    authView.style.visibility = 'hidden';
    authView.style.opacity = '0';
    authView.style.pointerEvents = 'none';
    authView.style.zIndex = '-1';

    // Mostrar app
    appView.style.display = 'flex';
    appView.style.visibility = 'visible';
    appView.style.opacity = '1';
    appView.style.pointerEvents = 'auto';
    appView.style.zIndex = '1';

    const emailEl = document.getElementById('userEmail');
    if (emailEl && session.user) {
        emailEl.textContent = session.user.email;
    }

    console.log('🎨 Vista cambiada - authView oculto, appView visible');
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
    const overlay = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('logoutButton');
    const navItems = document.querySelectorAll('.nav-item');
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const applySidebarState = (open) => {
        if (!sidebar) return;
        const isMobile = mobileQuery.matches;
        const shouldOpen = !!open && isMobile;
        sidebar.classList.toggle('open', shouldOpen);
        document.body.classList.toggle('sidebar-open', shouldOpen);
        if (overlay) {
            overlay.hidden = !shouldOpen;
        }
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        }
    };

    const closeSidebar = () => applySidebarState(false);

    if (toggleBtn && sidebar) {
        toggleBtn.setAttribute('aria-controls', 'sidebar');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('open');
            applySidebarState(!isOpen);
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
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
            if (mobileQuery.matches) {
                closeSidebar();
            }
        });
    });

    const handleMediaChange = (e) => {
        if (!e.matches) {
            if (sidebar) {
                sidebar.classList.remove('open');
            }
            document.body.classList.remove('sidebar-open');
            if (overlay) overlay.hidden = true;
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        }
    };

    if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener('change', handleMediaChange);
    } else if (mobileQuery.addListener) {
        mobileQuery.addListener(handleMediaChange);
    }

    // Atajos de teclado
    let keyBuffer = '';
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'Escape' && mobileQuery.matches && sidebar && sidebar.classList.contains('open')) {
            e.preventDefault();
            closeSidebar();
            return;
        }

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
            <div class="task-item priority-${escapeHtml(task.priority)}">
                <div class="task-name">${escapeHtml(task.name)}</div>
                <div class="task-details">
                    <span>⏱️ ${escapeHtml(task.duration)}h</span>
                    <span>📍 ${escapeHtml(task.location)}</span>
                </div>
            </div>
        `).join('');
    }

    // Generar alertas inteligentes
    const smartAlerts = generateSmartAlerts();
    const suggestions = generateSuggestions();
    const allSuggestions = [...smartAlerts, ...suggestions];

    if (allSuggestions.length === 0) {
        suggestionsEl.innerHTML = '<p class="empty-state">No hay sugerencias disponibles</p>';
    } else {
        suggestionsEl.innerHTML = allSuggestions.slice(0, 5).map(s => {
            // Generar título basado en el tipo de sugerencia
            let title = s.title || '';
            if (!title && s.type) {
                switch(s.type) {
                    case 'proximity':
                        title = '🗺️ Tareas cercanas';
                        break;
                    case 'location-group':
                        title = '📍 Agrupar por ubicación';
                        break;
                    case 'urgent':
                        title = '⚠️ Tarea urgente';
                        break;
                    case 'deadline':
                        title = '⏰ Fecha límite próxima';
                        break;
                    default:
                        title = '💡 Sugerencia';
                }
            }

            return `
                <div class="suggestion-item ${s.priority || ''}">
                    <div class="suggestion-title">${title}</div>
                    <div class="suggestion-body">${s.reason}</div>
                </div>
            `;
        }).join('');
    }
}

// Generar alertas inteligentes basadas en datos de Google Places
function generateSmartAlerts() {
    const alerts = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinutes;

    // Revisar tareas de hoy
    const todayStr = formatDateToString(now);
    const todayTasks = state.tasks.filter(t =>
        t.assignedDate === todayStr &&
        t.status === 'active' &&
        t.placeDetails
    );

    todayTasks.forEach(task => {
        const details = task.placeDetails;

        // Alerta: Lugar cerrado
        if (details.isOpenNow === false) {
            alerts.push({
                title: `⚠️ ${escapeHtml(task.name)} - Lugar cerrado`,
                reason: `El lugar está cerrado actualmente. Revisa el horario y reprograma la tarea.`,
                priority: 'urgent'
            });
        }

        // Alerta: Cierra pronto (en las próximas 2 horas)
        if (details.isOpenNow && details.todayHours && details.todayHours.close) {
            const closeTime = parseInt(details.todayHours.close);
            const minutesUntilClose = ((Math.floor(closeTime / 100) - currentHour) * 60) +
                                      ((closeTime % 100) - currentMinutes);

            if (minutesUntilClose > 0 && minutesUntilClose <= 120) {
                const hours = Math.floor(minutesUntilClose / 60);
                const mins = minutesUntilClose % 60;
                const timeLeft = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

                alerts.push({
                    title: `⏰ ${escapeHtml(task.name)} - Cierra pronto`,
                    reason: `El lugar cierra en ${timeLeft}. Considera ir ahora o reprogramar.`,
                    priority: 'warning'
                });
            }
        }

        // Alerta: Ya pasó la hora asignada
        if (task.assignedTime) {
            const [taskHour, taskMinute] = task.assignedTime.split(':').map(Number);
            const taskTime = taskHour * 100 + taskMinute;

            if (currentTime > taskTime + 30) { // 30 minutos de margen
                alerts.push({
                    title: `📅 ${escapeHtml(task.name)} - Hora pasada`,
                    reason: `La tarea estaba programada para las ${escapeHtml(task.assignedTime)}. ¿Ya la completaste?`,
                    priority: 'info'
                });
            }
        }
    });

    // Alertas para tareas no asignadas con lugares que cierran hoy
    const unassignedWithPlace = state.tasks.filter(t =>
        !t.assignedDate &&
        t.status === 'active' &&
        t.placeDetails &&
        t.placeDetails.todayHours
    );

    unassignedWithPlace.forEach(task => {
        const details = task.placeDetails;
        if (details.todayHours && details.todayHours.close) {
            const closeTime = parseInt(details.todayHours.close);
            const closeHour = formatTime24(closeTime);

            alerts.push({
                title: `💡 ${escapeHtml(task.name)} - Disponible hoy`,
                reason: `El lugar cierra hoy a las ${closeHour}. ¿Quieres programarla para hoy?`,
                priority: 'info'
            });
        }
    });

    // Alerta: Sugerencia de optimización de ruta
    const todayTasksWithLocation = todayTasks.filter(t => t.lat && t.lng);
    if (todayTasksWithLocation.length >= 2) {
        alerts.push({
            title: `🗺️ Optimiza tu ruta de hoy`,
            reason: `Tienes ${todayTasksWithLocation.length} tareas con ubicación. Haz clic en "🚗 Optimizar hoy" en el calendario para ordenarlas por tráfico.`,
            priority: 'info'
        });
    }

    return alerts;
}

// ===== HELP MODAL =====
function mountHelpModal() {
    const modal = document.getElementById('helpModal');
    const btn = document.getElementById('helpButton');
    const closeBtn = modal?.querySelector('.close');

    if (!modal || !btn) return;

    btn.addEventListener('click', () => {
        openModal(modal, { focusSelector: '.modal-content' });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(modal);
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
            closeModal(modal);
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

function openModal(modal, options = {}) {
    if (!modal) return;
    const { focusSelector } = options;
    if (modal.classList.contains('modal')) {
        modal.classList.add('show');
    }
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modal._previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    let focusTarget = null;
    if (focusSelector) {
        focusTarget = modal.querySelector(focusSelector);
    }
    if (!focusTarget) {
        focusTarget = modal;
    }
    if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
    }
}

function closeModal(modal) {
    if (!modal) {
        console.error('❌ closeModal: modal no encontrado');
        return;
    }

    console.log('🚪 Cerrando modal:', modal.id);

    // Forzar ocultamiento completo
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';

    if (modal.classList.contains('modal')) {
        modal.classList.remove('show');
    }
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('hidden', '');

    const previousFocus = modal._previousFocus;
    if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
    }
    modal._previousFocus = null;

    console.log('✅ Modal cerrado:', modal.id);
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

    // Modal de tareas
    document.getElementById('taskModalForm').addEventListener('submit', saveTaskFromModal);

    // Calendario
    document.getElementById('prevWeek')?.addEventListener('click', () => navigateWeek(-1));
    document.getElementById('nextWeek')?.addEventListener('click', () => navigateWeek(1));

    // Botón "+ Nueva Tarea" desde calendario - abrir modal
    document.getElementById('addTaskFromCalendar')?.addEventListener('click', () => {
        openTaskModal();
    });

    // Autocompletado de direcciones
    setupAddressAutocomplete('homeAddress', 'homeAddressSuggestions', 'home');
    setupAddressAutocomplete('workAddress', 'workAddressSuggestions', 'work');
    setupAddressAutocomplete('taskLocation', 'taskLocationSuggestions', 'taskLocation');
    setupAddressAutocomplete('taskAddress', 'taskAddressSuggestions', 'task');
    setupAddressAutocomplete('modalTaskLocation', 'modalTaskLocationSuggestions', 'modalLocation');
    setupAddressAutocomplete('modalTaskAddress', 'modalTaskAddressSuggestions', 'modal');

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

    // Cerrar al hacer clic fuera - usar handler único con atributo data
    input.dataset.autocompleteId = suggestionsId;
}

// Handler global único para cerrar autocomplete al hacer clic fuera
// Se ejecuta una sola vez en lugar de 6 veces (una por campo)
if (!window._autocompleteClickHandlerRegistered) {
    window._autocompleteClickHandlerRegistered = true;
    document.addEventListener('click', (e) => {
        // Buscar todos los inputs con autocomplete activo
        document.querySelectorAll('input[data-autocomplete-id]').forEach(input => {
            const suggestionsId = input.dataset.autocompleteId;
            const suggestionsContainer = document.getElementById(suggestionsId);

            if (suggestionsContainer &&
                !input.contains(e.target) &&
                !suggestionsContainer.contains(e.target)) {
                hideSuggestions(suggestionsId);
            }
        });
    });
}

async function searchAddresses(query, suggestionsId, inputId, type) {
    const suggestionsContainer = document.getElementById(suggestionsId);

    // Mostrar indicador de carga
    suggestionsContainer.innerHTML = '<div class="autocomplete-loading">🔍 Buscando direcciones...</div>';
    suggestionsContainer.classList.add('active');

    try {
        // Usar Google Places API si está configurado
        if (window.APP_CONFIG.useGoogleMaps && window.APP_CONFIG.googleMapsFrontendKey) {
            await searchWithGooglePlaces(query, suggestionsId, inputId, type);
        } else {
            // Fallback a Nominatim
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'CalendarioInteligente/1.0'
                    }
                }
            );

            const data = await response.json();

            if (data && data.length > 0) {
                displaySuggestions(data.slice(0, 4), suggestionsId, inputId, type, 'nominatim');
            } else {
                suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">No se encontraron direcciones</div>';
            }
        }
    } catch (error) {
        console.error('Error buscando direcciones:', error);
        suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">Error al buscar direcciones</div>';
    }
}

async function searchWithGooglePlaces(query, suggestionsId, inputId, type) {
    const suggestionsContainer = document.getElementById(suggestionsId);

    if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Places API no está cargada');
        suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">Error: Google Places API no disponible</div>';
        return;
    }

    try {
        // Usar la nueva API de Places (AutocompleteSuggestion)
        // Nota: No usar includedPrimaryTypes ya que limita a máximo 5 tipos
        const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            language: 'es',
            region: 'CL', // Código de país para resultados localizados
        });

        if (suggestions && suggestions.length > 0) {
            // Convertir el formato de la nueva API al formato esperado
            const formattedSuggestions = suggestions.map(s => {
                // La nueva API tiene una estructura diferente
                let mainText = '';
                let secondaryText = '';
                let description = '';
                let placeId = '';

                // Verificar si es placePrediction (lugar) o querySuggestion (búsqueda)
                if (s.placePrediction) {
                    const prediction = s.placePrediction;
                    description = prediction.text?.text || '';

                    // Intentar obtener el texto estructurado
                    if (prediction.structuredFormat) {
                        mainText = prediction.structuredFormat.mainText?.text || prediction.text?.text || '';
                        secondaryText = prediction.structuredFormat.secondaryText?.text || '';
                    } else {
                        // Si no hay structuredFormat, usar el texto completo
                        mainText = prediction.text?.text || '';
                    }

                    placeId = prediction.placeId || '';
                } else if (s.querySuggestion) {
                    // Sugerencia de búsqueda (no es un lugar específico)
                    const query = s.querySuggestion;
                    description = query.text?.text || '';
                    mainText = query.text?.text || '';
                    secondaryText = '';
                    placeId = ''; // No hay place_id para queries
                }

                return {
                    description: description,
                    structured_formatting: {
                        main_text: mainText,
                        secondary_text: secondaryText
                    },
                    place_id: placeId
                };
            }).slice(0, 4); // Limitar a las mejores 4 opciones

            displaySuggestions(formattedSuggestions, suggestionsId, inputId, type, 'google');
        } else {
            suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">No se encontraron direcciones</div>';
        }
    } catch (error) {
        console.error('[Google Places] Error:', error);
        // Fallback a Nominatim si Google falla
        console.log('Fallback a Nominatim...');
        searchAddresses(query, suggestionsId, inputId, type);
    }
}

function displaySuggestions(suggestions, suggestionsId, inputId, type, source = 'nominatim') {
    const container = document.getElementById(suggestionsId);
    selectedSuggestionIndex[inputId] = -1;

    container.innerHTML = suggestions.map((suggestion, index) => {
        let main, detail, address, lat, lng, placeId;

        if (source === 'google') {
            // Google Places format
            address = suggestion.description;
            const parts = suggestion.structured_formatting;
            main = escapeHtml(parts.main_text);
            detail = escapeHtml(parts.secondary_text || '');
            placeId = suggestion.place_id;
            lat = '';
            lng = '';
        } else {
            // Nominatim format
            address = suggestion.display_name;
            const parts = address.split(',');
            main = escapeHtml(parts.slice(0, 2).join(','));
            detail = escapeHtml(parts.slice(2).join(','));
            lat = suggestion.lat;
            lng = suggestion.lon;
            placeId = '';
        }

        return `
            <div class="autocomplete-suggestion-item"
                 data-index="${index}"
                 data-lat="${lat}"
                 data-lng="${lng}"
                 data-address="${address}"
                 data-place-id="${placeId}"
                 data-source="${source}">
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
    const source = item.dataset.source;
    const placeId = item.dataset.placeId;

    input.value = address;

    // Si es Google Places, obtener coordenadas del place_id
    if (source === 'google' && placeId && window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ placeId: placeId }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                // Guardar coordenadas según el tipo
                if (type === 'home' || type === 'work') {
                    state.locations[type].address = address;
                    state.locations[type].lat = lat;
                    state.locations[type].lng = lng;
                    updateLocationDisplay(type);
                    saveToStorage();
                } else if (type === 'modal') {
                    // Para el modal de tareas, guardar placeId en un campo oculto
                    const hiddenPlaceId = document.getElementById('modalTaskPlaceId');
                    if (hiddenPlaceId) {
                        hiddenPlaceId.value = placeId;
                    }
                    // También guardar coordenadas temporalmente
                    input.dataset.lat = lat;
                    input.dataset.lng = lng;
                }
            }
        });
    } else {
        // Nominatim - coordenadas ya están disponibles
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);

        // Guardar coordenadas según el tipo
        if (type === 'home' || type === 'work') {
            state.locations[type].address = address;
            state.locations[type].lat = lat;
            state.locations[type].lng = lng;
            updateLocationDisplay(type);
            saveToStorage();
        } else if (type === 'modal') {
            // Para el modal, limpiar placeId ya que no es de Google
            const hiddenPlaceId = document.getElementById('modalTaskPlaceId');
            if (hiddenPlaceId) {
                hiddenPlaceId.value = '';
            }
            input.dataset.lat = lat;
            input.dataset.lng = lng;
        }
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
        lng: null,
        status: 'active'  // active, pending, archived
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

// Cargar detalles del lugar desde Google Places
async function loadPlaceDetailsForTask(task) {
    if (!task.placeId || !window.GoogleMapsAPI) return;

    try {
        console.log(`[Place Details] Cargando detalles para: ${task.name}`);
        const details = await window.GoogleMapsAPI.placeDetails(task.placeId);

        task.placeDetails = details;

        // Actualizar coordenadas si no las tiene
        if (!task.lat || !task.lng) {
            task.lat = details.lat;
            task.lng = details.lng;
        }

        saveToStorage();
        renderTasks(); // Actualizar visualización con nueva información
        updateDashboard();

        console.log(`[Place Details] ✅ Detalles cargados:`, {
            name: details.name,
            rating: details.rating,
            isOpenNow: details.isOpenNow,
            todayHours: details.todayHours
        });

    } catch (error) {
        console.error('[Place Details] Error:', error);
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

// ===== FUNCIONES DE TRÁFICO Y RUTAS =====

// Calcular tráfico para una tarea
async function calculateTrafficForTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.lat || !task.lng) {
        showNotification('La tarea no tiene ubicación definida', 'warning');
        return;
    }

    const { home } = state.locations;
    if (!home.lat || !home.lng) {
        showNotification('Configura tu ubicación de casa primero', 'warning');
        switchView('config');
        return;
    }

    showNotification('Calculando ruta con tráfico...', 'info');

    try {
        // Preparar hora de salida
        let departureTime = new Date();
        if (task.assignedDate && task.assignedTime) {
            const [day, month, year] = task.assignedDate.split('-');
            const [hour, minute] = task.assignedTime.split(':');
            departureTime = new Date(year, month - 1, day, hour, minute);
        }

        // Llamar a la API de tráfico (backend)
        const trafficData = await window.GoogleMapsAPI.trafficMatrix(
            [{ lat: home.lat, lng: home.lng }],
            [{ lat: task.lat, lng: task.lng }],
            departureTime.toISOString(),
            'driving',
            'best_guess'
        );

        if (trafficData && trafficData.rows && trafficData.rows[0].elements[0].status === 'OK') {
            const element = trafficData.rows[0].elements[0];
            const durationText = element.duration.text;
            const durationInTrafficText = element.duration_in_traffic?.text || durationText;
            const distance = element.distance.text;

            // Guardar información de tráfico en la tarea
            task.trafficInfo = {
                distance: distance,
                durationNormal: durationText,
                durationWithTraffic: durationInTrafficText,
                lastUpdated: new Date().toISOString()
            };

            saveToStorage();
            renderTasks();

            // Mostrar resultado
            const trafficDiff = element.duration_in_traffic ?
                element.duration_in_traffic.value - element.duration.value : 0;
            const extraMinutes = Math.round(trafficDiff / 60);

            let message = `🚗 Ruta a ${task.name}:\n\n`;
            message += `📏 Distancia: ${distance}\n`;
            message += `⏱️ Tiempo sin tráfico: ${durationText}\n`;
            message += `🚦 Tiempo CON tráfico: ${durationInTrafficText}`;

            if (extraMinutes > 0) {
                message += `\n\n⚠️ El tráfico añade ${extraMinutes} minutos`;
            } else if (extraMinutes === 0) {
                message += `\n\n✅ No hay retrasos por tráfico`;
            }

            alert(message);

        } else {
            throw new Error('No se pudo calcular la ruta');
        }

    } catch (error) {
        console.error('[Traffic] Error:', error);
        showNotification('Error al calcular tráfico: ' + error.message, 'error');
    }
}

// Buscar lugares en la ruta entre dos tareas
async function findPlacesInRoute(task1Id, task2Id, placeType = 'supermercado') {
    const task1 = state.tasks.find(t => t.id === task1Id);
    const task2 = state.tasks.find(t => t.id === task2Id);

    if (!task1 || !task2 || !task1.lat || !task2.lat) {
        showNotification('Las tareas necesitan ubicación', 'warning');
        return;
    }

    showNotification(`Buscando ${placeType} en la ruta...`, 'info');

    try {
        // 1. Calcular ruta
        const routeData = await window.GoogleMapsAPI.computeRoutes(
            { lat: task1.lat, lng: task1.lng },
            { lat: task2.lat, lng: task2.lng },
            'DRIVE',
            false
        );

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error('No se encontró ruta');
        }

        const route = routeData.routes[0];
        const polyline = route.polyline?.encodedPolyline;

        if (!polyline) {
            throw new Error('No se pudo obtener la ruta');
        }

        // 2. Buscar lugares a lo largo de la ruta
        const placesData = await window.GoogleMapsAPI.placesAlongRoute(
            polyline,
            placeType,
            { lat: task1.lat, lng: task1.lng },
            10
        );

        if (!placesData.places || placesData.places.length === 0) {
            showNotification(`No se encontraron ${placeType} en la ruta`, 'info');
            return [];
        }

        // 3. Mostrar resultados
        const places = placesData.places.map(p => window.GoogleMapsAPI.parsePlace(p));

        let message = `📍 Encontrados ${places.length} ${placeType} en tu ruta:\n\n`;
        places.slice(0, 5).forEach((place, i) => {
            message += `${i + 1}. ${place.name}\n`;
            if (place.rating) message += `   ⭐ ${place.rating}\n`;
        });

        alert(message);
        return places;

    } catch (error) {
        console.error('[Places Along Route] Error:', error);
        showNotification('Error buscando lugares: ' + error.message, 'error');
        return [];
    }
}

// Optimizar orden de tareas del día con tráfico
async function optimizeDayRoute(dateStr) {
    const dayTasks = state.tasks.filter(t =>
        t.assignedDate === dateStr &&
        t.status === 'active' &&
        t.lat &&
        t.lng
    );

    if (dayTasks.length < 2) {
        showNotification('Necesitas al menos 2 tareas con ubicación', 'info');
        return;
    }

    showNotification('Optimizando ruta del día...', 'info');

    const { home } = state.locations;
    if (!home.lat || !home.lng) {
        showNotification('Configura tu ubicación de casa primero', 'warning');
        return;
    }

    try {
        // Calcular matriz de distancias con tráfico
        const origins = [{ lat: home.lat, lng: home.lng }, ...dayTasks.map(t => ({ lat: t.lat, lng: t.lng }))];
        const destinations = dayTasks.map(t => ({ lat: t.lat, lng: t.lng }));

        const matrixData = await window.GoogleMapsAPI.trafficMatrix(
            origins,
            destinations,
            new Date().toISOString(),
            'driving',
            'best_guess'
        );

        // Algoritmo simple: vecino más cercano
        const visited = new Set();
        const optimizedOrder = [];
        let currentPos = 0; // Empezar desde casa

        while (optimizedOrder.length < dayTasks.length) {
            let minDuration = Infinity;
            let nextTaskIndex = -1;

            dayTasks.forEach((task, index) => {
                if (visited.has(index)) return;

                const duration = matrixData.rows[currentPos].elements[index].duration_in_traffic?.value ||
                               matrixData.rows[currentPos].elements[index].duration.value;

                if (duration < minDuration) {
                    minDuration = duration;
                    nextTaskIndex = index;
                }
            });

            if (nextTaskIndex === -1) break;

            visited.add(nextTaskIndex);
            optimizedOrder.push(dayTasks[nextTaskIndex]);
            currentPos = nextTaskIndex + 1; // +1 porque origins incluye home
        }

        // Reasignar horarios
        let currentTime = new Date(dateStr);
        currentTime.setHours(9, 0, 0, 0); // Empezar a las 9 AM

        optimizedOrder.forEach(task => {
            task.assignedTime = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
            currentTime.setMinutes(currentTime.getMinutes() + (task.duration * 60) + 15); // +15 min de viaje
        });

        saveToStorage();
        renderCalendar();
        renderTasks();

        showNotification(`✅ Ruta optimizada: ${optimizedOrder.length} tareas reorganizadas`, 'success');

    } catch (error) {
        console.error('[Optimize Route] Error:', error);
        showNotification('Error optimizando ruta: ' + error.message, 'error');
    }
}

// Optimizar ruta de hoy
function optimizeTodayRoute() {
    const today = formatDateToString(new Date());
    optimizeDayRoute(today);
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
        const suggestionsContainer = document.getElementById('suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '<div class="empty-state">No hay tareas pendientes de asignar</div>';
        }
        return [];
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
    // Filtrar tareas activas y pendientes (no archivadas)
    const activeTasks = state.tasks.filter(t => t.status !== 'archived');
    const archivedTasks = state.tasks.filter(t => t.status === 'archived');

    const unassigned = activeTasks.filter(t => !t.assignedDate);
    const unassignedContainer = document.getElementById('unassignedTasks');

    if (unassigned.length === 0) {
        unassignedContainer.innerHTML = '<div class="empty-state">Todas las tareas activas están asignadas</div>';
    } else {
        unassignedContainer.innerHTML = unassigned.map(task => createTaskCard(task)).join('');
    }

    const allTasksContainer = document.getElementById('allTasks');

    if (activeTasks.length === 0) {
        allTasksContainer.innerHTML = '<div class="empty-state">No hay tareas activas</div>';
    } else {
        const sortedTasks = [...activeTasks].sort((a, b) => {
            const priorityOrder = { urgente: 0, alta: 1, media: 2, baja: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        allTasksContainer.innerHTML = sortedTasks.map(task => createTaskCard(task, true)).join('');
    }

    // Mostrar contador de tareas archivadas
    const archivedInfo = document.getElementById('archivedInfo');
    if (archivedInfo) {
        if (archivedTasks.length > 0) {
            archivedInfo.innerHTML = `
                <div class="archived-banner" onclick="toggleArchivedTasks()">
                    📦 Tienes ${archivedTasks.length} tarea(s) archivada(s). <span class="link">Click para ver</span>
                </div>
                <div id="archivedTasksList" style="display: none; margin-top: 12px;">
                    ${archivedTasks.map(task => createTaskCard(task, true)).join('')}
                </div>
            `;
        } else {
            archivedInfo.innerHTML = '';
        }
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

    // Información de Google Places
    const placeInfoText = getPlaceInfoHTML(task);

    // Información de tráfico
    const trafficInfoText = getTrafficInfoHTML(task);

    // Estado de la tarea
    const statusIcons = {
        active: '✅',
        pending: '⏸️',
        archived: '📦'
    };
    const statusLabels = {
        active: 'Activa',
        pending: 'Pendiente',
        archived: 'Archivada'
    };
    const statusIcon = statusIcons[task.status] || '✅';
    const statusLabel = statusLabels[task.status] || 'Activa';
    const statusText = `<div>${statusIcon} Estado: ${statusLabel}</div>`;

    const priorityClass = `priority-${task.priority}`;

    return `
        <div class="task-item ${priorityClass} ${task.status === 'archived' ? 'task-archived' : ''}" onclick="openTaskModal(${task.id})">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.name)}</div>
                <div class="task-priority ${priorityClass}">${escapeHtml(task.priority)}</div>
            </div>
            <div class="task-details">
                <div>⏱️ Duración: ${escapeHtml(task.duration)} hora(s)</div>
                <div>📍 Ubicación: ${escapeHtml(task.location)}</div>
                ${addressText}
                ${placeInfoText}
                ${trafficInfoText}
                ${distanceText}
                ${windowText}
                ${deadlineText}
                ${assignedText}
                ${statusText}
            </div>
            <div class="task-actions" onclick="event.stopPropagation()">
                ${!task.assignedDate && task.status !== 'archived' ? `
                    <button class="btn btn-success" onclick="suggestDayForTask(${task.id})">💡 Sugerir día</button>
                    <button class="btn btn-primary" onclick="assignTaskPrompt(${task.id})">📅 Asignar a día</button>
                ` : ''}
                ${task.assignedDate && task.status !== 'archived' ? `
                    <button class="btn btn-secondary" onclick="unassignTask(${task.id})">🔄 Desasignar</button>
                ` : ''}
                ${task.lat && task.lng && task.assignedDate ? `
                    <button class="btn btn-info" onclick="calculateTrafficForTask(${task.id})">🚗 Ver tráfico</button>
                ` : ''}
                <button class="btn btn-primary" onclick="openTaskModal(${task.id})">✏️ Editar</button>
            </div>
        </div>
    `;
}

// Generar HTML con información del lugar de Google Places
function getPlaceInfoHTML(task) {
    if (!task.placeDetails) return '';

    const details = task.placeDetails;
    let html = '<div class="place-info-section" style="border-left: 3px solid var(--brand); padding-left: 8px; margin: 8px 0;">';

    // Estado: Abierto/Cerrado
    if (details.isOpenNow !== null && details.isOpenNow !== undefined) {
        const openStatus = details.isOpenNow ? '🟢 Abierto ahora' : '🔴 Cerrado';
        const statusColor = details.isOpenNow ? '#22c55e' : '#ef4444';
        html += `<div style="color: ${statusColor}; font-weight: bold;">${openStatus}</div>`;
    }

    // Horario de hoy
    if (details.todayHours) {
        const open = formatTime24(details.todayHours.open);
        const close = formatTime24(details.todayHours.close);
        html += `<div>🕐 Horario hoy: ${open} - ${close}</div>`;
    }

    // Calificación
    if (details.rating) {
        const stars = '⭐'.repeat(Math.round(details.rating));
        html += `<div>${stars} ${escapeHtml(details.rating)} (${escapeHtml(details.ratingCount)} reseñas)</div>`;
    }

    // Nivel de precio
    if (details.priceLevel !== null && details.priceLevel !== undefined) {
        const price = '$'.repeat(details.priceLevel + 1);
        html += `<div>💰 Precio: ${escapeHtml(price)}</div>`;
    }

    // Teléfono
    if (details.phone) {
        html += `<div>📞 ${escapeHtml(details.phone)}</div>`;
    }

    html += '</div>';
    return html;
}

// Formatear hora de 4 dígitos (ej: "1430") a "14:30"
function formatTime24(time) {
    if (!time) return '';
    const str = String(time).padStart(4, '0');
    return `${str.substring(0, 2)}:${str.substring(2, 4)}`;
}

// Generar HTML con información de tráfico
function getTrafficInfoHTML(task) {
    if (!task.trafficInfo) return '';

    const traffic = task.trafficInfo;
    const isRecent = (new Date() - new Date(traffic.lastUpdated)) < 30 * 60 * 1000; // 30 minutos

    let html = '<div class="traffic-info-section" style="border-left: 3px solid #3b82f6; padding-left: 8px; margin: 8px 0;">';

    html += `<div style="font-weight: bold; color: #3b82f6;">🚗 Información de Tráfico ${isRecent ? '' : '(⚠️ desactualizada)'}</div>`;
    html += `<div>📏 Distancia: ${traffic.distance}</div>`;
    html += `<div>⏱️ Sin tráfico: ${traffic.durationNormal}</div>`;

    if (traffic.durationWithTraffic !== traffic.durationNormal) {
        html += `<div style="color: #f59e0b; font-weight: bold;">🚦 CON tráfico: ${traffic.durationWithTraffic}</div>`;
    } else {
        html += `<div style="color: #22c55e;">✅ Sin demoras por tráfico</div>`;
    }

    html += '</div>';
    return html;
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

// Renderizar calendario con FullCalendar
function renderCalendar() {
    // Si FullCalendar no está disponible aún, esperar
    if (!window.FullCalendar) {
        console.warn('FullCalendar aún no está cargado, esperando...');
        setTimeout(renderCalendar, 500);
        return;
    }

    // Si ya existe una instancia, solo actualizarla
    if (fullCalendar) {
        updateFullCalendarEvents();
        return;
    }

    // Inicializar FullCalendar
    const calendarEl = document.getElementById('fullcalendar');
    if (!calendarEl) {
        console.error('Elemento #fullcalendar no encontrado');
        return;
    }

    try {
        fullCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            slotMinTime: '06:00:00',
            slotMaxTime: '23:00:00',
            allDaySlot: true,
            nowIndicator: true,
            navLinks: true,
            selectable: true,
            selectMirror: true,
            editable: true,
            dayMaxEvents: true,
            height: 'auto',

            // Cuando se selecciona un rango de tiempo
            select: function(info) {
                const dateStr = formatDateToString(info.start);
                const timeStr = `${String(info.start.getHours()).padStart(2, '0')}:${String(info.start.getMinutes()).padStart(2, '0')}`;

                openTaskModal(null, {
                    date: dateStr,
                    time: info.allDay ? null : timeStr
                });

                fullCalendar.unselect();
            },

            // Cuando se hace click en un evento
            eventClick: function(info) {
                if (info.event.id.startsWith('task-')) {
                    const taskId = info.event.extendedProps.taskId;
                    openTaskModal(taskId);
                } else if (info.event.id.startsWith('work-')) {
                    showNotification('Bloque de trabajo - No editable', 'info');
                }
            },

            // Cuando se mueve un evento
            eventDrop: function(info) {
                updateTaskDateTime(info.event, info.event.start, info.event.end);
            },

            // Cuando se redimensiona un evento
            eventResize: function(info) {
                updateTaskDateTime(info.event, info.event.start, info.event.end);
            },

            events: getFullCalendarEvents()
        });

        fullCalendar.render();
        console.log('FullCalendar inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar FullCalendar:', error);
        showNotification('Error al cargar el calendario', 'error');
    }
}

// Convertir tareas a eventos de FullCalendar
function getFullCalendarEvents() {
    const events = [];

    const { start: workRangeStart, end: workRangeEnd } = getWorkBlockRange();
    events.push(...generateWorkBlockEvents(workRangeStart, workRangeEnd));

    // Agregar tareas asignadas (solo activas y pendientes, no archivadas)
    state.tasks.forEach(task => {
        // Filtrar tareas archivadas
        if (task.status === 'archived') return;

        if (task.assignedDate && task.assignedTime) {
            const [day, month, year] = task.assignedDate.split('-');
            const [hour, minute] = task.assignedTime.split(':');

            const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day),
                                      parseInt(hour), parseInt(minute));
            const endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + Math.floor(task.duration));
            endDate.setMinutes(startDate.getMinutes() + ((task.duration % 1) * 60));

            // Agregar indicador de estado si es pendiente
            const statusIcon = task.status === 'pending' ? '⏸️ ' : '';

            events.push({
                id: `task-${task.id}`,
                title: `${statusIcon}${task.name}`,
                start: startDate,
                end: endDate,
                classNames: [`priority-${task.priority}`, task.status === 'pending' ? 'task-pending' : ''],
                extendedProps: {
                    taskId: task.id,
                    location: task.location,
                    priority: task.priority,
                    status: task.status
                }
            });
        }
    });

    return events;
}

function getWorkBlockRange() {
    if (fullCalendar && fullCalendar.view) {
        return {
            start: new Date(fullCalendar.view.currentStart),
            end: new Date(fullCalendar.view.currentEnd)
        };
    }

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    return { start, end };
}

function generateWorkBlockEvents(rangeStart, rangeEnd) {
    const events = [];
    const [startHour, startMin] = state.workSchedule.start.split(':');
    const [endHour, endMin] = state.workSchedule.end.split(':');

    const start = startOfDay(rangeStart);
    const end = startOfDay(rangeEnd);

    for (let current = new Date(start.getTime()); current < end; current.setDate(current.getDate() + 1)) {
        if (current.getDay() < 1 || current.getDay() > 5) {
            continue;
        }

        const dateStr = formatDateToString(current);

        const startDate = new Date(current.getTime());
        startDate.setHours(parseInt(startHour, 10), parseInt(startMin, 10), 0, 0);

        const endDate = new Date(current.getTime());
        endDate.setHours(parseInt(endHour, 10), parseInt(endMin, 10), 0, 0);

        events.push({
            id: `work-${dateStr}`,
            title: '💼 Trabajo',
            start: startDate,
            end: endDate,
            classNames: ['work-block'],
            editable: false,
            backgroundColor: '#334155',
            borderColor: '#475569'
        });
    }

    return events;
}

function startOfDay(date) {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return day;
}

// Actualizar eventos del calendario
function updateFullCalendarEvents() {
    if (!fullCalendar) return;

    const events = getFullCalendarEvents();
    fullCalendar.removeAllEvents();
    fullCalendar.addEventSource(events);
}

// Actualizar fecha/hora de una tarea cuando se mueve en el calendario
function updateTaskDateTime(event, newStart, newEnd) {
    if (!event.id.startsWith('task-')) return;

    const taskId = event.extendedProps.taskId;
    const task = state.tasks.find(t => t.id === taskId);

    if (!task) return;

    // Actualizar fecha y hora
    task.assignedDate = formatDateToString(newStart);
    task.assignedTime = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`;

    // Calcular nueva duración basada en el rango
    const durationMs = newEnd - newStart;
    task.duration = durationMs / (1000 * 60 * 60); // Convertir a horas

    saveToStorage();
    showNotification(`Tarea "${task.name}" movida a ${task.assignedDate} ${task.assignedTime}`, 'success');
}

// Funciones showEventDetails y showAddTaskModal removidas - ahora se usa openTaskModal()

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
    if (!date) return '';
    if (typeof date === 'string') {
        date = new Date(date);
    }
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', date);
        return 'Fecha inválida';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Formato DD-MM-YYYY abreviado con día de semana
function formatDateShort(date) {
    if (!date) return '';
    if (typeof date === 'string') {
        date = new Date(date);
    }
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', date);
        return 'Fecha inválida';
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
    return `${day}-${month}-${year}`;
}

// Convertir DD-MM-YYYY a YYYY-MM-DD para input type="date"
function convertToDateInputFormat(dateStr) {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
}

// Convertir YYYY-MM-DD a DD-MM-YYYY
function convertFromDateInputFormat(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}

// Normalizar tiempo a formato HH:MM (24 horas)
function normalizeTimeFormat(timeStr) {
    if (!timeStr) return '';

    // Eliminar espacios
    timeStr = timeStr.trim();

    // Si ya está en formato correcto HH:MM
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr;
    }

    // Si tiene formato H:MM (sin cero inicial)
    if (/^\d{1}:\d{2}$/.test(timeStr)) {
        const [hour, minute] = timeStr.split(':');
        return `${hour.padStart(2, '0')}:${minute}`;
    }

    // Si tiene AM/PM
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (match) {
        let hour = parseInt(match[1]);
        const minute = match[2];
        const period = match[3].toLowerCase();

        if (period === 'pm' && hour !== 12) {
            hour += 12;
        } else if (period === 'am' && hour === 12) {
            hour = 0;
        }

        return `${String(hour).padStart(2, '0')}:${minute}`;
    }

    // Intentar parsear como número (ej: 1230 -> 12:30)
    const numMatch = timeStr.match(/^(\d{1,2})(\d{2})$/);
    if (numMatch) {
        return `${numMatch[1].padStart(2, '0')}:${numMatch[2]}`;
    }

    return timeStr;
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
                    <div class="poi-name">${escapeHtml(poi.name)}</div>
                    <div class="poi-details">
                        <span>📍 ${escapeHtml(poi.type)}</span>
                        <span>🔄 +${escapeHtml(poi.detour)} min desvío</span>
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
                    <div class="route-task-name">${escapeHtml(item.task.name)}</div>
                    <div class="route-task-detour">⏱️ ${escapeHtml(item.task.duration)}h</div>
                </div>
                <div class="route-task-options">
                    ${item.options.map(poi => `
                        <div class="route-task-option" onclick="assignTaskToLocation(${item.task.id}, '${escapeHtml(poi.name).replace(/'/g, '&#39;')}')">
                            <div class="route-task-option-name">${escapeHtml(poi.name)}</div>
                            <div class="route-task-option-meta">
                                <span>+${escapeHtml(poi.detour)} min</span>
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

// ===== MODAL FLOTANTE PARA TAREAS =====

function openTaskModal(taskId = null, prefilledData = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskModalForm');
    const title = document.getElementById('taskModalTitle');
    const btnDelete = document.getElementById('btnDeleteTask');
    const btnArchive = document.getElementById('btnArchiveTask');

    // Resetear formulario
    form.reset();
    document.getElementById('modalTaskId').value = '';
    document.getElementById('modalTaskPriority').value = 'media';
    document.getElementById('modalTaskStatus').value = 'active';
    document.getElementById('modalTaskDuration').value = '1';

    if (taskId) {
        // Modo edición
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) {
            showNotification('Tarea no encontrada', 'error');
            return;
        }

        title.textContent = '✏️ Editar Tarea';
        document.getElementById('modalTaskId').value = task.id;
        document.getElementById('modalTaskName').value = task.name;
        document.getElementById('modalTaskDuration').value = task.duration;
        document.getElementById('modalTaskLocation').value = task.location;
        document.getElementById('modalTaskAddress').value = task.address || '';
        document.getElementById('modalTaskPriority').value = task.priority;
        document.getElementById('modalTaskStatus').value = task.status || 'active';

        if (task.assignedDate) {
            document.getElementById('modalTaskDate').value = convertToDateInputFormat(task.assignedDate);
        }
        if (task.assignedTime) {
            document.getElementById('modalTaskTime').value = normalizeTimeFormat(task.assignedTime);
        }
        if (task.deadline) {
            document.getElementById('modalTaskDeadline').value = convertToDateInputFormat(task.deadline);
        }

        btnDelete.style.display = 'block';
        btnArchive.style.display = 'block';
    } else {
        // Modo creación
        title.textContent = '➕ Nueva Tarea';
        btnDelete.style.display = 'none';
        btnArchive.style.display = 'none';

        // Pre-rellenar si hay datos
        if (prefilledData) {
            if (prefilledData.date) {
                document.getElementById('modalTaskDate').value = convertToDateInputFormat(prefilledData.date);
            }
            if (prefilledData.time) {
                document.getElementById('modalTaskTime').value = normalizeTimeFormat(prefilledData.time);
            }
        }
    }

    openModal(modal, { focusSelector: '#modalTaskName' });
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    closeModal(modal);
}

function saveTaskFromModal(e) {
    e.preventDefault();

    const taskId = document.getElementById('modalTaskId').value;
    const name = document.getElementById('modalTaskName').value;
    const duration = parseFloat(document.getElementById('modalTaskDuration').value);
    const location = document.getElementById('modalTaskLocation').value;
    const address = document.getElementById('modalTaskAddress').value || null;
    const placeId = document.getElementById('modalTaskPlaceId').value || null;
    const priority = document.getElementById('modalTaskPriority').value;
    const status = document.getElementById('modalTaskStatus').value;
    const dateInput = document.getElementById('modalTaskDate').value;
    const timeInput = document.getElementById('modalTaskTime').value;
    const deadlineInput = document.getElementById('modalTaskDeadline').value;

    // Obtener coordenadas del input si están disponibles
    const addressInput = document.getElementById('modalTaskAddress');
    const lat = addressInput.dataset.lat ? parseFloat(addressInput.dataset.lat) : null;
    const lng = addressInput.dataset.lng ? parseFloat(addressInput.dataset.lng) : null;

    // Validar y convertir fecha si se proporcionó (viene en formato YYYY-MM-DD del input type="date")
    let assignedDate = null;
    if (dateInput) {
        assignedDate = convertFromDateInputFormat(dateInput);
    }

    // Validar y convertir deadline si se proporcionó
    let deadline = null;
    if (deadlineInput) {
        deadline = convertFromDateInputFormat(deadlineInput);
    }

    if (taskId) {
        // Editar tarea existente
        const task = state.tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            task.name = name;
            task.duration = duration;
            task.location = location;
            task.address = address;
            task.priority = priority;
            task.status = status;
            task.assignedDate = assignedDate;
            task.assignedTime = normalizeTimeFormat(timeInput) || null;
            task.deadline = deadline;
            task.placeId = placeId;

            // Actualizar coordenadas si están disponibles
            if (lat && lng) {
                task.lat = lat;
                task.lng = lng;
            }

            // Si cambió la dirección, re-geocodificar
            if (address && address !== task.address && !placeId) {
                geocodeTaskAddress(task);
            }

            // Si tiene placeId, cargar detalles del lugar
            if (placeId && window.GoogleMapsAPI) {
                loadPlaceDetailsForTask(task);
            }

            showNotification(`Tarea "${name}" actualizada`, 'success');
        }
    } else {
        // Crear nueva tarea
        const task = {
            id: Date.now(),
            name,
            duration,
            location,
            address,
            priority,
            deadline,
            windowStart: null,
            windowEnd: null,
            assignedDate,
            assignedTime: normalizeTimeFormat(timeInput) || null,
            lat: lat,
            lng: lng,
            placeId: placeId,
            status,
            placeDetails: null // Se llenará si hay placeId
        };

        // Si tiene placeId de Google, cargar detalles del lugar
        if (placeId && window.GoogleMapsAPI) {
            loadPlaceDetailsForTask(task);
        } else if (address && !lat && !lng) {
            // Geocodificar si se proporcionó dirección pero no hay coordenadas
            geocodeTaskAddress(task);
        }

        state.tasks.push(task);
        showNotification(`Tarea "${name}" creada`, 'success');
    }

    saveToStorage();
    renderCalendar();
    renderTasks();
    generateSuggestions();
    updateDashboard();
    closeTaskModal();
}

function deleteTaskFromModal() {
    const taskId = document.getElementById('modalTaskId').value;
    if (!taskId) return;

    const task = state.tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;

    const confirmed = confirm(`¿Estás seguro de eliminar la tarea "${task.name}"?`);
    if (!confirmed) return;

    state.tasks = state.tasks.filter(t => t.id !== parseInt(taskId));
    saveToStorage();
    renderCalendar();
    renderTasks();
    generateSuggestions();
    updateDashboard();
    closeTaskModal();

    showNotification(`Tarea "${task.name}" eliminada`, 'success');
}

function archiveTaskFromModal() {
    const taskId = document.getElementById('modalTaskId').value;
    if (!taskId) return;

    const task = state.tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;

    task.status = 'archived';

    // Si estaba asignada, guardar la fecha donde se archivó
    if (!task.assignedDate) {
        task.assignedDate = formatDateToString(new Date());
    }

    saveToStorage();
    renderCalendar();
    renderTasks();
    generateSuggestions();
    updateDashboard();
    closeTaskModal();

    showNotification(`Tarea "${task.name}" archivada`, 'success');
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('taskModal');
        if (modal && !modal.hasAttribute('hidden')) {
            closeTaskModal();
        }
    }
});

// Cerrar modal al hacer click fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('taskModal');
    if (modal && e.target === modal && !modal.hasAttribute('hidden')) {
        closeTaskModal();
    }
});

// Toggle tareas archivadas
function toggleArchivedTasks() {
    const list = document.getElementById('archivedTasksList');
    if (list) {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
    }
}

// ============================================
// ROUTE RECOMMENDATIONS SYSTEM
// ============================================

let currentSelectedRoute = null;
let currentTransportMode = null;
let currentRouteDetails = null;

/**
 * Muestra las recomendaciones de rutas para hoy
 */
async function showRouteRecommendations() {
    const modal = document.getElementById('routeRecommendationsModal');
    const listContainer = document.getElementById('routeRecommendationsList');

    openModal(modal, { focusSelector: '.modal-header h2' });
    listContainer.innerHTML = '<div class="loading-message"><p>⏳ Generando recomendaciones de rutas...</p></div>';

    try {
        // Obtener tareas de hoy
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = state.tasks.filter(task => {
            if (task.archived || task.completed) return false;

            // Si tiene fecha, debe ser hoy
            if (task.date) {
                return task.date === today;
            }

            // Si tiene deadline, debe ser hoy o anterior
            if (task.deadline) {
                return task.deadline <= today;
            }

            return false;
        });

        if (todayTasks.length === 0) {
            listContainer.innerHTML = `
                <div class="loading-message">
                    <p>📅 No hay tareas pendientes para hoy</p>
                    <p style="font-size: 0.9em; margin-top: 8px;">Agrega tareas con fecha de hoy para ver recomendaciones de rutas</p>
                </div>
            `;
            return;
        }

        // Filtrar tareas que tienen ubicación
        const tasksWithLocation = todayTasks.filter(task => task.location && task.location.trim() !== '');

        if (tasksWithLocation.length === 0) {
            listContainer.innerHTML = `
                <div class="loading-message">
                    <p>📍 No hay tareas con ubicación para hoy</p>
                    <p style="font-size: 0.9em; margin-top: 8px;">Agrega ubicaciones a tus tareas para recibir recomendaciones de rutas</p>
                </div>
            `;
            return;
        }

        // Generar recomendaciones de rutas
        const routes = await generateRouteRecommendations(tasksWithLocation);

        if (routes.length === 0) {
            listContainer.innerHTML = `
                <div class="loading-message">
                    <p>🤷 No se pudieron generar rutas</p>
                    <p style="font-size: 0.9em; margin-top: 8px;">Verifica que las ubicaciones sean válidas</p>
                </div>
            `;
            return;
        }

        // Mostrar recomendaciones
        displayRouteRecommendations(routes, tasksWithLocation);

    } catch (error) {
        console.error('Error generando recomendaciones:', error);
        listContainer.innerHTML = `
            <div class="loading-message">
                <p>❌ Error al generar recomendaciones</p>
                <p style="font-size: 0.9em; margin-top: 8px;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Genera recomendaciones de rutas basadas en las tareas
 */
async function generateRouteRecommendations(tasks) {
    const routes = [];

    // Ruta 1: Orden por prioridad
    const priorityRoute = {
        id: 'priority',
        name: 'Ruta por Prioridad',
        description: 'Completa primero las tareas más importantes',
        tasks: [...tasks].sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }),
        score: 85
    };
    routes.push(priorityRoute);

    // Ruta 2: Orden cronológico (por hora de inicio si existe)
    const tasksWithTime = tasks.filter(t => t.startTime);
    if (tasksWithTime.length > 0) {
        const chronoRoute = {
            id: 'chronological',
            name: 'Ruta Cronológica',
            description: 'Sigue el orden de tus horarios programados',
            tasks: [...tasks].sort((a, b) => {
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
            }),
            score: 90
        };
        routes.push(chronoRoute);
    }

    // Ruta 3: Orden por cercanía (simple - sin APIs)
    // Agrupar tareas por palabras clave de ubicación
    const proximityRoute = {
        id: 'proximity',
        name: 'Ruta Optimizada por Cercanía',
        description: 'Agrupa tareas cercanas para minimizar desplazamientos',
        tasks: groupTasksByProximity(tasks),
        score: 95
    };
    routes.push(proximityRoute);

    // Ruta 4: Balance (prioridad + tiempo)
    const balancedRoute = {
        id: 'balanced',
        name: 'Ruta Balanceada',
        description: 'Equilibrio entre prioridad, tiempo y ubicación',
        tasks: [...tasks].sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 0;
            const bPriority = priorityOrder[b.priority] || 0;

            // Si tienen diferente prioridad, ordenar por prioridad
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            // Si tienen misma prioridad, ordenar por tiempo
            if (a.startTime && b.startTime) {
                return a.startTime.localeCompare(b.startTime);
            }

            return 0;
        }),
        score: 88
    };
    routes.push(balancedRoute);

    return routes;
}

/**
 * Agrupa tareas por cercanía basándose en palabras clave de ubicación
 */
function groupTasksByProximity(tasks) {
    // Clonar tareas
    const tasksCopy = [...tasks];
    const grouped = [];
    const used = new Set();

    // Extraer palabras clave de ubicaciones
    const getLocationKeywords = (location) => {
        if (!location) return [];
        return location.toLowerCase()
            .split(/[\s,.-]+/)
            .filter(word => word.length > 3);
    };

    // Para cada tarea, buscar tareas cercanas
    for (let i = 0; i < tasksCopy.length; i++) {
        if (used.has(i)) continue;

        const task = tasksCopy[i];
        grouped.push(task);
        used.add(i);

        const keywords = getLocationKeywords(task.location);

        // Buscar tareas con ubicaciones similares
        for (let j = i + 1; j < tasksCopy.length; j++) {
            if (used.has(j)) continue;

            const otherTask = tasksCopy[j];
            const otherKeywords = getLocationKeywords(otherTask.location);

            // Verificar si comparten palabras clave
            const sharedKeywords = keywords.filter(k => otherKeywords.includes(k));

            if (sharedKeywords.length > 0) {
                grouped.push(otherTask);
                used.add(j);
            }
        }
    }

    return grouped;
}

/**
 * Muestra las recomendaciones de rutas en el modal
 */
function displayRouteRecommendations(routes, allTasks) {
    const listContainer = document.getElementById('routeRecommendationsList');

    listContainer.innerHTML = routes.map(route => {
        const totalTasks = route.tasks.length;
        const estimatedTime = totalTasks * 45; // 45 min por tarea aprox
        const estimatedDistance = totalTasks * 3; // 3 km por tarea aprox

        return `
            <div class="route-recommendation-card" onclick="selectRouteRecommendation('${route.id}')">
                <div class="route-card-header">
                    <h3 class="route-card-title">${route.name}</h3>
                    <div class="route-card-score">${route.score}/100</div>
                </div>

                <p style="color: var(--text-secondary); margin-bottom: 16px;">${route.description}</p>

                <div class="route-card-stats">
                    <div class="route-stat">
                        <span class="route-stat-icon">📍</span>
                        <span><span class="route-stat-value">${totalTasks}</span> paradas</span>
                    </div>
                    <div class="route-stat">
                        <span class="route-stat-icon">⏱️</span>
                        <span><span class="route-stat-value">~${Math.floor(estimatedTime / 60)}h ${estimatedTime % 60}m</span></span>
                    </div>
                    <div class="route-stat">
                        <span class="route-stat-icon">🛣️</span>
                        <span><span class="route-stat-value">~${estimatedDistance} km</span></span>
                    </div>
                </div>

                <div class="route-card-tasks">
                    <div class="route-card-tasks-title">🗺️ Orden de tareas:</div>
                    <div class="route-card-task-list">
                        ${route.tasks.slice(0, 4).map((task, idx) => `
                            <div class="route-card-task">
                                <span class="route-card-task-time">${idx + 1}.</span>
                                <span class="route-card-task-arrow">→</span>
                                <span>${task.title}</span>
                            </div>
                        `).join('')}
                        ${route.tasks.length > 4 ? `
                            <div class="route-card-task" style="font-style: italic; color: var(--text-secondary);">
                                <span>+ ${route.tasks.length - 4} tareas más...</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Selecciona una recomendación de ruta
 */
function selectRouteRecommendation(routeId) {
    // Obtener la ruta seleccionada
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = state.tasks.filter(task => {
        if (task.archived || task.completed) return false;
        if (task.date) return task.date === today;
        if (task.deadline) return task.deadline <= today;
        return false;
    });

    const tasksWithLocation = todayTasks.filter(task => task.location && task.location.trim() !== '');

    // Regenerar las rutas para obtener la seleccionada
    generateRouteRecommendations(tasksWithLocation).then(routes => {
        const selectedRoute = routes.find(r => r.id === routeId);

        if (!selectedRoute) {
            console.error('Ruta no encontrada:', routeId);
            return;
        }

        currentSelectedRoute = selectedRoute;

        // Cerrar modal de recomendaciones
        closeRouteRecommendationsModal();

        // Abrir modal de detalles de ruta
        showRouteDetailsModal();
    });
}

/**
 * Muestra el modal de detalles de ruta
 */
function showRouteDetailsModal() {
    const modal = document.getElementById('routeDetailsModal');
    const contentContainer = document.getElementById('routeDetailsContent');

    openModal(modal, { focusSelector: '.transport-option' });

    // Resetear modo de transporte
    currentTransportMode = null;
    document.querySelectorAll('.transport-option').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Mostrar mensaje inicial
    contentContainer.innerHTML = `
        <div class="loading-message">
            <p>👆 Selecciona un método de transporte para calcular la ruta</p>
        </div>
    `;

    // Ocultar botón de aplicar
    document.getElementById('btnApplyRoute').style.display = 'none';
}

/**
 * Selecciona el modo de transporte y calcula la ruta
 */
async function selectTransportMode(mode) {
    if (!currentSelectedRoute) {
        console.error('No hay ruta seleccionada');
        return;
    }

    currentTransportMode = mode;

    // Actualizar UI de selección
    document.querySelectorAll('.transport-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');

    // Mostrar loading
    const contentContainer = document.getElementById('routeDetailsContent');
    contentContainer.innerHTML = `
        <div class="loading-message">
            <p>⏳ Calculando ruta con ${getModeLabel(mode)}...</p>
        </div>
    `;

    try {
        // Calcular detalles de la ruta
        const routeDetails = await calculateRouteDetails(currentSelectedRoute, mode);
        currentRouteDetails = routeDetails;

        // Mostrar detalles
        displayRouteDetails(routeDetails);

        // Mostrar botón de aplicar
        document.getElementById('btnApplyRoute').style.display = 'inline-block';

    } catch (error) {
        console.error('Error calculando ruta:', error);
        contentContainer.innerHTML = `
            <div class="loading-message">
                <p>❌ Error al calcular la ruta</p>
                <p style="font-size: 0.9em; margin-top: 8px;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Calcula los detalles de la ruta con el modo de transporte seleccionado
 */
async function calculateRouteDetails(route, mode) {
    const tasks = route.tasks;
    const steps = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // Obtener ubicación de inicio (home si existe)
    let currentLocation = state.locations?.home?.address || 'Mi ubicación';

    // Para cada tarea, calcular el paso
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const destination = task.location;

        // Simular cálculo de distancia y tiempo
        // En producción, aquí usarías Google Maps Routes API o OSRM
        const distance = Math.random() * 5 + 1; // 1-6 km
        const duration = calculateTravelTime(distance, mode);

        totalDistance += distance;
        totalDuration += duration;

        steps.push({
            number: i + 1,
            from: currentLocation,
            to: destination,
            task: task,
            distance: distance,
            duration: duration,
            mode: mode
        });

        currentLocation = destination;
    }

    return {
        route: route,
        mode: mode,
        steps: steps,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        totalTasks: tasks.length
    };
}

/**
 * Calcula el tiempo de viaje basado en distancia y modo
 */
function calculateTravelTime(distanceKm, mode) {
    const speeds = {
        driving: 30,    // km/h en ciudad
        transit: 25,    // km/h transporte público
        bicycling: 15,  // km/h en bicicleta
        walking: 5      // km/h caminando
    };

    const speedKmH = speeds[mode] || 30;
    const timeHours = distanceKm / speedKmH;
    const timeMinutes = Math.round(timeHours * 60);

    return timeMinutes;
}

/**
 * Muestra los detalles de la ruta calculada
 */
function displayRouteDetails(details) {
    const contentContainer = document.getElementById('routeDetailsContent');

    const modeIcons = {
        driving: '🚗',
        transit: '🚌',
        bicycling: '🚴',
        walking: '🚶'
    };

    contentContainer.innerHTML = `
        <div class="route-steps">
            ${details.steps.map(step => `
                <div class="route-step">
                    <div class="route-step-number">${step.number}</div>
                    <div class="route-step-content">
                        <div class="route-step-location">
                            <strong>${step.task.title}</strong>
                        </div>
                        <div style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 8px;">
                            📍 ${step.to}
                        </div>
                        <div class="route-step-details">
                            <div class="route-step-detail">
                                <span class="route-step-detail-icon">${modeIcons[step.mode]}</span>
                                <span>${step.distance.toFixed(1)} km</span>
                            </div>
                            <div class="route-step-detail">
                                <span class="route-step-detail-icon">⏱️</span>
                                <span>${step.duration} min</span>
                            </div>
                            ${step.task.startTime ? `
                                <div class="route-step-detail">
                                    <span class="route-step-detail-icon">🕐</span>
                                    <span>${step.task.startTime}</span>
                                </div>
                            ` : ''}
                            ${step.task.priority ? `
                                <div class="route-step-detail">
                                    <span class="route-step-detail-icon">${getPriorityIcon(step.task.priority)}</span>
                                    <span>${getPriorityLabel(step.task.priority)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="route-summary">
            <div class="route-summary-title">
                ✅ Resumen de la Ruta
            </div>
            <div class="route-summary-stats">
                <div class="route-summary-stat">
                    <div class="route-summary-stat-label">Distancia Total</div>
                    <div class="route-summary-stat-value">${details.totalDistance.toFixed(1)} km</div>
                </div>
                <div class="route-summary-stat">
                    <div class="route-summary-stat-label">Tiempo de Viaje</div>
                    <div class="route-summary-stat-value">${Math.floor(details.totalDuration / 60)}h ${details.totalDuration % 60}m</div>
                </div>
                <div class="route-summary-stat">
                    <div class="route-summary-stat-label">Tareas</div>
                    <div class="route-summary-stat-value">${details.totalTasks}</div>
                </div>
                <div class="route-summary-stat">
                    <div class="route-summary-stat-label">Transporte</div>
                    <div class="route-summary-stat-value">${getModeLabel(details.mode)}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Obtiene el icono de prioridad
 */
function getPriorityIcon(priority) {
    const icons = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
    };
    return icons[priority] || '⚪';
}

/**
 * Obtiene la etiqueta de prioridad
 */
function getPriorityLabel(priority) {
    const labels = {
        high: 'Alta',
        medium: 'Media',
        low: 'Baja'
    };
    return labels[priority] || priority;
}

/**
 * Aplica la ruta seleccionada al calendario
 */
function applySelectedRoute() {
    if (!currentRouteDetails) {
        console.error('No hay detalles de ruta para aplicar');
        return;
    }

    // Preguntar confirmación
    if (!confirm('¿Quieres aplicar esta ruta? Esto actualizará el orden de tus tareas de hoy.')) {
        return;
    }

    // Actualizar orden de tareas basado en la ruta
    const steps = currentRouteDetails.steps;
    let currentTime = new Date();

    // Si es muy tarde, empezar mañana
    if (currentTime.getHours() >= 20) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(8, 0, 0, 0);
    } else if (currentTime.getHours() < 7) {
        currentTime.setHours(8, 0, 0, 0);
    }

    steps.forEach((step, index) => {
        const task = step.task;

        // Actualizar hora de inicio si no tiene
        if (!task.startTime) {
            const hours = currentTime.getHours().toString().padStart(2, '0');
            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
            task.startTime = `${hours}:${minutes}`;
        }

        // Añadir duración de viaje + duración de tarea
        const taskDuration = task.duration || 60; // 1 hora por defecto
        currentTime.setMinutes(currentTime.getMinutes() + step.duration + taskDuration);

        // Actualizar la tarea en el estado
        const taskIndex = state.tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            state.tasks[taskIndex] = task;
        }
    });

    // Guardar cambios
    saveToStorage();
    renderCalendar();
    renderTaskList();

    // Cerrar modales
    closeRouteDetailsModal();

    // Notificar
    showNotification(`✅ Ruta aplicada: ${steps.length} tareas organizadas con ${getModeLabel(currentRouteDetails.mode)}`, 'success');

    // Cambiar a vista de calendario
    switchView('calendar');
}

/**
 * Cierra el modal de recomendaciones de rutas
 */
function closeRouteRecommendationsModal() {
    const modal = document.getElementById('routeRecommendationsModal');
    closeModal(modal);
}

/**
 * Cierra el modal de detalles de ruta
 */
function closeRouteDetailsModal() {
    const modal = document.getElementById('routeDetailsModal');
    closeModal(modal);
    currentSelectedRoute = null;
    currentTransportMode = null;
    currentRouteDetails = null;
}
