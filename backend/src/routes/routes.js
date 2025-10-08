// routes.js - Google Routes API integration
import express from 'express';
const router = express.Router();

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GMAPS_KEY = process.env.GMAPS_SERVER_KEY;

/**
 * POST /api/route
 * Calcula rutas usando Google Routes API con soporte para:
 * - DRIVE, WALK, BICYCLE, TRANSIT
 * - Rutas alternativas
 * - Tráfico en tiempo real
 * - Preferencias de tránsito
 *
 * Body:
 * {
 *   origin: { lat: number, lng: number },
 *   destination: { lat: number, lng: number },
 *   mode: "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT",
 *   alternatives: boolean,
 *   departureTimeISO: string (ISO date)
 * }
 */
router.post('/route', async (req, res) => {
  try {
    const {
      origin,
      destination,
      mode = 'DRIVE',
      alternatives = true,
      departureTimeISO
    } = req.body;

    // Validación de entrada
    if (!origin || !origin.lat || !origin.lng) {
      return res.status(400).json({ error: 'Origin con lat/lng es requerido' });
    }
    if (!destination || !destination.lat || !destination.lng) {
      return res.status(400).json({ error: 'Destination con lat/lng es requerido' });
    }

    // Construir body de la petición a Google
    const body = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng
          }
        }
      },
      travelMode: mode,
      computeAlternativeRoutes: !!alternatives,
      polylineQuality: 'OVERVIEW',
      routingPreference: mode === 'DRIVE' ? 'TRAFFIC_AWARE_OPTIMAL' : 'ROUTING_PREFERENCE_UNSPECIFIED',
      languageCode: 'es',
      units: 'METRIC'
    };

    // Agregar tiempo de salida si se proporciona
    if (departureTimeISO) {
      body.departureTime = {
        seconds: Math.floor(new Date(departureTimeISO).getTime() / 1000)
      };
    }

    // Preferencias específicas para TRANSIT
    if (mode === 'TRANSIT') {
      body.transitPreferences = {
        routingPreference: 'LESS_WALKING'
      };
    }

    // Computaciones extra para DRIVE (tráfico)
    if (mode === 'DRIVE') {
      body.extraComputations = ['TRAFFIC_ON_POLYLINE'];
    }

    console.log('[Routes API] Request:', JSON.stringify(body, null, 2));

    // Llamada a Google Routes API
    const response = await fetch(ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY,
        // FieldMask: pedir SOLO lo necesario (optimización de costo/latencia)
        'X-Goog-FieldMask':
          'routes.distanceMeters,routes.duration,routes.staticDuration,' +
          'routes.polyline.encodedPolyline,routes.legs,routes.routeLabels,' +
          'routes.travelAdvisory,routes.description'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Routes API] Error:', data);
      return res.status(response.status).json({
        error: 'Error en Google Routes API',
        details: data
      });
    }

    console.log('[Routes API] Success:', data.routes?.length || 0, 'rutas');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Routes API] Exception:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

export default router;
