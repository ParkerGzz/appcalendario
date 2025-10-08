# 📋 Gestión de Tareas - Guía Completa

## Versión 0.4.1 - Sistema de Asignación y Sugerencias Restaurado

### ✅ Funcionalidades Restauradas y Mejoradas

#### 1. **Asignación Manual de Tareas** 📅
Ahora puedes asignar cualquier tarea a un día específico de dos formas:

**Opción A: Desde la lista de tareas**
1. Ve a la vista **✓ Tareas**
2. Encuentra la tarea que deseas asignar
3. Haz clic en el botón **"📅 Asignar a día"**
4. Ingresa la fecha en formato DD-MM-YYYY (ej: 25-01-2025)
5. La app calculará automáticamente la mejor hora del día

**Características:**
- ✅ Validación de formato de fecha
- ✅ Respeta ventanas de tiempo configuradas
- ✅ Alerta si asignas fuera de la ventana disponible
- ✅ Cálculo automático de mejor horario

#### 2. **Sugerencia Automática de Día** 💡
La app ahora puede sugerirte el mejor día para cada tarea individualmente.

**Cómo usarlo:**
1. Ve a **✓ Tareas**
2. En cualquier tarea pendiente, haz clic en **"💡 Sugerir día"**
3. La app analizará:
   - ✅ Prioridad de la tarea
   - ✅ Fecha límite (si existe)
   - ✅ Ventana de tiempo disponible
   - ✅ Tareas cercanas ese día (si la tarea tiene ubicación GPS)
   - ✅ Disponibilidad de tiempo en el calendario

4. Verás una ventana con:
   - 📅 Fecha sugerida
   - 📝 Razones de la sugerencia
   - ✅ Botón para aceptar o rechazar

**Ejemplo de sugerencia:**
```
💡 Se sugiere asignar "Comprar verduras" el día:

📅 25-01-2025

⚠️ La tarea es urgente
🗺️ Hay 2 tarea(s) cercana(s) ese día
⏰ Quedan 3 días hasta la fecha límite

¿Deseas asignar esta tarea a este día?
```

#### 3. **Sugerencias Inteligentes Mejoradas** 🧠
Sistema completo de análisis que agrupa y sugiere tareas automáticamente.

**Tipos de Sugerencias:**

**A) 🗺️ Tareas Cercanas**
- Detecta tareas que están a menos de 2km de distancia
- Sugiere hacerlas el mismo día
- Calcula tiempo ahorrado en traslados
- Ejemplo: "Comprar verduras" + "Ir al banco" (ambos en el centro)

**B) 📍 Agrupar por Ubicación**
- Agrupa tareas en lugares similares
- Basado en nombres de ubicación
- Ejemplo: Todas las tareas en "Supermercado"

**C) ⚠️ Tareas Urgentes**
- Detecta tareas con prioridad "urgente"
- Sugiere asignarlas lo antes posible
- Prioriza sobre otras sugerencias

**D) ⏰ Fecha Límite Próxima**
- Detecta tareas con deadline cercano (≤7 días)
- Alerta cuántos días quedan
- Sugiere día específico antes del límite

**Cómo ver las sugerencias:**
1. Ve a **✓ Tareas**
2. Desplázate a la sección **"💡 Sugerencias Inteligentes"**
3. Verás tarjetas con cada sugerencia

**Acciones disponibles:**
- ✓ **Asignar "Nombre"**: Asigna solo esa tarea
- ✓✓ **Asignar todas**: Asigna todas las tareas del grupo al día sugerido

#### 4. **Vista de Tareas Mejorada**
Nueva organización en la vista de Tareas:

```
✓ Gestión de Tareas
│
├─ ➕ Añadir Nueva Tarea
│  └─ Formulario completo
│
├─ 📋 Tareas Pendientes (Sin Asignar)
│  └─ Solo tareas que no tienen día asignado
│     ├─ 💡 Sugerir día
│     ├─ 📅 Asignar a día
│     └─ 🗑️ Eliminar
│
├─ 💡 Sugerencias Inteligentes
│  └─ Recomendaciones automáticas
│     ├─ Tareas cercanas
│     ├─ Agrupar por ubicación
│     ├─ Tareas urgentes
│     └─ Fecha límite próxima
│
└─ 📋 Todas las Tareas
   └─ Lista completa (asignadas y pendientes)
      ├─ 🔄 Desasignar (si está asignada)
      └─ 🗑️ Eliminar
```

#### 5. **Información de Distancias Restaurada** 🗺️
Cuando creas una tarea con dirección específica:

**Se muestra automáticamente:**
- 🏠→📍 Distancia desde casa (en km y tiempo estimado)
- 💼→📍 Distancia desde trabajo (en km y tiempo estimado)

**Ejemplo:**
```
Tarea: Comprar verduras
📍 Ubicación: Supermercado Centro
🗺️ Dirección: Av. Principal 123

🏠→📍 3.5km (≈12 min) | 💼→📍 1.2km (≈5 min)
```

**Esto te ayuda a:**
- Ver qué tan lejos está cada tarea
- Decidir cuándo hacerla (después del trabajo, desde casa, etc.)
- Planificar mejor las rutas

## Flujo de Trabajo Completo

### Escenario Real: Planificar la Semana

**1. Crear tareas** (Lunes por la mañana):
```
✓ Comprar verduras - Supermercado Centro - Urgente
✓ Comprar remedios - Farmacia Cruz Verde - Media
✓ Ir al banco - Banco Estado - Alta
✓ Retirar paquete - Correo Chile - Media
```

**2. Configurar ubicaciones:**
- Casa: Av. Independencia 1234
- Trabajo: Las Condes 5678

**3. La app automáticamente genera sugerencias:**

**Sugerencia 1: 🗺️ Tareas cercanas**
```
📅 Martes 23-01-2025

Estas tareas están muy cerca una de otra (menos de 2km).
Puedes ahorrar 15 minutos haciéndolas el mismo día.

Tareas:
- Comprar verduras (1h) - Supermercado Centro
- Ir al banco (0.5h) - Banco Estado

Duración total: 1.5 horas

[✓ Asignar "Comprar verduras"] [✓ Asignar "Ir al banco"] [✓✓ Asignar todas]
```

**Sugerencia 2: ⚠️ Tarea urgente**
```
📅 Lunes 22-01-2025

Esta tarea es urgente y debería hacerse lo antes posible.

Tareas:
- Comprar verduras (1h) - Supermercado Centro

[✓ Asignar "Comprar verduras"]
```

**4. Tú decides:**
- Opción A: Aceptar sugerencia (hacer todo el martes)
- Opción B: Usar "💡 Sugerir día" individual
- Opción C: Asignar manualmente con "📅 Asignar a día"

**5. Resultado:**
```
📅 Calendario actualizado:

Lunes 22-01:
  (sin tareas - día de descanso)

Martes 23-01:
  18:00 - Comprar verduras (1h)
  19:00 - Ir al banco (0.5h)

Miércoles 24-01:
  18:30 - Comprar remedios (0.5h)

Jueves 25-01:
  18:00 - Retirar paquete (1h)
```

## Algoritmo de Sugerencias

### Proceso de Análisis

```javascript
1. Detectar tareas pendientes (sin asignar)
2. Para cada tarea:
   a. Verificar prioridad (urgente → alta → media → baja)
   b. Verificar fecha límite
   c. Verificar ubicación GPS
   d. Buscar tareas cercanas geográficamente

3. Generar sugerencias:
   a. URGENTES: Asignar lo antes posible
   b. DEADLINE: Asignar antes de la fecha límite
   c. PROXIMIDAD: Agrupar tareas cercanas (<2km)
   d. UBICACIÓN: Agrupar por nombre similar

4. Para cada sugerencia:
   a. Calcular día óptimo (findBestDayForTasks)
   b. Considerar ventanas de tiempo
   c. Verificar disponibilidad horaria
   d. Evitar sobrecarga diaria

5. Ordenar por prioridad:
   urgente > deadline > proximity > location-group

6. Mostrar en UI con opción de aceptar/rechazar
```

### Función `findBestDayForTasks`

Esta función encuentra el mejor día para asignar tarea(s):

```javascript
Criterios:
1. Dentro de la ventana de tiempo (si existe)
2. Antes de la fecha límite (si existe)
3. Con suficiente tiempo libre ese día
4. Lo más pronto posible (preferencia)

Proceso:
1. Determinar rango de búsqueda (hoy + 14 días)
2. Ajustar por ventanas de tiempo de las tareas
3. Para cada día en el rango:
   a. Verificar si hay tiempo disponible
   b. Calcular "puntaje" del día
   c. Preferir días cercanos a hoy
4. Retornar día con mejor puntaje
```

## Casos Especiales

### Caso 1: Tarea con Ventana de Tiempo
```
Tarea: Renovar carnet
Ventana: 15-02-2025 al 28-02-2025
Duración: 2h

Sugerencia: 19-02-2025
Razón: Dentro de tu ventana disponible
```

Si intentas asignar fuera de la ventana:
```
⚠️ La fecha seleccionada está fuera de la ventana disponible.
Ventana: 15-02-2025 al 28-02-2025

¿Deseas asignarla de todos modos?
[Cancelar] [Asignar de todos modos]
```

### Caso 2: Múltiples Tareas en Mismo Lugar
```
Tareas:
- Comprar pan (Panadería El Sol)
- Comprar leche (Panadería El Sol)
- Comprar café (Panadería El Sol)

Sugerencia: 📍 Agrupar por ubicación
Día sugerido: 23-01-2025
Duración total: 0.75h

[✓✓ Asignar todas]
```

### Caso 3: Tarea Urgente con Deadline
```
Tarea: Pagar cuenta de luz
Prioridad: Urgente
Deadline: 24-01-2025

Sugerencia: ⚠️ Tarea urgente
Día sugerido: Hoy (22-01-2025)
Razones:
- ⚠️ La tarea es urgente
- ⏰ Quedan 2 días hasta la fecha límite
```

## Tips y Mejores Prácticas

### 💡 Para Mejores Sugerencias:
1. **Agrega direcciones específicas** a tus tareas
   - Con GPS: La app puede calcular distancias reales
   - Sin GPS: Solo agrupa por nombre similar

2. **Usa ventanas de tiempo**
   - Define cuándo puedes hacer cada tarea
   - La app respetará estos límites

3. **Asigna prioridades correctamente**
   - Urgente: Debe hacerse YA
   - Alta: Importante pero puede esperar 1-2 días
   - Media: Flexible
   - Baja: Cuando haya tiempo

4. **Revisa las sugerencias regularmente**
   - Aparecen automáticamente al crear/modificar tareas
   - Se actualizan al asignar/desasignar

### 🎯 Para Ahorrar Tiempo:
1. **Agrupa tareas cercanas**
   - Acepta sugerencias de proximidad
   - Ahorra tiempo y combustible

2. **Usa "Asignar todas"**
   - Cuando una sugerencia incluye múltiples tareas
   - Asigna todo de un clic

3. **Revisa distancias desde casa y trabajo**
   - Decide si hacer la tarea:
     - De camino al trabajo
     - De camino a casa
     - En fin de semana desde casa

## Próximas Mejoras

### En desarrollo:
- [ ] Sugerencias basadas en historial (ML)
- [ ] Considerar clima en sugerencias
- [ ] Integración con tráfico en tiempo real
- [ ] Notificaciones push cuando pases cerca de una tarea pendiente
- [ ] Sugerencias multi-día (planificar semana completa)
- [ ] Optimización con algoritmos avanzados (TSP solver)

---

**Versión**: 0.4.1
**Fecha**: Enero 2025
**Funcionalidades clave**: Asignación manual, sugerencia automática, análisis inteligente
