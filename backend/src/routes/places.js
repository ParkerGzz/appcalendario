// places.js - Google Places API (New) integration
import express from 'express';
const router = express.Router();

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';
const GMAPS_KEY = process.env.GMAPS_SERVER_KEY;

/**
 * POST /api/places-along-route
 * Busca lugares a lo largo de una ruta usando Places API (Text Search New)
 * con "Search along route" feature
 *
 * Body:
 * {
 *   textQuery: string ("supermarket", "farmacia", etc),
 *   encodedPolyline: string (de Routes API),
 *   originBiasOptional: { lat: number, lng: number },
 *   maxResults: number
 * }
 */
router.post('/places-along-route', async (req, res) => {
  try {
    const {
      textQuery,
      encodedPolyline,
      originBiasOptional,
      maxResults = 10
    } = req.body;

    // Validación
    if (!textQuery) {
      return res.status(400).json({ error: 'textQuery es requerido' });
    }
    if (!encodedPolyline) {
      return res.status(400).json({ error: 'encodedPolyline es requerido' });
    }

    // Construir body de la petición
    const body = {
      textQuery,
      maxResultCount: Math.min(maxResults, 20), // Max 20 por Google
      searchAlongRouteParameters: {
        polyline: {
          encodedPolyline
        }
      }
    };

    // Agregar bias de origen si se proporciona
    if (originBiasOptional) {
      body.routingParameters = {
        origin: {
          latitude: originBiasOptional.lat,
          longitude: originBiasOptional.lng
        }
      };
    }

    console.log('[Places API] Request:', {
      query: textQuery,
      polylineLength: encodedPolyline.length,
      maxResults
    });

    // Llamada a Google Places API
    const response = await fetch(PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY,
        // FieldMask: pedir campos necesarios
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,' +
          'places.types,places.rating,places.userRatingCount,places.businessStatus,' +
          'places.currentOpeningHours,places.googleMapsUri'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Places API] Error:', data);
      return res.status(response.status).json({
        error: 'Error en Places API',
        details: data
      });
    }

    console.log('[Places API] Success:', data.places?.length || 0, 'lugares encontrados');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Places API] Exception:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/places-nearby
 * Busca lugares cerca de un punto específico (Nearby Search)
 *
 * Body:
 * {
 *   location: { lat: number, lng: number },
 *   radius: number (metros),
 *   includedTypes: string[] (["supermarket", "pharmacy"]),
 *   maxResults: number
 * }
 */
router.post('/places-nearby', async (req, res) => {
  try {
    const {
      location,
      radius = 2000,
      includedTypes,
      maxResults = 10
    } = req.body;

    // Validación
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ error: 'location con lat/lng es requerido' });
    }

    const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

    const body = {
      maxResultCount: Math.min(maxResults, 20),
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng
          },
          radius: radius
        }
      }
    };

    // Agregar tipos si se especifican
    if (includedTypes && Array.isArray(includedTypes) && includedTypes.length > 0) {
      body.includedTypes = includedTypes;
    }

    console.log('[Places Nearby] Request:', {
      location,
      radius,
      types: includedTypes,
      maxResults
    });

    const response = await fetch(NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,' +
          'places.types,places.rating,places.userRatingCount,places.businessStatus,' +
          'places.currentOpeningHours,places.googleMapsUri'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Places Nearby] Error:', data);
      return res.status(response.status).json({
        error: 'Error en Places Nearby API',
        details: data
      });
    }

    console.log('[Places Nearby] Success:', data.places?.length || 0, 'lugares encontrados');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Places Nearby] Exception:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * Mapeo de categorías en español a tipos de Google Places
 */
const CATEGORY_TYPE_MAP = {
  'supermercado': ['supermarket', 'grocery_store'],
  'farmacia': ['pharmacy', 'drugstore'],
  'banco': ['bank', 'atm'],
  'gasolinera': ['gas_station'],
  'correo': ['post_office'],
  'tienda': ['convenience_store', 'store'],
  'restaurante': ['restaurant'],
  'cafe': ['cafe'],
  'panaderia': ['bakery'],
  'gimnasio': ['gym'],
  'hospital': ['hospital'],
  'dentista': ['dentist']
};

/**
 * GET /api/category-types/:category
 * Obtiene los tipos de Google Places para una categoría en español
 */
router.get('/category-types/:category', (req, res) => {
  const category = req.params.category.toLowerCase();
  const types = CATEGORY_TYPE_MAP[category];

  if (!types) {
    return res.status(404).json({
      error: 'Categoría no encontrada',
      availableCategories: Object.keys(CATEGORY_TYPE_MAP)
    });
  }

  return res.status(200).json({
    category,
    types,
    query: category
  });
});

export default router;
