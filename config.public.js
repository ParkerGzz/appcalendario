/**
 * =========================================
 * CONFIGURACIÓN DEL CALENDARIO INTELIGENTE
 * =========================================
 *
 * IMPORTANTE:
 * - Este archivo contiene tu API key configurada
 * - NO commitear este archivo en repositorios públicos
 * - Usar config.example.js como plantilla para nuevos entornos
 */

window.APP_CONFIG = {
  // ===== INFORMACIÓN DE LA APP =====
  app: {
    name: 'Calendario Inteligente',
    version: '2.0.0',
    language: 'es',
    timezone: 'America/Santiago',
    dateFormat: 'DD-MM-YYYY',
  },

  // ===== AUTENTICACIÓN =====
  auth: {
    demoEnabled: true, // Cambiar a false cuando uses auth real
    providers: ['google', 'microsoft', 'apple'], // Proveedores disponibles
  },

  // ===== BACKEND CONFIGURATION =====
  backend: {
    enabled: true,
    // Auto-detectar la URL del backend basado en el hostname actual
    url: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : `http://${window.location.hostname}:3000`,
    // Endpoints
    endpoints: {
      route: '/api/route',
      trafficMatrix: '/api/traffic-matrix',
      detour: '/api/calculate-detour',
      placesAlongRoute: '/api/places-along-route',
      placesNearby: '/api/places-nearby',
      categoryTypes: '/api/category-types',
    },
    timeout: 30000, // 30 segundos
  },

  // ===== GOOGLE MAPS PLATFORM =====
  googleMaps: {
    enabled: true,

    // Frontend API Key
    // ⚠️ IMPORTANTE: Esta clave debe tener las siguientes APIs habilitadas:
    // - Maps JavaScript API
    // - Places API (New) ← OBLIGATORIA para autocompletado
    // - Geocoding API
    // - Routes API (opcional, para backend)
    // - Distance Matrix API (opcional, para backend)
    // SEGURIDAD: Este config.js se mantiene por compatibilidad
    // La configuración real con variables de entorno está en src/config.js
    apiKey: 'AIzaSyCICyMcdM47lzTGq6hJgfwuEw_Gk8FCRNM',

    // Configuración de carga
    loadingStrategy: 'async', // 'async' o 'defer'
    libraries: ['places'], // Librerías a cargar
    language: 'es',
    region: 'CL', // Código de país para resultados localizados

    // Restricciones de HTTP Referrer (configurar en Google Cloud Console):
    // - http://localhost:*/*
    // - http://127.0.0.1:*/*
    // - file:///*

    // Configuración de búsqueda de lugares
    placesConfig: {
      // Tipos de lugares para incluir en búsquedas
      includedTypes: [
        'restaurant',
        'store',
        'shopping_mall',
        'cafe',
        'hospital',
        'pharmacy',
        'bank',
        'school',
        'gym',
        'park',
        'supermarket',
        'gas_station',
        'post_office',
        'library'
      ],
      // Radio de búsqueda por defecto (metros)
      defaultRadius: 5000,
    },
  },

  // ===== GOOGLE CALENDAR API (futuro) =====
  googleCalendar: {
    enabled: false,
    clientId: '', // YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    syncInterval: 15 * 60 * 1000, // 15 minutos en ms
  },

  // ===== MICROSOFT CALENDAR API (futuro) =====
  microsoft: {
    enabled: false,
    clientId: '', // YOUR_MICROSOFT_CLIENT_ID
    scopes: ['Calendars.Read', 'Calendars.ReadWrite'],
    syncInterval: 15 * 60 * 1000, // 15 minutos en ms
  },

  // ===== APPLE iCLOUD CALENDAR (futuro) =====
  apple: {
    enabled: false,
    calDavUrl: 'https://caldav.icloud.com',
    syncInterval: 15 * 60 * 1000, // 15 minutos en ms
  },

  // ===== APIS GRATUITAS (FALLBACK) =====
  fallback: {
    // OpenStreetMap Nominatim (Geocoding gratuito)
    nominatim: {
      enabled: true,
      url: 'https://nominatim.openstreetmap.org',
      // IMPORTANTE: Nominatim requiere User-Agent
      userAgent: 'CalendarioInteligente/2.0',
      // Límite: 1 request/segundo
      rateLimit: 1000, // ms entre requests
    },

    // OSRM (Routing gratuito)
    osrm: {
      enabled: true,
      url: 'https://router.project-osrm.org',
      // Sin límite estricto pero usar con moderación
      rateLimit: 100, // ms entre requests
    },
  },

  // ===== CACHE Y OPTIMIZACIÓN =====
  cache: {
    // Tiempo de vida de caché (segundos)
    distanceTTL: 7 * 24 * 60 * 60,      // 7 días
    geocodeTTL: 30 * 24 * 60 * 60,      // 30 días
    placeDetailsTTL: 24 * 60 * 60,      // 1 día
    trafficTTL: 15 * 60,                // 15 minutos

    // Almacenamiento
    storage: 'localStorage', // 'localStorage' o 'indexedDB'
    maxSize: 10 * 1024 * 1024, // 10 MB máximo
  },

  // ===== ALGORITMO DE OPTIMIZACIÓN =====
  scheduling: {
    // Tiempos por defecto
    defaultTaskDuration: 1, // horas
    defaultBufferMin: 15, // minutos entre tareas
    maxTravelTimeMin: 120, // tiempo máximo de viaje aceptable

    // Velocidades promedio (km/h)
    speeds: {
      walking: 5,
      cycling: 15,
      driving: 30,
      transit: 25,
    },

    // Franjas horarias para optimización de tráfico
    timeBuckets: {
      morning: { start: '06:00', end: '10:00', trafficFactor: 1.5 },
      midday: { start: '10:00', end: '14:00', trafficFactor: 1.0 },
      afternoon: { start: '14:00', end: '18:00', trafficFactor: 1.3 },
      evening: { start: '18:00', end: '22:00', trafficFactor: 1.2 },
      night: { start: '22:00', end: '06:00', trafficFactor: 0.8 },
    },

    // Pesos para el algoritmo de scoring
    weights: {
      travelTime: 2.0,      // Penalización por tiempo de viaje
      deadline: 5.0,        // Importancia de cumplir deadlines
      priority: 3.0,        // Peso de prioridad de tarea
      grouping: 1.5,        // Bonus por agrupar tareas cercanas
      traffic: 1.8,         // Factor de tráfico en tiempo real
    },

    // Distancias de agrupación (metros)
    groupingDistance: 2000, // 2km - tareas más cercanas se agrupan
  },

  // ===== NOTIFICACIONES Y ALERTAS =====
  notifications: {
    enabled: true,

    // Tipos de alertas
    alerts: {
      closingSoon: true,        // Lugar cierra pronto
      placeClosed: true,        // Lugar cerrado
      heavyTraffic: true,       // Tráfico pesado
      taskMissed: true,         // Tarea con hora pasada
      deadlineApproaching: true, // Deadline cercano
    },

    // Umbrales para alertas
    thresholds: {
      closingSoonMin: 30,       // Alerta X minutos antes de cerrar
      deadlineDays: 2,          // Alerta X días antes del deadline
      trafficDelayMin: 10,      // Alerta si tráfico añade X minutos
    },
  },

  // ===== LÍMITES Y RATE LIMITING =====
  rateLimits: {
    googleMapsQPS: 50,    // Queries por segundo (Google Maps)
    nominatimQPS: 1,      // Max 1 req/seg (política de Nominatim)
    osrmQPS: 10,          // Requests por segundo (OSRM)
    backendTimeout: 30000, // Timeout para llamadas al backend (ms)
  },

  // ===== FEATURES FLAGS =====
  features: {
    smartAlerts: true,          // Alertas inteligentes
    trafficIntegration: true,   // Integración con tráfico en tiempo real
    routeOptimization: true,    // Optimización de rutas
    placeDetails: true,         // Detalles de lugares (horarios, etc.)
    voiceCommands: false,       // Comandos de voz (futuro)
    offlineMode: false,         // Modo offline (futuro)
    aiSuggestions: false,       // Sugerencias con IA (futuro)
  },

  // ===== TEMAS Y UI =====
  ui: {
    theme: 'light',             // 'light', 'dark', 'auto'
    defaultView: 'dashboard',   // Vista inicial
    mapStyle: 'default',        // Estilo del mapa
    compactMode: false,         // Modo compacto
  },

  // ===== DEBUG Y DESARROLLO =====
  debug: {
    enabled: true,              // Logs en consola
    verbose: false,             // Logs detallados
    showApiCalls: true,         // Mostrar llamadas a APIs
    mockData: false,            // Usar datos de prueba
  },
};

// =========================================
// VALIDACIÓN Y WARNINGS
// =========================================

(function validateConfig() {
  if (typeof window === 'undefined') return;

  const config = window.APP_CONFIG;
  const isProduction = !window.location.hostname.includes('localhost');

  // Validar Google Maps
  if (config.googleMaps.enabled) {
    if (!config.googleMaps.apiKey || config.googleMaps.apiKey.includes('YOUR_')) {
      console.warn('⚠️ Google Maps API key no configurada. Usando fallback (Nominatim).');
      config.googleMaps.enabled = false;
    }
  }

  // Validar backend
  if (config.backend.enabled) {
    if (!config.backend.url) {
      console.warn('⚠️ Backend URL no configurada. Funciones avanzadas no disponibles.');
      config.backend.enabled = false;
    }
  }

  // Información de inicio
  if (config.debug.enabled) {
    console.log(`
╔════════════════════════════════════════╗
║  ${config.app.name} v${config.app.version}          ║
╚════════════════════════════════════════╝

📍 Google Maps: ${config.googleMaps.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
🔄 Backend: ${config.backend.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
🌐 Fallback APIs: ${config.fallback.nominatim.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
🔔 Notificaciones: ${config.notifications.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}

Zona horaria: ${config.app.timezone}
Idioma: ${config.app.language}
Modo: ${isProduction ? 'Producción' : 'Desarrollo'}
    `);
  }

  // Advertencia si no hay Google Maps en producción
  if (isProduction && !config.googleMaps.enabled) {
    console.warn('⚠️ Google Maps deshabilitado en producción. Experiencia limitada.');
  }
})();

// =========================================
// EXPORT PARA MÓDULOS
// =========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.APP_CONFIG;
}

// =========================================
// COMPATIBILIDAD CON CÓDIGO LEGACY
// =========================================

// Mantener compatibilidad con código antiguo que usa estas propiedades
window.APP_CONFIG.useGoogleMaps = window.APP_CONFIG.googleMaps.enabled;
window.APP_CONFIG.googleMapsFrontendKey = window.APP_CONFIG.googleMaps.apiKey;
window.APP_CONFIG.backendURL = window.APP_CONFIG.backend.url;
window.APP_CONFIG.nominatimURL = window.APP_CONFIG.fallback.nominatim.url;
window.APP_CONFIG.osrmURL = window.APP_CONFIG.fallback.osrm.url;
window.APP_CONFIG.timezone = window.APP_CONFIG.app.timezone;
window.APP_CONFIG.dateFormat = window.APP_CONFIG.app.dateFormat;
window.APP_CONFIG.authDemoEnabled = window.APP_CONFIG.auth.demoEnabled;
