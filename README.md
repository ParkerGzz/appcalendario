# 📅 Calendario Inteligente - Smart Task Scheduler

Una aplicación web inteligente que optimiza tu agenda personal considerando ubicaciones, tiempos de traslado y disponibilidad real.

## 🎯 Características Actuales (v0.1)

### ✅ Implementado
- **Gestión de ubicaciones**
  - Configuración de casa y trabajo con geolocalización GPS
  - Autocompletado de direcciones en tiempo real (OpenStreetMap)
  - Cálculo automático de tiempos de traslado (OSRM)
  - Visualización de distancias desde casa/trabajo a cada tarea

- **Gestión de tareas**
  - CRUD completo de tareas con prioridades (baja, media, alta, urgente)
  - Duración estimada y ubicación específica
  - Fechas límite opcionales
  - Persistencia en LocalStorage

- **Calendario semanal**
  - Vista de lunes a domingo con bloques horarios
  - Visualización de horario laboral
  - Código de colores por prioridad
  - Navegación entre semanas

- **Sugerencias inteligentes**
  - Agrupación por proximidad geográfica (<2km)
  - Agrupación por ubicación similar (texto)
  - Priorización de tareas urgentes
  - Alertas de fechas límite
  - Cálculo de tiempo ahorrado agrupando tareas

- **Optimización de horarios**
  - Asignación automática a días con menos carga
  - Consideración de tiempos de traslado
  - Cálculo de horarios óptimos (antes/después del trabajo)

## 🚀 Roadmap - MVP Completo

### Fase 1: Backend y Estructura de Datos (Semanas 1-2)
- [ ] **Migrar a arquitectura cliente-servidor**
  - Backend: Node.js (Express/NestJS) o Python (FastAPI)
  - Base de datos: PostgreSQL + Redis (cache)
  - API RESTful con autenticación JWT

- [ ] **Modelo de datos robusto**
  ```sql
  -- Users
  CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    timezone VARCHAR(50),
    settings JSONB
  );

  -- Locations
  CREATE TABLE locations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    label VARCHAR(100),
    address TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    service_hours JSONB -- { "mon": ["09:00-18:00"], ... }
  );

  -- Calendar Accounts
  CREATE TABLE calendar_accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    provider VARCHAR(20), -- 'google', 'microsoft', 'icloud'
    access_token TEXT ENCRYPTED,
    refresh_token TEXT ENCRYPTED,
    scopes TEXT[],
    last_sync TIMESTAMP
  );

  -- Events (synced from external calendars)
  CREATE TABLE events (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    provider_id VARCHAR(255),
    title VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location_id UUID REFERENCES locations(id),
    is_all_day BOOLEAN,
    source_calendar VARCHAR(100)
  );

  -- Availability Blocks (recurrent)
  CREATE TABLE availability_blocks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    rrule TEXT, -- RFC 5545 recurrence rule
    weekday INTEGER, -- 0=Mon, 6=Sun
    start_time TIME,
    end_time TIME,
    block_type VARCHAR(20), -- 'work', 'available', 'blocked'
    is_hard BOOLEAN -- true = cannot schedule over
  );

  -- Tasks
  CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    duration_min INTEGER,
    location_id UUID REFERENCES locations(id),
    window_start TIMESTAMP,
    window_end TIMESTAMP,
    deadline DATE,
    priority INTEGER, -- 1-5
    must_be_in_person BOOLEAN,
    prep_min INTEGER,
    buffer_min INTEGER,
    flexible_days INTEGER[],
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'pending'
  );

  -- Plan Slots (scheduled tasks)
  CREATE TABLE plan_slots (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    travel_from_location_id UUID REFERENCES locations(id),
    travel_min INTEGER,
    confidence DECIMAL(3, 2),
    status VARCHAR(20) DEFAULT 'draft'
  );

  -- Distance Cache
  CREATE TABLE distance_cache (
    origin_id UUID REFERENCES locations(id),
    dest_id UUID REFERENCES locations(id),
    time_bucket VARCHAR(20), -- 'morning', 'afternoon', 'evening'
    travel_min INTEGER,
    updated_at TIMESTAMP,
    PRIMARY KEY (origin_id, dest_id, time_bucket)
  );
  ```

### Fase 2: Integración de Calendarios (Semanas 2-3)
- [ ] **OAuth 2.0 Authentication**
  - Google Calendar API (OAuth flow)
  - Microsoft Graph API (Outlook/Office 365)
  - Apple iCloud (CalDAV con app-specific password)

- [ ] **Sincronización bidireccional**
  - Importar eventos existentes (próximos 90 días)
  - Webhooks de Google Calendar (watch notifications)
  - Microsoft Graph change notifications
  - Polling periódico para iCloud CalDAV

- [ ] **Detección de conflictos**
  - Verificar overlaps antes de crear eventos
  - Mostrar advertencias al usuario
  - Proponer horarios alternativos

### Fase 3: Planificador Avanzado (Semana 3-4)
- [ ] **Algoritmo Greedy mejorado**
  ```javascript
  function scheduleTasksGreedy(tasks, availability, events, locations) {
    // 1. Construir timeline semanal
    const freeSlots = calculateFreeSlots(availability, events);

    // 2. Ordenar tareas por urgencia
    const sortedTasks = tasks.sort((a, b) => {
      if (a.deadline !== b.deadline) return a.deadline - b.deadline;
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.duration - b.duration; // Más cortas primero
    });

    // 3. Asignar cada tarea al mejor slot
    for (const task of sortedTasks) {
      const candidates = findCompatibleSlots(
        task,
        freeSlots,
        locations,
        distanceCache
      );

      const bestSlot = selectBestSlot(candidates, {
        minimizeTravelTime: true,
        respectTimeWindows: true,
        addBuffers: true
      });

      if (bestSlot) {
        scheduledTasks.push({
          task,
          slot: bestSlot,
          travelBefore: calculateTravel(previousLocation, task.location),
          travelAfter: calculateTravel(task.location, nextLocation)
        });
      }
    }

    return scheduledTasks;
  }
  ```

- [ ] **Ventanas de tiempo**
  - Horarios de atención de lugares (ej: clínicas 9-13h)
  - Ventanas preferidas del usuario por tarea
  - Restricciones hard vs soft

- [ ] **Buffers automáticos**
  - 10-15 min antes de reuniones importantes
  - Tiempo de preparación configurable
  - Buffers de traslado con tráfico

- [ ] **Optimización con Google OR-Tools** (opcional, fase 2)
  - CP-SAT Solver para scheduling óptimo
  - Minimizar: tiempo_total_viaje + penalizaciones
  - Constraints: disponibilidad, ventanas, secuencias

### Fase 4: Mapas y Traslados (Semana 4)
- [ ] **Google Maps Platform**
  - Distance Matrix API (con tráfico en tiempo real)
  - Places API (búsqueda y horarios)
  - Geocoding para direcciones
  - Time Zone API

- [ ] **Cache inteligente**
  - Redis para distancias frecuentes
  - Invalidación por franjas horarias (mañana/tarde/noche)
  - Prefetch de rutas comunes

- [ ] **Visualización de rutas**
  - Mapa interactivo con markers
  - Polylines entre tareas del día
  - Estimaciones de tráfico

### Fase 5: Exportación/Importación (Semana 5)
- [ ] **Formato ICS (iCalendar)**
  ```javascript
  // Exportar a .ics
  POST /api/calendar/export?from=2025-01-01&to=2025-12-31
  // Retorna: calendario.ics

  // Importar desde .ics
  POST /api/calendar/import
  // Body: FormData con archivo .ics
  ```

- [ ] **Commit de planes**
  - Vista previa del plan generado
  - Confirmación del usuario
  - Creación masiva de eventos en calendarios externos
  - Rollback si falla alguna creación

### Fase 6: Características Avanzadas (Semanas 6+)
- [ ] **Tareas meta** (ej: "Pedir hora al doctor")
  - Tarea de llamada (15 min, sin ubicación física)
  - Al completarse, crear evento de cita real

- [ ] **Machine Learning**
  - Aprender patrones del usuario (¿cuándo prefiere hacer compras?)
  - Predecir duraciones reales vs estimadas
  - Sugerir mejores horarios basado en histórico

- [ ] **Notificaciones**
  - Push notifications antes de salir (considerando tráfico)
  - Alertas de cambios en calendario externo
  - Recordatorios de tareas sin agendar

- [ ] **Mobile App**
  - React Native o Flutter
  - Modo offline con sincronización
  - Widget de agenda diaria

- [ ] **Compartir y colaborar**
  - Compartir slots disponibles (para agendar reuniones)
  - Coordinación de tareas familiares
  - Integración con apps de delivery

## 🛠️ Tech Stack (Propuesto)

### Frontend
- **Framework**: React 18 + Next.js 14
- **UI**: Tailwind CSS + shadcn/ui
- **Calendario**: FullCalendar o React Big Calendar
- **Mapas**: @react-google-maps/api
- **Estado**: Zustand + React Query
- **Validación**: Zod
- **Fechas**: Luxon (con timezone support)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS (TypeScript) o FastAPI (Python)
- **Base de datos**: PostgreSQL 15+ (con PostGIS para geo)
- **Cache**: Redis 7+
- **Jobs**: BullMQ (Node) o Celery (Python)
- **Auth**: Passport.js + JWT

### APIs Externas
- Google Calendar API
- Microsoft Graph API (Calendar)
- Apple CalDAV (iCloud)
- Google Maps Platform (Distance Matrix, Places, Geocoding)
- OSRM (Open Source Routing Machine) - alternativa gratuita

### DevOps
- **Container**: Docker + Docker Compose
- **Deploy**: Vercel (frontend) + Railway/Fly.io (backend)
- **Monitoring**: Sentry (errores) + PostHog (analytics)
- **Secrets**: Vault o AWS Secrets Manager

## 📚 Bibliotecas Clave

```json
{
  "dependencies": {
    // Frontend
    "react": "^18.3.0",
    "next": "^14.0.0",
    "fullcalendar": "^6.1.0",
    "@react-google-maps/api": "^2.19.0",
    "luxon": "^3.4.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "zod": "^3.22.0",

    // Backend
    "@nestjs/core": "^10.0.0",
    "typeorm": "^0.3.0",
    "ioredis": "^5.3.0",
    "bullmq": "^5.0.0",
    "rrule": "^2.8.0",
    "ical.js": "^1.5.0",
    "googleapis": "^126.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.0",

    // Maps & Geo
    "@googlemaps/google-maps-services-js": "^3.3.0",
    "node-geocoder": "^4.3.0",

    // Optimization (opcional)
    "or-tools": "^9.7.0"
  }
}
```

## 🔐 Seguridad

- Tokens OAuth cifrados en base de datos (AES-256)
- Scope mínimo: solo acceso a calendarios
- Rate limiting en todos los endpoints
- Validación de inputs con Zod
- CORS configurado apropiadamente
- Logs sin información sensible (no guardar tokens, direcciones exactas)
- HTTPS obligatorio en producción

## 📊 Endpoints API (Propuestos)

```
# Auth
POST   /api/auth/google
POST   /api/auth/microsoft
POST   /api/auth/apple

# Calendar Sync
GET    /api/calendar/events?from=&to=
POST   /api/calendar/webhook (Google/Microsoft notifications)

# Locations
POST   /api/locations
GET    /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id

# Availability
POST   /api/availability (RRULE blocks)
GET    /api/availability
PUT    /api/availability/:id

# Tasks
POST   /api/tasks
GET    /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status

# Planning
POST   /api/plan/generate?from=&to= (returns draft PlanSlots)
POST   /api/plan/commit (creates events in external calendars)
GET    /api/plan/suggestions

# Travel & Maps
GET    /api/travel-time?from=locA&to=locB&when=ISO8601
GET    /api/places/search?q=supermercado&near=casa
GET    /api/places/:id/hours

# Export/Import
GET    /api/calendar/export?from=&to= (returns .ics)
POST   /api/calendar/import (upload .ics)
```

## 🚀 Cómo empezar (versión actual)

1. **Clonar el repositorio**
   ```bash
   cd appcalendario
   ```

2. **Abrir en navegador**
   ```bash
   open index.html
   # o usar un servidor local
   python -m http.server 8000
   # http://localhost:8000
   ```

3. **Configurar ubicaciones**
   - Ir a "📍 Configurar Ubicaciones"
   - Usar geolocalización o escribir direcciones
   - Calcular tiempos de traslado

4. **Agregar tareas**
   - Completar formulario con duración, ubicación, prioridad
   - Añadir dirección específica para cálculos precisos

5. **Ver sugerencias**
   - Revisar panel "💡 Sugerencias Inteligentes"
   - Aceptar asignaciones propuestas o ajustar manualmente

## 🎨 Próximas Mejoras Inmediatas

1. **Ventanas de tiempo para tareas** (ej: "doctor solo de Lun-Jue 9-13h")
2. **Bloques de disponibilidad recurrente** (ej: "trabajo Lun-Vie 8-17:30")
3. **Exportación a ICS** para importar en cualquier calendario
4. **Mejores algoritmos de optimización** (considerar secuencias óptimas)
5. **Integración con Google Maps Distance Matrix** (tráfico real)

## 📝 Notas de Implementación

### Manejo de Zonas Horarias
- Guardar todo en UTC en base de datos
- Convertir a timezone del usuario en frontend
- Usar Luxon para operaciones con fechas

### Cache de Distancias
- Key: `{origin_id}:{dest_id}:{time_bucket}`
- Time buckets: `morning` (6-10), `midday` (10-14), `afternoon` (14-18), `evening` (18-22)
- TTL: 7 días

### Rate Limits APIs Externas
- Google Maps Distance Matrix: 100 elementos/segundo
- Nominatim (OSM): 1 req/segundo
- Considerar plan de pago si escala

## 🤝 Contribuir

Este proyecto está en desarrollo activo. Para contribuir:
1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE

## 🙏 Agradecimientos

- **OpenStreetMap** por datos de mapas libres
- **Nominatim** por geocodificación gratuita
- **OSRM** por cálculo de rutas
- Comunidad de código abierto

---

## ⚡ Integración con Google Maps (Nuevo en v2.0)

La aplicación ahora soporta **Google Maps Platform** para funciones avanzadas:

### 🆕 Características con Google Maps
- **Rutas con tráfico en tiempo real** (Routes API)
- **Tiempos de viaje precisos** (Distance Matrix API)
- **Búsqueda de lugares mejorada** a lo largo de rutas (Places API New)
- **Múltiples modos de transporte**: Auto, A pie, Bicicleta, Transporte público
- **Cálculo de desvíos** al agregar paradas

### 📖 Configuración
Ver guía completa: **[GOOGLE-MAPS-SETUP.md](GOOGLE-MAPS-SETUP.md)**

**Resumen rápido**:
1. Crear proyecto en Google Cloud Console
2. Habilitar APIs: Routes, Distance Matrix, Places (New)
3. Crear 2 API keys con restricciones de seguridad
4. Configurar backend (Node.js + Express)
5. Activar en `config.js`: `useGoogleMaps: true`

### 💰 Costos
- **Crédito gratis**: $200 USD/mes
- **Uso típico**: ~$8-15/mes (dentro del crédito gratis)
- **Fallback gratuito**: La app funciona sin Google Maps usando OSRM + Nominatim

### 🔄 Modo Híbrido
La aplicación detecta automáticamente qué API usar:
- Si `useGoogleMaps = true` y backend activo → Google Maps Platform
- Si `useGoogleMaps = false` o backend inactivo → APIs gratuitas (OSRM, Nominatim)

---

**Versión Actual**: 2.0.0 (Con integración Google Maps)
**Última Actualización**: Enero 2025
