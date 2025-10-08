# 🚀 Plan de Mejoras - Calendario Inteligente

## Objetivo
Transformar el prototipo actual en una aplicación completa de planificación semanal con sincronización de calendarios externos, optimización inteligente de tareas y cálculo de tiempos de traslado en tiempo real.

---

## 📋 Funcionalidades Solicitadas vs Estado Actual

| Funcionalidad | Estado Actual | Acción Requerida |
|--------------|---------------|------------------|
| **Vista calendario semanal** | ✅ Implementada | 🔄 Mejorar a formato hora-día |
| **Horarios fijos** | ⚠️ Parcial (solo trabajo) | ➕ Añadir múltiples bloques |
| **Horarios disponibles** | ⚠️ Calculado implícito | ➕ Gestión explícita RRULE |
| **Tareas con ubicación** | ✅ Implementada | ✅ OK |
| **Ventanas de tiempo (DD-MM-YYYY)** | ❌ No | ➕ Implementar rangos |
| **Prioridades** | ✅ Implementada | ✅ OK |
| **Planificación automática** | ⚠️ Greedy simple | 🔄 Mejorar algoritmo |
| **Distancias y tiempos** | ✅ Básico | 🔄 Añadir tráfico real |
| **Tareas meta ("pedir hora")** | ❌ No | ➕ Implementar |
| **Sync Google Calendar** | ❌ No | ➕ Requiere backend |
| **Sync Outlook** | ❌ No | ➕ Requiere backend |
| **Sync Apple Calendar** | ❌ No | ➕ Requiere backend |
| **Drag & drop** | ❌ No | ➕ Implementar |
| **Tooltips con tiempos** | ⚠️ Parcial | 🔄 Mejorar |
| **Formato DD-MM-YYYY** | ❌ No (usa ISO) | 🔄 Cambiar formato |
| **Exportación ICS** | ❌ No | ➕ Implementar |
| **Buffers configurables** | ⚠️ Fijo en código | ➕ Hacer configurable |

**Leyenda:**
- ✅ = Completado
- ⚠️ = Parcialmente implementado
- ❌ = No implementado
- ➕ = Agregar nuevo
- 🔄 = Mejorar existente

---

## 🎯 Fases de Implementación

### **FASE 1: Mejoras Sin Backend (1-2 semanas)**
*Implementable ahora con la arquitectura actual*

#### 1.1 Formato de Fechas DD-MM-YYYY ✅
```javascript
// Cambiar en toda la app:
- Input type="date" → usar máscara DD-MM-YYYY
- Mostrar fechas: "07-10-2025" en lugar de "7 Oct"
- Parsear entrada del usuario en formato latino
```

**Archivos a modificar:**
- `app.js`: Funciones `formatDate()`, `formatDateToString()`
- `index.html`: Inputs de fecha con placeholder

#### 1.2 Ventanas de Tiempo para Tareas 🔥
```javascript
// Permitir rango de fechas para tareas
task = {
  ...
  windowStart: '10-10-2025',  // Earliest
  windowEnd: '15-10-2025',    // Latest
  flexibleDays: [1,2,3,4,5]   // Lun-Vie
}
```

**UI necesaria:**
- Dos campos de fecha: "Disponible desde" y "Disponible hasta"
- Checkboxes para días de la semana preferidos

#### 1.3 Bloques de Disponibilidad Recurrentes 🔥
```javascript
// Permitir múltiples bloques fijos
availabilityBlocks = [
  { label: 'Trabajo', days: [1,2,3,4,5], start: '08:00', end: '17:30', type: 'blocked' },
  { label: 'Gimnasio', days: [2,4], start: '19:00', end: '20:30', type: 'blocked' },
  { label: 'Almuerzo', days: [1,2,3,4,5], start: '13:00', end: '14:00', type: 'blocked' }
]
```

**UI necesaria:**
- CRUD de bloques de disponibilidad
- Selector de días de semana (checkboxes)
- Vista en calendario de bloques recurrentes

#### 1.4 Buffers Configurables ⚡
```javascript
// Añadir configuración global y por tarea
settings = {
  defaultBuffer: 15,        // minutos
  travelBuffer: 10,         // extra para traslados
  preparationBuffer: 5      // antes de eventos importantes
}

task = {
  ...
  customBuffer: 20  // Override para esta tarea específica
}
```

#### 1.5 Vista Calendario Mejorada (Día-Hora) 🔥
**Cambiar de:**
```
Lunes | Martes | Miércoles
[Bloques apilados]
```

**A formato Google Calendar:**
```
        Lun 07  Mar 08  Mié 09
06:00
07:00
08:00   [Trabajo ------>]
09:00   [    "    ------>]
...
18:00   [Compras]
19:00
```

**Implementación:**
- Generar grilla de 24 horas (6:00 - 22:00)
- Posicionar bloques con `position: absolute` y altura proporcional
- CSS Grid para columnas de días

#### 1.6 Tooltips Mejorados ⚡
```javascript
// Al hacer hover en tarea del calendario
tooltip.innerHTML = `
  📍 ${task.name}
  ⏱️ Duración: ${task.duration}h
  🚗 Traslado desde casa: 15 min (3.2km)
  🚦 Tráfico: Moderado
  ⏰ ${task.start} - ${task.end}
`;
```

#### 1.7 Exportación ICS 🔥
```javascript
// Generar archivo .ics estándar
function exportToICS(tasks, dateRange) {
  const ics = generateICSContent(tasks);
  downloadFile('calendario.ics', ics);
}

// Formato ICS (RFC 5545)
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendario Inteligente//ES
BEGIN:VEVENT
DTSTART:20251007T183000Z
DTEND:20251007T191500Z
SUMMARY:Comprar verduras
LOCATION:Jumbo Los Domínicos
DESCRIPTION:Tarea generada automáticamente
END:VEVENT
END:VCALENDAR
```

**Botón en UI:**
- "📥 Exportar a Calendario" → descarga .ics
- Importable en Google Calendar, Outlook, Apple Calendar

#### 1.8 Drag & Drop Básico ⚡
```javascript
// Permitir arrastrar tareas entre días
- onDragStart: guardar taskId
- onDragOver: mostrar zona válida
- onDrop: reasignar a nuevo día/hora
```

**Librerías sugeridas:**
- `interact.js` (vanilla JS)
- O HTML5 Drag & Drop nativo

---

### **FASE 2: Backend y Sincronización (2-3 semanas)**
*Requiere migrar a arquitectura cliente-servidor*

#### 2.1 Setup Backend
```bash
# Opción 1: Node.js + NestJS
nest new calendario-backend
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-google-oauth20

# Opción 2: Python + FastAPI
pip install fastapi uvicorn sqlalchemy psycopg2-binary
pip install google-auth google-auth-oauthlib google-api-python-client
```

#### 2.2 Base de Datos
```sql
-- PostgreSQL con el schema ya creado en database-schema.sql
psql -U postgres -d calendario -f database-schema.sql
```

#### 2.3 OAuth Google Calendar
```javascript
// Backend: NestJS
@Controller('auth/google')
export class GoogleAuthController {
  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const tokens = req.user.tokens;
    // Guardar tokens cifrados en DB
    await this.calendarService.saveTokens(tokens);
    res.redirect('/dashboard');
  }
}

// Importar eventos
async importGoogleEvents(userId: string) {
  const calendar = google.calendar('v3');
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime'
  });

  // Guardar en DB
  for (const event of events.data.items) {
    await this.eventsRepo.save({
      userId,
      providerEventId: event.id,
      title: event.summary,
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      location: event.location
    });
  }
}
```

#### 2.4 Webhooks Google Calendar
```javascript
// Suscribirse a cambios
async watchCalendar(calendarId: string) {
  const response = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: uuid(),
      type: 'web_hook',
      address: 'https://tu-dominio.com/api/calendar/webhook'
    }
  });
}

// Endpoint para recibir notificaciones
@Post('calendar/webhook')
async handleWebhook(@Headers() headers, @Body() body) {
  const resourceState = headers['x-goog-resource-state'];

  if (resourceState === 'sync') {
    // Sincronización inicial
  } else if (resourceState === 'exists') {
    // Evento modificado
    await this.syncService.syncChangedEvents();
  }
}
```

#### 2.5 Microsoft Graph (Outlook)
```javascript
// Similar a Google pero usando Microsoft Graph
const client = Client.init({
  authProvider: (done) => {
    done(null, accessToken);
  }
});

const events = await client
  .api('/me/calendar/events')
  .filter(`start/dateTime ge '${startDate}' and end/dateTime le '${endDate}'`)
  .select('subject,start,end,location')
  .get();
```

#### 2.6 Apple Calendar (CalDAV)
```javascript
// Más complejo, requiere DAV client
const DAVClient = require('dav');

const xhr = new DAVClient.transport.Basic(
  new DAVClient.Credentials({
    username: user.icloudEmail,
    password: user.appSpecificPassword
  })
);

const account = await DAVClient.createAccount({
  server: 'https://caldav.icloud.com',
  xhr: xhr,
  loadCollections: true
});

// Sincronizar eventos
const events = await DAVClient.syncCalendar(calendar);
```

---

### **FASE 3: Optimización Avanzada (3-4 semanas)**

#### 3.1 Google Distance Matrix con Tráfico Real
```javascript
// Backend: cachear resultados
async calculateTravelTime(
  origin: Location,
  destination: Location,
  departureTime: Date
): Promise<number> {
  // Verificar cache primero
  const cached = await this.distanceCache.find({
    originId: origin.id,
    destId: destination.id,
    timeBucket: getTimeBucket(departureTime)
  });

  if (cached && isRecent(cached.updatedAt)) {
    return cached.travelMin;
  }

  // Llamar API
  const response = await this.mapsClient.distancematrix({
    origins: [`${origin.lat},${origin.lng}`],
    destinations: [`${destination.lat},${destination.lng}`],
    departure_time: departureTime,
    traffic_model: 'best_guess'
  });

  const duration = response.data.rows[0].elements[0].duration_in_traffic.value;
  const minutes = Math.ceil(duration / 60);

  // Guardar en cache
  await this.distanceCache.save({
    originId: origin.id,
    destId: destination.id,
    timeBucket: getTimeBucket(departureTime),
    travelMin: minutes,
    trafficFactor: calculateTrafficFactor(duration, distance)
  });

  return minutes;
}
```

#### 3.2 Algoritmo de Scheduling Mejorado
```javascript
/**
 * Planificador con ventanas de tiempo, buffers y tráfico
 */
async function scheduleTasksAdvanced(
  tasks: Task[],
  availability: AvailabilityBlock[],
  events: Event[],
  locations: Location[],
  settings: Settings
): Promise<PlanSlot[]> {

  // 1. Construir timeline diario considerando:
  //    - Eventos externos (Google/Outlook/Apple)
  //    - Bloques de disponibilidad fijos
  //    - Buffers configurables
  const timeline = buildWeeklyTimeline(availability, events, settings);

  // 2. Ordenar tareas por score compuesto
  const sortedTasks = tasks.sort((a, b) => {
    return calculateTaskScore(b) - calculateTaskScore(a);
  });

  function calculateTaskScore(task: Task): number {
    let score = 0;

    // Deadline (más cercano = mayor score)
    if (task.deadline) {
      const daysUntil = daysBetween(new Date(), task.deadline);
      score += (30 - daysUntil) * 10;
    }

    // Prioridad
    score += task.priority * 5;

    // Duración (más cortas primero para fitting)
    score += (10 - task.duration) * 2;

    return score;
  }

  const scheduledSlots: PlanSlot[] = [];

  // 3. Para cada tarea, encontrar mejor slot
  for (const task of sortedTasks) {
    const candidates = await findCompatibleSlots(
      task,
      timeline,
      locations,
      settings
    );

    if (candidates.length === 0) {
      console.warn(`No se pudo agendar: ${task.title}`);
      continue;
    }

    // 4. Evaluar cada candidato con scoring
    const scoredCandidates = await Promise.all(
      candidates.map(async (slot) => {
        const score = await evaluateSlot(slot, task, scheduledSlots, locations, settings);
        return { slot, score };
      })
    );

    // 5. Seleccionar mejor
    scoredCandidates.sort((a, b) => b.score - a.score);
    const bestSlot = scoredCandidates[0].slot;

    // 6. Agendar con buffers
    const planSlot = {
      taskId: task.id,
      scheduledStart: bestSlot.start,
      scheduledEnd: new Date(bestSlot.start.getTime() + task.duration * 60 * 60 * 1000),
      travelFromLocationId: getPreviousLocation(scheduledSlots),
      travelMin: await calculateTravelTime(/* ... */),
      confidence: scoredCandidates[0].score / 100,
      status: 'draft'
    };

    scheduledSlots.push(planSlot);

    // Actualizar timeline (marcar slot como ocupado)
    markSlotAsOccupied(timeline, planSlot, settings.defaultBuffer);
  }

  return scheduledSlots;
}

/**
 * Evaluar calidad de un slot para una tarea
 */
async function evaluateSlot(
  slot: TimeSlot,
  task: Task,
  existingSlots: PlanSlot[],
  locations: Location[],
  settings: Settings
): Promise<number> {
  let score = 100;

  // Penalizar por tiempo de viaje
  const prevLocation = getPreviousLocation(existingSlots, slot.start);
  if (prevLocation && task.locationId) {
    const travelMin = await calculateTravelTime(prevLocation, task.location, slot.start);
    score -= travelMin * settings.weights.travelTime;
  }

  // Bonus por agrupar tareas cercanas
  const nearbyTasks = findNearbyTasks(existingSlots, task, slot.start.getDay());
  score += nearbyTasks.length * settings.weights.grouping * 10;

  // Penalizar si se acerca al deadline
  if (task.deadline) {
    const daysLeft = daysBetween(slot.start, task.deadline);
    if (daysLeft < 3) score += 30;
    if (daysLeft < 1) score += 50;
  }

  // Bonus por ventana de tiempo preferida
  if (task.windowStart && task.windowEnd) {
    if (isWithinWindow(slot.start, task.windowStart, task.windowEnd)) {
      score += 20;
    } else {
      score -= 50; // Fuerte penalización
    }
  }

  // Bonus por día preferido
  if (task.flexibleDays && task.flexibleDays.includes(slot.start.getDay())) {
    score += 15;
  }

  return Math.max(0, score);
}
```

#### 3.3 Tareas Meta ("Pedir Hora")
```javascript
// Tipo especial de tarea
task = {
  type: 'meta',  // vs 'regular'
  metaAction: 'call',  // 'call', 'email', 'search'
  duration: 0.25,  // 15 min
  requiresLocation: false,
  completionTrigger: {
    type: 'manual',  // Usuario marca como completa
    nextTaskTemplate: {
      // Al completarse, crear esta tarea
      title: 'Cita con doctor',
      type: 'regular',
      duration: 2,
      locationId: null,  // Usuario ingresa después
      windowStart: null,  // Usuario define rango
      windowEnd: null
    }
  }
}

// UI: Al marcar "Pedir hora" como completa
async function completeMetaTask(taskId: string) {
  const task = await getTask(taskId);

  if (task.completionTrigger) {
    // Mostrar dialog para crear próxima tarea
    showDialog({
      title: 'Crear tarea: ' + task.completionTrigger.nextTaskTemplate.title,
      fields: [
        { label: 'Fecha obtenida', type: 'daterange' },
        { label: 'Ubicación', type: 'address' },
        { label: 'Duración', type: 'number', default: 2 }
      ],
      onConfirm: (data) => {
        createTask({
          ...task.completionTrigger.nextTaskTemplate,
          ...data
        });
      }
    });
  }
}
```

---

## 📊 Priorización de Features

### 🔥 **Alta Prioridad (Hacer Ya)**
1. ✅ Formato DD-MM-YYYY en toda la app
2. ✅ Ventanas de tiempo (windowStart/windowEnd)
3. ✅ Bloques de disponibilidad recurrentes
4. ✅ Vista calendario día-hora (Google Calendar style)
5. ✅ Exportación ICS
6. ✅ Buffers configurables

### ⚡ **Media Prioridad (Próxima Iteración)**
7. Drag & drop
8. Tooltips mejorados con tráfico
9. Tareas meta
10. Backend básico con PostgreSQL

### 🚀 **Baja Prioridad (Futuro)**
11. OAuth Google Calendar
12. OAuth Microsoft Outlook
13. CalDAV Apple Calendar
14. Google Distance Matrix con tráfico
15. OR-Tools optimization

---

## 🛠️ Implementación Recomendada

### **Semana 1-2: Mejoras Frontend (Sin Backend)**
```bash
# Trabajar en rama feature
git checkout -b feature/advanced-scheduling

# Implementar:
1. Formato DD-MM-YYYY
2. Ventanas de tiempo
3. Bloques disponibilidad
4. Exportación ICS

# Deploy temporal:
vercel deploy  # O Netlify
```

### **Semana 3-4: Backend Setup**
```bash
# Crear proyecto backend
mkdir calendario-backend
cd calendario-backend

# NestJS
nest new .
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport

# Configurar DB
docker-compose up -d postgres
psql -U postgres -f ../database-schema.sql
```

### **Semana 5-6: OAuth + Sync**
```javascript
// Implementar flujos OAuth
// Google Calendar
// Microsoft Graph
// Webhooks
```

### **Semana 7+: Features Avanzadas**
```javascript
// Distance Matrix
// Algoritmo optimizado
// Tareas meta
// ML predictions
```

---

## 📝 Checklist de Implementación

### Frontend (Sin Backend)
- [ ] Formato DD-MM-YYYY
- [ ] Ventanas de tiempo para tareas
- [ ] CRUD de bloques disponibilidad
- [ ] Vista calendario día-hora
- [ ] Tooltips mejorados
- [ ] Buffers configurables
- [ ] Exportación ICS
- [ ] Drag & drop básico

### Backend + Integrations
- [ ] Setup NestJS/FastAPI
- [ ] PostgreSQL + migrations
- [ ] OAuth Google
- [ ] OAuth Microsoft
- [ ] CalDAV Apple
- [ ] Webhooks Google/Microsoft
- [ ] Sync bidireccional
- [ ] Distance Matrix cache
- [ ] Algoritmo scheduling avanzado

### Testing & Deployment
- [ ] Tests unitarios
- [ ] Tests E2E
- [ ] CI/CD pipeline
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Deploy backend (Railway/Fly.io)
- [ ] Monitoreo (Sentry)

---

## 🎯 Resultado Final Esperado

```
┌────────────────────────────────────────────────────────┐
│  📅 Calendario Inteligente        🔄 Sync  ❓ Ayuda    │
│  Sincronizado con Google Calendar, Outlook, Apple      │
└────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│   Hora   │  Lun 07  │  Mar 08  │  Mié 09  │  Jue 10  │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│  06:00   │          │          │          │          │
│  07:00   │          │          │          │          │
│  08:00   │ ████████ │ ████████ │ ████████ │ ████████ │
│  09:00   │ Trabajo  │ Trabajo  │ Trabajo  │ Trabajo  │
│  10:00   │    ↓     │    ↓     │    ↓     │    ↓     │
│  11:00   │    ↓     │    ↓     │    ↓     │    ↓     │
│  12:00   │    ↓     │    ↓     │    ↓     │    ↓     │
│  13:00   │ ──────── │ ──────── │ ──────── │ ──────── │
│  14:00   │ Almuerzo │ Almuerzo │ Almuerzo │ Almuerzo │
│  15:00   │ ████████ │ ████████ │ ████████ │ ████████ │
│  16:00   │ Trabajo  │ Trabajo  │ Trabajo  │ Trabajo  │
│  17:00   │    ↓     │    ↓     │    ↓     │    ↓     │
│  18:00   │          │ ████████ │          │ ████████ │
│  19:00   │          │ Compras  │          │ Doctor   │
│          │          │ + Remedios│         │ (2h)     │
│  20:00   │          │ (1.5h)   │          │    ↓     │
│  21:00   │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘

💡 Sugerencias:
• Martes 18:30: Comprar verduras + remedios (cerca, ahorras 15 min)
  🚗 Desde trabajo: 12 min | Tráfico: Moderado

• Jueves 18:00: Cita doctor (dentro de ventana 10-15/10)
  🚗 Desde trabajo: 8 min | Tráfico: Leve

[Aceptar Todo] [Editar] [Rechazar]

📥 Exportar a .ics   |   🔄 Última sync: hace 5 min
```

---

¿Por dónde empezamos? Recomiendo este orden:
1. Formato DD-MM-YYYY + Ventanas de tiempo (hoy)
2. Vista calendario mejorada (mañana)
3. Exportación ICS (esta semana)
4. Backend + OAuth (próxima semana)
