/**
 * Utilidades de seguridad para prevenir XSS y otras vulnerabilidades
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string} - Texto escapado y seguro para insertar en HTML
 */
export function escapeHtml(str) {
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
export function sanitizeUrl(url) {
  if (!url) return '';
  const lower = url.toLowerCase().trim();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return '';
  }
  return url;
}
