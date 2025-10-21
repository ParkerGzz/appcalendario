# Floating Action Button (FAB) - Implementación

## 📱 Descripción

Se ha implementado un **Floating Action Button (FAB)** siguiendo los principios de Material Design para mejorar la experiencia móvil de la aplicación. El FAB es visible **solo en dispositivos móviles** (≤768px) y proporciona acceso rápido a la acción principal: **crear una nueva tarea**.

---

## ✨ Características Implementadas

### 1. **Diseño Material Design**
- ✅ Botón circular flotante de 56x56px (48x48px en pantallas pequeñas)
- ✅ Gradiente violeta que coincide con la paleta de colores de la app
- ✅ Sombras elevadas (elevation) según Material Design
- ✅ Icono centrado (➕ para nueva tarea)
- ✅ Efecto ripple al hacer clic

### 2. **Responsive**
- ✅ **Oculto en desktop** (>768px) - No interfiere con la UI de escritorio
- ✅ **Visible en móvil** (≤768px) - Posicionado sobre el bottom navigation
- ✅ Ajustable en pantallas pequeñas (≤480px) - Tamaño reducido a 48x48px

### 3. **Interactividad**
- ✅ Efecto ripple animado al hacer clic/touch
- ✅ Vibración háptica en dispositivos compatibles (10ms)
- ✅ Animación de entrada al cargar la página
- ✅ Se oculta al hacer scroll hacia abajo, se muestra al hacer scroll hacia arriba
- ✅ Estados hover/active con transiciones suaves

### 4. **Accesibilidad**
- ✅ `aria-label` descriptivo ("Nueva tarea")
- ✅ Touch target de 48x48px mínimo (WCAG 2.1)
- ✅ Contraste adecuado (blanco sobre violeta)
- ✅ Feedback visual y táctil

---

## 📂 Archivos Creados/Modificados

### Archivos Nuevos

1. **`styles-fab.css`** (300+ líneas)
   - Estilos completos del FAB
   - Variantes: regular, mini, extended
   - Responsive breakpoints
   - Animaciones y transiciones

2. **`fab.js`** (200+ líneas)
   - Lógica del FAB
   - Efecto ripple
   - Manejo de scroll
   - Event listeners

3. **`FAB-IMPLEMENTATION.md`** (este archivo)
   - Documentación completa

### Archivos Modificados

1. **`index.html`**
   - Línea 16: Agregado `<link rel="stylesheet" href="styles-fab.css">`
   - Líneas 872-875: Agregado HTML del FAB
   - Línea 877: Agregado `<script src="fab.js"></script>`

---

## 🎨 Estilos y Diseño

### Paleta de Colores
```css
/* Normal */
background: linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%);
/* var(--brand): #7c3aed (violet-600) */
/* var(--accent): #a855f7 (violet-500) */

/* Hover */
background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);

/* Active/Pressed */
background: linear-gradient(135deg, #5b21b6 0%, #7e22ce 100%);
```

### Posicionamiento
```css
/* Móvil normal */
position: fixed;
bottom: 80px;  /* Sobre el bottom navigation */
right: 16px;
z-index: 1000;

/* Móvil pequeño (≤480px) */
bottom: 75px;
right: 12px;
width: 48px;
height: 48px;
```

### Sombras (Elevation)
```css
/* Normal - Elevation 6 */
box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
            0 6px 10px 0 rgba(0, 0, 0, 0.14),
            0 1px 18px 0 rgba(0, 0, 0, 0.12);

/* Hover - Elevation 8 */
box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
            0 8px 10px 1px rgba(0, 0, 0, 0.14),
            0 3px 14px 2px rgba(0, 0, 0, 0.12);

/* Active - Elevation 12 */
box-shadow: 0 7px 8px -4px rgba(0, 0, 0, 0.2),
            0 12px 17px 2px rgba(0, 0, 0, 0.14),
            0 5px 22px 4px rgba(0, 0, 0, 0.12);
```

---

## 🔧 Funcionalidad JavaScript

### Inicialización
```javascript
// Se auto-inicializa cuando el DOM está listo
document.addEventListener('DOMContentLoaded', initFAB);
```

### Acciones Principales

1. **Click/Tap**: Abre el modal de nueva tarea
   ```javascript
   fabButton.addEventListener('click', handleFabClick);
   ```

2. **Efecto Ripple**: Crea una onda expansiva desde el punto de toque
   ```javascript
   function createRipple(e) {
       // Calcula posición relativa del click
       // Crea elemento ripple animado
       // Se elimina después de 600ms
   }
   ```

3. **Scroll Behavior**: Oculta/muestra el FAB según la dirección del scroll
   ```javascript
   // Scroll hacia abajo (>100px): Oculta FAB
   // Scroll hacia arriba: Muestra FAB
   ```

4. **Vibración Háptica**: Feedback táctil en dispositivos compatibles
   ```javascript
   if (navigator.vibrate) {
       navigator.vibrate(10); // 10ms
   }
   ```

### API Pública
```javascript
// Expuesta globalmente
window.FAB = {
    show: showFab,           // Muestra el FAB
    hide: hideFab,           // Oculta el FAB
    updateVisibility: updateFabVisibility  // Actualiza según vista actual
};
```

---

## 📱 Comportamiento Responsive

### Desktop (>768px)
```css
@media (min-width: 769px) {
  .mdc-fab {
    display: none !important;
  }
}
```
- ❌ FAB completamente oculto
- ✅ No interfiere con la UI de escritorio
- ✅ El sidebar lateral tiene el botón de nueva tarea

### Tablet/Mobile (≤768px)
```css
@media (max-width: 768px) {
  .mdc-fab {
    display: flex;
  }
}
```
- ✅ FAB visible en esquina inferior derecha
- ✅ Posicionado sobre el bottom navigation bar
- ✅ Tamaño completo 56x56px

### Mobile Pequeño (≤480px)
```css
@media (max-width: 480px) {
  .mdc-fab {
    width: 48px;
    height: 48px;
    bottom: 75px;
  }
}
```
- ✅ Tamaño reducido a 48x48px
- ✅ Ajuste de posición para no interferir con bottom nav

---

## 🎯 Variantes Disponibles (Para Uso Futuro)

### 1. FAB Mini
```html
<button class="mdc-fab mdc-fab--mini" aria-label="Acción">
  <div class="mdc-fab__ripple"></div>
  <span class="mdc-fab__icon">⭐</span>
</button>
```
- Tamaño: 40x40px
- Uso: Acciones secundarias

### 2. FAB Extended (con texto)
```html
<button class="mdc-fab mdc-fab--extended">
  <div class="mdc-fab__ripple"></div>
  <span class="mdc-fab__icon">➕</span>
  <span class="mdc-fab__label">CREAR</span>
</button>
```
- Ancho automático
- Incluye texto descriptivo
- Útil para acciones complejas

### 3. Variantes de Color
```html
<!-- Verde (success) -->
<button class="mdc-fab mdc-fab--secondary">...</button>

<!-- Rojo (danger) -->
<button class="mdc-fab mdc-fab--danger">...</button>
```

---

## 🔄 Animaciones

### Entrada (Al cargar)
```css
@keyframes fab-enter {
  from {
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
```

### Salida (Al ocultar)
```css
.mdc-fab--exited {
  transform: scale(0) translateY(20px);
  opacity: 0;
  pointer-events: none;
}
```

### Ripple
```css
@keyframes ripple-animation {
  from {
    transform: scale(0);
    opacity: 1;
  }
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

---

## ✅ Testing Checklist

### Desktop
- [ ] FAB está oculto en pantallas >768px
- [ ] No interfiere con otros elementos
- [ ] El botón del sidebar funciona correctamente

### Mobile/Tablet
- [ ] FAB es visible en pantallas ≤768px
- [ ] Está posicionado sobre el bottom navigation
- [ ] No bloquea contenido importante
- [ ] Abre el modal de nueva tarea al hacer clic
- [ ] Efecto ripple funciona correctamente
- [ ] Vibración funciona en dispositivos compatibles
- [ ] Se oculta al hacer scroll hacia abajo
- [ ] Se muestra al hacer scroll hacia arriba
- [ ] Animación de entrada suave
- [ ] Estados hover/active funcionan

### Accesibilidad
- [ ] `aria-label` está presente
- [ ] Touch target es ≥48x48px
- [ ] Contraste cumple WCAG 2.1 (AA)
- [ ] Se puede activar con teclado (si es aplicable)

---

## 🚀 Próximas Mejoras (Opcional)

1. **Speed Dial**: Múltiples acciones rápidas
   - Crear tarea
   - Crear evento en calendario
   - Agregar ubicación favorita

2. **Notificaciones Badge**: Mostrar contador de tareas pendientes

3. **Gestos**: Swipe para revelar acciones secundarias

4. **Personalización**: Permitir al usuario cambiar el icono/color

---

## 📖 Referencias

- [Material Design - Floating Action Button](https://material.io/components/buttons-floating-action-button)
- [MDC Web FAB Documentation](https://material-components.github.io/material-components-web-catalog/#/component/fab)
- [WCAG 2.1 - Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

## 🎉 Resultado Final

El FAB ha sido implementado exitosamente con:
- ✅ Diseño Material Design profesional
- ✅ Paleta violeta coherente con la app
- ✅ Responsive (solo móvil)
- ✅ Animaciones suaves
- ✅ Accesibilidad completa
- ✅ Efecto ripple
- ✅ Vibración háptica
- ✅ Scroll behavior inteligente

**El usuario móvil ahora tiene acceso rápido y fácil a la acción principal (crear tarea) sin necesidad de navegar por menús.**
