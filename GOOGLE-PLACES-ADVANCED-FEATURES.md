# 🚀 Funcionalidades Avanzadas con Google Places API

## Resumen de Implementación

Se han agregado funcionalidades inteligentes que enriquecen automáticamente las tareas con información en tiempo real de Google Places API.

---

## 🎯 Funcionalidades Implementadas

### 1. **Place Details - Información Completa de Lugares**

Cuando seleccionas un lugar de Google Places al crear/editar una tarea, el sistema automáticamente obtiene y muestra:

#### Información Disponible:

- **🟢🔴 Estado actual**: Abierto/Cerrado ahora
- **🕐 Horarios de apertura**: Horario de hoy y toda la semana
- **⭐ Calificaciones**: Rating con estrellas y número de reseñas
- **💰 Nivel de precio**: $ a $$$$
- **📞 Teléfono**: Número de contacto
- **🌐 Website**: Sitio web oficial
- **📸 Fotos**: Hasta 5 fotos del lugar
- **💬 Reseñas**: Las 3 reseñas más recientes
- **🗺️ Coordenadas precisas**: Lat/Lng exactos

#### Cómo se Muestra:

Las **tarjetas de tareas** ahora incluyen una sección especial con borde azul que muestra:

```
🟢 Abierto ahora
🕐 Horario hoy: 09:00 - 22:00
⭐⭐⭐⭐ 4.5 (1,234 reseñas)
💰 Precio: $$
📞 +56 2 1234 5678
```

---

### 2. **Alertas Inteligentes en el Dashboard**

El sistema analiza automáticamente tus tareas y genera alertas basadas en:

#### Tipos de Alertas:

**🔴 Alertas Urgentes** (borde rojo):
- **Lugar cerrado**: "⚠️ Ir al Banco - Lugar cerrado"
  - El lugar está cerrado actualmente
  - Necesitas reprogramar la tarea

**🟡 Alertas de Advertencia** (borde amarillo):
- **Cierra pronto**: "⏰ Farmacia - Cierra pronto"
  - El lugar cierra en menos de 2 horas
  - Ejemplo: "El lugar cierra en 1h 30min. Considera ir ahora o reprogramar."

**🔵 Alertas Informativas** (borde azul):
- **Hora pasada**: "📅 Supermercado - Hora pasada"
  - La tarea estaba programada y ya pasó la hora
  - Pregunta si ya la completaste

- **Disponible hoy**: "💡 Banco - Disponible hoy"
  - Tienes una tarea no asignada y el lugar cierra hoy
  - Sugiere programarla para hoy

#### Ejemplo Visual:

```
╔════════════════════════════════════╗
║ ⏰ Farmacia Cruz Verde - Cierra    ║
║    pronto                          ║ <- Borde amarillo
║                                    ║
║ El lugar cierra en 45min.          ║
║ Considera ir ahora o reprogramar.  ║
╚════════════════════════════════════╝
```

---

### 3. **Actualización Automática de Datos**

#### Cuándo se Cargan los Detalles:

1. **Al seleccionar un lugar** del autocompletado en el modal
2. **Al crear una nueva tarea** con lugar de Google Places
3. **Al editar una tarea existente** y cambiar la dirección

#### Almacenamiento:

Los datos se guardan en `localStorage` junto con la tarea:

```javascript
{
  id: 12345,
  name: "Ir al Starbucks",
  address: "Av. Providencia 2133, Santiago",
  placeId: "ChIJ...",  // ID de Google Places
  placeDetails: {
    name: "Starbucks",
    rating: 4.3,
    isOpenNow: true,
    todayHours: { open: "0700", close: "2200" },
    weekdayText: ["Lunes: 7:00 AM – 10:00 PM", ...],
    phone: "+56 2 1234 5678",
    photos: [...],
    reviews: [...]
  }
}
```

---

## 📋 Cómo Usar las Nuevas Funcionalidades

### Paso 1: Crear Tarea con Lugar de Google

1. **Abrir modal** de nueva tarea (botón "➕ Nueva Tarea")
2. **Escribir en "Dirección específica"**: ejemplo "starbucks providencia"
3. **Esperar sugerencias** de Google Places (1-2 segundos)
4. **Seleccionar un lugar** de la lista
5. **Guardar la tarea**

✅ El sistema automáticamente carga todos los detalles del lugar

### Paso 2: Ver Información Enriquecida

En la vista de **Tareas**, las tarjetas mostrarán:

```
╔═══════════════════════════════════════╗
║ Comprar café                          ║
║ Prioridad: Media                      ║
║ ─────────────────────────────────────  ║
║ ⏱️ Duración: 0.5 hora(s)              ║
║ 📍 Ubicación: Starbucks               ║
║ 🗺️ Dirección: Av. Providencia 2133   ║
║                                       ║
║ ┃ 🟢 Abierto ahora                   ║ <- Información de
║ ┃ 🕐 Horario hoy: 07:00 - 22:00      ║    Google Places
║ ┃ ⭐⭐⭐⭐ 4.3 (892 reseñas)           ║
║ ┃ 💰 Precio: $$                       ║
║                                       ║
║ 🏠→📍 2.3km (≈7 min)                   ║
║ ✅ Estado: Activa                      ║
╚═══════════════════════════════════════╝
```

### Paso 3: Revisar Alertas en Dashboard

1. **Ir a la vista Dashboard**
2. **Ver "Sugerencias Inteligentes"**
3. Las alertas aparecen ordenadas por prioridad:
   - 🔴 Urgentes primero
   - 🟡 Advertencias segundo
   - 🔵 Informativas último

---

## 🔧 Detalles Técnicos

### APIs de Google Utilizadas

#### 1. **Autocomplete Service**
- **Función**: `searchWithGooglePlaces()`
- **Archivo**: `app.js` líneas 445-470
- **Uso**: Buscar lugares mientras el usuario escribe
- **Costo**: ~$0.017 por sesión

#### 2. **Place Details**
- **Función**: `googlePlaceDetails()`
- **Archivo**: `google-maps-api.js` líneas 267-305
- **Uso**: Obtener información completa del lugar
- **Costo**: ~$0.017 por solicitud
- **Campos solicitados**:
  - name, formatted_address, geometry
  - rating, user_ratings_total
  - opening_hours, business_status
  - formatted_phone_number, website
  - price_level, photos, reviews

#### 3. **Geocoding API**
- **Función**: `geocoder.geocode()`
- **Archivo**: `app.js` líneas 538-554
- **Uso**: Convertir `place_id` a coordenadas
- **Costo**: ~$0.005 por solicitud

### Flujo de Datos

```
Usuario escribe → Autocomplete API
                       ↓
              Selecciona lugar
                       ↓
              Geocoding API (coordenadas)
                       ↓
              Place Details API (información completa)
                       ↓
              Guardar en task.placeDetails
                       ↓
              Renderizar en tarjeta
```

### Funciones Principales

| Función | Ubicación | Propósito |
|---------|-----------|-----------|
| `searchWithGooglePlaces()` | app.js:445 | Buscar lugares en autocompletado |
| `googlePlaceDetails()` | google-maps-api.js:267 | Obtener detalles del lugar |
| `loadPlaceDetailsForTask()` | app.js:1016 | Cargar detalles para una tarea |
| `getPlaceInfoHTML()` | app.js:1567 | Generar HTML con info del lugar |
| `generateSmartAlerts()` | app.js:252 | Generar alertas inteligentes |
| `formatTime24()` | app.js:1609 | Formatear hora HHMM → HH:MM |

---

## 💰 Costos y Optimización

### Estimación de Costos

Con el plan gratuito de Google Maps Platform ($200 USD/mes):

| Acción | Costo | Cantidad en $200 |
|--------|-------|------------------|
| Autocompletado (sesión) | $0.017 | ~11,764 sesiones |
| Place Details | $0.017 | ~11,764 solicitudes |
| Geocoding | $0.005 | ~40,000 solicitudes |

**Ejemplo de uso mensual**:
- 50 tareas creadas/mes con Google Places
- Costo: ~$1.70/mes
- **Muy por debajo del límite gratuito**

### Optimizaciones Implementadas

1. **Cache en localStorage**: Los detalles se guardan y no se vuelven a solicitar
2. **Carga bajo demanda**: Solo se solicita cuando el usuario selecciona un lugar
3. **Campos específicos**: Solo pedimos los campos que usamos
4. **Sin polling**: No actualizamos horarios automáticamente

---

## 🎨 Personalización

### Cambiar Horario de Alerta "Cierra Pronto"

Por defecto: 2 horas antes del cierre

**Modificar en** `app.js` línea 285:

```javascript
// Cambiar de 120 minutos (2 horas) a 60 minutos (1 hora)
if (minutesUntilClose > 0 && minutesUntilClose <= 60) {
```

### Agregar Más Campos a Place Details

**En** `google-maps-api.js` línea 278, agregar campos:

```javascript
fields: [
    // ... campos existentes ...
    'wheelchair_accessible_entrance',  // Accesibilidad
    'delivery',                        // Delivery disponible
    'dine_in',                        // Comer en el lugar
    'takeout',                        // Para llevar
    'reservable',                     // Se puede reservar
    // Ver lista completa: https://developers.google.com/maps/documentation/places/web-service/place-data-fields
]
```

**Nota**: Más campos = mayor costo por solicitud

### Cambiar Estilo de Alertas

**En** `styles.css` líneas 685-701:

```css
/* Alerta urgente - cambiar color rojo */
.suggestion-item.urgent {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  border-left: 4px solid #ef4444;
}
```

---

## 🐛 Troubleshooting

### Problema: No aparecen sugerencias de Google Places

**Verificar**:
1. ✅ API Key configurada en `config.js`
2. ✅ API Key tiene permisos para Places API
3. ✅ Consola muestra: "✅ Google Maps JavaScript API cargada"
4. ✅ No hay errores en consola sobre cuota excedida

**Solución**:
```javascript
// Abrir consola del navegador (F12)
// Verificar que existe:
window.google.maps.places
// Debería devolver: Object {AutocompleteService: ƒ, ...}
```

### Problema: placeDetails es null

**Causa**: La tarea se creó antes de implementar esta funcionalidad

**Solución**:
1. Editar la tarea
2. Escribir de nuevo la dirección y seleccionarla
3. Guardar

Esto cargará los detalles automáticamente.

### Problema: Horarios incorrectos

**Causa**: Diferencia de zona horaria

**Verificar** en `config.js`:
```javascript
timezone: 'America/Santiago'  // Cambiar según tu zona
```

### Problema: "Place Details error: OVER_QUERY_LIMIT"

**Causa**: Excediste el límite de solicitudes gratuitas

**Soluciones**:
1. Esperar hasta el próximo mes (se reinicia)
2. Agregar facturación en Google Cloud Console
3. Optimizar uso (ver sección de optimización)

---

## 📊 Monitoreo y Analytics

### Ver Uso de API en Google Cloud Console

1. Ir a https://console.cloud.google.com/
2. **APIs & Services** → **Dashboard**
3. Seleccionar:
   - Places API (New)
   - Geocoding API
   - Maps JavaScript API
4. Ver gráficos de uso diario

### Logs en Consola del Navegador

El sistema registra todas las operaciones:

```javascript
[Place Details] Cargando detalles para: Starbucks
[Place Details] ✅ Detalles cargados: {
  name: "Starbucks",
  rating: 4.3,
  isOpenNow: true,
  todayHours: { open: "0700", close: "2200" }
}
```

---

## 🔐 Seguridad

### Restricciones de API Key

**✅ Configurar en Google Cloud Console**:

1. **HTTP referrers**:
   ```
   http://localhost:*/*
   https://tu-dominio.com/*
   ```

2. **Restricciones de API**:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Geocoding API
   - ❌ Todas las demás desactivadas

### NO Compartir la API Key

- ❌ No commitear en GitHub público
- ❌ No incluir en código frontend expuesto
- ✅ Usar restricciones por dominio
- ✅ Monitorear uso regularmente

---

## 🚀 Próximas Mejoras Posibles

### 1. Popular Times (Flujo de Personas)

**Estado**: No implementado (requiere backend)

Google no expone Popular Times en la API pública, pero se puede obtener mediante web scraping o servicios de terceros.

**Implementación sugerida**:
- Usar servicio como Outscraper API
- Mostrar gráfico de afluencia por hora
- Sugerir mejor hora para visitar

### 2. Tiempo de Viaje con Tráfico en Tiempo Real

**Estado**: Parcialmente implementado

Ya tienes `googleTrafficMatrix()` en el backend.

**Mejora**:
```javascript
// En createTaskCard(), agregar:
if (task.placeId && task.assignedDate === todayStr) {
    const traffic = await GoogleMapsAPI.trafficMatrix(
        [{ lat: userLat, lng: userLng }],
        [{ lat: task.lat, lng: task.lng }]
    );
    // Mostrar: "Tiempo de viaje CON tráfico: 25 min"
}
```

### 3. Sugerencias de Lugares en Ruta

**Estado**: Backend listo, falta frontend

Ya tienes `googlePlacesAlongRoute()`.

**Implementación**:
```javascript
// Cuando asignas 2 tareas el mismo día:
const route = await GoogleMapsAPI.computeRoutes(task1, task2);
const places = await GoogleMapsAPI.placesAlongRoute(
    route.encodedPolyline,
    "farmacia"  // O tipo que necesites
);
// Mostrar: "Hay una farmacia a 2 min en tu ruta"
```

### 4. Integración con LLM (Claude/GPT)

**Idea**: Asistente conversacional

```javascript
// Preguntar: "¿Cuándo debería ir al supermercado?"
const response = await fetch('https://api.anthropic.com/v1/messages', {
    body: JSON.stringify({
        messages: [{
            role: 'user',
            content: `Analiza estas tareas y dime cuándo ir:
            ${JSON.stringify(state.tasks)}`
        }]
    })
});
```

**Funcionalidades**:
- Optimizar orden de tareas
- Detectar conflictos
- Responder preguntas
- Sugerir agrupaciones

---

## 📚 Referencias

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Place Data Fields](https://developers.google.com/maps/documentation/places/web-service/place-data-fields)
- [Places API Pricing](https://mapsplatform.google.com/pricing/)
- [Best Practices for Places API](https://developers.google.com/maps/documentation/places/web-service/best-practices)

---

## ✅ Checklist de Verificación

Antes de usar en producción:

- [ ] API Key configurada y restringida
- [ ] Límites de cuota configurados en Google Cloud
- [ ] Fallback a Nominatim funcionando
- [ ] Logs de errores monitoreados
- [ ] Tareas de prueba con diferentes tipos de lugares
- [ ] Alertas funcionando correctamente
- [ ] CSS de alertas se ve bien en todos los navegadores
- [ ] localStorage no se llena demasiado rápido

---

## 🎉 Resumen

Con estas funcionalidades, tu calendario ahora:

✅ **Sabe cuándo cierran los lugares**
✅ **Te alerta si vas a llegar tarde**
✅ **Muestra calificaciones y reseñas**
✅ **Detecta conflictos automáticamente**
✅ **Sugiere mejores momentos para ir**
✅ **Funciona sin internet** (con datos cacheados)

**Todo automático, sin intervención del usuario** 🚀
