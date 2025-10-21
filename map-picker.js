/**
 * Map Picker - Selector de ubicación en mapa interactivo
 * Permite al usuario seleccionar una ubicación haciendo clic en el mapa
 */

(function() {
    'use strict';

    let mapPickerMap = null;
    let mapPickerMarker = null;
    let selectedLocation = null;
    let isModalPicker = false; // Track si estamos en modal o form normal

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapPicker);
    } else {
        initMapPicker();
    }

    function initMapPicker() {
        // Botón para abrir selector de mapa desde formulario principal
        const selectFromMapBtn = document.getElementById('selectFromMap');
        if (selectFromMapBtn) {
            selectFromMapBtn.addEventListener('click', function() {
                isModalPicker = false;
                openMapPickerModal();
            });
        }

        // Botón para abrir selector de mapa desde modal de tarea
        const selectFromMapModalBtn = document.getElementById('selectFromMapModal');
        if (selectFromMapModalBtn) {
            selectFromMapModalBtn.addEventListener('click', function() {
                isModalPicker = true;
                openMapPickerModal();
            });
        }

        // Configurar búsqueda en el mapa
        const mapSearchInput = document.getElementById('mapSearchInput');
        if (mapSearchInput) {
            mapSearchInput.addEventListener('input', handleMapSearch);
        }
    }

    // Abrir modal de selector de mapa
    window.openMapPickerModal = function() {
        const modal = document.getElementById('mapPickerModal');
        if (!modal) return;

        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Resetear selección
        selectedLocation = null;
        document.getElementById('btnConfirmLocation').disabled = true;
        document.getElementById('selectedLocationInfo').style.display = 'none';

        // Inicializar el mapa después de que el modal sea visible
        setTimeout(() => {
            initializeMapPicker();
        }, 100);
    };

    // Cerrar modal de selector de mapa
    window.closeMapPickerModal = function() {
        const modal = document.getElementById('mapPickerModal');
        if (!modal) return;

        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');

        // Limpiar mapa
        if (mapPickerMap) {
            mapPickerMap.remove();
            mapPickerMap = null;
            mapPickerMarker = null;
        }
    };

    // Inicializar el mapa interactivo
    function initializeMapPicker() {
        const container = document.getElementById('mapPickerContainer');
        if (!container) return;

        // Si el mapa ya existe, no recrearlo
        if (mapPickerMap) {
            mapPickerMap.invalidateSize();
            return;
        }

        // Verificar si Leaflet está disponible (usado por mapa-ruta.js)
        if (typeof L === 'undefined') {
            console.error('Leaflet no está disponible');
            alert('El sistema de mapas no está disponible. Por favor, recarga la página.');
            return;
        }

        // Obtener ubicación inicial (casa o ubicación actual)
        const homeCoords = getUserHomeCoords();
        const initialLat = homeCoords ? homeCoords.lat : -33.4489; // Santiago, Chile por defecto
        const initialLng = homeCoords ? homeCoords.lng : -70.6693;

        // Crear mapa
        mapPickerMap = L.map('mapPickerContainer').setView([initialLat, initialLng], 13);

        // Agregar capa de mapa
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapPickerMap);

        // Evento de clic en el mapa
        mapPickerMap.on('click', function(e) {
            handleMapClick(e.latlng);
        });

        console.log('✅ Map Picker inicializado');
    }

    // Obtener coordenadas de casa del usuario
    function getUserHomeCoords() {
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (settings.homeLocation && settings.homeLocation.lat && settings.homeLocation.lng) {
                return {
                    lat: settings.homeLocation.lat,
                    lng: settings.homeLocation.lng
                };
            }
        } catch (e) {
            console.warn('No se pudo obtener ubicación de casa');
        }
        return null;
    }

    // Manejar clic en el mapa
    function handleMapClick(latlng) {
        // Remover marcador anterior si existe
        if (mapPickerMarker) {
            mapPickerMap.removeLayer(mapPickerMarker);
        }

        // Agregar nuevo marcador
        mapPickerMarker = L.marker([latlng.lat, latlng.lng]).addTo(mapPickerMap);

        // Hacer geocoding inverso para obtener el nombre del lugar
        reverseGeocode(latlng.lat, latlng.lng);
    }

    // Geocoding inverso usando Nominatim
    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            const data = await response.json();

            const placeName = data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

            // Guardar ubicación seleccionada
            selectedLocation = {
                name: placeName,
                address: data.display_name,
                lat: lat,
                lng: lng,
                placeId: data.place_id
            };

            // Mostrar información de ubicación
            document.getElementById('selectedLocationName').textContent = placeName;
            document.getElementById('selectedLocationCoords').textContent =
                `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            document.getElementById('selectedLocationInfo').style.display = 'block';
            document.getElementById('btnConfirmLocation').disabled = false;

        } catch (error) {
            console.error('Error en geocoding inverso:', error);

            // Fallback: usar coordenadas como nombre
            selectedLocation = {
                name: `Ubicación (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
                address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
                lat: lat,
                lng: lng,
                placeId: null
            };

            document.getElementById('selectedLocationName').textContent = selectedLocation.name;
            document.getElementById('selectedLocationCoords').textContent = selectedLocation.address;
            document.getElementById('selectedLocationInfo').style.display = 'block';
            document.getElementById('btnConfirmLocation').disabled = false;
        }
    }

    // Búsqueda de lugares en el mapa
    let searchTimeout;
    async function handleMapSearch(e) {
        const query = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 3) {
            document.getElementById('mapSearchSuggestions').innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
                );
                const results = await response.json();

                displaySearchResults(results);
            } catch (error) {
                console.error('Error en búsqueda:', error);
            }
        }, 300);
    }

    // Mostrar resultados de búsqueda
    function displaySearchResults(results) {
        const suggestionsDiv = document.getElementById('mapSearchSuggestions');

        if (!results || results.length === 0) {
            suggestionsDiv.innerHTML = '<div class="autocomplete-item">No se encontraron resultados</div>';
            return;
        }

        suggestionsDiv.innerHTML = results.map(result => `
            <div class="autocomplete-item" data-lat="${result.lat}" data-lng="${result.lon}" data-name="${result.display_name}">
                <strong>${result.display_name}</strong>
            </div>
        `).join('');

        // Agregar eventos a las sugerencias
        suggestionsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                const lat = parseFloat(this.dataset.lat);
                const lng = parseFloat(this.dataset.lng);
                const name = this.dataset.name;

                // Centrar mapa en la ubicación
                mapPickerMap.setView([lat, lng], 15);

                // Simular clic en el mapa
                handleMapClick({ lat, lng });

                // Limpiar búsqueda
                document.getElementById('mapSearchInput').value = '';
                suggestionsDiv.innerHTML = '';
            });
        });
    }

    // Confirmar ubicación seleccionada
    window.confirmMapLocation = function() {
        if (!selectedLocation) return;

        // Determinar qué input rellenar (formulario principal o modal)
        const targetInput = isModalPicker
            ? document.getElementById('modalTaskLocation')
            : document.getElementById('taskLocation');

        if (targetInput) {
            targetInput.value = selectedLocation.name;

            // Si hay una función para guardar coordenadas en la tarea, llamarla
            if (typeof window.setTaskLocationData === 'function') {
                window.setTaskLocationData(selectedLocation);
            } else {
                // Guardar en atributos data del input
                targetInput.dataset.lat = selectedLocation.lat;
                targetInput.dataset.lng = selectedLocation.lng;
                targetInput.dataset.placeId = selectedLocation.placeId || '';
            }
        }

        // Cerrar modal
        closeMapPickerModal();

        // Mostrar mensaje de confirmación
        if (typeof showToast === 'function') {
            showToast('Ubicación seleccionada correctamente', 'success');
        }
    };

    console.log('✅ Map Picker script cargado');
})();
