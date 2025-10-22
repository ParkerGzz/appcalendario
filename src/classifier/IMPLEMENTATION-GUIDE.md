# TaskClassifier Implementation Guide

## Overview

This guide explains how to integrate the `TaskClassifier` and `CLASSIFIER_KEYWORDS` into your application for automatic task categorization.

## Files

### 1. **taskClassifier.js** (286 lines)
The core classification engine with the following capabilities:
- Automatic task categorization based on keywords
- Confidence scoring
- Dynamic keyword management
- Serialization/deserialization

### 2. **keywords.js** (400 lines)
Modular keywords dictionary with:
- 100+ keywords for fitness, shopping, pharmacy categories
- Category metadata (labels, colors, emojis)
- Exclusion words for negation detection
- Difficulty levels for keyword filtering

## Integration Steps

### Step 1: Import Keywords in Your App

```javascript
// In your main app.js file
// If using CommonJS (current setup):
const { CLASSIFIER_KEYWORDS, EXCLUSION_WORDS } = require('./src/classifier/keywords.js');
const TaskClassifier = require('./src/classifier/taskClassifier.js');

// Create global classifier instance
const taskClassifier = new TaskClassifier();
taskClassifier.loadKeywords(CLASSIFIER_KEYWORDS);
taskClassifier.loadExclusionWords(EXCLUSION_WORDS);

// Or if using ES6 modules:
// import { CLASSIFIER_KEYWORDS, EXCLUSION_WORDS } from './src/classifier/keywords.js';
// import TaskClassifier from './src/classifier/taskClassifier.js';
```

### Step 2: Call Classifier When Creating Tasks

Modify your `addTask()` function:

```javascript
function addTask() {
  // ... existing validation code ...

  const taskName = document.getElementById('taskName').value.trim();

  // NEW: Classify the task automatically
  const classification = taskClassifier.classify(taskName);

  // Show classification to user (optional confirmation)
  console.log(`Task "${taskName}" classified as:`, classification);
  // Output: { category: "fitness", confidence: 0.5, matches: ["gym"] }

  // Create task object with classification
  const task = {
    id: generateId(),
    name: taskName,
    duration: parseInt(document.getElementById('taskDuration').value),
    priority: document.getElementById('taskPriority').value,
    category: classification.category, // ← NEW
    categoryConfidence: classification.confidence, // ← NEW
    categoryMatches: classification.matches, // ← NEW (for debugging)
    // ... other properties ...
  };

  // Save task to localStorage
  state.tasks.push(task);
  saveToLocalStorage();

  // Show success message
  const categoryLabel = classification.category === 'general'
    ? 'Tarea general'
    : `Tarea de ${classification.category}`;
  showNotification(`✅ ${categoryLabel} añadida correctamente`);
}
```

### Step 3: Display Category in UI

#### Option A: Show Category Badge in Task List

```javascript
function renderTasks() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  state.tasks.forEach(task => {
    const taskItem = document.createElement('li');

    // Get category metadata for styling
    const categoryInfo = CATEGORY_METADATA[task.category] || CATEGORY_METADATA.general;

    taskItem.innerHTML = `
      <div class="task-item">
        <div class="task-header">
          <span class="task-name">${task.name}</span>
          <span class="category-badge"
                style="background-color: ${categoryInfo.color}">
            ${categoryInfo.icon} ${categoryInfo.label}
          </span>
        </div>
        <div class="task-details">
          <span class="priority">${task.priority}</span>
          <span class="duration">${task.duration} min</span>
        </div>
      </div>
    `;

    taskList.appendChild(taskItem);
  });
}
```

#### Option B: Filter Tasks by Category

```javascript
function filterTasksByCategory(category) {
  const filtered = state.tasks.filter(task => task.category === category);

  console.log(`Found ${filtered.length} tasks in "${category}" category:`, filtered);

  // Render filtered tasks
  renderFilteredTasks(filtered);
}

// Usage:
// filterTasksByCategory('fitness');      // Show only fitness tasks
// filterTasksByCategory('shopping_lider'); // Show only shopping tasks
// filterTasksByCategory('pharmacy');      // Show only pharmacy tasks
// filterTasksByCategory('general');       // Show only general tasks
```

### Step 4: Add Category Selector in Modal

Update your HTML task modal:

```html
<div class="modal-body">
  <!-- Existing fields -->
  <input type="text" id="modalTaskName" placeholder="Nombre de la tarea">
  <input type="number" id="modalTaskDuration" placeholder="Duración (minutos)">

  <!-- NEW: Category Selector -->
  <div class="form-group">
    <label for="modalTaskCategory">Categoría</label>
    <select id="modalTaskCategory">
      <option value="general">General</option>
      <option value="fitness">Fitness</option>
      <option value="shopping_lider">Compras</option>
      <option value="pharmacy">Farmacia</option>
    </select>
    <small id="categoryHint" style="color: #999;">
      Categoría sugerida automáticamente
    </small>
  </div>

  <!-- Existing fields -->
  <select id="modalTaskPriority">
    <option value="baja">Baja</option>
    <option value="media">Media</option>
    <option value="alta">Alta</option>
    <option value="urgente">Urgente</option>
  </select>
</div>
```

### Step 5: Update Save Task Function

Modify `saveTaskFromModal()`:

```javascript
function saveTaskFromModal(taskId = null) {
  const taskName = document.getElementById('modalTaskName').value.trim();

  // NEW: Suggest category based on name
  const suggested = taskClassifier.classify(taskName);
  const selectedCategory = document.getElementById('modalTaskCategory').value;

  // Validate category
  const validCategories = ['general', 'fitness', 'shopping_lider', 'pharmacy'];
  const category = validCategories.includes(selectedCategory)
    ? selectedCategory
    : suggested.category;

  if (taskId) {
    // Update existing task
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.name = taskName;
      task.category = category;
      task.categoryConfidence = suggested.confidence;
      // ... other properties ...
      saveToLocalStorage();
      showNotification(`✅ Tarea "${taskName}" actualizada`);
    }
  } else {
    // Create new task
    const newTask = {
      id: generateId(),
      name: taskName,
      category: category,
      categoryConfidence: suggested.confidence,
      // ... other properties ...
    };
    state.tasks.push(newTask);
    saveToLocalStorage();
    showNotification(`✅ Tarea "${taskName}" añadida`);
  }

  closeModal();
  renderTasks();
}
```

### Step 6: Handle Modal Opening

When opening a task modal, pre-select the category:

```javascript
function openTaskModal(taskId = null) {
  const modal = document.getElementById('taskModal');

  if (taskId) {
    // Edit existing task
    const task = state.tasks.find(t => t.id === taskId);
    document.getElementById('modalTaskName').value = task.name;
    document.getElementById('modalTaskCategory').value = task.category;
    // ... other fields ...
  } else {
    // Create new task - show category suggestion
    const taskName = document.getElementById('modalTaskName').value;
    if (taskName) {
      const suggested = taskClassifier.classify(taskName);
      document.getElementById('modalTaskCategory').value = suggested.category;

      // Show confidence hint
      const hint = document.getElementById('categoryHint');
      hint.textContent = `Sugerida: ${suggested.category} (${Math.round(suggested.confidence * 100)}% seguro)`;
    }
  }

  modal.style.display = 'block';
}
```

## Usage Examples

### Example 1: Auto-Classify a Task

```javascript
// User creates task: "Ir al gimnasio"
const result = taskClassifier.classify('Ir al gimnasio');
console.log(result);
// Output:
// {
//   category: 'fitness',
//   confidence: 0.5,
//   matches: ['gym', 'gimnasio']
// }
```

### Example 2: Add Custom Keywords

```javascript
// Add custom keyword to fitness category
const added = taskClassifier.addKeyword('fitness', 'crossfit');
console.log(added); // true

// Now "crossfit" will be recognized:
const result = taskClassifier.classify('Clases de crossfit');
console.log(result);
// Output:
// {
//   category: 'fitness',
//   confidence: 0.33,
//   matches: ['crossfit']
// }
```

### Example 3: Create New Category

```javascript
// Add new category for work-related tasks
const created = taskClassifier.addCategory('work', [
  'trabajo',
  'reunión',
  'proyecto',
  'deadline',
  'llamada',
  'email'
]);

if (created) {
  console.log('Work category created');

  const result = taskClassifier.classify('Reunión con equipo');
  console.log(result);
  // Output:
  // {
  //   category: 'work',
  //   confidence: 0.33,
  //   matches: ['reunión']
  // }
}
```

### Example 4: Get Statistics

```javascript
const stats = taskClassifier.getStatistics();
console.log(stats);
// Output:
// {
//   totalCategories: 4,
//   categories: {
//     fitness: 52,
//     shopping_lider: 30,
//     pharmacy: 40,
//     work: 6
//   },
//   totalKeywords: 128
// }
```

### Example 5: Export/Import Keywords

```javascript
// Export classifier configuration
const json = taskClassifier.toJSON();
console.log(json);

// Save to localStorage
localStorage.setItem('classifierConfig', json);

// Later, restore from localStorage
const saved = localStorage.getItem('classifierConfig');
taskClassifier.fromJSON(saved);
```

## Confidence Scoring Algorithm

The classifier uses a simple but effective confidence calculation:

```
confidence = (matched_keywords / total_keywords_in_category) * 100
```

Example:
- Fitness category has 52 keywords
- Task "Ir al gimnasio" matches: ['gym', 'gimnasio']
- Confidence = (2 / 52) × 100 = 3.8% (displayed as 0.04)

Higher confidence = stronger match

## Category Metadata

Use the category metadata for UI display:

```javascript
const categoryInfo = CATEGORY_METADATA['fitness'];
// {
//   label: 'Fitness',
//   icon: '💪',
//   color: '#FF6B6B',
//   description: 'Tareas relacionadas con ejercicio y fitness',
//   emoji: '🏋️'
// }
```

## Best Practices

1. **Always validate category in saveTaskFromModal()** - Don't trust user input
2. **Show confidence score to user** - Helps them understand if classification might be wrong
3. **Allow manual override** - User might disagree with auto-classification
4. **Expand keywords over time** - Add common patterns your users search for
5. **Consider word order** - Current implementation uses substring matching
6. **Handle exclusion words** - Flag tasks with "no", "sin", "evitar" for review

## Future Enhancements

1. **Fuzzy Matching** - Match similar keywords (e.g., "gimasio" → "gimnasio")
2. **Multi-category Tasks** - Support tasks in multiple categories
3. **Machine Learning** - Train on actual user data for better classification
4. **Category Weights** - Give more importance to certain keywords
5. **Contextual Hints** - Use time of day, location, other tasks to improve classification
6. **Natural Language Processing** - Use NLP libraries for semantic understanding

## Testing

### Manual Testing

```javascript
// Test in browser console:

// Test 1: Fitness task
console.log(taskClassifier.classify('Ir al gimnasio'));

// Test 2: Shopping task
console.log(taskClassifier.classify('Compras en Líder'));

// Test 3: Pharmacy task
console.log(taskClassifier.classify('Comprar medicinas en farmacia'));

// Test 4: Ambiguous task
console.log(taskClassifier.classify('Ir a caminar')); // Could be fitness

// Test 5: General task
console.log(taskClassifier.classify('Llamar a mamá'));

// Test 6: Statistics
console.log(taskClassifier.getStatistics());

// Test 7: Add custom keyword
console.log(taskClassifier.addKeyword('fitness', 'crosstraining'));

// Test 8: Category with custom keywords
console.log(taskClassifier.classify('Hacer crosstraining'));
```

### Unit Test Template (Jest)

```javascript
describe('TaskClassifier', () => {
  let classifier;

  beforeEach(() => {
    classifier = new TaskClassifier();
    classifier.loadKeywords(CLASSIFIER_KEYWORDS);
  });

  test('should classify fitness task', () => {
    const result = classifier.classify('Ir al gimnasio');
    expect(result.category).toBe('fitness');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.matches).toContain('gym');
  });

  test('should classify shopping task', () => {
    const result = classifier.classify('Compras en Líder');
    expect(result.category).toBe('shopping_lider');
  });

  test('should classify pharmacy task', () => {
    const result = classifier.classify('Comprar medicinas');
    expect(result.category).toBe('pharmacy');
  });

  test('should return general for unknown task', () => {
    const result = classifier.classify('Llamar a un amigo');
    expect(result.category).toBe('general');
    expect(result.confidence).toBe(0);
  });

  test('should add new keyword', () => {
    const added = classifier.addKeyword('fitness', 'yoga');
    expect(added).toBe(true);
  });

  test('should return statistics', () => {
    const stats = classifier.getStatistics();
    expect(stats.totalCategories).toBeGreaterThan(0);
    expect(stats.totalKeywords).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Issue: Classifier not recognizing keywords

**Solution:** Make sure keywords are lowercase:
```javascript
taskClassifier.classify('Ir Al Gimnasio'); // Works (converted to lowercase)
```

### Issue: "undefined is not a function"

**Solution:** Make sure TaskClassifier is properly instantiated:
```javascript
// ✓ Correct
const classifier = new TaskClassifier();

// ✗ Wrong
const classifier = TaskClassifier();
```

### Issue: Keywords not loading

**Solution:** Check if keywords.js is being imported correctly:
```javascript
// Check in browser console:
console.log(CLASSIFIER_KEYWORDS);
console.log(typeof CLASSIFIER_KEYWORDS);
```

## Next Steps

Once TaskClassifier is integrated:

1. **Create Decision Assistant** (Paso 5 in QUICK-START-ASSISTANT.md)
   - ConversationFlow for multi-step dialogs
   - Interactive fitness, shopping, pharmacy flows

2. **Add UI Components** (Paso 6)
   - Category filter buttons
   - Category-specific action buttons
   - Suggested actions based on category

3. **Backend Integration** (Phase 2)
   - Store categories in database
   - Analyze task patterns
   - Improve classification over time

---

**Status:** Ready for integration
**Date:** October 22, 2025
**Next Step:** Add category selector UI to HTML (Paso 4 of QUICK-START-ASSISTANT.md)
