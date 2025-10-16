/**
 * Gestión centralizada del estado de la aplicación
 */

// Estado de la sesión
export const session = {
  user: null  // { email: '...' }
};

// Estado de la aplicación
export const state = {
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
    }
  },
  tasks: [],
  selectedDay: new Date(),
  currentView: 'dashboard',
  lastTaskId: 0
};

/**
 * Carga la sesión desde localStorage
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem('calendarSession');
    Object.assign(session, raw ? JSON.parse(raw) : { user: null });
  } catch (e) {
    console.error('Error loading session:', e);
    session.user = null;
  }
}

/**
 * Guarda la sesión en localStorage
 */
export function saveSession() {
  try {
    localStorage.setItem('calendarSession', JSON.stringify(session));
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated() {
  return !!(session && session.user);
}

/**
 * Carga el estado desde localStorage
 */
export function loadState() {
  try {
    const saved = localStorage.getItem('calendarState');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      state.selectedDay = new Date(state.selectedDay);
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
}

/**
 * Guarda el estado en localStorage
 */
export function saveState() {
  try {
    localStorage.setItem('calendarState', JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}
