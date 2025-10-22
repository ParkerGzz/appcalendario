# Integration Guide - Zod Validation & Zustand Store

## Overview

This guide explains how to use the new validation system (Zod) and state management (Zustand) in your application.

## Table of Contents
1. [Zod Validation](#zod-validation)
2. [Zustand Store](#zustand-store)
3. [Integration with app.js](#integration-with-appjs)
4. [Code Examples](#code-examples)
5. [Migration Strategy](#migration-strategy)

---

## Zod Validation

### What is Zod?
Zod is a TypeScript-first schema validation library. It provides:
- **Runtime validation** of data
- **Type inference** (optional, without TypeScript)
- **Clear error messages**
- **Composable schemas**

### Available Schemas

#### 1. TaskSchema
Validates complete task objects with all properties.

```javascript
import { TaskSchema, TaskCreateSchema, TaskUpdateSchema } from './validation/schemas.js';

// Complete task (includes id, timestamps)
const completeTask = {
  id: 'task-123',
  title: 'Buy groceries',
  duration: 60,
  priority: 'media',
  location: { address: 'Supermarket Center', lat: -33.4, lng: -70.6, label: 'Groceries' },
  createdAt: new Date(),
  updatedAt: new Date()
};
TaskSchema.parse(completeTask); // ✓ Valid

// New task (without id, timestamps)
const newTask = {
  title: 'Buy groceries',
  duration: 60,
  priority: 'media',
  location: { address: 'Supermarket Center', lat: -33.4, lng: -70.6, label: 'Groceries' }
};
TaskCreateSchema.parse(newTask); // ✓ Valid

// Update (all fields optional)
const updates = { title: 'Buy vegetables', duration: 45 };
TaskUpdateSchema.parse(updates); // ✓ Valid
```

#### 2. LocationSchema
Validates location objects with address and coordinates.

```javascript
import { LocationSchema } from './validation/schemas.js';

const location = {
  address: 'Calle Principal 123, Santiago',
  lat: -33.4489,
  lng: -70.6693,
  label: 'Home'
};
LocationSchema.parse(location); // ✓ Valid
```

#### 3. SettingsSchema
Validates application settings and preferences.

```javascript
import { SettingsSchema } from './validation/schemas.js';

const settings = {
  transportMode: 'driving',
  maxDetour: 15,
  priorityWeights: {
    urgent: 5.0,
    high: 3.0,
    medium: 2.0,
    low: 1.0
  }
};
SettingsSchema.parse(settings); // ✓ Valid
```

### Validation Helper Functions

```javascript
import { validateTask, validateLocation, validateSettings } from './validation/schemas.js';

// Validate and handle errors gracefully
const result = validateTask(taskData);
if (result.success) {
  console.log('Task is valid:', result.data);
} else {
  console.error('Validation errors:', result.error);
  // result.error = [{ field: 'title', message: 'Title is required' }]
}
```

### Error Handling

```javascript
import { z } from 'zod';
import { TaskCreateSchema } from './validation/schemas.js';

try {
  const validTask = TaskCreateSchema.parse(invalidData);
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.log(`${err.path.join('.')}: ${err.message}`);
    });
  }
}
```

---

## Zustand Store

### What is Zustand?
Zustand is a lightweight state management library that provides:
- **Minimal boilerplate**
- **Direct state mutations (no reducers)**
- **Subscriptions to state changes**
- **localStorage persistence** (built-in)
- **Redux DevTools** (dev mode)

### Store Structure

The store is organized into logical sections:

#### 1. View & UI State
```javascript
import { useAppStore } from './store.js';

// Get current view
const view = useAppStore(state => state.currentView);

// Change view
useAppStore.getState().setCurrentView('tasks');

// Set loading state
useAppStore.getState().setLoading(true);
```

#### 2. Task Management
```javascript
import { useTasks } from './store.js';

const { tasks, addTask, updateTask, deleteTask } = useTasks();

// Add task
const newTask = addTask({
  title: 'Buy groceries',
  duration: 60,
  priority: 'media',
  location: { address: 'Market', lat: 0, lng: 0, label: 'Market' }
});

// Update task
updateTask('task-123', { priority: 'alta' });

// Delete task
deleteTask('task-123');

// Get all tasks
const allTasks = useAppStore(state => state.getTasks());

// Search tasks
const results = useAppStore(state => state.searchTasks('groceries'));
```

#### 3. Location Management
```javascript
import { useLocations } from './store.js';

const { homeLocation, workLocation, setHomeLocation, setWorkLocation } = useLocations();

// Set home location
setHomeLocation({
  address: '123 Main St, City',
  lat: -33.4489,
  lng: -70.6693,
  label: 'Home'
});

// Access current locations
const home = useAppStore(state => state.homeLocation);
const work = useAppStore(state => state.workLocation);
```

#### 4. Settings
```javascript
import { useSettings } from './store.js';

const { settings, updateSettings } = useSettings();

// Update settings
updateSettings({
  transportMode: 'transit',
  maxDetour: 20,
  priorityWeights: {
    urgent: 6.0,
    high: 3.5,
    medium: 2.0,
    low: 1.0
  }
});
```

#### 5. Notifications
```javascript
import { useNotifications } from './store.js';

const { addNotification, removeNotification, notifications } = useNotifications();

// Add notification
const id = addNotification('Task created successfully', 'success', 3000);

// Remove specific notification
removeNotification(id);

// Clear all notifications
useAppStore.getState().clearNotifications();
```

### Subscribing to State Changes

```javascript
import { useAppStore } from './store.js';

// Subscribe to all changes
const unsubscribe = useAppStore.subscribe(
  (state) => state.tasks,
  (tasks) => {
    console.log('Tasks updated:', tasks);
    // Update calendar, charts, etc.
  }
);

// Later: unsubscribe
unsubscribe();

// Subscribe to nested state
useAppStore.subscribe(
  (state) => state.settings.transportMode,
  (mode) => console.log('Transport mode changed:', mode)
);
```

---

## Integration with app.js

### Step 1: Import Store and Validation

```javascript
import { useAppStore, useTasks, useLocations } from './src/store.js';
import { validateTask, validateLocation } from './src/validation/schemas.js';
```

### Step 2: Replace localStorage with Store

**Before (Old Way):**
```javascript
// Old: manual localStorage
const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
tasks.push(newTask);
localStorage.setItem('tasks', JSON.stringify(tasks));
```

**After (New Way):**
```javascript
// New: use store (handles localStorage automatically)
const store = useAppStore.getState();
store.addTask(newTask);
```

### Step 3: Add Validation Before Operations

```javascript
// Add task with validation
function addTaskWithValidation(taskData) {
  const { addTask, addNotification } = useAppStore.getState();

  const result = validateTask(taskData);
  if (!result.success) {
    addNotification('Invalid task data', 'error');
    console.error('Validation errors:', result.error);
    return;
  }

  addTask(result.data);
}
```

### Step 4: Refactor Event Handlers

**Before:**
```javascript
// Old way
document.getElementById('addTaskBtn').addEventListener('click', async () => {
  const title = document.getElementById('taskName').value;
  const duration = parseFloat(document.getElementById('taskDuration').value);

  // No validation!
  const task = { title, duration, /* ... */ };
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));
});
```

**After:**
```javascript
// New way
document.getElementById('addTaskBtn').addEventListener('click', async () => {
  const store = useAppStore.getState();
  const title = document.getElementById('taskName').value;
  const duration = parseFloat(document.getElementById('taskDuration').value);

  // With validation and notifications
  const success = store.addTask({
    title,
    duration,
    priority: 'media',
    location: { /* ... */ }
  });

  if (success) {
    // Task added, notification sent automatically
  }
});
```

---

## Code Examples

### Example 1: Create Task with Full Validation

```javascript
import { useAppStore } from './src/store.js';
import { validateTask } from './src/validation/schemas.js';

function createTaskFromForm() {
  const store = useAppStore.getState();

  const taskData = {
    title: document.getElementById('taskTitle').value,
    duration: parseInt(document.getElementById('taskDuration').value),
    priority: document.getElementById('taskPriority').value,
    location: {
      address: document.getElementById('taskAddress').value,
      lat: parseFloat(document.getElementById('taskLat').value),
      lng: parseFloat(document.getElementById('taskLng').value),
      label: document.getElementById('taskLabel').value
    },
    deadline: document.getElementById('taskDeadline').value
      ? new Date(document.getElementById('taskDeadline').value)
      : undefined
  };

  const result = validateTask(taskData);

  if (result.success) {
    const task = store.addTask(result.data);
    console.log('Task created:', task);
  } else {
    result.error.forEach(err => {
      console.error(`${err.path.join('.')}: ${err.message}`);
    });
  }
}
```

### Example 2: Update Task with Validation

```javascript
import { useAppStore } from './src/store.js';

function updateTaskPriority(taskId, newPriority) {
  const store = useAppStore.getState();

  const updated = store.updateTask(taskId, {
    priority: newPriority,
    updatedAt: new Date()
  });

  if (updated) {
    console.log('Task updated:', updated);
  }
}
```

### Example 3: Search and Filter Tasks

```javascript
import { useAppStore } from './src/store.js';

function findTasksForLocation(address) {
  const store = useAppStore.getState();
  const tasksByLocation = store.getTasksByLocation(address);
  return tasksByLocation;
}

function searchTasksByQuery(query) {
  const store = useAppStore.getState();
  const results = store.searchTasks(query);
  return results;
}

function getUrgentTasks() {
  const store = useAppStore.getState();
  return store.getTasksByPriority('urgente');
}
```

### Example 4: Reactive Updates with Subscriptions

```javascript
import { useAppStore } from './src/store.js';

// Update calendar when tasks change
useAppStore.subscribe(
  (state) => state.tasks,
  (tasks) => {
    console.log('Tasks changed, updating calendar...');
    // Regenerate calendar events
    updateCalendarFromTasks(tasks);
  }
);

// Update map when locations change
useAppStore.subscribe(
  (state) => [state.homeLocation, state.workLocation],
  ([home, work]) => {
    console.log('Locations changed, updating map...');
    updateMapMarkers(home, work);
  }
);

// Update UI when settings change
useAppStore.subscribe(
  (state) => state.settings.transportMode,
  (mode) => {
    console.log('Transport mode changed to:', mode);
    recalculateRoutes(mode);
  }
);
```

### Example 5: Batch Operations

```javascript
import { useAppStore } from './src/store.js';

function markTasksAsDone(taskIds) {
  const store = useAppStore.getState();
  store.bulkUpdateTasks(taskIds, { completed: true });
}

function changePriorityForSelectedTasks(taskIds, newPriority) {
  const store = useAppStore.getState();
  store.bulkUpdateTasks(taskIds, { priority: newPriority });
}
```

---

## Migration Strategy

### Phase 1: Setup (Already Done)
- ✅ Install Zod and Zustand
- ✅ Create validation schemas
- ✅ Create Zustand store
- ✅ Create integration guide

### Phase 2: Integration (Next)
1. Update `index.html` to import store and validation in app.js:
   ```html
   <script type="module">
     import { useAppStore } from './src/store.js';
     import { validateTask } from './src/validation/schemas.js';
     window.appStore = useAppStore;
     window.validate = { validateTask };
   </script>
   ```

2. Replace localStorage calls in app.js:
   - Replace `localStorage.getItem('tasks')` with `useAppStore.getState().getTasks()`
   - Replace `localStorage.setItem('tasks', ...)` with `useAppStore.getState().addTask(...)`

3. Add validation before all data operations:
   ```javascript
   // Before: tasks.push(formData);
   // After: const result = validateTask(formData); if (result.success) { addTask(...) }
   ```

4. Replace manual notifications with store notifications:
   ```javascript
   // Before: showToast('Task created');
   // After: useAppStore.getState().addNotification('Task created', 'success');
   ```

### Phase 3: Cleanup
- Remove manual localStorage persistence code
- Remove duplicate state management logic
- Update form handlers to use validation

### Phase 4: Testing
- Write tests for validation schemas
- Test store subscriptions
- Test localStorage persistence

---

## Best Practices

### 1. Always Validate Before Storing
```javascript
// ✅ Good
const result = validateTask(data);
if (result.success) {
  store.addTask(result.data);
}

// ❌ Bad
store.addTask(data); // No validation
```

### 2. Use Specific Hooks for Performance
```javascript
// ✅ Good - only re-renders when tasks change
const { tasks } = useTasks();

// ⚠️ Less optimal - re-renders on any state change
const tasks = useAppStore(state => state.tasks);
```

### 3. Subscribe to Specific State Slices
```javascript
// ✅ Good - only subscribes to tasks
useAppStore.subscribe(
  (state) => state.tasks,
  (tasks) => updateUI(tasks)
);

// ❌ Bad - subscribes to entire state
useAppStore.subscribe(
  (state) => state,
  (state) => updateUI(state.tasks)
);
```

### 4. Handle Validation Errors Gracefully
```javascript
// ✅ Good
const result = validateLocation(data);
if (!result.success) {
  result.error.forEach(err => {
    showFieldError(err.path[0], err.message);
  });
  return;
}

// ❌ Bad
try {
  LocationSchema.parse(data);
} catch (e) {
  console.error(e); // Cryptic message to user
}
```

---

## Testing

### Test Validation

```javascript
import { validateTask, TaskCreateSchema } from './src/validation/schemas.js';

// Test valid task
const validTask = {
  title: 'Test',
  duration: 60,
  priority: 'media',
  location: { address: 'Test', lat: 0, lng: 0, label: 'Test' }
};
expect(validateTask(validTask).success).toBe(true);

// Test invalid task (title too short)
const invalidTask = { ...validTask, title: 'T' };
expect(validateTask(invalidTask).success).toBe(false);

// Test invalid task (invalid priority)
const taskInvalidPriority = { ...validTask, priority: 'invalid' };
expect(validateTask(taskInvalidPriority).success).toBe(false);
```

### Test Store

```javascript
import { useAppStore } from './src/store.js';

// Reset store before each test
beforeEach(() => {
  useAppStore.getState().reset();
});

// Test adding task
test('addTask should add a task to the store', () => {
  const store = useAppStore.getState();
  const task = store.addTask({
    title: 'Test',
    duration: 60,
    priority: 'media',
    location: { address: 'Test', lat: 0, lng: 0, label: 'Test' }
  });

  expect(task).toBeDefined();
  expect(store.getTasks()).toHaveLength(1);
});

// Test updating task
test('updateTask should modify an existing task', () => {
  const store = useAppStore.getState();
  const task = store.addTask({ /* ... */ });

  store.updateTask(task.id, { priority: 'alta' });
  const updated = store.getTaskById(task.id);

  expect(updated.priority).toBe('alta');
});
```

---

## Troubleshooting

### Validation always fails
**Solution:** Check that all required fields are provided

### Store not persisting to localStorage
**Solution:** Zustand persists automatically - check browser storage

### State not updating in UI
**Solution:** Subscribe to state changes or use React hooks integration

### Validation error messages unclear
**Solution:** Check the error.errors array for detailed messages

---

## Summary

The combination of Zod + Zustand provides:
- ✅ **Type-safe data** - Validation at runtime
- ✅ **Centralized state** - No more localStorage chaos
- ✅ **Reactive updates** - Subscribe to changes
- ✅ **Better DX** - Simple, clean API
- ✅ **Built-in persistence** - localStorage out of the box
- ✅ **Great debugging** - Redux DevTools support

Start using this system today to improve code quality and maintainability!
