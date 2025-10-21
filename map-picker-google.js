/**
 * Map Picker con Google Maps - Selector de ubicación interactivo
 * Incluye: búsqueda, lugares cercanos, ubicaciones favoritas, y todas las tareas en el mapa
 */

(function() {
    'use strict';

    let mapPickerMap = null;
    let mapPickerMarker = null;
    let selectedLocation = null;
    let isModalPicker = false;
    let autocompleteService = null;
    let placesService = null;
    let nearbyMarkers = [];
    let taskMarkers = [];
    let infoWindow = null;

    // Esperar a que Google Maps esté cargado
    function waitForGoogleMaps(callback) {
        if (typeof google !== 'undefined' && google.maps) {
            callback();
        } else {
            setTimeout(() => waitForGoogleMaps(callback), 100);
        }
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        waitForGoogleMaps(initMapPicker);
    }

    function initMapPicker() {
        console.log('✅ Inicializando Map Picker con Google Maps');

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
            loadNearbyPlaces();
            loadAllTasksOnMap();
            loadFavoriteLocations();
        }, 100);
    };

    // Cerrar modal de selector de mapa
    window.closeMapPickerModal = function() {
        const modal = document.getElementById('mapPickerModal');
        if (!modal) return;

        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');

        // Limpiar marcadores
        clearMarkers();
    };

    // Inicializar el mapa interactivo con Google Maps
    function initializeMapPicker() {
        const container = document.getElementById('mapPickerContainer');
        if (!container) return;

        // Si el mapa ya existe, no recrearlo
        if (mapPickerMap) {
            google.maps.event.trigger(mapPickerMap, 'resize');
            return;
        }

        // Obtener ubicación inicial (casa o ubicación actual)
        const homeCoords = getUserHomeCoords();
        const initialLat = homeCoords ? homeCoords.lat : -33.4489; // Santiago, Chile
        const initialLng = homeCoords ? homeCoords.lng : -70.6693;

        // Crear mapa con Google Maps
        mapPickerMap = new google.maps.Map(container, {
            center: { lat: initialLat, lng: initialLng },
            zoom: 14,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy'
        });

        // Crear infoWindow para mostrar información
        infoWindow = new google.maps.InfoWindow();

        // Crear servicio de Places
        placesService = new google.maps.places.PlacesService(mapPickerMap);

        // Crear servicio de Autocomplete
        autocompleteService = new google.maps.places.AutocompleteService();

        // Evento de clic en el mapa
        mapPickerMap.addListener('click', function(e) {
            handleMapClick(e.latLng);
        });

        console.log('✅ Map Picker con Google Maps inicializado');
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
    function handleMapClick(latLng) {
        // Remover marcador anterior si existe
        if (mapPickerMarker) {
            mapPickerMarker.setMap(null);
        }

        // Agregar nuevo marcador
        mapPickerMarker = new google.maps.Marker({
            position: latLng,
            map: mapPickerMap,
            animation: google.maps.Animation.DROP,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
        });

        // Hacer geocoding inverso para obtener el nombre del lugar
        reverseGeocode(latLng.lat(), latLng.lng());
    }

    // Geocoding inverso usando Google Maps
    function reverseGeocode(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: lat, lng: lng };

        geocoder.geocode({ location: latlng }, function(results, status) {
            if (status === 'OK' && results[0]) {
                const placeName = results[0].formatted_address;
                const placeId = results[0].place_id;

                // Guardar ubicación seleccionada
                selectedLocation = {
                    name: placeName,
                    address: results[0].formatted_address,
                    lat: lat,
                    lng: lng,
                    placeId: placeId
                };

                // Mostrar información de ubicación
                document.getElementById('selectedLocationName').textContent = placeName;
                document.getElementById('selectedLocationCoords').textContent =
                    `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                document.getElementById('selectedLocationInfo').style.display = 'block';
                document.getElementById('btnConfirmLocation').disabled = false;

            } else {
                console.error('Geocoding falló:', status);

                // Fallback
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
        });
    }

    // Búsqueda de lugares usando Google Places Autocomplete
    let searchTimeout;
    function handleMapSearch(e) {
        const query = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 3) {
            document.getElementById('mapSearchSuggestions').innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            if (!autocompleteService) return;

            // Obtener centro del mapa para resultados localizados
            const center = mapPickerMap.getCenter();

            autocompleteService.getPlacePredictions({
                input: query,
                location: center,
                radius: 50000, // 50km
                language: 'es'
            }, displaySearchResults);
        }, 300);
    }

    // Mostrar resultados de búsqueda
    function displaySearchResults(predictions, status) {
        const suggestionsDiv = document.getElementById('mapSearchSuggestions');

        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            suggestionsDiv.innerHTML = '<div class="autocomplete-item">No se encontraron resultados</div>';
            return;
        }

        suggestionsDiv.innerHTML = predictions.map(prediction => `
            <div class="autocomplete-item" data-place-id="${prediction.place_id}">
                <strong>${prediction.structured_formatting.main_text}</strong>
                <small style="display: block; color: var(--text-muted);">
                    ${prediction.structured_formatting.secondary_text || ''}
                </small>
            </div>
        `).join('');

        // Agregar eventos a las sugerencias
        suggestionsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                const placeId = this.dataset.placeId;
                selectPlaceById(placeId);
                document.getElementById('mapSearchInput').value = '';
                suggestionsDiv.innerHTML = '';
            });
        });
    }

    // Seleccionar lugar por ID
    function selectPlaceById(placeId) {
        if (!placesService) return;

        placesService.getDetails({
            placeId: placeId,
            fields: ['name', 'formatted_address', 'geometry', 'place_id']
        }, function(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                // Centrar mapa en la ubicación
                mapPickerMap.setCenter(place.geometry.location);
                mapPickerMap.setZoom(16);

                // Simular clic en el mapa
                handleMapClick(place.geometry.location);
            }
        });
    }

    // Cargar lugares cercanos de interés
    function loadNearbyPlaces() {
        if (!mapPickerMap || !placesService) return;

        const center = mapPickerMap.getCenter();

        const request = {
            location: center,
            radius: 2000, // 2km
            type: ['restaurant', 'cafe', 'store', 'supermarket', 'bank', 'pharmacy', 'gas_station']
        };

        placesService.nearbySearch(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                displayNearbyPlaces(results.slice(0, 20)); // Limitar a 20 lugares
            }
        });
    }

    // Mostrar lugares cercanos en el mapa
    function displayNearbyPlaces(places) {
        // Limpiar marcadores anteriores
        nearbyMarkers.forEach(marker => marker.setMap(null));
        nearbyMarkers = [];

        places.forEach(place => {
            const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: mapPickerMap,
                title: place.name,
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new google.maps.Size(32, 32)
                }
            });

            // Click en marcador de lugar cercano
            marker.addListener('click', function() {
                infoWindow.setContent(`
                    <div style="padding: 8px;">
                        <strong>${place.name}</strong><br>
                        <small>${place.vicinity || ''}</small><br>
                        <button onclick="selectNearbyPlace('${place.place_id}')"
                                class="btn btn-primary btn-sm"
                                style="margin-top: 8px;">
                            Seleccionar esta ubicación
                        </button>
                    </div>
                `);
                infoWindow.open(mapPickerMap, marker);
            });

            nearbyMarkers.push(marker);
        });

        console.log(`✅ ${places.length} lugares cercanos cargados`);
    }

    // Seleccionar lugar cercano
    window.selectNearbyPlace = function(placeId) {
        selectPlaceById(placeId);
        infoWindow.close();
    };

    // Cargar todas las tareas en el mapa
    function loadAllTasksOnMap() {
        if (!mapPickerMap) return;

        // Obtener tareas del localStorage
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

        // Limpiar marcadores anteriores
        taskMarkers.forEach(marker => marker.setMap(null));
        taskMarkers = [];

        tasks.forEach(task => {
            if (task.location && task.location.lat && task.location.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: task.location.lat, lng: task.location.lng },
                    map: mapPickerMap,
                    title: task.name,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new google.maps.Size(28, 28)
                    }
                });

                // Click en marcador de tarea
                marker.addListener('click', function() {
                    infoWindow.setContent(`
                        <div style="padding: 8px;">
                            <strong>📋 ${task.name}</strong><br>
                            <small>Duración: ${task.duration || 1}h</small><br>
                            <small>Prioridad: ${task.priority || 'media'}</small><br>
                            <small>${task.location.address || ''}</small>
                        </div>
                    `);
                    infoWindow.open(mapPickerMap, marker);
                });

                taskMarkers.push(marker);
            }
        });

        if (taskMarkers.length > 0) {
            console.log(`✅ ${taskMarkers.length} tareas mostradas en el mapa`);
        }
    }

    // Cargar ubicaciones favoritas
    function loadFavoriteLocations() {
        const favorites = getFavoriteLocations();

        if (favorites.length === 0) return;

        // Crear sección de favoritos en el modal
        const modalBody = document.querySelector('#mapPickerModal .modal-body');
        let favSection = document.getElementById('favoritesSection');

        if (!favSection) {
            favSection = document.createElement('div');
            favSection.id = 'favoritesSection';
            favSection.className = 'favorites-section';
            favSection.innerHTML = '<h4>⭐ Ubicaciones Favoritas</h4><div id="favoritesList"></div>';
            modalBody.insertBefore(favSection, modalBody.firstChild.nextSibling);
        }

        const favoritesList = document.getElementById('favoritesList');
        favoritesList.innerHTML = favorites.map((fav, index) => `
            <button class="favorite-location-btn" onclick="selectFavorite(${index})">
                <span class="favorite-icon">📍</span>
                <span class="favorite-name">${fav.name}</span>
                <span class="favorite-remove" onclick="event.stopPropagation(); removeFavorite(${index})">✕</span>
            </button>
        `).join('');
    }

    // Obtener ubicaciones favoritas
    function getFavoriteLocations() {
        try {
            return JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
        } catch (e) {
            return [];
        }
    }

    // Guardar ubicación como favorita
    function saveFavoriteLocation(location) {
        const favorites = getFavoriteLocations();

        // Verificar si ya existe
        const exists = favorites.some(fav => fav.placeId === location.placeId);
        if (exists) {
            return;
        }

        favorites.push(location);
        localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
        loadFavoriteLocations();
    }

    // Seleccionar favorito
    window.selectFavorite = function(index) {
        const favorites = getFavoriteLocations();
        const fav = favorites[index];

        if (fav) {
            mapPickerMap.setCenter({ lat: fav.lat, lng: fav.lng });
            mapPickerMap.setZoom(16);
            handleMapClick(new google.maps.LatLng(fav.lat, fav.lng));
        }
    };

    // Eliminar favorito
    window.removeFavorite = function(index) {
        const favorites = getFavoriteLocations();
        favorites.splice(index, 1);
        localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
        loadFavoriteLocations();
    };

    // Limpiar todos los marcadores
    function clearMarkers() {
        if (mapPickerMarker) {
            mapPickerMarker.setMap(null);
            mapPickerMarker = null;
        }

        nearbyMarkers.forEach(marker => marker.setMap(null));
        nearbyMarkers = [];

        taskMarkers.forEach(marker => marker.setMap(null));
        taskMarkers = [];
    }

    // Confirmar ubicación seleccionada
    window.confirmMapLocation = function() {
        if (!selectedLocation) return;

        // Determinar qué input rellenar
        const targetInput = isModalPicker
            ? document.getElementById('modalTaskLocation')
            : document.getElementById('taskLocation');

        if (targetInput) {
            targetInput.value = selectedLocation.name;
            targetInput.dataset.lat = selectedLocation.lat;
            targetInput.dataset.lng = selectedLocation.lng;
            targetInput.dataset.placeId = selectedLocation.placeId || '';
        }

        // Preguntar si quiere guardar como favorito
        if (confirm('¿Deseas guardar esta ubicación en favoritos?')) {
            saveFavoriteLocation(selectedLocation);
        }

        // Cerrar modal
        closeMapPickerModal();

        // Mostrar mensaje
        if (typeof showToast === 'function') {
            showToast('Ubicación seleccionada correctamente', 'success');
        }
    };

    console.log('✅ Map Picker con Google Maps cargado');
})();
