/**
 * Sidebar Colapsable - Control de expansión con hover o clic
 */

(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebarCollapse);
    } else {
        initSidebarCollapse();
    }

    function initSidebarCollapse() {
        const sidebar = document.getElementById('sidebar');
        const navItems = document.querySelectorAll('.nav-item');

        if (!sidebar) {
            console.warn('Sidebar not found');
            return;
        }

        let expandTimeout;
        let collapseTimeout;

        // Detectar si es móvil (basado en ancho de pantalla)
        function isMobile() {
            return window.innerWidth <= 768;
        }

        // Función para expandir el sidebar
        function expandSidebar() {
            // No expandir en móvil - el sidebar es bottom navigation
            if (isMobile()) return;

            clearTimeout(collapseTimeout);
            expandTimeout = setTimeout(() => {
                sidebar.classList.add('expanded');
            }, 100); // Pequeño delay para evitar expansiones accidentales
        }

        // Función para colapsar el sidebar
        function collapseSidebar() {
            // No colapsar en móvil
            if (isMobile()) return;

            clearTimeout(expandTimeout);
            collapseTimeout = setTimeout(() => {
                sidebar.classList.remove('expanded');
            }, 200);
        }

        // Expandir al hacer hover sobre el sidebar (solo desktop)
        sidebar.addEventListener('mouseenter', expandSidebar);

        // Colapsar al salir del sidebar (solo desktop)
        sidebar.addEventListener('mouseleave', collapseSidebar);

        // También expandir al hacer clic en cualquier nav-item (solo desktop)
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                // Solo en desktop
                if (isMobile()) return;

                // Expandir brevemente cuando se hace clic
                sidebar.classList.add('expanded');

                // Después de la animación de cambio de vista, colapsar
                setTimeout(() => {
                    sidebar.classList.remove('expanded');
                }, 300);
            });
        });

        // Mantener expandido al hacer clic y colapsar al hacer clic fuera (solo desktop)
        document.addEventListener('click', function(e) {
            if (isMobile()) return;

            const isClickInsideSidebar = sidebar.contains(e.target);

            if (!isClickInsideSidebar && sidebar.classList.contains('expanded')) {
                // Si el clic fue fuera del sidebar y está expandido, colapsarlo
                collapseSidebar();
            }
        });

        // Limpiar estado expanded al cambiar tamaño de ventana
        window.addEventListener('resize', function() {
            if (isMobile()) {
                sidebar.classList.remove('expanded');
            }
        });

        console.log('✅ Sidebar colapsable inicializado (responsive)');
    }
})();
