/**
 * Map Picker con Google Maps - VERSIÓN CORREGIDA
 * Selector de ubicación interactivo con manejo robusto de carga
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
    let isGoogleMapsLoaded = false;

    console.log('🗺️ Map Picker: Iniciando carga...');

    // Verificar si Google Maps está cargado
    function checkGoogleMaps() {
        return typeof google !== 'undefined' &&
               google.maps &&
               google.maps.Map &&
               google.maps.places;
    }

    // Esperar a que Google Maps esté completamente cargado
    function waitForGoogleMaps() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo

            const checkInterval = setInterval(() => {
                attempts++;

                if (checkGoogleMaps()) {
                    clearInterval(checkInterval);
                    isGoogleMapsLoaded = true;
                    console.log('✅ Google Maps cargado correctamente');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('❌ Google Maps no se cargó a tiempo');
                    reject(new Error('Google Maps no disponible'));
                }
            }, 100);
        });
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        try {
            // Esperar a que Google Maps se cargue
            await waitForGoogleMaps();
            initMapPicker();
        } catch (error) {
            console.error('Error inicializando Map Picker:', error);
            showError('No se pudo cargar Google Maps. Por favor, recarga la página.');
        }
    }

    function initMapPicker() {
        console.log('✅ Inicializando Map Picker con Google Maps');

        // Botones para abrir selector
        const selectFromMapBtn = document.getElementById('selectFromMap');
        if (selectFromMapBtn) {
            selectFromMapBtn.addEventListener('click', function(e) {
                e.preventDefault();
                isModalPicker = false;
                openMapPickerModal();
            });
        }

        const selectFromMapModalBtn = document.getElementById('selectFromMapModal');
        if (selectFromMapModalBtn) {
            selectFromMapModalBtn.addEventListener('click', function(e) {
                e.preventDefault();
                isModalPicker = true;
                openMapPickerModal();
            });
        }

        // Búsqueda
        const mapSearchInput = document.getElementById('mapSearchInput');
        if (mapSearchInput) {
            mapSearchInput.addEventListener('input', handleMapSearch);
        }

        console.log('✅ Event listeners configurados');
    }

    // Abrir modal
    window.openMapPickerModal = function() {
        if (!isGoogleMapsLoaded) {
            alert('Google Maps aún no está cargado. Espera un momento e intenta de nuevo.');
            return;
        }

        const modal = document.getElementById('mapPickerModal');
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }

        console.log('🗺️ Abriendo modal de mapa...');

        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Resetear
        selectedLocation = null;
        const btnConfirm = document.getElementById('btnConfirmLocation');
        if (btnConfirm) btnConfirm.disabled = true;

        const locationInfo = document.getElementById('selectedLocationInfo');
        if (locationInfo) locationInfo.style.display = 'none';

        // Inicializar mapa
        setTimeout(() => {
            try {
                initializeMapPicker();
                loadNearbyPlaces();
                loadAllTasksOnMap();
                loadFavoriteLocations();
            } catch (error) {
                console.error('Error inicializando componentes del mapa:', error);
                showError('Error al cargar el mapa');
            }
        }, 150);
    };

    // Cerrar modal
    window.closeMapPickerModal = function() {
        const modal = document.getElementById('mapPickerModal');
        if (!modal) return;

        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');

        // Limpiar
        clearMarkers();

        // Limpiar búsqueda
        const searchInput = document.getElementById('mapSearchInput');
        if (searchInput) searchInput.value = '';

        const suggestions = document.getElementById('mapSearchSuggestions');
        if (suggestions) suggestions.innerHTML = '';
    };

    // Inicializar mapa
    function initializeMapPicker() {
        const container = document.getElementById('mapPickerContainer');
        if (!container) {
            console.error('Contenedor del mapa no encontrado');
            return;
        }

        // Si ya existe, solo ajustar tamaño
        if (mapPickerMap) {
            google.maps.event.trigger(mapPickerMap, 'resize');
            return;
        }

        console.log('🗺️ Creando mapa...');

        const homeCoords = getUserHomeCoords();
        const initialLat = homeCoords ? homeCoords.lat : -33.4489;
        const initialLng = homeCoords ? homeCoords.lng : -70.6693;

        try {
            mapPickerMap = new google.maps.Map(container, {
                center: { lat: initialLat, lng: initialLng },
                zoom: 14,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                gestureHandling: 'greedy',
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'on' }]
                    }
                ]
            });

            infoWindow = new google.maps.InfoWindow();
            placesService = new google.maps.places.PlacesService(mapPickerMap);
            autocompleteService = new google.maps.places.AutocompleteService();

            // Click en el mapa
            mapPickerMap.addListener('click', function(e) {
                handleMapClick(e.latLng);
            });

            console.log('✅ Mapa creado exitosamente');
        } catch (error) {
            console.error('Error creando mapa:', error);
            showError('Error al crear el mapa');
        }
    }

    function getUserHomeCoords() {
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (settings.homeLocation?.lat && settings.homeLocation?.lng) {
                return settings.homeLocation;
            }
        } catch (e) {}
        return null;
    }

    function handleMapClick(latLng) {
        console.log('📍 Click en mapa:', latLng.lat(), latLng.lng());

        if (mapPickerMarker) {
            mapPickerMarker.setMap(null);
        }

        mapPickerMarker = new google.maps.Marker({
            position: latLng,
            map: mapPickerMap,
            animation: google.maps.Animation.DROP,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
        });

        reverseGeocode(latLng.lat(), latLng.lng());
    }

    function reverseGeocode(lat, lng) {
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ location: { lat, lng } }, function(results, status) {
            if (status === 'OK' && results[0]) {
                selectedLocation = {
                    name: results[0].formatted_address,
                    address: results[0].formatted_address,
                    lat: lat,
                    lng: lng,
                    placeId: results[0].place_id
                };

                document.getElementById('selectedLocationName').textContent = selectedLocation.name;
                document.getElementById('selectedLocationCoords').textContent =
                    `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                document.getElementById('selectedLocationInfo').style.display = 'block';
                document.getElementById('btnConfirmLocation').disabled = false;

                console.log('✅ Ubicación seleccionada:', selectedLocation.name);
            } else {
                console.warn('Geocoding falló:', status);
                selectedLocation = {
                    name: `Ubicación (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
                    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    lat, lng, placeId: null
                };

                document.getElementById('selectedLocationName').textContent = selectedLocation.name;
                document.getElementById('selectedLocationCoords').textContent = selectedLocation.address;
                document.getElementById('selectedLocationInfo').style.display = 'block';
                document.getElementById('btnConfirmLocation').disabled = false;
            }
        });
    }

    // Búsqueda
    let searchTimeout;
    function handleMapSearch(e) {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);

        const suggestionsDiv = document.getElementById('mapSearchSuggestions');
        if (query.length < 3) {
            suggestionsDiv.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            if (!autocompleteService || !mapPickerMap) return;

            autocompleteService.getPlacePredictions({
                input: query,
                location: mapPickerMap.getCenter(),
                radius: 50000,
                language: 'es',
                componentRestrictions: { country: 'cl' }
            }, displaySearchResults);
        }, 300);
    }

    function displaySearchResults(predictions, status) {
        const suggestionsDiv = document.getElementById('mapSearchSuggestions');

        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            suggestionsDiv.innerHTML = '<div class="autocomplete-item">No se encontraron resultados</div>';
            return;
        }

        suggestionsDiv.innerHTML = predictions.map(prediction => `
            <div class="autocomplete-item" data-place-id="${prediction.place_id}">
                <strong>${prediction.structured_formatting.main_text}</strong>
                <small style="display: block; color: #64748b;">
                    ${prediction.structured_formatting.secondary_text || ''}
                </small>
            </div>
        `).join('');

        suggestionsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                selectPlaceById(this.dataset.placeId);
                document.getElementById('mapSearchInput').value = '';
                suggestionsDiv.innerHTML = '';
            });
        });
    }

    function selectPlaceById(placeId) {
        if (!placesService) return;

        placesService.getDetails({
            placeId: placeId,
            fields: ['name', 'formatted_address', 'geometry', 'place_id']
        }, function(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                mapPickerMap.setCenter(place.geometry.location);
                mapPickerMap.setZoom(16);
                handleMapClick(place.geometry.location);
            }
        });
    }

    // Lugares cercanos
    function loadNearbyPlaces() {
        if (!mapPickerMap || !placesService) return;

        const center = mapPickerMap.getCenter();

        try {
            placesService.nearbySearch({
                location: center,
                radius: 2000,
                type: ['restaurant', 'cafe', 'store', 'supermarket', 'bank', 'pharmacy', 'gas_station']
            }, function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    displayNearbyPlaces(results.slice(0, 20));
                } else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    console.warn('⚠️ Error cargando lugares cercanos:', status);
                }
            });
        } catch (error) {
            console.error('❌ Error en nearbySearch:', error);
        }
    }

    function displayNearbyPlaces(places) {
        nearbyMarkers.forEach(m => m.setMap(null));
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

            marker.addListener('click', function() {
                infoWindow.setContent(`
                    <div style="padding: 8px; max-width: 200px;">
                        <strong>${place.name}</strong><br>
                        <small>${place.vicinity || ''}</small><br>
                        <button onclick="selectNearbyPlace('${place.place_id}')"
                                style="margin-top: 8px; padding: 6px 12px; background: #10155f; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Seleccionar
                        </button>
                    </div>
                `);
                infoWindow.open(mapPickerMap, marker);
            });

            nearbyMarkers.push(marker);
        });

        console.log(`✅ ${places.length} lugares cercanos cargados`);
    }

    window.selectNearbyPlace = function(placeId) {
        selectPlaceById(placeId);
        if (infoWindow) infoWindow.close();
    };

    // Tareas en el mapa
    function loadAllTasksOnMap() {
        if (!mapPickerMap) return;

        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        taskMarkers.forEach(m => m.setMap(null));
        taskMarkers = [];

        tasks.forEach(task => {
            if (task.location?.lat && task.location?.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: task.location.lat, lng: task.location.lng },
                    map: mapPickerMap,
                    title: task.name,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new google.maps.Size(28, 28)
                    }
                });

                marker.addListener('click', function() {
                    infoWindow.setContent(`
                        <div style="padding: 8px; max-width: 200px;">
                            <strong>📋 ${task.name}</strong><br>
                            <small>Duración: ${task.duration || 1}h</small><br>
                            <small>Prioridad: ${task.priority || 'media'}</small>
                        </div>
                    `);
                    infoWindow.open(mapPickerMap, marker);
                });

                taskMarkers.push(marker);
            }
        });

        if (taskMarkers.length > 0) {
            console.log(`✅ ${taskMarkers.length} tareas en el mapa`);
        }
    }

    // Favoritos
    function loadFavoriteLocations() {
        const favorites = getFavoriteLocations();
        if (favorites.length === 0) return;

        const modalBody = document.querySelector('#mapPickerModal .modal-body');
        let favSection = document.getElementById('favoritesSection');

        if (!favSection) {
            favSection = document.createElement('div');
            favSection.id = 'favoritesSection';
            favSection.className = 'favorites-section';
            favSection.innerHTML = '<h4>⭐ Ubicaciones Favoritas</h4><div id="favoritesList"></div>';

            const instructions = modalBody.querySelector('.map-picker-instructions');
            if (instructions) {
                modalBody.insertBefore(favSection, instructions.nextSibling);
            }
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

    function getFavoriteLocations() {
        try {
            return JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
        } catch (e) {
            return [];
        }
    }

    window.selectFavorite = function(index) {
        const favorites = getFavoriteLocations();
        const fav = favorites[index];
        if (fav && mapPickerMap) {
            mapPickerMap.setCenter({ lat: fav.lat, lng: fav.lng });
            mapPickerMap.setZoom(16);
            handleMapClick(new google.maps.LatLng(fav.lat, fav.lng));
        }
    };

    window.removeFavorite = function(index) {
        const favorites = getFavoriteLocations();
        favorites.splice(index, 1);
        localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
        loadFavoriteLocations();
    };

    function clearMarkers() {
        if (mapPickerMarker) {
            mapPickerMarker.setMap(null);
            mapPickerMarker = null;
        }
        nearbyMarkers.forEach(m => m.setMap(null));
        nearbyMarkers = [];
        taskMarkers.forEach(m => m.setMap(null));
        taskMarkers = [];
    }

    // Confirmar
    window.confirmMapLocation = function() {
        if (!selectedLocation) return;

        const targetInput = isModalPicker
            ? document.getElementById('modalTaskLocation')
            : document.getElementById('taskLocation');

        if (targetInput) {
            targetInput.value = selectedLocation.name;
            targetInput.dataset.lat = selectedLocation.lat;
            targetInput.dataset.lng = selectedLocation.lng;
            targetInput.dataset.placeId = selectedLocation.placeId || '';
        }

        const favorites = getFavoriteLocations();
        const exists = favorites.some(f => f.placeId === selectedLocation.placeId);

        if (!exists && confirm('¿Deseas guardar esta ubicación en favoritos?')) {
            favorites.push(selectedLocation);
            localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
        }

        closeMapPickerModal();

        if (typeof showToast === 'function') {
            showToast('Ubicación seleccionada correctamente', 'success');
        }
    };

    function showError(message) {
        console.error(message);
        alert(message);
    }

    console.log('✅ Map Picker cargado y listo');
})();
