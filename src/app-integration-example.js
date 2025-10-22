/**
 * Example: How to integrate Zod + Zustand into app.js
 *
 * This file shows concrete examples of how to refactor app.js
 * to use the new validation and state management system.
 *
 * Copy these patterns into your app.js and replace the old code.
 */

import { useAppStore, useTasks, useNotifications } from './store.js';
import { validateTask, validateLocation } from './validation/schemas.js';

/**
 * ============================================================================
 * EXAMPLE 1: Creating a Task with Full Validation
 * ============================================================================
 */
export function createTaskExample() {
  // Get form values
  const taskName = document.getElementById('taskName').value;
  const taskDuration = parseFloat(document.getElementById('taskDuration').value);
  const taskPriority = document.getElementById('taskPriority').value;
  const taskAddress = document.getElementById('taskLocation').value;
  const taskDeadline = document.getElementById('taskDeadline').value;

  // Get location coordinates (from map picker or autocomplete)
  const taskLat = parseFloat(document.getElementById('taskLat').value);
  const taskLng = parseFloat(document.getElementById('taskLng').value);

  // Build task object
  const taskData = {
    title: taskName,
    duration: taskDuration,
    priority: taskPriority,
    location: {
      address: taskAddress,
      lat: taskLat,
      lng: taskLng,
      label: taskAddress.split(',')[0] // First part of address
    },
    deadline: taskDeadline ? new Date(taskDeadline) : undefined,
    notes: document.getElementById('taskNotes')?.value
  };

  // Validate using Zod
  const validation = validateTask(taskData);

  if (!validation.success) {
    // Show validation errors
    const store = useAppStore.getState();
    const errors = validation.error;

    // Display first error as notification
    const firstError = errors[0];
    const fieldPath = firstError.path.join('.');
    const message = `${fieldPath}: ${firstError.message}`;

    store.addNotification(`❌ ${message}`, 'error', 5000);

    // Optionally highlight field
    document.getElementById(fieldPath)?.classList.add('error');

    return null;
  }

  // Add to store (handles localStorage automatically)
  const store = useAppStore.getState();
  const newTask = store.addTask(validation.data);

  // Clear form
  document.getElementById('taskForm').reset();

  return newTask;
}

/**
 * ============================================================================
 * EXAMPLE 2: Update Task with Validation
 * ============================================================================
 */
export function updateTaskExample(taskId) {
  const { updateTask } = useTasks();
  const { addNotification } = useNotifications();

  // Get new values from form
  const updates = {
    title: document.getElementById('editTaskName').value,
    duration: parseFloat(document.getElementById('editTaskDuration').value),
    priority: document.getElementById('editTaskPriority').value
  };

  // Update (validation happens inside store)
  const updated = updateTask(taskId, updates);

  if (updated) {
    addNotification('✅ Task updated', 'success', 3000);
    // Close modal, refresh UI
    document.getElementById('taskModal').close();
  }
}

/**
 * ============================================================================
 * EXAMPLE 3: Delete Task with Confirmation
 * ============================================================================
 */
export function deleteTaskExample(taskId) {
  const { deleteTask } = useTasks();
  const { addNotification } = useNotifications();

  // Confirm deletion
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  deleteTask(taskId);
  // Store automatically notifies and updates localStorage
}

/**
 * ============================================================================
 * EXAMPLE 4: Setting Locations with Validation
 * ============================================================================
 */
export function setHomeLocationExample(address, lat, lng) {
  const { setHomeLocation } = useAppStore.getState();
  const { addNotification } = useNotifications();

  const locationData = {
    address: address,
    lat: lat,
    lng: lng,
    label: 'Home'
  };

  // Validate location
  const validation = validateLocation(locationData);

  if (!validation.success) {
    addNotification(
      `Invalid location: ${validation.error[0].message}`,
      'error',
      5000
    );
    return false;
  }

  // Set location (returns boolean indicating success)
  const success = setHomeLocation(validation.data);
  return success;
}

/**
 * ============================================================================
 * EXAMPLE 5: Task Search and Filter
 * ============================================================================
 */
export function searchTasksExample(query) {
  const { searchTasks } = useAppStore.getState();

  // Search handles validation internally
  const results = searchTasks(query);

  // Display results
  displayTasksInUI(results);

  return results;
}

/**
 * ============================================================================
 * EXAMPLE 6: Get Filtered Tasks by Priority
 * ============================================================================
 */
export function getUrgentTasksExample() {
  const { getTasksByPriority } = useAppStore.getState();

  const urgentTasks = getTasksByPriority('urgente');

  // Show urgent tasks in dashboard
  displayUrgentTaskWidget(urgentTasks);

  return urgentTasks;
}

/**
 * ============================================================================
 * EXAMPLE 7: Bulk Operations
 * ============================================================================
 */
export function markMultipleTasksCompleteExample(taskIds) {
  const { bulkUpdateTasks, addNotification } = useAppStore.getState();

  bulkUpdateTasks(taskIds, {
    completed: true,
    updatedAt: new Date()
  });

  // Notification happens automatically in store
  // "✅ 5 tasks updated"
}

/**
 * ============================================================================
 * EXAMPLE 8: Reactive Subscriptions
 * ============================================================================
 */
export function setupReactiveUpdatesExample() {
  // Subscribe to task changes - auto-update calendar
  useAppStore.subscribe(
    (state) => state.tasks,
    (tasks) => {
      console.log('Tasks updated, refreshing calendar...');
      // Regenerate FullCalendar events
      updateCalendarFromTasks(tasks);
      // Update dashboard stats
      updateDashboardStats(tasks);
    }
  );

  // Subscribe to location changes - auto-update map
  useAppStore.subscribe(
    (state) => [state.homeLocation, state.workLocation],
    ([home, work]) => {
      console.log('Locations updated, refreshing map...');
      // Update map markers
      updateMapMarkers(home, work);
      // Recalculate routes
      recalculateAllRoutes();
    }
  );

  // Subscribe to settings changes - auto-recalculate
  useAppStore.subscribe(
    (state) => state.settings.transportMode,
    (mode) => {
      console.log('Transport mode changed to:', mode);
      // Recalculate all routes with new transport mode
      recalculateAllRoutes();
      // Update UI to show new transport icon
      updateTransportModeUI(mode);
    }
  );

  // Subscribe to view changes
  useAppStore.subscribe(
    (state) => state.currentView,
    (view) => {
      console.log('View changed to:', view);
      // Hide all views
      document.querySelectorAll('.content-view').forEach(v => {
        v.classList.remove('active');
      });
      // Show current view
      document.getElementById(`view${capitalize(view)}`).classList.add('active');
    }
  );
}

/**
 * ============================================================================
 * EXAMPLE 9: Error Handling
 * ============================================================================
 */
export function errorHandlingExample() {
  const { addNotification, setError } = useAppStore.getState();

  try {
    // Some operation
    const result = validateTask(invalidData);

    if (!result.success) {
      // Format error message
      const messages = result.error.map(e => `${e.path.join('.')}: ${e.message}`);
      const errorMsg = messages.join(', ');

      // Add notification
      addNotification(`❌ ${errorMsg}`, 'error', 5000);

      // Also store in global error state
      setError(errorMsg);

      return false;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    addNotification('Unexpected error occurred', 'error', 5000);
    return false;
  }

  return true;
}

/**
 * ============================================================================
 * EXAMPLE 10: Persisting Settings
 * ============================================================================
 */
export function updateSettingsExample() {
  const { updateSettings, addNotification } = useAppStore.getState();

  const newSettings = {
    transportMode: document.getElementById('transportMode').value,
    maxDetour: parseInt(document.getElementById('maxDetour').value),
    locationClustering: document.getElementById('clustering').checked,
    clusterRadius: parseInt(document.getElementById('clusterRadius').value),
    priorityWeights: {
      urgent: parseFloat(document.getElementById('weightUrgent').value),
      high: parseFloat(document.getElementById('weightHigh').value),
      medium: parseFloat(document.getElementById('weightMedium').value),
      low: parseFloat(document.getElementById('weightLow').value)
    }
  };

  // Update (validation happens inside store)
  const success = updateSettings(newSettings);

  if (success) {
    // Store automatically:
    // 1. Validates the data
    // 2. Updates the state
    // 3. Persists to localStorage
    // 4. Shows notification
    console.log('Settings saved successfully');
  }
}

/**
 * ============================================================================
 * EXAMPLE 11: Initialize App with Store
 * ============================================================================
 */
export function initializeAppExample() {
  const store = useAppStore.getState();

  // 1. Load persisted data (automatic from localStorage)
  console.log('Tasks loaded:', store.getTasks().length);
  console.log('Home location:', store.homeLocation);
  console.log('Settings:', store.getSettings());

  // 2. Setup subscriptions
  setupReactiveUpdatesExample();

  // 3. Load initial data from API if needed
  loadTasksFromAPI();
  loadLocationsFromAPI();

  // 4. Setup event listeners
  setupEventListeners();

  // 5. Set initial view
  store.setCurrentView('dashboard');

  console.log('✅ App initialized successfully');
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

function updateCalendarFromTasks(tasks) {
  // Convert tasks to FullCalendar events and update
  const events = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: task.start,
    end: task.end,
    backgroundColor: getPriorityColor(task.priority),
    extendedProps: {
      location: task.location.address,
      priority: task.priority
    }
  }));

  if (window.fullCalendar) {
    window.fullCalendar.removeAllEvents();
    window.fullCalendar.addEventSource(events);
  }
}

function updateDashboardStats(tasks) {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  document.getElementById('completedCount').textContent = completed;
  document.getElementById('pendingCount').textContent = pending;
}

function updateMapMarkers(home, work) {
  // Update Google Map with home and work markers
  if (!window.map) return;

  // Clear existing markers
  if (window.homeMarker) window.homeMarker.setMap(null);
  if (window.workMarker) window.workMarker.setMap(null);

  // Add new markers
  if (home) {
    window.homeMarker = new google.maps.Marker({
      position: { lat: home.lat, lng: home.lng },
      map: window.map,
      title: 'Home'
    });
  }

  if (work) {
    window.workMarker = new google.maps.Marker({
      position: { lat: work.lat, lng: work.lng },
      map: window.map,
      title: 'Work'
    });
  }
}

function recalculateAllRoutes() {
  // Recalculate routes with current settings
  const store = useAppStore.getState();
  const tasks = store.getTasks();
  const settings = store.getSettings();

  tasks.forEach(task => {
    // Calculate route from task to next task
    // Use settings.transportMode for the mode
  });
}

function getPriorityColor(priority) {
  const colors = {
    baja: '#10b981',
    media: '#3b82f6',
    alta: '#f59e0b',
    urgente: '#ef4444'
  };
  return colors[priority] || '#3b82f6';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function displayTasksInUI(tasks) {
  // Display tasks in the UI
  const container = document.getElementById('tasksContainer');
  container.innerHTML = tasks.map(task => `
    <div class="task-card">
      <h3>${task.title}</h3>
      <p>${task.location.address}</p>
      <span class="priority ${task.priority}">${task.priority}</span>
    </div>
  `).join('');
}

function displayUrgentTaskWidget(tasks) {
  // Display urgent tasks in dashboard
  const widget = document.getElementById('urgentTasksWidget');
  widget.innerHTML = `<h4>Urgent Tasks (${tasks.length})</h4>` +
    tasks.map(t => `<div>${t.title}</div>`).join('');
}

function loadTasksFromAPI() {
  // Load tasks from backend API
  // Then add to store: useAppStore.getState().addTask(task)
}

function loadLocationsFromAPI() {
  // Load locations from backend API
  // Then set in store: useAppStore.getState().setHomeLocation(location)
}

function setupEventListeners() {
  // Add event listeners to buttons, forms, etc.
  document.getElementById('addTaskBtn').addEventListener('click', createTaskExample);
  document.getElementById('deleteTaskBtn').addEventListener('click', (e) => {
    deleteTaskExample(e.target.dataset.taskId);
  });
}

function updateTransportModeUI(mode) {
  // Update UI to show current transport mode icon
  const modeIcon = {
    driving: '🚗',
    transit: '🚌',
    bicycling: '🚴',
    walking: '🚶'
  };

  document.getElementById('transportModeIcon').textContent = modeIcon[mode];
}

/**
 * ============================================================================
 * EXPORT FUNCTIONS FOR USE IN HTML
 * ============================================================================
 *
 * Add these to window object to use in HTML onclick handlers:
 *
 * window.createTask = createTaskExample;
 * window.updateTask = updateTaskExample;
 * window.deleteTask = deleteTaskExample;
 * window.initializeApp = initializeAppExample;
 */

// Make functions available globally
window.createTask = createTaskExample;
window.updateTask = updateTaskExample;
window.deleteTask = deleteTaskExample;
window.setHomeLocation = setHomeLocationExample;
window.searchTasks = searchTasksExample;
window.getUrgentTasks = getUrgentTasksExample;
window.markComplete = markMultipleTasksCompleteExample;
window.updateSettings = updateSettingsExample;
window.initializeApp = initializeAppExample;
