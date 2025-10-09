# Corrección: Google Places Autocomplete y Formato de Hora 24h

## Problemas Reportados

1. **Formato de hora inválido**: Al ingresar "12:30 p.m" el sistema rechazaba el formato
2. **Sin recomendaciones de ubicación**: El autocompletado no mostraba sugerencias de Google Maps

## Soluciones Implementadas

### 1. Normalización de Formato de Hora

**Problema**: El input `type="time"` en HTML5 requiere formato estricto **HH:MM** en 24 horas (ejemplo: `14:30`), pero rechaza formatos como "12:30 p.m" o "2:30".

**Solución**: Creada función `normalizeTimeFormat()` que convierte automáticamente diferentes formatos a HH:MM.

**Ubicación**: `app.js` líneas 1934-1975

**Formatos soportados**:
- ✅ `14:30` → `14:30` (ya correcto)
- ✅ `2:30` → `02:30` (agrega cero inicial)
- ✅ `12:30 pm` → `12:30`
- ✅ `12:30 p.m` → `12:30`
- ✅ `2:30 pm` → `14:30` (convierte a 24h)
- ✅ `2:30 am` → `02:30` (convierte a 24h)
- ✅ `1230` → `12:30` (número sin dos puntos)

**Ejemplos de conversión**:

```javascript
normalizeTimeFormat('12:30 p.m')  // → '12:30'
normalizeTimeFormat('2:30 pm')    // → '14:30'
normalizeTimeFormat('11:45 am')   // → '11:45'
normalizeTimeFormat('12:00 am')   // → '00:00'
normalizeTimeFormat('5:15')       // → '05:15'
```

**Integración**: La función se aplica automáticamente en:
- Carga de tareas existentes (línea 2634)
- Pre-relleno desde calendario (línea 2654)
- Guardado de tareas nuevas (línea 2728)
- Guardado de tareas editadas (línea 2705)

### 2. Google Places Autocomplete

**Problema**: El sistema usaba Nominatim (OpenStreetMap) que tiene menos precisión y cobertura que Google Places.

**Solución**: Implementado autocompletado dual que usa Google Places cuando está configurado, con fallback a Nominatim.

#### Archivos Modificados

**a) index.html (líneas 555-570)**

Agregado script que carga Google Maps JavaScript API automáticamente si está configurado:

```javascript
if (window.APP_CONFIG.useGoogleMaps && window.APP_CONFIG.googleMapsFrontendKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${APP_CONFIG.googleMapsFrontendKey}&libraries=places&language=es`;
    document.head.appendChild(script);
}
```

**b) app.js - Nueva función `searchWithGooglePlaces()` (líneas 445-470)**

Usa `google.maps.places.AutocompleteService` para buscar direcciones:

```javascript
const service = new google.maps.places.AutocompleteService();
service.getPlacePredictions({
    input: query,
    language: 'es',
    types: ['address', 'establishment']
}, callback);
```

**c) app.js - Función `searchAddresses()` actualizada (líneas 409-443)**

Ahora detecta automáticamente qué API usar:

```javascript
if (window.APP_CONFIG.useGoogleMaps && window.APP_CONFIG.googleMapsFrontendKey) {
    await searchWithGooglePlaces(query, ...);
} else {
    // Fallback a Nominatim
}
```

**d) app.js - Función `displaySuggestions()` actualizada (líneas 472-526)**

Soporta ambos formatos de respuesta:

```javascript
if (source === 'google') {
    // Google Places format
    address = suggestion.description;
    main = suggestion.structured_formatting.main_text;
    detail = suggestion.structured_formatting.secondary_text;
    placeId = suggestion.place_id;
} else {
    // Nominatim format
    address = suggestion.display_name;
    lat = suggestion.lat;
    lng = suggestion.lon;
}
```

**e) app.js - Función `selectSuggestion()` actualizada (líneas 528-571)**

Obtiene coordenadas desde Google Geocoding API cuando se usa Places:

```javascript
if (source === 'google' && placeId) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: placeId }, (results, status) => {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        // Guardar coordenadas...
    });
}
```

## Configuración Requerida

### Para Usar Google Places Autocomplete

1. **Obtener API Key de Google Maps Platform**:
   - Ir a https://console.cloud.google.com/
   - Crear proyecto nuevo o usar existente
   - Habilitar APIs:
     - ✅ Places API (New)
     - ✅ Geocoding API
     - ✅ Maps JavaScript API
   - Crear credenciales → API Key
   - Restringir por HTTP referrer (ejemplo: `localhost/*`, `*.tudominio.com/*`)

2. **Configurar en `config.js`**:

```javascript
window.APP_CONFIG = {
    useGoogleMaps: true,
    googleMapsFrontendKey: 'TU_API_KEY_AQUI',
    // ...
};
```

3. **Sin API Key**: El sistema funcionará con Nominatim automáticamente (menos preciso pero gratuito).

## Ventajas de Google Places

| Característica | Google Places | Nominatim |
|----------------|---------------|-----------|
| Precisión | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Velocidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Cobertura | Global completa | Global parcial |
| Negocios | ✅ Incluye establecimientos | ❌ Solo direcciones |
| Formato | Estructurado | Texto largo |
| Costo | 💰 Requiere API key | ✅ Gratis |

## Ejemplo de Uso

### Antes (Formato Rechazado)
```
Usuario ingresa: "12:30 p.m"
❌ Input dice: "formato no válido"
```

### Después (Normalizado Automáticamente)
```
Usuario ingresa: "12:30 p.m"
✅ Sistema convierte a: "12:30"
✅ Se guarda correctamente en formato 24h
```

### Autocompletado de Dirección

**Con Google Places**:
```
Usuario escribe: "starbucks santiago"
Sugerencias:
  ➤ Starbucks - Av. Providencia 2133
    Santiago, Región Metropolitana
  ➤ Starbucks - Mall Costanera Center
    Av. Andrés Bello 2425, Providencia
```

**Con Nominatim (fallback)**:
```
Usuario escribe: "providencia santiago"
Sugerencias:
  ➤ Providencia, Santiago, Región Metropolitana, Chile
  ➤ Avenida Providencia, Providencia, Santiago...
```

## Testing

Para probar los cambios:

### Test 1: Formato de Hora
1. Abrir modal de tarea (botón "➕ Nueva Tarea")
2. Ingresar hora: `2:30 pm`
3. Guardar tarea
4. Reabrir tarea → Debe mostrar `14:30`

### Test 2: Google Places (con API key)
1. Configurar API key en `config.js`
2. Recargar página
3. Consola debe mostrar: "✅ Google Maps JavaScript API cargada"
4. En modal, escribir dirección: "starbucks"
5. Deben aparecer sugerencias de establecimientos

### Test 3: Fallback a Nominatim (sin API key)
1. Dejar `googleMapsFrontendKey: ''` en config.js
2. Recargar página
3. Consola debe mostrar: "ℹ️ Google Maps desactivado o sin API key - usando Nominatim"
4. Autocompletado funciona con OpenStreetMap

## Compatibilidad

✅ Chrome 91+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 91+

**Nota**: Input `type="time"` es estándar HTML5, soportado por todos los navegadores modernos.

## Archivos Modificados

1. **app.js**:
   - Líneas 1934-1975: Nueva función `normalizeTimeFormat()`
   - Líneas 409-443: Actualizada `searchAddresses()` con lógica dual
   - Líneas 445-470: Nueva función `searchWithGooglePlaces()`
   - Líneas 472-526: Actualizada `displaySuggestions()` para ambos formatos
   - Líneas 528-571: Actualizada `selectSuggestion()` con geocoding
   - Líneas 2634, 2654, 2728, 2705: Aplicación de `normalizeTimeFormat()`

2. **index.html**:
   - Líneas 555-570: Script de carga de Google Maps JavaScript API

3. **config.js**:
   - Sin cambios (usuario debe agregar su API key)

## Notas Importantes

⚠️ **Cuota de Google Places**:
- Plan gratuito: $200 USD de crédito mensual
- Autocomplete por sesión: $0.017 (primera solicitud) + $0.00 (siguientes)
- Geocoding: $0.005 por solicitud
- Recomendado: Configurar límites de cuota en Google Cloud Console

⚠️ **Seguridad**:
- La API key debe estar restringida por HTTP referrer
- NO usar API key de backend en frontend
- NO commitear API keys en repositorios públicos

✅ **Fallback Automático**:
- Si Google Maps falla, Nominatim toma el control
- No se requiere intervención del usuario
- La experiencia degrada gracefully
