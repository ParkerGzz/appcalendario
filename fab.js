/**
 * =================================================================
 * FAB (Floating Action Button) - Funcionalidad
 * Implementa el comportamiento del botón de acción flotante
 * =================================================================
 */

(function() {
    'use strict';

    console.log('🔵 Inicializando FAB...');

    // Elementos del DOM
    let fabButton = null;
    let fabRipple = null;

    /**
     * Inicializa el FAB cuando el DOM está listo
     */
    function initFAB() {
        fabButton = document.getElementById('fabNewTask');

        if (!fabButton) {
            console.warn('⚠️ FAB no encontrado en el DOM');
            return;
        }

        fabRipple = fabButton.querySelector('.mdc-fab__ripple');

        // Event listeners
        fabButton.addEventListener('click', handleFabClick);
        fabButton.addEventListener('touchstart', handleTouchStart, { passive: true });

        // Mostrar/ocultar FAB según scroll (opcional)
        let lastScrollY = window.scrollY;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll(lastScrollY);
                    lastScrollY = window.scrollY;
                    ticking = false;
                });
                ticking = true;
            }
        });

        console.log('✅ FAB inicializado correctamente');
    }

    /**
     * Maneja el click en el FAB
     */
    function handleFabClick(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🎯 FAB clicked - Abriendo modal de nueva tarea');

        // Crear efecto ripple
        createRipple(e);

        // Abrir el modal de nueva tarea
        // Verifica que la función global exista (definida en app.js)
        if (typeof window.showTaskModal === 'function') {
            window.showTaskModal();
        } else {
            console.error('❌ showTaskModal no está disponible');
            // Fallback: intentar click en el botón de nueva tarea del sidebar
            const newTaskBtn = document.querySelector('[onclick*="showTaskModal"]');
            if (newTaskBtn) {
                newTaskBtn.click();
            }
        }
    }

    /**
     * Maneja el evento touchstart para mejor feedback táctil
     */
    function handleTouchStart(e) {
        // El CSS ya maneja el efecto visual con :active
        // Aquí se puede agregar haptic feedback si el navegador lo soporta
        if (navigator.vibrate) {
            navigator.vibrate(10); // Vibración muy corta (10ms)
        }
    }

    /**
     * Crea el efecto ripple en la posición del click/touch
     */
    function createRipple(e) {
        if (!fabRipple) return;

        // Obtener la posición del click relativa al botón
        const rect = fabButton.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Crear elemento de ripple
        const rippleElement = document.createElement('span');
        rippleElement.className = 'fab-ripple-effect';
        rippleElement.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
            left: ${x - rect.width / 2}px;
            top: ${y - rect.height / 2}px;
        `;

        fabRipple.appendChild(rippleElement);

        // Eliminar el ripple después de la animación
        setTimeout(() => {
            rippleElement.remove();
        }, 600);
    }

    /**
     * Maneja el comportamiento del FAB durante el scroll
     * Oculta el FAB al hacer scroll hacia abajo, lo muestra al hacer scroll hacia arriba
     */
    function handleScroll(lastScrollY) {
        const currentScrollY = window.scrollY;

        // Solo en móvil
        if (window.innerWidth > 768) return;

        // Si hace scroll hacia abajo, ocultar FAB
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            hideFab();
        }
        // Si hace scroll hacia arriba, mostrar FAB
        else if (currentScrollY < lastScrollY) {
            showFab();
        }
    }

    /**
     * Oculta el FAB con animación
     */
    function hideFab() {
        if (fabButton && !fabButton.classList.contains('mdc-fab--exited')) {
            fabButton.classList.add('mdc-fab--exited');
        }
    }

    /**
     * Muestra el FAB con animación
     */
    function showFab() {
        if (fabButton && fabButton.classList.contains('mdc-fab--exited')) {
            fabButton.classList.remove('mdc-fab--exited');
        }
    }

    /**
     * Actualiza la visibilidad del FAB según la vista actual
     */
    function updateFabVisibility() {
        const currentView = localStorage.getItem('currentView') || 'dashboard';

        // El FAB solo se muestra en ciertas vistas
        const showInViews = ['dashboard', 'calendario', 'tareas'];

        if (showInViews.includes(currentView)) {
            showFab();
        } else {
            hideFab();
        }
    }

    // Agregar CSS para la animación de ripple
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFAB);
    } else {
        initFAB();
    }

    // Exponer funciones públicas si es necesario
    window.FAB = {
        show: showFab,
        hide: hideFab,
        updateVisibility: updateFabVisibility
    };

    console.log('✅ FAB module cargado');
})();
