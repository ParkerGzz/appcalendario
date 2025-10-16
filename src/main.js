/**
 * Punto de entrada principal de la aplicación
 * Importa y coordina todos los módulos
 */

// Importar utilidades de seguridad y hacerlas globales temporalmente
// para compatibilidad con código legacy
import { escapeHtml, sanitizeUrl } from './utils/security.js';
import { loadSession, loadState, saveState } from './state/store.js';
import { delegate } from './utils/eventDelegation.js';
import { APP_CONFIG } from './config.js';

// Exportar funciones de seguridad globalmente para compatibilidad con app.js
window.escapeHtml = escapeHtml;
window.sanitizeUrl = sanitizeUrl;

console.log('✅ Aplicación modular inicializada');
console.log('📦 Módulos ESM cargados correctamente');
console.log('✅ Config cargado:', APP_CONFIG.app.name);

// Cargar estado después de que config esté listo
loadSession();
loadState();

// Configurar delegación de eventos para autocomplete
delegate('click', '.autocomplete-item', (e, target) => {
  const container = target.closest('.autocomplete-suggestions');
  if (container && container.id) {
    target.click();
  }
});

// Cargar el código legacy (app.js)
const appScript = document.createElement('script');
appScript.src = '/app.js';
appScript.onload = () => console.log('✅ App.js cargado');
appScript.onerror = (err) => console.error('❌ Error cargando app.js:', err);
document.head.appendChild(appScript);
