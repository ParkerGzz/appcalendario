/**
 * Sistema de delegación de eventos para evitar múltiples listeners
 */

// Almacén de handlers por tipo de evento
const delegatedHandlers = new Map();

/**
 * Registra un handler delegado para un selector específico
 * @param {string} eventType - Tipo de evento (click, input, etc.)
 * @param {string} selector - Selector CSS
 * @param {Function} handler - Función handler
 */
export function delegate(eventType, selector, handler) {
  // Crear handler delegado si no existe para este tipo de evento
  if (!delegatedHandlers.has(eventType)) {
    const delegatedHandler = (e) => {
      // Buscar el elemento más cercano que coincida con algún selector registrado
      for (const [sel, handlers] of delegatedHandlers.get(eventType)) {
        const target = e.target.closest(sel);
        if (target) {
          handlers.forEach(h => h(e, target));
        }
      }
    };

    document.addEventListener(eventType, delegatedHandler);
    delegatedHandlers.set(eventType, new Map());
  }

  // Agregar handler al selector
  const handlers = delegatedHandlers.get(eventType);
  if (!handlers.has(selector)) {
    handlers.set(selector, []);
  }
  handlers.get(selector).push(handler);
}

/**
 * Remueve todos los handlers delegados (útil para cleanup)
 */
export function clearDelegation() {
  delegatedHandlers.clear();
}
