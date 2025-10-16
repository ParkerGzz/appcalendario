# 🗺️ Guía: Rutas y Visualización de Tareas

## 📍 ¿Dónde encuentro las rutas optimizadas?

### 1. **Dashboard** (Vista Principal)

Cuando inicias sesión, estás en el **Dashboard**. Aquí verás:

```
┌─────────────────────────────────────┐
│  📊 DASHBOARD                       │
├─────────────────────────────────────┤
│  📅 Tareas Pendientes (máx 5)       │
│  ├─ Tarea 1                         │
│  ├─ Tarea 2                         │
│  └─ ...                             │
│                                     │
│  💡 Sugerencias y Alertas           │
│  ├─ Alerta 1                        │
│  └─ ...                             │
└─────────────────────────────────────┘
```

### 2. **Vista de Tareas** 📝

Para ver **TODAS** tus tareas:

1. Click en el menú lateral (☰)
2. Selecciona **"📝 Tareas"**

Aquí verás:
- **Tareas Pendientes** (sin asignar fecha)
- **Todas las Tareas Activas** (ordenadas por prioridad)
- **Tareas Archivadas** (click para expandir)

Cada tarea muestra:
- ✅ Nombre
- ⏱️ Duración
- 📍 Ubicación
- 🗓️ Fecha asignada (si tiene)
- 🚗 Información de tráfico (si calculaste ruta)

### 3. **Vista de Calendario** 📅

Para ver tareas en formato calendario:

1. Click en el menú lateral (☰)
2. Selecciona **"📅 Calendario"**

El calendario muestra:
- Tareas por día
- Color según prioridad:
  - 🔴 Rojo = Urgente
  - 🟠 Naranja = Alta
  - 🟡 Amarillo = Media
  - 🟢 Verde = Baja

Click en una tarea para ver detalles completos.

---

## 🚗 Cómo optimizar rutas

### Paso 1: Crear tareas con ubicación

1. Click en **"+ Nueva Tarea"**
2. Llena el formulario:
   - Nombre: "Comprar en el supermercado"
   - Duración: 1 hora
   - **Ubicación:** Escribe y selecciona del autocomplete
   - Prioridad: Media
   - Fecha límite: (opcional)
3. Click en **"Guardar"**

**Repite** para crear varias tareas con ubicaciones diferentes.

### Paso 2: Abrir Recomendaciones de Rutas

Hay **2 formas**:

#### Opción A: Desde el menú lateral
1. Click en el menú (☰)
2. Click en **"🗺️ Optimizar Rutas"**

#### Opción B: Desde la vista de Tareas
1. Ve a **"📝 Tareas"**
2. Busca el botón **"🗺️ Optimizar Rutas"** (arriba a la derecha)
3. Click en él

### Paso 3: Ver recomendaciones

Se abrirá el modal **"🗺️ Recomendaciones de Rutas para Hoy"**:

```
┌──────────────────────────────────────────┐
│  🗺️ Recomendaciones de Rutas para Hoy   │
├──────────────────────────────────────────┤
│  📍 Ruta Optimizada #1                   │
│  ├─ 3 tareas                             │
│  ├─ ~9 km total                          │
│  ├─ ~2h 15min estimado                   │
│  └─ [Ver Detalles] [Aceptar]            │
│                                          │
│  📍 Ruta Optimizada #2                   │
│  ├─ 2 tareas                             │
│  ├─ ~5 km total                          │
│  └─ ...                                  │
└──────────────────────────────────────────┘
```

Cada ruta muestra:
- Número de tareas incluidas
- Distancia total estimada
- Tiempo total estimado
- Botón **"Ver Detalles"**
- Botón **"Aceptar"**

### Paso 4: Ver detalles de una ruta

Click en **"Ver Detalles"** para ver:

```
┌──────────────────────────────────────────┐
│  🚗 Planifica tu Ruta                    │
├──────────────────────────────────────────┤
│  Elige modo de transporte:               │
│  [🚗 Auto] [🚶 Caminar] [🚴 Bici] [🚌] │
│                                          │
│  📊 Resumen de Ruta                      │
│  ├─ Distancia: 8.5 km                   │
│  └─ Duración: 25 min                     │
│                                          │
│  🗺️ Lugares de Interés en Ruta          │
│  ├─ Supermercado Los Andes (+2 min)     │
│  ├─ Farmacia Cruz Verde (+1 min)        │
│  └─ ...                                  │
│                                          │
│  ✅ Tareas a Realizar                    │
│  ├─ Tarea 1: Comprar comida             │
│  │   Opciones cercanas:                 │
│  │   • Supermercado A (+0 min)          │
│  │   • Supermercado B (+3 min)          │
│  └─ Tarea 2: Comprar medicinas          │
│                                          │
│  🗺️ Mapa de Ruta (visual)               │
│                                          │
│  [Cerrar] [Aceptar Ruta]                │
└──────────────────────────────────────────┘
```

### Paso 5: Aceptar la ruta

Click en **"Aceptar"** o **"Aceptar Ruta"**:

1. El modal se cerrará automáticamente
2. Las tareas se actualizarán con:
   - ✅ Fecha asignada (hoy)
   - 🕐 Hora sugerida
   - 🚗 Información de tráfico
   - 📍 Ubicación confirmada

### Paso 6: Ver las tareas optimizadas

Las tareas optimizadas aparecerán en:

1. **Dashboard**: Con alertas de tráfico y horarios
2. **Vista de Tareas**: Marcadas como "Asignadas hoy"
3. **Calendario**: En el día de hoy con hora sugerida

---

## ❓ Problemas Comunes

### "No veo el botón de Optimizar Rutas"

**Causa:** No tienes tareas con ubicación.

**Solución:**
1. Crea al menos 2 tareas
2. Agrega ubicaciones a cada tarea (usa el autocomplete)
3. El botón aparecerá automáticamente

### "El autocomplete de direcciones no funciona"

**Causa:** La API key de Google Maps no está configurada o tiene restricciones.

**Solución para GitHub Pages:**
Ver [CONFIGURAR-GITHUB-PAGES.md](CONFIGURAR-GITHUB-PAGES.md)

**Solución para localhost:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Edita tu API key
3. Agrega estos HTTP referrers:
   ```
   http://localhost:*/*
   http://127.0.0.1:*/*
   file:///*
   ```

### "El modal de rutas no se cierra"

**Causa:** Error de JavaScript (ya corregido).

**Solución:**
1. Recarga la página (Cmd+R o F5)
2. El botón de cerrar (✕) debería funcionar
3. También puedes hacer Escape para cerrar

### "No veo mis tareas después de aceptar la ruta"

**Causa:** Las tareas se asignaron pero estás en la vista incorrecta.

**Solución:**
1. Ve al **Dashboard** (icono de casa)
2. O ve a **"📝 Tareas"** en el menú
3. Las tareas estarán en "Todas las Tareas Activas"
4. Filtradas con fecha de hoy

---

## 💡 Tips y Trucos

### 1. Agrupar tareas por zona

Cuando creas tareas, agrupa las que están en la misma zona:
- Ejemplo: "Compras en el centro", "Banco en el centro", etc.

El algoritmo las detectará y optimizará automáticamente.

### 2. Usar ventanas de tiempo

Al crear una tarea, puedes especificar:
- **Hora inicio:** "No antes de las 10:00"
- **Hora fin:** "No después de las 14:00"

Esto ayuda al optimizador a crear rutas realistas.

### 3. Revisar alertas inteligentes

El Dashboard muestra alertas como:
- ⚠️ "Lugar cierra pronto"
- 🚗 "Tráfico pesado en tu ruta"
- 🕐 "Hora pasada para esta tarea"

Revísalas antes de salir.

### 4. Calcular tráfico en tiempo real

En una tarea con ubicación:
1. Click en la tarea
2. Click en **"🚗 Ver tráfico"**
3. Verás el tiempo actual de viaje

### 5. Cambiar hora de una tarea

1. Click en la tarea
2. Modifica "Hora asignada"
3. Click en "Actualizar"

---

## 🔄 Flujo Completo de Ejemplo

```
1. Crear Tareas
   ├─ "Comprar en Supermercado" (Av. Principal 123)
   ├─ "Recoger paquete" (Correos de Chile, Calle 5)
   └─ "Farmacia" (Farmacia Cruz Verde, Av. Central)

2. Optimizar Rutas
   ├─ Menu (☰) → "🗺️ Optimizar Rutas"
   └─ Se abre modal con recomendaciones

3. Ver Detalles
   ├─ Click en "Ver Detalles" de Ruta #1
   ├─ Seleccionar modo: 🚗 Auto
   └─ Ver mapa y POIs en ruta

4. Aceptar Ruta
   ├─ Click en "Aceptar Ruta"
   └─ Modal se cierra

5. Verificar Tareas
   ├─ Ve a "📝 Tareas"
   ├─ Las 3 tareas ahora tienen:
   │   ├─ Fecha: Hoy
   │   ├─ Hora: Sugerida por optimizador
   │   └─ Tráfico: Calculado
   └─ Listo para salir!
```

---

## 📱 Desde el Celular

Todo funciona igual, pero:
- Menú lateral: Click en (☰) arriba izquierda
- Modales: Ocupan toda la pantalla
- Autocomplete: Puede tardar unos segundos más

**Asegúrate de tener la API key configurada para GitHub Pages** (ver [CONFIGURAR-GITHUB-PAGES.md](CONFIGURAR-GITHUB-PAGES.md))

---

## 🎯 Resumen Rápido

| Acción | Ubicación |
|--------|-----------|
| Ver tareas pendientes | Dashboard |
| Ver todas las tareas | Menu → 📝 Tareas |
| Ver calendario | Menu → 📅 Calendario |
| Crear tarea | Botón "+ Nueva Tarea" (siempre visible) |
| Optimizar rutas | Menu → 🗺️ Optimizar Rutas |
| Ver detalles de ruta | Modal de rutas → "Ver Detalles" |
| Aceptar ruta | Modal de detalles → "Aceptar Ruta" |
| Editar tarea | Click en la tarea |
| Calcular tráfico | En tarea → "🚗 Ver tráfico" |

---

**¿Tienes más dudas?** Revisa los otros archivos de documentación:
- [README.md](README.md) - Documentación general
- [INSTALACION-SEGURA.md](INSTALACION-SEGURA.md) - Setup completo
- [COMPLETE-FEATURES-GUIDE.md](COMPLETE-FEATURES-GUIDE.md) - Todas las funciones
