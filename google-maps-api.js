// google-maps-api.js
// Funciones para integrar con Google Maps Platform APIs vía backend

// ===== ROUTES API =====

/**
 * Calcula rutas usando Google Routes API
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @param {String} mode - "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"
 * @param {Boolean} alternatives - Incluir rutas alternativas
 * @param {String} departureTimeISO - Hora de salida (ISO string)
 * @returns {Promise<Object>} - Resultado con routes[]
 */
async function googleComputeRoutes(origin, destination, mode = 'DRIVE', alternatives = true, departureTimeISO = null) {
    if (!window.APP_CONFIG.useGoogleMaps) {
        console.warn('[Google Maps] useGoogleMaps está desactivado, usando fallback');
        throw new Error('Google Maps desactivado. Activa en config.js');
    }

    const url = `${window.APP_CONFIG.backendURL}/api/route`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origin,
                destination,
                mode,
                alternatives,
                departureTimeISO: departureTimeISO || new Date().toISOString()
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en Routes API');
        }

        const data = await response.json();
        console.log('[Google Routes] Rutas calculadas:', data.routes?.length || 0);

        return data;

    } catch (error) {
        console.error('[Google Routes] Error:', error);
        throw error;
    }
}

/**
 * Extrae información de una ruta de Google
 * @param {Object} route - Ruta de Google Routes API
 * @returns {Object} - Información formateada
 */
function parseGoogleRoute(route) {
    const durationSeconds = parseInt(route.duration?.replace('s', '') || 0);
    const distanceMeters = route.distanceMeters || 0;

    return {
        distanceKm: (distanceMeters / 1000).toFixed(1),
        distanceMeters,
        durationMinutes: Math.round(durationSeconds / 60),
        durationSeconds,
        durationText: `${Math.round(durationSeconds / 60)} min`,
        distanceText: `${(distanceMeters / 1000).toFixed(1)} km`,
        encodedPolyline: route.polyline?.encodedPolyline || '',
        legs: route.legs || [],
        routeLabels: route.routeLabels || []
    };
}

// ===== DISTANCE MATRIX API =====

/**
 * Calcula matriz de distancias con tráfico
 * @param {Array} origins - [{lat, lng}, ...]
 * @param {Array} destinations - [{lat, lng}, ...]
 * @param {String} departureTimeISO - Hora de salida
 * @param {String} mode - "driving" | "walking" | "bicycling" | "transit"
 * @param {String} trafficModel - "best_guess" | "pessimistic" | "optimistic"
 * @returns {Promise<Object>} - Matriz de distancias
 */
async function googleTrafficMatrix(origins, destinations, departureTimeISO = null, mode = 'driving', trafficModel = 'best_guess') {
    if (!window.APP_CONFIG.useGoogleMaps) {
        throw new Error('Google Maps desactivado');
    }

    const url = `${window.APP_CONFIG.backendURL}/api/traffic-matrix`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origins,
                destinations,
                departureTimeISO: departureTimeISO || new Date().toISOString(),
                mode,
                trafficModel
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en Distance Matrix API');
        }

        const data = await response.json();
        console.log('[Google Distance Matrix] Matriz calculada');

        return data;

    } catch (error) {
        console.error('[Google Distance Matrix] Error:', error);
        throw error;
    }
}

/**
 * Calcula el desvío de incluir una parada en la ruta
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @param {Object} waypoint - {lat, lng}
 * @param {String} departureTimeISO - Hora de salida
 * @returns {Promise<Object>} - Información del desvío
 */
async function googleCalculateDetour(origin, destination, waypoint, departureTimeISO = null) {
    if (!window.APP_CONFIG.useGoogleMaps) {
        throw new Error('Google Maps desactivado');
    }

    const url = `${window.APP_CONFIG.backendURL}/api/calculate-detour`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origin,
                destination,
                waypoint,
                departureTimeISO: departureTimeISO || new Date().toISOString()
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error calculando desvío');
        }

        const data = await response.json();
        console.log('[Google Detour] Desvío calculado:', data.detour.minutes, 'min');

        return data;

    } catch (error) {
        console.error('[Google Detour] Error:', error);
        throw error;
    }
}

// ===== PLACES API =====

/**
 * Busca lugares a lo largo de una ruta
 * @param {String} encodedPolyline - Polyline de la ruta
 * @param {String} textQuery - "supermercado", "farmacia", etc.
 * @param {Object} originBiasOptional - {lat, lng} opcional
 * @param {Number} maxResults - Máximo de resultados
 * @returns {Promise<Object>} - Lugares encontrados
 */
async function googlePlacesAlongRoute(encodedPolyline, textQuery, originBiasOptional = null, maxResults = 10) {
    if (!window.APP_CONFIG.useGoogleMaps) {
        throw new Error('Google Maps desactivado');
    }

    const url = `${window.APP_CONFIG.backendURL}/api/places-along-route`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                textQuery,
                encodedPolyline,
                originBiasOptional,
                maxResults
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en Places API');
        }

        const data = await response.json();
        console.log('[Google Places] Lugares encontrados:', data.places?.length || 0);

        return data;

    } catch (error) {
        console.error('[Google Places] Error:', error);
        throw error;
    }
}

/**
 * Busca lugares cerca de un punto
 * @param {Object} location - {lat, lng}
 * @param {Number} radius - Radio en metros
 * @param {Array} includedTypes - ["supermarket", "pharmacy"]
 * @param {Number} maxResults - Máximo de resultados
 * @returns {Promise<Object>} - Lugares encontrados
 */
async function googlePlacesNearby(location, radius = 2000, includedTypes = [], maxResults = 10) {
    if (!window.APP_CONFIG.useGoogleMaps) {
        throw new Error('Google Maps desactivado');
    }

    const url = `${window.APP_CONFIG.backendURL}/api/places-nearby`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location,
                radius,
                includedTypes,
                maxResults
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en Places Nearby API');
        }

        const data = await response.json();
        console.log('[Google Places Nearby] Lugares encontrados:', data.places?.length || 0);

        return data;

    } catch (error) {
        console.error('[Google Places Nearby] Error:', error);
        throw error;
    }
}

/**
 * Parsea un lugar de Google Places API
 * @param {Object} place - Lugar de Places API
 * @returns {Object} - Información formateada
 */
function parseGooglePlace(place) {
    return {
        id: place.id,
        name: place.displayName?.text || 'Sin nombre',
        address: place.formattedAddress || '',
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
        types: place.types || [],
        rating: place.rating || null,
        ratingCount: place.userRatingCount || 0,
        isOpen: place.businessStatus === 'OPERATIONAL',
        googleMapsUri: place.googleMapsUri || '',
        openingHours: place.currentOpeningHours?.weekdayDescriptions || []
    };
}

// ===== FLUJO COMPLETO: PLANIFICAR RUTA CON PARADAS =====

/**
 * Flujo completo: Calcula ruta, encuentra POIs y sugiere paradas
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @param {String} mode - "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"
 * @param {Array} poiTypes - ["supermercado", "farmacia"]
 * @param {String} departureTimeISO - Hora de salida
 * @returns {Promise<Object>} - Resultado completo
 */
async function googlePlanRouteWithStops(origin, destination, mode, poiTypes, departureTimeISO) {
    console.log('[Google Plan Route] Iniciando planificación completa...');

    try {
        // 1. Calcular ruta base
        const routesData = await googleComputeRoutes(origin, destination, mode, true, departureTimeISO);

        if (!routesData.routes || routesData.routes.length === 0) {
            throw new Error('No se encontraron rutas');
        }

        const mainRoute = routesData.routes[0];
        const routeInfo = parseGoogleRoute(mainRoute);

        console.log('[Google Plan Route] Ruta principal:', routeInfo.distanceKm, 'km,', routeInfo.durationMinutes, 'min');

        // 2. Buscar POIs a lo largo de la ruta para cada tipo
        const allPlaces = [];

        for (const poiType of poiTypes) {
            try {
                const placesData = await googlePlacesAlongRoute(
                    routeInfo.encodedPolyline,
                    poiType,
                    origin,
                    10
                );

                if (placesData.places && placesData.places.length > 0) {
                    const parsedPlaces = placesData.places.map(p => ({
                        ...parseGooglePlace(p),
                        poiType,
                        detour: null // Se calculará después
                    }));
                    allPlaces.push(...parsedPlaces);
                }
            } catch (error) {
                console.warn(`[Google Plan Route] Error buscando ${poiType}:`, error.message);
            }
        }

        console.log('[Google Plan Route] POIs encontrados:', allPlaces.length);

        // 3. Calcular desvío para cada POI (límite de 10 para no saturar la API)
        const placesWithDetour = [];
        const maxPlacesToCalculate = Math.min(allPlaces.length, 10);

        for (let i = 0; i < maxPlacesToCalculate; i++) {
            const place = allPlaces[i];
            try {
                const detourData = await googleCalculateDetour(
                    origin,
                    destination,
                    { lat: place.lat, lng: place.lng },
                    departureTimeISO
                );

                placesWithDetour.push({
                    ...place,
                    detour: detourData.detour
                });

                // Delay para respetar rate limits
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.warn(`[Google Plan Route] Error calculando desvío para ${place.name}:`, error.message);
                placesWithDetour.push({
                    ...place,
                    detour: { minutes: 999, seconds: 999999 } // Desvío desconocido
                });
            }
        }

        // 4. Ordenar por desvío
        placesWithDetour.sort((a, b) => a.detour.minutes - b.detour.minutes);

        console.log('[Google Plan Route] Planificación completa exitosa');

        return {
            route: routeInfo,
            alternativeRoutes: routesData.routes.slice(1).map(parseGoogleRoute),
            places: placesWithDetour,
            summary: {
                totalPlaces: placesWithDetour.length,
                minDetour: placesWithDetour[0]?.detour?.minutes || 0,
                maxDetour: placesWithDetour[placesWithDetour.length - 1]?.detour?.minutes || 0
            }
        };

    } catch (error) {
        console.error('[Google Plan Route] Error:', error);
        throw error;
    }
}

// ===== EXPORTAR FUNCIONES =====
window.GoogleMapsAPI = {
    computeRoutes: googleComputeRoutes,
    parseRoute: parseGoogleRoute,
    trafficMatrix: googleTrafficMatrix,
    calculateDetour: googleCalculateDetour,
    placesAlongRoute: googlePlacesAlongRoute,
    placesNearby: googlePlacesNearby,
    parsePlace: parseGooglePlace,
    planRouteWithStops: googlePlanRouteWithStops
};

console.log('✅ Google Maps API functions loaded');
