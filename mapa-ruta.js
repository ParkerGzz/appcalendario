// ========================================
// MAPA INTERACTIVO DE RUTA
// ========================================

// Variables globales del mapa
let routeMap = null;
let directionsService = null;
let directionsRenderer = null;
let trafficLayer = null;
let routeMarkers = [];
let isTrafficLayerVisible = false;

/**
 * Inicializa el mapa de Google Maps
 */
function initializeRouteMap() {
    console.log('🗺️ Inicializando mapa de ruta...');

    if (!window.google || !window.google.maps) {
        console.error('❌ Google Maps API no está cargada');
        showMapError('Google Maps API no disponible. Recarga la página.');
        return false;
    }

    const mapContainer = document.getElementById('routeMapContainer');
    if (!mapContainer) {
        console.error('❌ Contenedor del mapa no encontrado');
        return false;
    }

    try {
        // Determinar centro del mapa (usar ubicación de casa si existe, sino Santiago)
        let center = { lat: -33.4489, lng: -70.6693 }; // Santiago por defecto

        if (state.locations && state.locations.home && state.locations.home.lat) {
            center = {
                lat: state.locations.home.lat,
                lng: state.locations.home.lng
            };
        }

        // Crear mapa
        routeMap = new google.maps.Map(mapContainer, {
            zoom: 13,
            center: center,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            streetViewControl: false,
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP
            },
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            },
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        // Inicializar servicios de Directions
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: routeMap,
            suppressMarkers: true, // Usaremos marcadores personalizados
            polylineOptions: {
                strokeColor: '#7C3AED',
                strokeWeight: 5,
                strokeOpacity: 0.8
            },
            preserveViewport: false
        });

        // Inicializar capa de tráfico (oculta por defecto)
        trafficLayer = new google.maps.TrafficLayer();

        console.log('✅ Mapa inicializado correctamente');
        return true;

    } catch (error) {
        console.error('❌ Error inicializando mapa:', error);
        showMapError('Error al inicializar el mapa');
        return false;
    }
}

/**
 * Muestra un error en el contenedor del mapa
 */
function showMapError(message) {
    const mapContainer = document.getElementById('routeMapContainer');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="map-loading">
                <div style="font-size: 48px;">🗺️</div>
                <div class="map-loading-text" style="color: var(--danger);">${escapeHtml(message)}</div>
            </div>
        `;
    }
}

/**
 * Muestra indicador de carga en el mapa
 */
function showMapLoading(message = 'Calculando ruta...') {
    const mapContainer = document.getElementById('routeMapContainer');
    if (mapContainer && !routeMap) {
        mapContainer.innerHTML = `
            <div class="map-loading">
                <div class="map-loading-spinner"></div>
                <div class="map-loading-text">${escapeHtml(message)}</div>
            </div>
        `;
    }
}

/**
 * Muestra la ruta en el mapa usando Google Directions API
 * @param {Array} tasks - Array de tareas con lat/lng
 * @param {String} mode - Modo de transporte: 'driving', 'walking', 'bicycling', 'transit'
 */
function displayRouteOnMap(tasks, mode = 'driving') {
    console.log('🗺️ Mostrando ruta en mapa:', { tasks: tasks.length, mode });

    if (!routeMap || !directionsService || !directionsRenderer) {
        console.error('❌ Mapa no inicializado');
        showNotification('Inicializando mapa...', 'info');
        if (initializeRouteMap()) {
            // Reintentar después de inicializar
            setTimeout(() => displayRouteOnMap(tasks, mode), 500);
        }
        return;
    }

    // Limpiar marcadores anteriores
    clearRouteMarkers();

    // Validar tareas con ubicación
    const validTasks = tasks.filter(t => t.lat && t.lng);
    if (validTasks.length < 2) {
        console.warn('⚠️ Se necesitan al menos 2 tareas con ubicación');
        showMapError('Agrega al menos 2 tareas con ubicación para ver la ruta');
        return;
    }

    // Determinar origen y destino
    let origin, destination;

    // Usar ubicación de casa como origen si existe
    if (state.locations && state.locations.home && state.locations.home.lat) {
        origin = {
            lat: state.locations.home.lat,
            lng: state.locations.home.lng
        };
        // Primera tarea es destino si solo hay una tarea
        destination = validTasks.length === 1 ?
            { lat: validTasks[0].lat, lng: validTasks[0].lng } :
            { lat: validTasks[validTasks.length - 1].lat, lng: validTasks[validTasks.length - 1].lng };
    } else {
        // Usar primera y última tarea
        origin = { lat: validTasks[0].lat, lng: validTasks[0].lng };
        destination = { lat: validTasks[validTasks.length - 1].lat, lng: validTasks[validTasks.length - 1].lng };
    }

    // Waypoints intermedios
    let waypoints = [];
    if (state.locations && state.locations.home && state.locations.home.lat) {
        // Si usamos casa como origen, todas las tareas son waypoints
        waypoints = validTasks.map(task => ({
            location: { lat: task.lat, lng: task.lng },
            stopover: true
        }));
    } else {
        // Si usamos primera tarea como origen, las intermedias son waypoints
        waypoints = validTasks.slice(1, -1).map(task => ({
            location: { lat: task.lat, lng: task.lng },
            stopover: true
        }));
    }

    // Mapear modo de transporte
    const travelModes = {
        'driving': google.maps.TravelMode.DRIVING,
        'walking': google.maps.TravelMode.WALKING,
        'bicycling': google.maps.TravelMode.BICYCLING,
        'transit': google.maps.TravelMode.TRANSIT
    };

    const travelMode = travelModes[mode.toLowerCase()] || google.maps.TravelMode.DRIVING;

    // Configurar solicitud de ruta
    const request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: travelMode,
        optimizeWaypoints: true, // Google optimiza el orden
        avoidHighways: false,
        avoidTolls: false,
        provideRouteAlternatives: false
    };

    // Solicitar ruta
    console.log('📍 Solicitando ruta:', request);

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            console.log('✅ Ruta calculada correctamente');

            // Mostrar ruta en el mapa
            directionsRenderer.setDirections(result);

            // Obtener información de la ruta
            const route = result.routes[0];

            // Calcular distancia y duración totales
            let totalDistance = 0;
            let totalDuration = 0;

            route.legs.forEach(leg => {
                totalDistance += leg.distance.value; // en metros
                totalDuration += leg.duration.value; // en segundos
            });

            const distanceKm = (totalDistance / 1000).toFixed(1);
            const durationMin = Math.round(totalDuration / 60);

            // Actualizar resumen
            updateRouteSummaryInfo({
                distance: distanceKm,
                duration: durationMin,
                mode: mode
            });

            // Agregar marcadores personalizados
            addCustomMarkersToRoute(validTasks, route);

            console.log('✅ Ruta mostrada:', {
                distance: distanceKm + ' km',
                duration: durationMin + ' min'
            });

        } else {
            console.error('❌ Error calculando ruta:', status);

            let errorMessage = 'No se pudo calcular la ruta.';
            if (status === 'ZERO_RESULTS') {
                errorMessage = 'No hay rutas disponibles para este modo de transporte.';
            } else if (status === 'NOT_FOUND') {
                errorMessage = 'Una o más ubicaciones no se encontraron.';
            } else if (status === 'REQUEST_DENIED') {
                errorMessage = 'Error de API key. Verifica tu configuración.';
            }

            showNotification(errorMessage, 'error');
            showMapError(errorMessage);
        }
    });
}

/**
 * Agrega marcadores personalizados con números
 */
function addCustomMarkersToRoute(tasks, routeResult) {
    // Limpiar marcadores anteriores
    clearRouteMarkers();

    tasks.forEach((task, index) => {
        const marker = new google.maps.Marker({
            position: { lat: task.lat, lng: task.lng },
            map: routeMap,
            title: task.name,
            label: {
                text: String(index + 1),
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 18,
                fillColor: '#7C3AED',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3
            },
            animation: google.maps.Animation.DROP
        });

        // Info window con detalles
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="custom-info-window">
                    <h4>${escapeHtml(task.name)}</h4>
                    <p>📍 ${escapeHtml(task.address || task.location)}</p>
                    <p>⏱️ Duración estimada: ${escapeHtml(task.duration)}h</p>
                    ${task.priority ? `<p>⚡ Prioridad: ${escapeHtml(task.priority)}</p>` : ''}
                    <span class="task-duration">Parada ${index + 1} de ${tasks.length}</span>
                </div>
            `
        });

        // Abrir info window al hacer click
        marker.addListener('click', () => {
            infoWindow.open(routeMap, marker);
        });

        routeMarkers.push(marker);
    });

    console.log(`✅ ${routeMarkers.length} marcadores agregados`);
}

/**
 * Limpia los marcadores del mapa
 */
function clearRouteMarkers() {
    routeMarkers.forEach(marker => marker.setMap(null));
    routeMarkers = [];
}

/**
 * Actualiza el resumen de la ruta en la UI
 */
function updateRouteSummaryInfo(info) {
    const summaryDiv = document.getElementById('routeSummaryInfo');
    if (!summaryDiv) return;

    const modeLabels = {
        'driving': '🚗 En auto',
        'walking': '🚶 Caminando',
        'bicycling': '🚴 En bicicleta',
        'transit': '🚌 Transporte público'
    };

    summaryDiv.innerHTML = `
        <div class="route-summary">
            <div class="route-summary-item">
                <span class="route-summary-label">Distancia</span>
                <span class="route-summary-value">${escapeHtml(info.distance)} km</span>
            </div>
            <div class="route-summary-item">
                <span class="route-summary-label">Duración</span>
                <span class="route-summary-value">${escapeHtml(info.duration)} min</span>
            </div>
        </div>
        <div style="text-align: center; margin-top: 12px; color: var(--text-light); font-size: 14px;">
            Modo: ${modeLabels[info.mode] || info.mode}
        </div>
    `;
}

/**
 * Alterna la visualización de la capa de tráfico
 */
function toggleTrafficLayer() {
    if (!routeMap || !trafficLayer) {
        console.warn('⚠️ Mapa no inicializado');
        return;
    }

    const btn = document.getElementById('btnToggleTraffic');

    if (isTrafficLayerVisible) {
        trafficLayer.setMap(null);
        isTrafficLayerVisible = false;
        if (btn) {
            btn.classList.remove('active');
        }
        console.log('🚦 Capa de tráfico ocultada');
    } else {
        trafficLayer.setMap(routeMap);
        isTrafficLayerVisible = true;
        if (btn) {
            btn.classList.add('active');
        }
        console.log('🚦 Capa de tráfico mostrada');
    }
}

/**
 * Centra el mapa en la ubicación actual del usuario
 */
function centerMapOnUserLocation() {
    if (!routeMap) {
        console.warn('⚠️ Mapa no inicializado');
        return;
    }

    if (!navigator.geolocation) {
        showNotification('Tu navegador no soporta geolocalización', 'error');
        return;
    }

    const btn = document.getElementById('btnMyLocation');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⌛ Ubicando...';
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            routeMap.setCenter(pos);
            routeMap.setZoom(15);

            // Agregar marcador temporal
            const marker = new google.maps.Marker({
                position: pos,
                map: routeMap,
                title: 'Tu ubicación actual',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2
                },
                animation: google.maps.Animation.BOUNCE
            });

            setTimeout(() => marker.setAnimation(null), 2000);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '📍 Mi Ubicación';
            }

            showNotification('Ubicación encontrada', 'success');
            console.log('📍 Ubicación del usuario:', pos);
        },
        (error) => {
            console.error('❌ Error obteniendo ubicación:', error);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '📍 Mi Ubicación';
            }

            let message = 'No se pudo obtener tu ubicación';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Permiso de ubicación denegado';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = 'Ubicación no disponible';
            } else if (error.code === error.TIMEOUT) {
                message = 'Tiempo de espera agotado';
            }

            showNotification(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

console.log('✅ Módulo de mapa de ruta cargado');
