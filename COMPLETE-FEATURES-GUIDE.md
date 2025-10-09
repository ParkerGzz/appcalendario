# 🚀 Guía Completa de Funcionalidades - Calendario Inteligente

## 📑 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Google Places Integration](#google-places-integration)
3. [Tráfico en Tiempo Real](#tráfico-en-tiempo-real)
4. [Optimización de Rutas](#optimización-de-rutas)
5. [Lugares en Ruta](#lugares-en-ruta)
6. [Alertas Inteligentes](#alertas-inteligentes)
7. [Guía de Uso Paso a Paso](#guía-de-uso-paso-a-paso)
8. [API y Costos](#api-y-costos)

---

## Resumen Ejecutivo

Tu calendario ahora es **completamente inteligente** con capacidades de:

✅ **Información en tiempo real** de lugares (horarios, calificaciones, precios)
✅ **Cálculo de tráfico** considerando hora del día
✅ **Optimización automática** de rutas diarias
✅ **Búsqueda de lugares** a lo largo de tu ruta
✅ **Alertas proactivas** sobre cierres y demoras
✅ **Integración completa** con Google Maps Platform

---

## 1. Google Places Integration

### 🎯 Funcionalidad

Cuando agregas una tarea con ubicación de Google Places, automáticamente obtienes:

#### Información Disponible

| Dato | Ejemplo | Uso |
|------|---------|-----|
| **Estado actual** | 🟢 Abierto / 🔴 Cerrado | Saber si puedes ir ahora |
| **Horarios** | Lun-Vie: 9:00-22:00 | Planificar visitas |
| **Horario hoy** | Cierra a las 20:00 | Urgencia de la tarea |
| **Calificación** | ⭐⭐⭐⭐ 4.5 | Calidad del lugar |
| **Reseñas** | 1,234 opiniones | Confiabilidad |
| **Precio** | $$ (moderado) | Presupuesto |
| **Teléfono** | +56 2 1234 5678 | Contacto directo |
| **Website** | www.ejemplo.cl | Más información |
| **Fotos** | 5 imágenes | Vista previa |

#### Cómo se Ve

```
╔═══════════════════════════════════╗
║ Comprar en Supermercado          ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║ 📍 Jumbo Providencia              ║
║ 🗺️ Av. Providencia 2653          ║
║                                   ║
║ ┃ 🟢 Abierto ahora               ║
║ ┃ 🕐 Horario hoy: 08:00 - 23:00  ║
║ ┃ ⭐⭐⭐⭐ 4.2 (2,145 reseñas)     ║
║ ┃ 💰 Precio: $$                   ║
║ ┃ 📞 +56 2 2233 4455              ║
╚═══════════════════════════════════╝
```

### 💡 Casos de Uso

**Escenario 1**: Ir al banco
- Ves que cierra a las 14:00
- Son las 13:30
- Sistema te alerta: "⏰ Banco - Cierra en 30min"

**Escenario 2**: Elegir farmacia
- Sistema muestra 3 farmacias cercanas
- Ves calificaciones: 4.5★, 3.8★, 4.9★
- Eliges la mejor calificada

---

## 2. Tráfico en Tiempo Real

### 🚗 Funcionalidad

Calcula el tiempo de viaje **considerando el tráfico** actual o futuro.

#### Botón "🚗 Ver tráfico"

Aparece en cada tarea asignada con ubicación.

**Al hacer clic**:
1. Calcula ruta desde tu casa
2. Considera hora de la tarea
3. Analiza tráfico previsto
4. Muestra comparación

#### Ejemplo de Resultado

```
🚗 Ruta a Banco Estado:

📏 Distancia: 5.2 km
⏱️ Tiempo sin tráfico: 12 minutos
🚦 Tiempo CON tráfico: 25 minutos

⚠️ El tráfico añade 13 minutos
```

### 📊 Información Guardada

La información de tráfico se guarda en la tarea:

```javascript
{
  trafficInfo: {
    distance: "5.2 km",
    durationNormal: "12 min",
    durationWithTraffic: "25 min",
    lastUpdated: "2025-10-09T14:30:00Z"
  }
}
```

### 🎨 Visualización

En la tarjeta de tarea verás:

```
┃ 🚗 Información de Tráfico
┃ 📏 Distancia: 5.2 km
┃ ⏱️ Sin tráfico: 12 min
┃ 🚦 CON tráfico: 25 min  ← En amarillo si hay demora
```

### ⚠️ Alerta de Desactualización

Si la información tiene más de 30 minutos:

```
🚗 Información de Tráfico (⚠️ desactualizada)
```

Haz clic de nuevo en "🚗 Ver tráfico" para actualizar.

---

## 3. Optimización de Rutas

### 🗺️ Funcionalidad

**Optimiza automáticamente** el orden de tus tareas del día para minimizar tiempo de viaje.

#### Botón "🚗 Optimizar hoy"

Ubicación: En la parte superior del **Calendario**.

**Lo que hace**:
1. Toma todas las tareas de HOY con ubicación
2. Calcula matriz de distancias con tráfico
3. Usa algoritmo de "vecino más cercano"
4. Reordena tareas para minimizar viaje total
5. Asigna nuevos horarios automáticamente

#### Ejemplo Práctico

**ANTES**:
```
9:00 AM - Farmacia (norte)      ↑ 15 km
10:30 AM - Casa (centro)        ↓ 10 km
12:00 PM - Supermercado (sur)   ↓ 20 km
2:00 PM - Banco (norte)         ↑ 25 km
                          Total: 70 km
```

**DESPUÉS**:
```
9:00 AM - Farmacia (norte)      ↑ 15 km
9:45 AM - Banco (norte)         → 2 km
11:00 AM - Casa (centro)        ↓ 12 km
12:15 PM - Supermercado (sur)   ↓ 8 km
                          Total: 37 km ✅ Ahorras 33 km!
```

### ⚙️ Algoritmo

**Técnica**: Nearest Neighbor (Vecino Más Cercano)

1. Empiezas desde casa
2. Eliges la tarea más cercana no visitada
3. Vas a esa tarea
4. Desde ahí, eliges la siguiente más cercana
5. Repites hasta terminar todas

**Consideraciones**:
- Usa tráfico en tiempo real
- Respeta duración de cada tarea
- Añade 15 min de margen entre tareas
- Empieza a las 9:00 AM por defecto

### 🎯 Resultado

Al terminar verás:

```
✅ Ruta optimizada: 4 tareas reorganizadas
```

Y en el calendario, las tareas ahora tienen nuevos horarios optimizados.

---

## 4. Lugares en Ruta

### 📍 Funcionalidad

Encuentra lugares de interés **a lo largo de tu ruta** entre dos tareas.

#### Función: `findPlacesInRoute()`

**Uso programático**:
```javascript
// Buscar farmacias entre Tarea 1 y Tarea 2
findPlacesInRoute(12345, 67890, 'farmacia');
```

**Parámetros**:
- `task1Id`: ID de la primera tarea
- `task2Id`: ID de la segunda tarea
- `placeType`: Tipo de lugar (ej: "supermercado", "gasolinera", "cajero")

### 🔍 Proceso

1. **Calcula ruta** entre las dos tareas
2. **Obtiene polyline** (camino codificado)
3. **Busca lugares** del tipo especificado
4. **Ordena por proximidad** a la ruta
5. **Muestra resultados** con rating

#### Ejemplo de Resultado

```
📍 Encontrados 5 farmacia en tu ruta:

1. Farmacia Cruz Verde
   ⭐ 4.3
2. Salcobrand
   ⭐ 4.1
3. Farmacia Ahumada
   ⭐ 4.5
4. Dr. Ahorro
   ⭐ 3.9
5. Farmacias del Dr. Simi
   ⭐ 4.0
```

### 💡 Casos de Uso

**Caso 1**: Ir al banco y luego al supermercado
```javascript
// Buscar gasolineras en el camino
findPlacesInRoute(bancoId, supermercadoId, 'gasolinera');
// Resultado: 3 gasolineras, eliges la de mejor precio
```

**Caso 2**: Ruta de compras
```javascript
// Buscar cajeros automáticos
findPlacesInRoute(tienda1Id, tienda2Id, 'cajero');
// Resultado: 4 cajeros, eliges el de tu banco
```

---

## 5. Alertas Inteligentes

### 🚨 Tipos de Alertas

El sistema genera **alertas automáticas** en el Dashboard basadas en análisis en tiempo real.

#### 5.1. Alertas Urgentes (🔴 Borde Rojo)

**⚠️ Lugar Cerrado**
```
⚠️ Farmacia - Lugar cerrado

El lugar está cerrado actualmente.
Revisa el horario y reprograma la tarea.
```

**Cuándo aparece**: La tarea está programada para HOY pero el lugar está cerrado ahora.

---

#### 5.2. Alertas de Advertencia (🟡 Borde Amarillo)

**⏰ Cierra Pronto**
```
⏰ Banco Estado - Cierra pronto

El lugar cierra en 1h 30min.
Considera ir ahora o reprogramar.
```

**Cuándo aparece**: El lugar cierra en menos de 2 horas.

---

#### 5.3. Alertas Informativas (🔵 Borde Azul)

**📅 Hora Pasada**
```
📅 Supermercado - Hora pasada

La tarea estaba programada para las 10:00.
¿Ya la completaste?
```

**Cuándo aparece**: Pasaron más de 30 minutos desde la hora asignada.

---

**💡 Disponible Hoy**
```
💡 Correos de Chile - Disponible hoy

El lugar cierra hoy a las 18:00.
¿Quieres programarla para hoy?
```

**Cuándo aparece**: Tienes una tarea sin asignar y el lugar cierra hoy.

---

**🗺️ Optimiza tu Ruta**
```
🗺️ Optimiza tu ruta de hoy

Tienes 3 tareas con ubicación.
Haz clic en "🚗 Optimizar hoy" para ordenarlas.
```

**Cuándo aparece**: Tienes 2 o más tareas hoy con ubicación.

---

### 🎯 Lógica de Prioridades

Las alertas se muestran en este orden:

1. **Urgentes** (lugar cerrado) → Acción inmediata
2. **Advertencias** (cierra pronto) → Acción pronta
3. **Informativas** (sugerencias) → Acción opcional

---

## 6. Guía de Uso Paso a Paso

### 📱 Flujo Completo de Usuario

#### Paso 1: Crear Tarea con Google Places

1. Clic en "➕ Nueva Tarea"
2. Llenar:
   - Nombre: "Ir al banco"
   - Duración: 0.5 horas
   - Ubicación: "Banco Estado"
3. En **"Dirección específica"**, escribir:
   ```
   banco estado providencia
   ```
4. Aparecen sugerencias:
   ```
   ▼ Banco Estado - Av. Providencia 2133
     Santiago, Región Metropolitana

   ▼ Banco Estado - Pedro de Valdivia 100
     Providencia, Región Metropolitana
   ```
5. Seleccionar uno
6. Guardar tarea

**Resultado**: La tarea ahora tiene:
- Coordenadas exactas
- Place ID de Google
- Información detallada (se carga en 1-2 segundos)

---

#### Paso 2: Ver Información del Lugar

En la vista **Tareas**, verás la tarjeta enriquecida:

```
╔══════════════════════════════════╗
║ Ir al banco                      ║
║                                  ║
║ ⏱️ Duración: 0.5 hora(s)         ║
║ 📍 Banco Estado                  ║
║ 🗺️ Av. Providencia 2133         ║
║                                  ║
║ ┃ 🟢 Abierto ahora              ║
║ ┃ 🕐 Hoy: 09:00 - 14:00         ║
║ ┃ ⭐⭐⭐⭐ 4.1 (523 reseñas)      ║
║ ┃ 📞 600 200 7000                ║
║                                  ║
║ 🏠→📍 3.2km (≈10 min)            ║
║                                  ║
║ [💡 Sugerir día] [📅 Asignar]   ║
╚══════════════════════════════════╝
```

---

#### Paso 3: Asignar a Hoy

1. Clic en **"📅 Asignar a día"**
2. Seleccionar fecha de HOY
3. Sistema asigna automáticamente una hora

---

#### Paso 4: Ver Tráfico

1. Ahora aparece botón **"🚗 Ver tráfico"**
2. Hacer clic
3. Sistema calcula:
   - Ruta desde casa
   - Tráfico previsto para la hora asignada
4. Muestra resultado:
   ```
   🚗 Ruta a Ir al banco:

   📏 Distancia: 3.2 km
   ⏱️ Sin tráfico: 10 min
   🚦 CON tráfico: 18 min

   ⚠️ El tráfico añade 8 minutos
   ```

**Resultado**: La información se guarda y aparece en la tarjeta.

---

#### Paso 5: Ver Alertas en Dashboard

1. Ir a vista **Dashboard**
2. En "Sugerencias Inteligentes" verás:

```
┌─────────────────────────────────┐
│ ⏰ Ir al banco - Cierra pronto  │
│                                 │
│ El lugar cierra en 45min.       │
│ Considera ir ahora o reprogramar│
└─────────────────────────────────┘
```

---

#### Paso 6: Optimizar Ruta del Día

1. Ir a vista **Calendario**
2. Clic en **"🚗 Optimizar hoy"**
3. Sistema analiza todas las tareas de hoy
4. Calcula mejor orden
5. Reorganiza automáticamente
6. Muestra: `✅ Ruta optimizada: 3 tareas reorganizadas`

---

### 🎓 Tips Avanzados

#### Tip 1: Actualizar Tráfico

Si la información de tráfico está desactualizada (>30 min):
1. Clic nuevamente en **"🚗 Ver tráfico"**
2. Se recalcula con datos actuales

#### Tip 2: Buscar Lugares en Ruta

Si tienes 2 tareas asignadas y quieres encontrar algo en el camino:

```javascript
// Abrir consola del navegador (F12)
findPlacesInRoute(tarea1_id, tarea2_id, 'farmacia');
```

Reemplazar `tarea1_id` y `tarea2_id` con los IDs reales.

#### Tip 3: Ver Horarios Completos

1. Editar tarea (clic en "✏️ Editar")
2. En la información del lugar verás horarios de toda la semana

---

## 7. API y Costos

### 🔑 APIs Utilizadas

| API | Función | Costo por uso |
|-----|---------|---------------|
| **Places Autocomplete** | Sugerencias al escribir | $0.017/sesión |
| **Place Details** | Info completa del lugar | $0.017/solicitud |
| **Geocoding** | Convertir place_id a coords | $0.005/solicitud |
| **Distance Matrix** | Tráfico y distancias | $0.005/elemento |
| **Routes** | Calcular rutas | $0.005/solicitud |
| **Places Nearby** | Lugares en ruta | $0.032/solicitud |

### 💰 Estimación de Costos Mensuales

**Uso Moderado** (50 tareas/mes):

```
Acciones:
- 50 autocompletados con Google Places   = $0.85
- 50 cargas de Place Details              = $0.85
- 50 geocodificaciones                    = $0.25
- 10 cálculos de tráfico (por tarea)      = $0.05
- 5 optimizaciones de ruta (matriz 5x5)   = $0.13
- 3 búsquedas de lugares en ruta          = $0.10

TOTAL: ~$2.23/mes
```

**Uso Intensivo** (200 tareas/mes):

```
TOTAL: ~$8.92/mes
```

**Plan Gratuito de Google**: $200 USD/mes

**Conclusión**: ✅ Muy por debajo del límite gratuito

### 📊 Optimizaciones Implementadas

1. ✅ **Cache en localStorage**: No recarga Place Details
2. ✅ **Carga bajo demanda**: Solo cuando usuario selecciona
3. ✅ **Tráfico opcional**: Usuario decide cuándo calcular
4. ✅ **Optimización inteligente**: Solo tareas del día
5. ✅ **Límite de resultados**: Máximo 10 lugares por búsqueda

---

## 8. Arquitectura Técnica

### 📁 Estructura de Datos

#### Tarea Completa

```javascript
{
  // Datos básicos
  id: 1696872349234,
  name: "Ir al Banco Estado",
  duration: 0.5,
  location: "Banco Estado",
  address: "Av. Providencia 2133, Santiago",
  priority: "media",
  status: "active",

  // Fechas
  assignedDate: "09-10-2025",
  assignedTime: "10:30",
  deadline: "10-10-2025",

  // Ubicación
  lat: -33.4222,
  lng: -70.6089,
  placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",

  // Google Places
  placeDetails: {
    name: "Banco Estado",
    rating: 4.1,
    ratingCount: 523,
    isOpenNow: true,
    todayHours: { open: "0900", close: "1400" },
    weekdayText: ["Lunes: 9:00 AM – 2:00 PM", ...],
    phone: "600 200 7000",
    website: "www.bancoestado.cl",
    photos: [...]
  },

  // Tráfico
  trafficInfo: {
    distance: "3.2 km",
    durationNormal: "10 min",
    durationWithTraffic: "18 min",
    lastUpdated: "2025-10-09T10:15:00Z"
  }
}
```

### 🔄 Flujo de Datos

```
Usuario escribe dirección
        ↓
Autocomplete API (Google)
        ↓
Selecciona lugar
        ↓
Geocoding API → Coordenadas
        ↓
Place Details API → Info completa
        ↓
Guardar en localStorage
        ↓
Renderizar tarjeta enriquecida
```

### 🎯 Funciones Clave

| Función | Archivo | Línea | Propósito |
|---------|---------|-------|-----------|
| `googlePlaceDetails()` | google-maps-api.js | 267 | Obtener detalles de lugar |
| `loadPlaceDetailsForTask()` | app.js | 1016 | Cargar detalles para tarea |
| `getPlaceInfoHTML()` | app.js | 1890 | Renderizar info de lugar |
| `generateSmartAlerts()` | app.js | 252 | Generar alertas inteligentes |
| `calculateTrafficForTask()` | app.js | 1185 | Calcular tráfico |
| `optimizeDayRoute()` | app.js | 1329 | Optimizar ruta del día |
| `findPlacesInRoute()` | app.js | 1265 | Buscar lugares en ruta |

---

## 9. Solución de Problemas

### ❌ Problema: No aparece información de Google Places

**Verificar**:
1. API Key configurada en `config.js`
2. Consola muestra: "✅ Google Maps JavaScript API cargada"
3. No hay errores de cuota excedida

**Solución**:
```javascript
// En consola (F12):
window.google.maps.places
// Debe devolver: Object {...}
```

---

### ❌ Problema: Tráfico no se calcula

**Verificar**:
1. Backend está corriendo (`npm start` en carpeta backend)
2. Backend está en `http://localhost:3000`
3. API Key de backend configurada

**Solución**:
```bash
cd backend
npm start
```

---

### ❌ Problema: Optimización no funciona

**Causas comunes**:
- Menos de 2 tareas con ubicación
- No configuraste ubicación de casa
- Backend no responde

**Solución**:
1. Ir a Configuración
2. Configurar "Mi Casa"
3. Asignar al menos 2 tareas con ubicación

---

### ❌ Problema: "OVER_QUERY_LIMIT"

**Causa**: Excediste límite de API

**Solución**:
1. Esperar hasta próximo mes
2. Habilitar facturación en Google Cloud
3. Reducir uso (no recalcular tráfico constantemente)

---

## 10. Roadmap Futuro

### 🚀 Funcionalidades Posibles

#### Fase 1: Mejoras Visuales
- [ ] Mapa interactivo mostrando ruta del día
- [ ] Gráfico de flujo de personas (Popular Times)
- [ ] Timeline visual de tareas optimizadas

#### Fase 2: IA Conversacional
- [ ] Chat con Claude/GPT para optimizar día
- [ ] Preguntas naturales: "¿Cuándo debo ir al banco?"
- [ ] Detección automática de conflictos

#### Fase 3: Automatización
- [ ] Optimización automática todas las mañanas
- [ ] Notificaciones push cuando lugar cierra pronto
- [ ] Integración con Google Calendar

#### Fase 4: Social
- [ ] Compartir rutas optimizadas
- [ ] Recomendaciones de lugares según preferencias
- [ ] Historial de lugares visitados

---

## 11. Conclusión

### ✅ Lo que Tienes Ahora

Un calendario **completamente inteligente** que:

1. 🗺️ **Conoce todos los lugares** (horarios, calificaciones, precios)
2. 🚦 **Calcula tráfico real** para cada tarea
3. 🎯 **Optimiza rutas** automáticamente
4. 📍 **Sugiere lugares** en tu camino
5. ⚠️ **Te alerta** de cierres y demoras
6. 💰 **Todo gratis** dentro del límite de Google

### 🎯 Ventaja Competitiva

**Vs. Google Calendar**: ❌ No sabe de tráfico
**Vs. Google Maps**: ❌ No organiza tareas
**Vs. Todoist**: ❌ No considera ubicaciones
**Tu App**: ✅ TODO LO ANTERIOR INTEGRADO

### 📚 Recursos

- [Documentación Google Places](https://developers.google.com/maps/documentation/places/web-service)
- [Documentación Routes API](https://developers.google.com/maps/documentation/routes)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

---

**¡Disfruta tu calendario inteligente! 🚀**

*Última actualización: 9 de Octubre, 2025*
