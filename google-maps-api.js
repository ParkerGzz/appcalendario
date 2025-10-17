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
        console.warn('[Google Distance Matrix] Backend no disponible, usando estimación básica');
        // Retornar matriz básica con estimaciones
        return generateBasicDistanceMatrix(origins, destinations, mode);
    }
}

/**
 * Genera una matriz de distancias básica sin backend
 * @param {Array} origins
 * @param {Array} destinations
 * @param {String} mode
 * @returns {Object}
 */
function generateBasicDistanceMatrix(origins, destinations, mode) {
    const rows = origins.map((origin, i) => {
        const elements = destinations.map((dest, j) => {
            // Calcular distancia en línea recta (Haversine)
            const distance = calculateHaversineDistance(
                origin.lat, origin.lng,
                dest.lat, dest.lng
            );

            // Estimar duración según modo
            let speedKmH = 30; // driving default
            if (mode === 'walking') speedKmH = 5;
            else if (mode === 'bicycling') speedKmH = 15;
            else if (mode === 'transit') speedKmH = 25;

            const durationSeconds = Math.round((distance / speedKmH) * 3600);

            return {
                distance: {
                    text: `${distance.toFixed(1)} km`,
                    value: Math.round(distance * 1000)
                },
                duration: {
                    text: `${Math.round(durationSeconds / 60)} min`,
                    value: durationSeconds
                },
                status: 'OK'
            };
        });

        return { elements };
    });

    return {
        origin_addresses: origins.map(o => `${o.lat}, ${o.lng}`),
        destination_addresses: destinations.map(d => `${d.lat}, ${d.lng}`),
        rows
    };
}

/**
 * Calcula distancia Haversine entre dos puntos
 * @param {Number} lat1
 * @param {Number} lon1
 * @param {Number} lat2
 * @param {Number} lon2
 * @returns {Number} Distancia en km
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
 * Obtiene detalles completos de un lugar usando Place ID
 * @param {String} placeId - ID del lugar de Google
 * @returns {Promise<Object>} - Detalles completos del lugar
 */
async function googlePlaceDetails(placeId) {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
        throw new Error('Google Places API no está cargada');
    }

    return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement('div'));

        service.getDetails(
            {
                placeId: placeId,
                fields: [
                    'name',
                    'formatted_address',
                    'geometry',
                    'place_id',
                    'rating',
                    'user_ratings_total',
                    'opening_hours',
                    'business_status',
                    'formatted_phone_number',
                    'website',
                    'price_level',
                    'photos',
                    'reviews',
                    'types',
                    'url'
                ]
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(parseGooglePlaceDetails(place));
                } else {
                    reject(new Error(`Place Details error: ${status}`));
                }
            }
        );
    });
}

/**
 * Parsea detalles completos de un lugar
 * @param {Object} place - Resultado de Places Details API
 * @returns {Object} - Información formateada
 */
function parseGooglePlaceDetails(place) {
    const openingHours = place.opening_hours;
    const isOpenNow = openingHours?.isOpen() || false;

    // Obtener horarios de la semana
    const weekdayText = openingHours?.weekday_text || [];

    // Obtener horarios de hoy
    let todayHours = null;
    if (openingHours && openingHours.periods) {
        const today = new Date().getDay();
        const todayPeriod = openingHours.periods.find(p => p.open.day === today);
        if (todayPeriod) {
            todayHours = {
                open: todayPeriod.open.time,
                close: todayPeriod.close?.time || '2400'
            };
        }
    }

    // Obtener fotos
    const photos = [];
    if (place.photos && place.photos.length > 0) {
        place.photos.slice(0, 5).forEach(photo => {
            photos.push({
                url: photo.getUrl({ maxWidth: 400, maxHeight: 300 }),
                attributions: photo.html_attributions
            });
        });
    }

    // Obtener reseñas
    const reviews = [];
    if (place.reviews && place.reviews.length > 0) {
        place.reviews.slice(0, 3).forEach(review => {
            reviews.push({
                author: review.author_name,
                rating: review.rating,
                text: review.text,
                time: review.relative_time_description
            });
        });
    }

    return {
        placeId: place.place_id,
        name: place.name || 'Sin nombre',
        address: place.formatted_address || '',
        lat: place.geometry?.location.lat() || 0,
        lng: place.geometry?.location.lng() || 0,
        rating: place.rating || null,
        ratingCount: place.user_ratings_total || 0,
        priceLevel: place.price_level || null, // 0-4 ($ a $$$$)
        phone: place.formatted_phone_number || null,
        website: place.website || null,
        googleMapsUrl: place.url || null,
        types: place.types || [],
        businessStatus: place.business_status || null,

        // Horarios
        isOpenNow: isOpenNow,
        weekdayText: weekdayText,
        todayHours: todayHours,

        // Contenido
        photos: photos,
        reviews: reviews
    };
}

/**
 * Parsea un lugar de Google Places API (versión simplificada)
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
/**
 * Estima el nivel de ocupación de un lugar basado en tipo y hora
 * @param {String} placeType - Tipo de lugar (supermercado, farmacia, banco, etc.)
 * @param {Date} datetime - Fecha y hora para la estimación
 * @returns {Object} - {level: 'low'|'medium'|'high', percentage: 0-100, description: String}
 */
function estimatePlaceBusyness(placeType, datetime = new Date()) {
    const hour = datetime.getHours();
    const dayOfWeek = datetime.getDay(); // 0 = domingo, 6 = sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Patrones de ocupación por tipo de lugar
    const patterns = {
        supermercado: {
            weekday: {
                peak: [12, 13, 18, 19, 20], // Hora del almuerzo y después del trabajo
                high: [9, 10, 11, 14, 17, 21],
                medium: [8, 15, 16],
                low: [7, 22, 23]
            },
            weekend: {
                peak: [10, 11, 12, 13],
                high: [9, 14, 15, 16, 17],
                medium: [8, 18, 19],
                low: [7, 20, 21]
            }
        },
        farmacia: {
            weekday: {
                peak: [12, 13, 18, 19],
                high: [9, 10, 11, 17, 20],
                medium: [8, 14, 15, 16, 21],
                low: [7, 22, 23]
            },
            weekend: {
                peak: [10, 11, 12],
                high: [9, 13, 14],
                medium: [8, 15, 16],
                low: [7, 17, 18]
            }
        },
        banco: {
            weekday: {
                peak: [12, 13],
                high: [9, 10, 11, 14, 15],
                medium: [8, 16, 17],
                low: [7, 18]
            },
            weekend: {
                peak: [],
                high: [],
                medium: [],
                low: [] // Cerrado generalmente
            }
        },
        gasolinera: {
            weekday: {
                peak: [7, 8, 18, 19],
                high: [9, 17, 20],
                medium: [10, 11, 12, 13, 14, 15, 16, 21],
                low: [6, 22, 23]
            },
            weekend: {
                peak: [10, 11, 12],
                high: [9, 13, 14, 15],
                medium: [8, 16, 17, 18],
                low: [7, 19, 20]
            }
        },
        restaurante: {
            weekday: {
                peak: [13, 14, 20, 21],
                high: [12, 15, 19, 22],
                medium: [11, 16, 18, 23],
                low: [10, 17]
            },
            weekend: {
                peak: [13, 14, 15, 20, 21, 22],
                high: [12, 16, 19, 23],
                medium: [11, 17, 18],
                low: [10]
            }
        },
        default: {
            weekday: {
                peak: [12, 13, 18, 19],
                high: [10, 11, 14, 17, 20],
                medium: [9, 15, 16, 21],
                low: [8, 22, 23]
            },
            weekend: {
                peak: [11, 12, 13],
                high: [10, 14, 15, 16],
                medium: [9, 17, 18],
                low: [8, 19, 20]
            }
        }
    };

    // Obtener patrón para el tipo de lugar (o usar default)
    const pattern = patterns[placeType] || patterns.default;
    const schedule = isWeekend ? pattern.weekend : pattern.weekday;

    // Determinar nivel de ocupación
    let level, percentage, description;

    if (schedule.peak.includes(hour)) {
        level = 'high';
        percentage = 80 + Math.floor(Math.random() * 20); // 80-100%
        description = 'Muy concurrido';
    } else if (schedule.high.includes(hour)) {
        level = 'medium-high';
        percentage = 60 + Math.floor(Math.random() * 20); // 60-80%
        description = 'Bastante concurrido';
    } else if (schedule.medium.includes(hour)) {
        level = 'medium';
        percentage = 40 + Math.floor(Math.random() * 20); // 40-60%
        description = 'Moderadamente concurrido';
    } else if (schedule.low.includes(hour)) {
        level = 'low';
        percentage = 10 + Math.floor(Math.random() * 30); // 10-40%
        description = 'Poco concurrido';
    } else {
        level = 'unknown';
        percentage = 50;
        description = 'Ocupación desconocida';
    }

    return {
        level,
        percentage,
        description,
        estimatedAt: datetime.toISOString(),
        isEstimate: true
    };
}

window.GoogleMapsAPI = {
    computeRoutes: googleComputeRoutes,
    parseRoute: parseGoogleRoute,
    trafficMatrix: googleTrafficMatrix,
    calculateDetour: googleCalculateDetour,
    placesAlongRoute: googlePlacesAlongRoute,
    placesNearby: googlePlacesNearby,
    placeDetails: googlePlaceDetails,
    parsePlace: parseGooglePlace,
    parsePlaceDetails: parseGooglePlaceDetails,
    planRouteWithStops: googlePlanRouteWithStops,
    estimateBusyness: estimatePlaceBusyness
};

console.log('✅ Google Maps API functions loaded');
