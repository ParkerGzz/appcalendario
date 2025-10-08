/**
 * Archivo de configuración para APIs externas
 *
 * IMPORTANTE:
 * 1. Copiar este archivo a config.js
 * 2. Reemplazar los valores de ejemplo con tus propias API keys
 * 3. NO commitear config.js (está en .gitignore)
 */

const CONFIG = {
  // Google Maps Platform
  // Obtener en: https://console.cloud.google.com/google/maps-apis
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    // Servicios a habilitar:
    // - Maps JavaScript API
    // - Geocoding API
    // - Places API
    // - Distance Matrix API
    // - Directions API
    // - Time Zone API
  },

  // Google Calendar API (OAuth 2.0)
  // Obtener en: https://console.cloud.google.com/apis/credentials
  googleCalendar: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET_HERE',
    redirectUri: 'http://localhost:8000/auth/google/callback',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ]
  },

  // Microsoft Graph API (Outlook/Office 365)
  // Obtener en: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
  microsoft: {
    clientId: 'YOUR_MICROSOFT_CLIENT_ID_HERE',
    clientSecret: 'YOUR_MICROSOFT_CLIENT_SECRET_HERE',
    redirectUri: 'http://localhost:8000/auth/microsoft/callback',
    scopes: [
      'Calendars.Read',
      'Calendars.ReadWrite'
    ]
  },

  // Apple iCloud Calendar (CalDAV)
  // Requiere contraseña específica de app
  // Generar en: https://appleid.apple.com/account/manage
  apple: {
    // Usuario: email de iCloud
    // Password: app-specific password (no la contraseña principal)
    calDavUrl: 'https://caldav.icloud.com',
    // El backend manejará la autenticación CalDAV
  },

  // Configuración de la aplicación
  app: {
    name: 'Calendario Inteligente',
    version: '0.1.0',
    timezone: 'America/Santiago', // Cambiar según tu ubicación
    language: 'es',

    // URLs (cambiar en producción)
    frontendUrl: 'http://localhost:8000',
    backendUrl: 'http://localhost:3000', // Cuando implementes backend
  },

  // Cache y límites
  cache: {
    distanceCacheTTL: 7 * 24 * 60 * 60, // 7 días en segundos
    geocodeCacheTTL: 30 * 24 * 60 * 60, // 30 días
    calendarSyncInterval: 15 * 60, // 15 minutos
  },

  // Optimización
  scheduling: {
    defaultBufferMin: 15, // Buffer por defecto entre tareas
    maxTravelTimeMin: 120, // Máximo tiempo de viaje aceptable
    travelSpeedKmh: 30, // Velocidad promedio en ciudad

    // Franjas horarias para cache de distancias
    timeBuckets: {
      morning: { start: '06:00', end: '10:00' },
      midday: { start: '10:00', end: '14:00' },
      afternoon: { start: '14:00', end: '18:00' },
      evening: { start: '18:00', end: '22:00' }
    },

    // Pesos para el algoritmo de scoring
    weights: {
      travelTime: 2.0,    // Penalización por tiempo de viaje
      deadline: 5.0,      // Importancia de cumplir deadlines
      priority: 3.0,      // Peso de prioridad de tarea
      grouping: 1.5       // Bonus por agrupar tareas cercanas
    }
  },

  // Límites de uso (para prevenir abusos)
  rateLimits: {
    googleMapsQPS: 50, // Queries por segundo
    nominatimQPS: 1,   // OpenStreetMap: 1 req/seg máximo
    osrmQPS: 10
  }
};

// Validación básica al cargar
if (typeof window !== 'undefined') {
  // Verificar si las keys están configuradas (en producción)
  const isProduction = window.location.hostname !== 'localhost';

  if (isProduction) {
    if (CONFIG.googleMaps.apiKey.includes('YOUR_')) {
      console.warn('⚠️ Google Maps API key no configurada. Algunas funciones no estarán disponibles.');
    }
  }
}

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
