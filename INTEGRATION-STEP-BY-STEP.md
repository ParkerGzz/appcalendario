# Integración Paso a Paso - Zod + Zustand en app.js

## 🎯 Objetivo

Reemplazar el código viejo de app.js con nuevas funciones que usen:
- **Zod** para validación
- **Zustand** para estado reactivo
- localStorage automático
- Mejor error handling

## 📋 Pasos de Integración

### PASO 1: Agregar Imports al inicio de app.js

**Ubicación:** Después de otros imports, cerca de la línea 1-30

```javascript
// Agregar estos imports en app.js
import { useAppStore, useTasks, useNotifications } from './src/store.js';
import {
  validateTask,
  validateLocation,
  validateSettings
} from './src/validation/schemas.js';
```

Si app.js no usa módulos ES6, hazlo así en HTML:

```html
<!-- En index.html, dentro de <body> al final -->
<script type="module">
  import { useAppStore } from './src/store.js';
  import { validateTask } from './src/validation/schemas.js';

  // Hacer disponible globalmente
  window.appStore = useAppStore;
  window.validateTask = validateTask;
</script>
```

---

### PASO 2: Reemplazar función `addTask`

**Ubicación:** Línea 1356 en app.js

**Qué hacer:**

1. Abre `src/integration-app-refactored.js`
2. Copia la función `addTaskRefactored(e)`
3. En app.js, **reemplaza completamente** la función `addTask(e)` (líneas 1356-1431)
4. Renombra `addTaskRefactored` a `addTask`

**Antes:**
```javascript
function addTask(e) {
  e.preventDefault();

  // Obtener y validar deadline
  const deadlineInput = document.getElementById('taskDeadline').value;
  // ... código viejo ...

  state.tasks.push(task);
  saveToStorage();
}
```

**Después:**
```javascript
function addTask(e) {
  e.preventDefault();

  try {
    // Obtener valores del formulario
    const deadlineInput = document.getElementById('taskDeadline').value;
    // ...

    // VALIDAR CON ZOD
    const validation = validateTask(taskData);

    if (!validation.success) {
      const { addNotification } = useAppStore.getState();
      validation.error.forEach(err => {
        addNotification(`❌ ${err.path.join('.')}: ${err.message}`, 'error', 5000);
      });
      return;
    }

    // AGREGAR A STORE
    const store = useAppStore.getState();
    const newTask = store.addTask(validation.data);

    // ... resto del código ...
  } catch (error) {
    console.error('Error adding task:', error);
  }
}
```

---

### PASO 3: Verificar que funciona en navegador

**Pruebas:**

1. Abre el navegador en `http://localhost:8000`
2. Ve a la vista de Tareas
3. Intenta crear una tarea NUEVA:
   - Nombre: "Test task"
   - Duración: 60
   - Prioridad: Media
   - Ubicación: "Test location"

**¿Qué debería pasar?**
- ✅ La tarea aparece en la lista
- ✅ Se ve una notificación de éxito
- ✅ Si recargs la página, la tarea sigue ahí (localStorage)
- ❌ Si intentas crear sin nombre, muestra error

**Si algo falla:**
- Abre la consola (F12)
- Busca errores rojos
- Verifica que los imports están en el lugar correcto

---

### PASO 4: Reemplazar localStorage manual

**Ubicación:** Líneas 3310-3314 en app.js

**Qué hacer:**

Busca estas líneas:
```javascript
// ANTES
localStorage.setItem('calendarApp', JSON.stringify(state));
const saved = localStorage.getItem('calendarApp');
```

**Reemplaza con:**
```javascript
// DESPUÉS
// Zustand maneja localStorage automáticamente
// NO NECESITAS hacer setItem ni getItem manualmente

// Si necesitas acceder al estado:
const store = useAppStore.getState();
const tasks = store.getTasks();
const settings = store.getSettings();
```

---

### PASO 5: Agregar Suscripciones Reactivas

**Ubicación:** En la función de inicialización de app.js (busca `function initApp()` o similar)

**Qué hacer:**

Agrega esto en la función de inicialización:

```javascript
// Suscribirse a cambios de tareas - auto-actualizar UI
useAppStore.subscribe(
  (state) => state.tasks,
  (tasks) => {
    console.log('📋 Tasks updated, refreshing UI...');
    renderCalendar();
    renderTasks();
    generateSuggestions();
  }
);

// Suscribirse a cambios de ubicaciones - actualizar mapa
useAppStore.subscribe(
  (state) => [state.homeLocation, state.workLocation],
  ([home, work]) => {
    console.log('📍 Locations updated');
    // Si tienes mapa, actualizar marcadores
    // updateMapMarkers(home, work);
  }
);

// Suscribirse a cambios de configuración
useAppStore.subscribe(
  (state) => state.settings,
  (settings) => {
    console.log('⚙️ Settings updated');
    // Recalcular rutas, etc si es necesario
  }
);
```

---

### PASO 6: Cargar Estado Existente en el Store

Si ya tienes tareas guardadas en localStorage viejo:

**Qué hacer:**

Agrega esto en la inicialización:

```javascript
// Cargar tareas existentes si existen
const existingData = JSON.parse(localStorage.getItem('calendarApp')) || {};

if (existingData.tasks && existingData.tasks.length > 0) {
  const store = useAppStore.getState();

  existingData.tasks.forEach(task => {
    store.addTask({
      title: task.name, // mapear 'name' a 'title'
      duration: task.duration,
      priority: task.priority,
      location: {
        address: task.address || task.location,
        lat: task.lat,
        lng: task.lng,
        label: task.location
      }
    });
  });

  console.log('✅ Loaded', existingData.tasks.length, 'existing tasks');
}
```

---

### PASO 7: Pruebas Finales en Navegador

**Checklist de Pruebas:**

- [ ] Crear una tarea nueva → aparece en lista y calendario
- [ ] Recargar página → la tarea sigue ahí
- [ ] Intentar crear sin nombre → muestra error rojo
- [ ] Cambiar prioridad de una tarea → se actualiza automáticamente
- [ ] Eliminar una tarea → desaparece
- [ ] Abrir DevTools (F12) → ver Redux DevTools con el store
- [ ] Ver en localStorage (`Application > Storage > Local Storage`) → datos persistidos

---

## 🔄 Orden Recomendado de Integración

Si `app.js` es muy grande, integra gradualmente:

### Semana 1: Tareas
1. PASO 1: Agregar imports
2. PASO 2: Reemplazar `addTask()`
3. PASO 3: Pruebas básicas
4. PASO 7: Verificar en navegador

### Semana 2: localStorage y suscripciones
5. PASO 4: Eliminar localStorage manual
6. PASO 5: Agregar suscripciones
7. PASO 6: Cargar datos existentes

### Semana 3: Ampliación
- Reemplazar `updateTask()`
- Reemplazar `deleteTask()`
- Agregar validación a ubicaciones
- Agregar validación a configuración

---

## 🐛 Troubleshooting

### Problema: "Cannot find module './src/store.js'"

**Solución:**
- Verifica que `src/store.js` existe
- Usa rutas relativas correctas
- En navegador, puede necesitar `/src/store.js`

### Problema: "validateTask is not defined"

**Solución:**
- Verifica que importaste `validateTask`
- Comprueba que no hay typos en el nombre
- Abre la consola y ve los errores de import

### Problema: "Las tareas no se guardan"

**Solución:**
- Abre DevTools (F12)
- Ve a Application > Local Storage
- Busca clave `calendar-store`
- Verifica que hay datos ahí

### Problema: "Las notificaciones no aparecen"

**Solución:**
- El store crea notificaciones automáticamente
- Verifica que `showNotification()` no está conflictuando
- Puedes remover llamadas manuales a `showNotification()`

---

## 📊 Antes vs Después

### ANTES (Código Viejo)
```javascript
function addTask(e) {
  const task = {
    id: Date.now(),
    name: document.getElementById('taskName').value,
    duration: parseFloat(document.getElementById('taskDuration').value),
    // Sin validación ❌
  };

  // localStorage manual ❌
  state.tasks.push(task);
  saveToStorage();

  // Actualización manual ❌
  renderCalendar();
  renderTasks();
}
```

### DESPUÉS (Código Nuevo)
```javascript
function addTask(e) {
  const validation = validateTask(taskData);

  if (!validation.success) {
    // Errores claros ✅
    addNotification(`❌ ${err.message}`, 'error');
    return;
  }

  // Actualización automática ✅
  const store = useAppStore.getState();
  store.addTask(validation.data);
  // localStorage automático ✅
  // Notificación automática ✅
}
```

---

## 📚 Documentación Relacionada

- `src/INTEGRATION-GUIDE.md` - Guía completa de Zod + Zustand
- `src/app-integration-example.js` - 11 ejemplos de código
- `NEXT-STEPS.md` - Timeline de implementación

---

## ✅ Checklist Final

- [ ] PASO 1: Imports agregados
- [ ] PASO 2: `addTask()` reemplazada
- [ ] PASO 3: Pruebas básicas pasadas
- [ ] PASO 4: localStorage manual eliminado
- [ ] PASO 5: Suscripciones reactivas agregadas
- [ ] PASO 6: Datos existentes cargados
- [ ] PASO 7: Todas las pruebas pasadas
- [ ] Revisar consola - sin errores rojos
- [ ] Revisar DevTools - Redux DevTools funciona
- [ ] Revisar localStorage - datos persistidos

---

## 🎉 Siguiente Paso

Una vez completada la integración:

1. **Integrar más funciones** (updateTask, deleteTask)
2. **Implementar Tests** (Tarea #4)
3. **Agregar Offline Mode** (Tarea #5)
4. **Mejoras UI/UX** (Dark mode, colores, etc)

**¿Preguntas?** Consulta `NEXT-STEPS.md`
