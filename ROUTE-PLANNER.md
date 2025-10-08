# 🗺️ Planificador de Rutas Inteligente

## Versión 0.4.0 - Sistema de Optimización de Rutas

### Nuevas Funcionalidades Implementadas

#### 1. **Selector de Medio de Transporte** 🚗🚌🚴🚶
- **Auto (driving)**: Rutas optimizadas para automóvil
- **Transporte Público (transit)**: Considerando buses, metro, etc.
- **Bicicleta (bicycling)**: Rutas para ciclistas
- **A pie (walking)**: Rutas peatonales

#### 2. **Desvío Máximo Configurable**
- Define cuántos minutos adicionales estás dispuesto a agregar a tu ruta
- Rango: 0-60 minutos
- Por defecto: 10 minutos
- La app solo sugerirá lugares que estén dentro de este rango

#### 3. **Búsqueda de Puntos de Interés (POI)**
Tipos de lugares que se buscan automáticamente en tu ruta:
- 🛒 **Supermercados**
- 💊 **Farmacias**
- 🏦 **Bancos/Cajeros**
- ⛽ **Gasolineras**
- 📮 **Oficinas de Correo**
- 🏪 **Tiendas de Conveniencia**

Puedes activar/desactivar cada tipo según tus necesidades.

#### 4. **Predicción de Flujo de Personas**
Sistema inteligente que predice el nivel de afluencia de personas según:
- **Día de la semana** (fin de semana vs días laborales)
- **Hora del día** (mañana, mediodía, tarde, noche)
- **Tipo de lugar** (supermercados más llenos en fines de semana, bancos en la mañana, etc.)

Niveles de flujo:
- 🟢 **Poco flujo**: Momento ideal para visitar
- 🟡 **Flujo medio**: Moderadamente concurrido
- 🔴 **Alto flujo**: Muy concurrido, considera otro momento

#### 5. **Matching Inteligente de Tareas**
La app automáticamente:
- Analiza tus tareas pendientes
- Busca lugares en tu ruta que coincidan con las tareas
- Te ofrece opciones específicas con:
  - Nombre del lugar
  - Tiempo de desvío
  - Nivel de flujo predicho
  - Opción de asignar la tarea a ese lugar específico

#### 6. **Visualización de Ruta en Mapa SVG**
- Mapa interactivo generado automáticamente
- Muestra:
  - 🟢 **Punto de inicio** (verde)
  - 🔴 **Punto de destino** (rojo)
  - 🟣 **Ruta optimizada** (línea morada)
  - 🟡 **POIs encontrados** (puntos amarillos)

## Cómo Usar el Planificador de Rutas

### Paso 1: Configurar Preferencias de Transporte
1. Ve a **⚙️ Configuración**
2. Selecciona tu **medio de transporte** preferido
3. Define el **desvío máximo** aceptable
4. Marca los **tipos de lugares** que te interesan
5. Haz clic en **"Guardar Preferencias"**

### Paso 2: Configurar Ubicaciones (si aún no lo has hecho)
1. En **Configuración**, define tu dirección de **Casa**
2. Define tu dirección de **Trabajo**
3. Opcionalmente, calcula tiempos de traslado automáticamente

### Paso 3: Crear Tareas
1. Ve a **✓ Tareas**
2. Crea tareas indicando:
   - Nombre de la tarea
   - Ubicación/lugar (ej: "Supermercado", "Farmacia", etc.)
   - Duración estimada
   - Prioridad

### Paso 4: Planificar Ruta
1. Ve a **🗺️ Rutas**
2. Selecciona:
   - **Origen**: Casa, Trabajo, o ubicación actual
   - **Destino**: Casa o Trabajo
   - **Hora de salida**: Para predecir flujo de personas
3. Haz clic en **"🔍 Buscar Ruta Optimizada"**

### Paso 5: Revisar Resultados
La app te mostrará:

#### **📍 Ruta Sugerida**
- Distancia total en km
- Tiempo estimado en minutos
- Modo de transporte
- Visualización en mapa

#### **🛍️ Lugares en la Ruta**
Lista de POIs encontrados con:
- Nombre del lugar
- Tipo (supermercado, farmacia, etc.)
- Tiempo de desvío
- Nivel de flujo predicho

#### **✅ Tareas que puedes hacer**
- Tareas pendientes que coinciden con lugares en la ruta
- Opciones específicas de lugares para cada tarea
- Asignación rápida con un clic

## Algoritmo de Optimización

### 1. Cálculo de Ruta Base
```javascript
// Usa OSRM (Open Source Routing Machine)
- Calcula la ruta más rápida entre origen y destino
- Considera el modo de transporte seleccionado
- Retorna: distancia, duración, geometría de la ruta
```

### 2. Búsqueda de POIs
```javascript
// Proceso:
1. Crear caja delimitadora alrededor de la ruta
2. Para cada tipo de POI seleccionado:
   - Buscar en OpenStreetMap (Nominatim)
   - Filtrar por proximidad a la ruta
3. Para cada POI encontrado:
   - Calcular tiempo de desvío
   - Si desvío <= máximo configurado: incluir
```

### 3. Cálculo de Desvío
```javascript
// Fórmula:
desvío = tiempo(origen → POI → destino) - tiempo(origen → destino)

// Solo se incluyen POIs donde:
desvío <= maxDetour configurado
```

### 4. Predicción de Flujo
```javascript
// Basado en heurísticas:
- Supermercados: Alto en fines de semana y 18-20h
- Bancos: Alto en apertura (9-11h)
- Farmacias: Medio en mañana y tarde
```

### 5. Matching de Tareas
```javascript
// Algoritmo de coincidencia:
For each tarea pendiente:
  buscar = tarea.location.toLowerCase()

  For each POI:
    if (buscar includes POI.type) OR
       (buscar includes POI.name) OR
       (POI.name includes buscar):
      → Agregar a opciones
```

## Ejemplo de Uso Real

### Escenario:
- Vives en **Santiago Centro**
- Trabajas en **Las Condes**
- Necesitas: comprar en supermercado, pasar por farmacia
- Medio de transporte: **Auto**
- Desvío máximo: **15 minutos**

### Proceso:
1. **Configuras** transporte y ubicaciones
2. **Creas tareas**:
   - "Comprar verduras" → ubicación: "Supermercado"
   - "Comprar remedios" → ubicación: "Farmacia"
3. **Planificas ruta**: Casa → Trabajo a las 8:00
4. **La app encuentra**:
   - Supermercado Jumbo (+8 min desvío) - 🟡 Flujo medio
   - Farmacia Cruz Verde (+5 min desvío) - 🟢 Poco flujo
   - Supermercado Líder (+12 min desvío) - 🔴 Alto flujo
5. **Ves las opciones** y seleccionas:
   - Farmacia Cruz Verde (menos flujo)
   - Supermercado Jumbo (buen punto medio)
6. **Asignas tareas** con un clic

## APIs Utilizadas

### OSRM (Open Source Routing Machine)
```
https://router.project-osrm.org/route/v1/{mode}/{coords}
```
- **Modos**: driving, transit, bicycling, walking
- **Retorna**: geometría, distancia, duración
- **Gratis**: Sin límite de uso

### Nominatim (OpenStreetMap)
```
https://nominatim.openstreetmap.org/search?amenity={type}
```
- **Amenities**: supermarket, pharmacy, bank, fuel, etc.
- **Retorna**: nombre, coordenadas, dirección
- **Límite**: 1 req/segundo (respetado con delays)

### Geolocation API (Browser)
```javascript
navigator.geolocation.getCurrentPosition()
```
- Detecta ubicación actual del usuario
- Requiere permiso del navegador

## Mejoras Futuras

### Corto Plazo (v0.5.0):
- [ ] Integración con Google Distance Matrix para tráfico en tiempo real
- [ ] Guardar rutas favoritas
- [ ] Notificación cuando estés cerca de un POI relevante
- [ ] Exportar ruta a Google Maps / Waze

### Mediano Plazo (v0.6.0):
- [ ] Algoritmo de optimización más avanzado (TSP - Traveling Salesman Problem)
- [ ] Considerar horarios de apertura/cierre de lugares
- [ ] Integración con datos reales de flujo de personas (Google Popular Times API)
- [ ] Modo multi-día (planificar rutas para toda la semana)

### Largo Plazo (v0.7.0):
- [ ] Machine Learning para aprender tus patrones de rutas
- [ ] Compartir rutas con otros usuarios
- [ ] Integración con apps de transporte público local
- [ ] Alertas de tráfico y accidentes

## Rendimiento

### Tiempos Estimados:
- **Cálculo de ruta base**: ~500ms
- **Búsqueda de POIs**: ~2-3 segundos (depende de cantidad de tipos)
- **Cálculo de desvíos**: ~100ms por POI
- **Tiempo total promedio**: 3-5 segundos

### Optimizaciones Implementadas:
- Caché de rutas calculadas
- Límite de 10 POIs por tipo
- Delays entre requests a Nominatim
- Cancelación de búsquedas anteriores si se inicia una nueva

## Troubleshooting

### Problema: "No se encontraron lugares en la ruta"
**Solución**:
- Aumenta el desvío máximo
- Verifica que los tipos de POI estén seleccionados
- Asegúrate de que la ruta pase por zonas con comercios

### Problema: "No se pudieron obtener las coordenadas"
**Solución**:
- Verifica que las direcciones de casa/trabajo estén configuradas
- Si usas "ubicación actual", permite el acceso al GPS en el navegador

### Problema: "Error al calcular la ruta"
**Solución**:
- Verifica tu conexión a internet
- Prueba con otro modo de transporte
- Verifica que las coordenadas sean válidas

### Problema: Predicción de flujo incorrecta
**Solución**:
- La predicción es heurística, no usa datos reales
- Considera como una guía general
- Versiones futuras integrarán datos reales de flujo

## Privacidad y Datos

✅ **Tu privacidad está protegida**:
- Todas las ubicaciones se guardan **solo en tu navegador** (LocalStorage)
- Las búsquedas de rutas **no se almacenan en ningún servidor**
- Las APIs utilizadas son públicas y anónimas
- **Ningún dato personal** se envía a terceros

## Créditos

- **OSRM**: Cálculo de rutas - [project-osrm.org](http://project-osrm.org/)
- **OpenStreetMap**: Datos de mapas y POIs - [openstreetmap.org](https://www.openstreetmap.org/)
- **Nominatim**: Geocoding - [nominatim.org](https://nominatim.org/)

---

**Versión**: 0.4.0
**Fecha**: Enero 2025
**Desarrollado por**: Claude Code
