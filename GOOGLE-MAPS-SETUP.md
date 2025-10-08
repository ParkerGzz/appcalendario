# 🗺️ Guía de Configuración: Google Maps Platform

## Integración Completa con Routes, Distance Matrix y Places APIs

Esta guía te explica paso a paso cómo configurar Google Maps Platform para usar:
- ✅ **Routes API** - Rutas optimizadas con tráfico
- ✅ **Distance Matrix API** - Tiempos con tráfico en tiempo real
- ✅ **Places API (New)** - Búsqueda de lugares en la ruta

---

## 📋 Tabla de Contenidos

1. [Crear Proyecto en Google Cloud](#1-crear-proyecto-en-google-cloud)
2. [Habilitar APIs Necesarias](#2-habilitar-apis-necesarias)
3. [Crear y Configurar API Keys](#3-crear-y-configurar-api-keys)
4. [Restricciones de Seguridad](#4-restricciones-de-seguridad)
5. [Configurar el Backend](#5-configurar-el-backend)
6. [Configurar el Frontend](#6-configurar-el-frontend)
7. [Probar la Integración](#7-probar-la-integración)
8. [Costos y Límites](#8-costos-y-límites)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Crear Proyecto en Google Cloud

### Paso 1.1: Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Inicia sesión con tu cuenta de Google

### Paso 1.2: Crear Nuevo Proyecto
1. Click en el selector de proyectos (arriba a la izquierda)
2. Click en **"Nuevo Proyecto"**
3. Nombre del proyecto: `calendario-inteligente`
4. Click en **"Crear"**

### Paso 1.3: Activar Facturación
⚠️ **Importante**: Google Maps Platform requiere una cuenta de facturación activa, PERO:
- Google ofrece **$200 USD de crédito mensual gratis**
- La mayoría de apps pequeñas/medianas NO superan este crédito
- Puedes configurar alertas de presupuesto

**Para activar:**
1. Ve a: **Facturación** > **Vincular cuenta de facturación**
2. Crea una nueva cuenta o vincula una existente
3. Ingresa tus datos de pago (tarjeta de crédito)

💡 **Tip**: Configura una alerta de presupuesto en $50 para recibir notificaciones.

---

## 2. Habilitar APIs Necesarias

### Paso 2.1: Ir a APIs y Servicios
1. En el menú lateral: **APIs y servicios** > **Biblioteca**
2. Busca y habilita cada una de estas APIs:

### APIs a Habilitar:

#### ✅ Routes API
- **URL**: https://console.cloud.google.com/apis/library/routes.googleapis.com
- **Para**: Calcular rutas con tráfico, múltiples modos de transporte
- Click en **"HABILITAR"**

#### ✅ Distance Matrix API
- **URL**: https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com
- **Para**: Tiempos de viaje con tráfico en tiempo real
- Click en **"HABILITAR"**

#### ✅ Places API (New)
- **URL**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- **Para**: Buscar supermercados, farmacias, etc. en la ruta
- Click en **"HABILITAR"**

#### 🔧 Opcional: Maps JavaScript API
- **URL**: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
- **Para**: Mostrar mapas interactivos en el frontend
- Solo si quieres renderizar mapas visuales
- Click en **"HABILITAR"**

---

## 3. Crear y Configurar API Keys

Necesitamos **2 API Keys** diferentes:
- 🔑 **Server Key** (backend) - Para Routes, Distance Matrix, Places
- 🔑 **Frontend Key** (browser) - Solo para Maps JavaScript (opcional)

### Paso 3.1: Crear Server API Key

1. Ve a: **APIs y servicios** > **Credenciales**
2. Click en **"+ CREAR CREDENCIALES"**
3. Selecciona **"Clave de API"**
4. Se creará una API key, cópiala y guárdala en un lugar seguro
5. Click en **"EDITAR CLAVE DE API"**
6. Nombre: `calendario-server-key`

**⚠️ IMPORTANTE: Configurar restricciones (siguiente paso)**

### Paso 3.2: Crear Frontend API Key (opcional)

1. Repite el proceso anterior
2. Nombre: `calendario-frontend-key`
3. Esta key es SOLO si vas a usar Maps JavaScript API

---

## 4. Restricciones de Seguridad

### 4.1: Restringir Server Key (CRÍTICO)

**Restricción 1: Por IP del Servidor**

1. En la configuración de `calendario-server-key`
2. Sección **"Restricciones de aplicación"**
3. Selecciona **"Direcciones IP (servidores web, trabajos cron, etc.)"**
4. Agrega la IP de tu servidor:
   - **Desarrollo local**: `127.0.0.1`
   - **Producción**: Tu IP pública del servidor (ej: `203.0.113.45`)
5. Puedes agregar múltiples IPs separadas por comas

**Restricción 2: Por APIs**

1. Sección **"Restricciones de API"**
2. Selecciona **"Restringir clave"**
3. Selecciona SOLO estas APIs:
   - ✅ Routes API
   - ✅ Distance Matrix API
   - ✅ Places API (New)
4. Click en **"GUARDAR"**

### 4.2: Restringir Frontend Key (opcional)

**Restricción 1: Por HTTP Referrer**

1. En la configuración de `calendario-frontend-key`
2. Sección **"Restricciones de aplicación"**
3. Selecciona **"Referencias HTTP (sitios web)"**
4. Agrega tus dominios:
   ```
   http://localhost:8000/*
   http://localhost:3000/*
   https://tudominio.com/*
   https://*.tudominio.com/*
   ```

**Restricción 2: Por APIs**

1. Sección **"Restricciones de API"**
2. Selecciona SOLO:
   - ✅ Maps JavaScript API
3. Click en **"GUARDAR"**

---

## 5. Configurar el Backend

### Paso 5.1: Instalar Dependencias

```bash
cd backend
npm install express cors dotenv
```

O si quieres usar el package simple:

```bash
cd backend
cp package-simple.json package.json
npm install
```

### Paso 5.2: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita `.env` y agrega tu Server API Key:

```bash
# ========================================
# GOOGLE MAPS PLATFORM
# ========================================
GMAPS_SERVER_KEY=TU_SERVER_API_KEY_AQUI

# ========================================
# SERVER
# ========================================
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8000
```

⚠️ **NUNCA** subas el archivo `.env` a Git. Está en `.gitignore` por seguridad.

### Paso 5.3: Iniciar el Backend

```bash
npm start
```

Deberías ver:

```
🚀 ================================
🚀 Calendario Backend iniciado
🚀 ================================
📡 Puerto: 3000
🌐 URL: http://localhost:3000
🔑 Google Maps API: ✅ Configurada

📚 Endpoints disponibles:
   GET  /health
   POST /api/route
   POST /api/traffic-matrix
   POST /api/calculate-detour
   POST /api/places-along-route
   POST /api/places-nearby
```

### Paso 5.4: Probar Health Check

```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-01-22T...",
  "service": "Calendario Backend",
  "version": "1.0.0"
}
```

---

## 6. Configurar el Frontend

### Paso 6.1: Editar config.js

Abre `appcalendario/config.js` y actualiza:

```javascript
window.APP_CONFIG = {
  authDemoEnabled: true,
  timezone: 'America/Santiago',
  dateFormat: 'DD-MM-YYYY',

  // Backend URL
  backendURL: 'http://localhost:3000',

  // ✅ ACTIVAR Google Maps
  useGoogleMaps: true,  // ← Cambiar a true

  // Frontend API Key (solo si usas Maps JavaScript)
  googleMapsFrontendKey: 'TU_FRONTEND_KEY_AQUI',  // ← Opcional

  // Fallback APIs (se ignoran si useGoogleMaps = true)
  nominatimURL: 'https://nominatim.openstreetmap.org',
  osrmURL: 'https://router.project-osrm.org'
};
```

### Paso 6.2: Verificar que los scripts estén cargados

En `index.html` verifica que estén estos scripts:

```html
<script src="config.js"></script>
<script src="google-maps-api.js"></script>
<script src="app.js"></script>
```

---

## 7. Probar la Integración

### Prueba 1: Calcular Ruta

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Prueba: Santiago Centro → Las Condes
const origin = { lat: -33.4489, lng: -70.6693 };
const destination = { lat: -33.4117, lng: -70.5747 };

GoogleMapsAPI.computeRoutes(origin, destination, 'DRIVE', true)
  .then(data => console.log('Rutas:', data))
  .catch(err => console.error('Error:', err));
```

**Resultado esperado**:
```
[Google Routes] Rutas calculadas: 1-3
Rutas: { routes: [...] }
```

### Prueba 2: Buscar Supermercados en Ruta

```javascript
// Primero obtén el polyline de la prueba anterior
const polyline = "tu_polyline_aqui";

GoogleMapsAPI.placesAlongRoute(polyline, 'supermercado', origin, 10)
  .then(data => console.log('Lugares:', data))
  .catch(err => console.error('Error:', err));
```

### Prueba 3: Calcular Desvío

```javascript
const waypoint = { lat: -33.4300, lng: -70.6200 }; // Un supermercado

GoogleMapsAPI.calculateDetour(origin, destination, waypoint)
  .then(data => {
    console.log('Desvío:', data.detour.minutes, 'minutos');
    console.log('Porcentaje:', data.detour.percentage, '%');
  })
  .catch(err => console.error('Error:', err));
```

### Prueba 4: Flujo Completo (Planificar Ruta con Paradas)

```javascript
GoogleMapsAPI.planRouteWithStops(
  origin,
  destination,
  'DRIVE',
  ['supermercado', 'farmacia'],
  new Date().toISOString()
).then(result => {
  console.log('Ruta:', result.route);
  console.log('Lugares:', result.places.length);
  console.log('Mejor parada (menos desvío):', result.places[0]);
}).catch(err => console.error('Error:', err));
```

---

## 8. Costos y Límites

### Crédito Gratuito Mensual

Google ofrece **$200 USD/mes** de crédito gratuito.

### Precios (después del crédito)

| API | Precio | Incluido en $200 |
|-----|--------|------------------|
| **Routes API** | $5 / 1000 requests | ≈40,000 rutas/mes |
| **Distance Matrix** | $5 / 1000 elements | ≈40,000 cálculos/mes |
| **Places (Text Search)** | $32 / 1000 requests | ≈6,250 búsquedas/mes |
| **Maps JavaScript** | $7 / 1000 loads | ≈28,000 cargas/mes |

### Estimación para App Pequeña

**Uso mensual típico:**
- 500 rutas calculadas → $2.50
- 500 búsquedas de tráfico → $2.50
- 100 búsquedas de lugares → $3.20
- **Total**: ≈ $8.20/mes (dentro del crédito gratis)

### Límites de Tasa (Rate Limits)

- **Routes API**: 100 requests/segundo
- **Distance Matrix**: 100 elements/segundo
- **Places API**: 100 requests/segundo

⚠️ **Recomendación**: Implementa caché en el backend para reducir llamadas.

---

## 9. Troubleshooting

### Error: "This API project is not authorized to use this API"

**Solución**:
1. Verifica que la API esté **habilitada** en el proyecto
2. Espera 1-2 minutos (puede tardar en propagarse)
3. Verifica que estés usando el proyecto correcto

### Error: "API key not valid"

**Solución**:
1. Verifica que la key esté bien copiada (sin espacios extra)
2. Verifica las restricciones de IP/Referrer
3. Verifica que la API esté seleccionada en restricciones

### Error: "PERMISSION_DENIED"

**Solución**:
- La facturación no está activa → Actívala en Google Cloud Console

### Error: "REQUEST_DENIED"

**Solución**:
- La API no está habilitada → Habilítala
- La key no tiene permisos → Revisa restricciones

### Error: CORS en el navegador

**Solución**:
- Las llamadas a Google Maps DEBEN ir desde el backend
- Verifica que `backendURL` en `config.js` sea correcto
- Verifica que el backend tenga CORS configurado correctamente

### No encuentra lugares en la ruta

**Soluciones**:
1. Verifica que el `encodedPolyline` no esté vacío
2. Intenta con queries más genéricos ("tienda" en vez de marca específica)
3. Aumenta el radio de búsqueda
4. Verifica que haya lugares de ese tipo en esa zona

---

## 🎯 Checklist Final

Antes de usar en producción:

- [ ] ✅ APIs habilitadas (Routes, Distance Matrix, Places)
- [ ] ✅ 2 API Keys creadas (Server + Frontend)
- [ ] ✅ Server Key restringida por IP y APIs
- [ ] ✅ Frontend Key restringida por HTTP Referrer
- [ ] ✅ Facturación activa con tarjeta de crédito
- [ ] ✅ Alerta de presupuesto configurada
- [ ] ✅ Backend corriendo con `.env` configurado
- [ ] ✅ `config.js` con `useGoogleMaps: true`
- [ ] ✅ Pruebas funcionando correctamente
- [ ] ✅ `.env` en `.gitignore` (NO subir a Git)

---

## 📚 Recursos Adicionales

- **Routes API Docs**: https://developers.google.com/maps/documentation/routes
- **Distance Matrix Docs**: https://developers.google.com/maps/documentation/distance-matrix
- **Places API (New) Docs**: https://developers.google.com/maps/documentation/places/web-service/op-overview
- **Precios**: https://mapsplatform.google.com/pricing/
- **Soporte**: https://developers.google.com/maps/support

---

## 🚀 Siguiente Paso

Una vez configurado todo, ve a la vista **🗺️ Rutas** en la app y:

1. Selecciona origen y destino
2. Elige modo de transporte (Auto / Tránsito / Bici / A pie)
3. Marca tipos de lugares que te interesan
4. Click en **"Buscar Ruta Optimizada"**
5. ¡Disfruta de las sugerencias inteligentes con tráfico en tiempo real!

---

**Versión**: 1.0.0
**Fecha**: Enero 2025
**Autor**: Claude Code
