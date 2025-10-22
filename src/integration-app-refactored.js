/**
 * REFACTORED app.js INTEGRATION
 *
 * Este archivo muestra cómo refactorizar las funciones principales de app.js
 * para usar Zod validation y Zustand state management.
 *
 * Copia estas funciones y reemplaza las viejas en app.js
 */

import { useAppStore, useTasks, useNotifications } from './store.js';
import { validateTask } from './validation/schemas.js';

/**
 * ============================================================================
 * REEMPLAZAR: function addTask(e) { ... }
 * ============================================================================
 *
 * ORIGINAL: Líneas 1356-1431 en app.js
 * NUEVA: Usa validación Zod y store Zustand
 */
export function addTaskRefactored(e) {
  e.preventDefault();

  try {
    // 1. Obtener valores del formulario
    const deadlineInput = document.getElementById('taskDeadline').value;
    let deadline = null;
    if (deadlineInput) {
      deadline = parseDateInput(deadlineInput);
      if (!deadline) {
        const { addNotification } = useAppStore.getState();
        addNotification('Formato de fecha límite inválido. Usa DD-MM-YYYY (ej: 15-10-2025)', 'error', 5000);
        return;
      }
    }

    // 2. Obtener ventana de tiempo (igual que antes)
    const windowStartInput = document.getElementById('taskWindowStart').value;
    const windowEndInput = document.getElementById('taskWindowEnd').value;
    let windowStart = null;
    let windowEnd = null;

    if (windowStartInput || windowEndInput) {
      if (windowStartInput && windowEndInput) {
        windowStart = parseDateInput(windowStartInput);
        windowEnd = parseDateInput(windowEndInput);

        if (!windowStart || !windowEnd) {
          const { addNotification } = useAppStore.getState();
          addNotification('Formato de ventana de tiempo inválido. Usa DD-MM-YYYY', 'error', 5000);
          return;
        }

        if (new Date(windowStart) > new Date(windowEnd)) {
          const { addNotification } = useAppStore.getState();
          addNotification('La fecha de inicio debe ser anterior a la fecha de fin', 'error', 5000);
          return;
        }
      } else {
        const { addNotification } = useAppStore.getState();
        addNotification('Debes especificar tanto fecha de inicio como de fin para la ventana de tiempo', 'error', 5000);
        return;
      }
    }

    // 3. Construir objeto de tarea
    const taskData = {
      title: document.getElementById('taskName').value, // Nota: cambiado 'name' por 'title'
      duration: parseFloat(document.getElementById('taskDuration').value),
      priority: document.getElementById('taskPriority').value,
      location: {
        address: document.getElementById('taskLocation').value || document.getElementById('taskAddress').value,
        lat: null,
        lng: null,
        label: 'Task location'
      },
      deadline: deadline,
      windowStart: windowStart,
      windowEnd: windowEnd,
      isFixed: document.getElementById('taskIsFixed')?.checked || false
    };

    // 4. VALIDAR CON ZOD
    const validation = validateTask(taskData);

    if (!validation.success) {
      const { addNotification } = useAppStore.getState();

      // Mostrar errores de validación
      validation.error.forEach(err => {
        const fieldPath = err.path.join('.');
        const message = `${fieldPath}: ${err.message}`;
        addNotification(`❌ ${message}`, 'error', 5000);
      });

      // Destacar el primer campo con error
      const firstErrorField = validation.error[0].path[0];
      const fieldElement = document.getElementById(`task${capitalize(firstErrorField)}`);
      if (fieldElement) {
        fieldElement.classList.add('input-error');
        setTimeout(() => fieldElement.classList.remove('input-error'), 3000);
      }

      return;
    }

    // 5. AGREGAR A STORE (con validación automática)
    const store = useAppStore.getState();
    const newTask = store.addTask(validation.data);

    if (newTask) {
      // 6. Geocodificar si tiene dirección
      if (taskData.location.address) {
        geocodeTaskAddress(newTask);
      }

      // 7. Actualizar UI
      document.getElementById('taskForm').reset();
      document.getElementById('taskPriority').value = 'media';

      // 8. Renderizar (opcional - las suscripciones reactivas harán esto automáticamente)
      renderCalendar();
      renderTasks();
      generateSuggestions();

      // El store ya mostró la notificación automáticamente
      // showNotification('Tarea añadida correctamente', 'success'); ← NO NECESARIO
    }
  } catch (error) {
    console.error('Error adding task:', error);
    const { addNotification } = useAppStore.getState();
    addNotification(`Error al agregar tarea: ${error.message}`, 'error', 5000);
  }
}

/**
 * ============================================================================
 * REEMPLAZAR: Función para actualizar tareas
 * ============================================================================
 */
export function updateTaskRefactored(taskId, updates) {
  try {
    const { updateTask, addNotification } = useAppStore.getState();

    // Validar y actualizar
    const updated = updateTask(taskId, updates);

    if (updated) {
      // Actualizar UI
      renderCalendar();
      renderTasks();
      generateSuggestions();

      // Cerrar modal si está abierto
      const modal = document.getElementById('taskModal');
      if (modal?.open) modal.close();
    }
  } catch (error) {
    console.error('Error updating task:', error);
    const { addNotification } = useAppStore.getState();
    addNotification(`Error al actualizar tarea: ${error.message}`, 'error', 5000);
  }
}

/**
 * ============================================================================
 * REEMPLAZAR: Función para eliminar tareas
 * ============================================================================
 */
export function deleteTaskRefactored(taskId) {
  try {
    const { deleteTask, addNotification } = useAppStore.getState();

    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }

    deleteTask(taskId);

    // Actualizar UI
    renderCalendar();
    renderTasks();
    generateSuggestions();

    // El store ya mostró la notificación automáticamente
  } catch (error) {
    console.error('Error deleting task:', error);
    const { addNotification } = useAppStore.getState();
    addNotification(`Error al eliminar tarea: ${error.message}`, 'error', 5000);
  }
}

/**
 * ============================================================================
 * NUEVA: Función para cargar tareas al iniciar la app
 * ============================================================================
 */
export function loadTasksOnInit() {
  try {
    const store = useAppStore.getState();

    // Las tareas ya están cargadas desde localStorage automáticamente
    // Pero si necesitas hacer algo adicional:
    const tasks = store.getTasks();
    console.log(`✅ Loaded ${tasks.length} tasks from storage`);

    // Renderizar tareas
    renderTasks();
    renderCalendar();
    generateSuggestions();
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

/**
 * ============================================================================
 * NUEVA: Suscripción reactiva para actualizar UI automáticamente
 * ============================================================================
 */
export function setupReactiveUpdates() {
  try {
    // Suscribirse a cambios de tareas
    useAppStore.subscribe(
      (state) => state.tasks,
      (tasks) => {
        console.log('📋 Tasks updated, refreshing UI...');
        // Auto-actualizar UI cuando cambian las tareas
        renderCalendar();
        renderTasks();
        generateSuggestions();
        updateDashboard();
      }
    );

    // Suscribirse a cambios de vista
    useAppStore.subscribe(
      (state) => state.currentView,
      (view) => {
        console.log('📱 View changed to:', view);
        // El código existente de vista ya maneja esto
      }
    );

    // Suscribirse a notificaciones
    useAppStore.subscribe(
      (state) => state.notifications,
      (notifications) => {
        console.log('🔔 Notifications:', notifications.length);
        // Las notificaciones se muestran automáticamente
      }
    );

    console.log('✅ Reactive updates setup complete');
  } catch (error) {
    console.error('Error setting up reactive updates:', error);
  }
}

/**
 * ============================================================================
 * NUEVA: Inicializar store desde código existente de app.js
 * ============================================================================
 */
export function initializeStoreFromExistingState(existingState) {
  try {
    const store = useAppStore.getState();

    // Si tienes tareas almacenadas, cargarlas
    if (existingState?.tasks && Array.isArray(existingState.tasks)) {
      existingState.tasks.forEach(task => {
        store.addTask({
          title: task.name, // Mapear 'name' a 'title'
          duration: task.duration,
          priority: task.priority,
          location: {
            address: task.address || task.location,
            lat: task.lat,
            lng: task.lng,
            label: task.location
          },
          deadline: task.deadline,
          windowStart: task.windowStart,
          windowEnd: task.windowEnd,
          isFixed: task.isFixed
        });
      });
    }

    // Cargar ubicaciones si existen
    if (existingState?.homeLocation) {
      store.setHomeLocation({
        address: existingState.homeLocation.address,
        lat: existingState.homeLocation.lat,
        lng: existingState.homeLocation.lng,
        label: 'Home'
      });
    }

    if (existingState?.workLocation) {
      store.setWorkLocation({
        address: existingState.workLocation.address,
        lat: existingState.workLocation.lat,
        lng: existingState.workLocation.lng,
        label: 'Work'
      });
    }

    console.log('✅ Store initialized from existing state');
  } catch (error) {
    console.error('Error initializing store:', error);
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Estas funciones YA EXISTEN en app.js - no necesitan cambios
function parseDateInput(dateStr) {
  // Función existente - sin cambios
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function geocodeTaskAddress(task) {
  // Función existente - sin cambios
  // Mantener tal como está
}

function renderCalendar() {
  // Función existente - sin cambios
}

function renderTasks() {
  // Función existente - sin cambios
}

function generateSuggestions() {
  // Función existente - sin cambios
}

function updateDashboard() {
  // Función existente - sin cambios
}

/**
 * ============================================================================
 * EXPORTAR PARA USAR EN HTML O GLOBALMENTE
 * ============================================================================
 */

// Hacer disponible globalmente
window.addTaskRefactored = addTaskRefactored;
window.updateTaskRefactored = updateTaskRefactored;
window.deleteTaskRefactored = deleteTaskRefactored;
window.loadTasksOnInit = loadTasksOnInit;
window.setupReactiveUpdates = setupReactiveUpdates;
window.initializeStoreFromExistingState = initializeStoreFromExistingState;

export {
  addTaskRefactored,
  updateTaskRefactored,
  deleteTaskRefactored,
  loadTasksOnInit,
  setupReactiveUpdates,
  initializeStoreFromExistingState
};
