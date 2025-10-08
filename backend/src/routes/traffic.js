// traffic.js - Google Distance Matrix API integration
import express from 'express';
const router = express.Router();

const MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const GMAPS_KEY = process.env.GMAPS_SERVER_KEY;

/**
 * POST /api/traffic-matrix
 * Calcula matriz de distancias con tráfico en tiempo real usando Distance Matrix API
 *
 * Body:
 * {
 *   origins: [{ lat: number, lng: number }],
 *   destinations: [{ lat: number, lng: number }],
 *   departureTimeISO: string (ISO date),
 *   mode: "driving" | "walking" | "bicycling" | "transit",
 *   trafficModel: "best_guess" | "pessimistic" | "optimistic"
 * }
 */
router.post('/traffic-matrix', async (req, res) => {
  try {
    const {
      origins,
      destinations,
      departureTimeISO,
      mode = 'driving',
      trafficModel = 'best_guess'
    } = req.body;

    // Validación
    if (!origins || !Array.isArray(origins) || origins.length === 0) {
      return res.status(400).json({ error: 'Origins array es requerido' });
    }
    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: 'Destinations array es requerido' });
    }

    // Formatear coordenadas para la API
    const originsParam = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destParam = destinations.map(d => `${d.lat},${d.lng}`).join('|');

    // Timestamp de salida
    const departure = departureTimeISO
      ? Math.floor(new Date(departureTimeISO).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Construir URL
    const params = new URLSearchParams({
      origins: originsParam,
      destinations: destParam,
      mode: mode,
      language: 'es',
      units: 'metric',
      key: GMAPS_KEY
    });

    // Solo para driving: agregar departure_time y traffic_model
    if (mode === 'driving') {
      params.append('departure_time', departure.toString());
      params.append('traffic_model', trafficModel);
    }

    const url = `${MATRIX_URL}?${params.toString()}`;

    console.log('[Distance Matrix] Request:', {
      origins: origins.length,
      destinations: destinations.length,
      mode,
      departure: new Date(departure * 1000).toISOString()
    });

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.status !== 'OK') {
      console.error('[Distance Matrix] Error:', data);
      return res.status(response.ok ? 400 : response.status).json({
        error: 'Error en Distance Matrix API',
        details: data
      });
    }

    console.log('[Distance Matrix] Success:', data.rows?.length || 0, 'filas');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Distance Matrix] Exception:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/calculate-detour
 * Calcula el tiempo de desvío al incluir una parada intermedia
 *
 * Body:
 * {
 *   origin: { lat, lng },
 *   destination: { lat, lng },
 *   waypoint: { lat, lng },
 *   departureTimeISO: string
 * }
 */
router.post('/calculate-detour', async (req, res) => {
  try {
    const { origin, destination, waypoint, departureTimeISO } = req.body;

    // Validación
    if (!origin || !destination || !waypoint) {
      return res.status(400).json({ error: 'origin, destination y waypoint son requeridos' });
    }

    const departure = departureTimeISO
      ? Math.floor(new Date(departureTimeISO).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Calcular ruta directa
    const directParams = new URLSearchParams({
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${destination.lat},${destination.lng}`,
      mode: 'driving',
      departure_time: departure.toString(),
      traffic_model: 'best_guess',
      key: GMAPS_KEY
    });

    const directResponse = await fetch(`${MATRIX_URL}?${directParams.toString()}`);
    const directData = await directResponse.json();

    if (directData.status !== 'OK') {
      return res.status(400).json({ error: 'Error calculando ruta directa', details: directData });
    }

    // Calcular ruta con parada (origen -> waypoint -> destino)
    const withStopParams = new URLSearchParams({
      origins: `${origin.lat},${origin.lng}|${waypoint.lat},${waypoint.lng}`,
      destinations: `${waypoint.lat},${waypoint.lng}|${destination.lat},${destination.lng}`,
      mode: 'driving',
      departure_time: departure.toString(),
      traffic_model: 'best_guess',
      key: GMAPS_KEY
    });

    const withStopResponse = await fetch(`${MATRIX_URL}?${withStopParams.toString()}`);
    const withStopData = await withStopResponse.json();

    if (withStopData.status !== 'OK') {
      return res.status(400).json({ error: 'Error calculando ruta con parada', details: withStopData });
    }

    // Calcular tiempos
    const directDuration = directData.rows[0].elements[0].duration_in_traffic?.value ||
                          directData.rows[0].elements[0].duration.value;

    const leg1Duration = withStopData.rows[0].elements[0].duration_in_traffic?.value ||
                        withStopData.rows[0].elements[0].duration.value;
    const leg2Duration = withStopData.rows[1].elements[1].duration_in_traffic?.value ||
                        withStopData.rows[1].elements[1].duration.value;

    const totalWithStop = leg1Duration + leg2Duration;
    const detourSeconds = totalWithStop - directDuration;
    const detourMinutes = Math.round(detourSeconds / 60);

    return res.status(200).json({
      directRoute: {
        durationSeconds: directDuration,
        durationMinutes: Math.round(directDuration / 60),
        durationText: directData.rows[0].elements[0].duration.text,
        distance: directData.rows[0].elements[0].distance
      },
      withStop: {
        durationSeconds: totalWithStop,
        durationMinutes: Math.round(totalWithStop / 60),
        leg1: {
          durationSeconds: leg1Duration,
          durationMinutes: Math.round(leg1Duration / 60)
        },
        leg2: {
          durationSeconds: leg2Duration,
          durationMinutes: Math.round(leg2Duration / 60)
        }
      },
      detour: {
        seconds: detourSeconds,
        minutes: detourMinutes,
        percentage: Math.round((detourSeconds / directDuration) * 100)
      }
    });

  } catch (error) {
    console.error('[Calculate Detour] Exception:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

export default router;
