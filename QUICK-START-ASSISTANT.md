# Quick Start Guide - Asistente de Decisiones

## 🚀 Inicio Rápido (Empezar HOY)

Si quieres empezar la Fase 1 ahora mismo, sigue estos pasos:

### Paso 1: Setup (30 minutos)

```bash
# Crear rama de desarrollo
cd /Users/felipegzr/Desktop/"Codigos Python Chatgpt"/appcalendario
git checkout -b feature/decision-assistant

# Crear estructura de carpetas
mkdir -p src/assistant
mkdir -p src/fitness
mkdir -p src/shopping
mkdir -p src/pharmacy
mkdir -p src/classifier
```

### Paso 2: Crear TaskClassifier (Primera tarea - 2 horas)

**Archivo:** `src/classifier/taskClassifier.js`

```javascript
class TaskClassifier {
  constructor() {
    this.keywords = {
      fitness: [
        'gym', 'gimnasio', 'entrenar', 'entrenamiento',
        'pesas', 'cardio', 'correr', 'yoga', 'pilates'
      ],
      shopping_lider: [
        'lider', 'compras', 'supermercado', 'mercado',
        'grocery', 'comprar comida'
      ],
      pharmacy: [
        'farmacia', 'remedio', 'medicina', 'pastilla',
        'medicamento', 'comprar medicinas', 'receta'
      ]
    };
  }

  classify(taskName) {
    const name = taskName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const matches = keywords.filter(keyword => name.includes(keyword));
      if (matches.length > 0) {
        return {
          category,
          confidence: Math.min(1, matches.length / 3),
          matches
        };
      }
    }
    
    return { category: 'general', confidence: 0, matches: [] };
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TaskClassifier;
}
```

### Paso 3: Integrar en addTask() (1 hora)

En `app.js`, modificar `addTask()`:

```javascript
function addTask(e) {
  e.preventDefault();

  try {
    // ... validaciones existentes ...

    const taskName = document.getElementById('taskName').value?.trim();
    
    // NEW: Clasificar tarea
    const classifier = new TaskClassifier();
    const classification = classifier.classify(taskName);
    
    const task = {
      id: Date.now(),
      name: taskName,
      duration: taskDuration,
      // ... otras propiedades ...
      category: classification.category,  // NEW
      metadata: {                          // NEW
        intent: classification.matches.join(','),
        conversationState: 'pending'
      }
    };

    // ... resto del código ...
  } catch (error) {
    console.error('Error adding task:', error);
    showNotification(`❌ Error al agregar tarea: ${error.message}`, 'error', 5000);
  }
}
```

### Paso 4: Crear UI para Categoría (1 hora)

En `index.html`, agregar selector en modal de tarea:

```html
<!-- Agregar después de <div class="form-group"> de nombre -->
<div class="form-group">
  <label for="modalTaskCategory">Categoría</label>
  <select id="modalTaskCategory" class="form-control">
    <option value="general">General</option>
    <option value="fitness">💪 Fitness / Gimnasio</option>
    <option value="shopping_lider">🛒 Compras Líder</option>
    <option value="pharmacy">💊 Farmacia</option>
  </select>
  <small id="categoryHint" style="color: var(--text-muted); margin-top: 4px;"></small>
</div>
```

### Paso 5: Actualizar saveTaskFromModal() (1 hora)

```javascript
function saveTaskFromModal(e) {
  e.preventDefault();

  try {
    const taskId = document.getElementById('modalTaskId').value;
    const category = document.getElementById('modalTaskCategory').value; // NEW

    // ... validaciones existentes ...

    if (taskId) {
      const task = state.tasks.find(t => t.id === parseInt(taskId));
      if (!task) {
        showNotification('❌ Tarea no encontrada', 'error', 3000);
        return;
      }

      task.category = category;  // NEW
      // ... resto de actualizaciones ...
    } else {
      const task = {
        // ... propiedades existentes ...
        category: category,  // NEW
        metadata: {}
      };
      state.tasks.push(task);
    }

    // ... resto del código ...
  } catch (error) {
    console.error('Error saving task from modal:', error);
    showNotification(`❌ Error al guardar tarea: ${error.message}`, 'error', 5000);
  }
}
```

### Paso 6: Test y Commit (1 hora)

```bash
# Test en navegador
# 1. Abrir http://localhost:8000
# 2. Crear tarea con nombre "Ir al gimnasio"
# 3. Verificar que se clasifique como "fitness"
# 4. Editar tarea y ver categoria en modal

# Si funciona, hacer commit
git add -A
git commit -m "feat: Add basic task classifier and category selector

- Implement TaskClassifier with keyword-based classification
- Add category field to task model (general, fitness, shopping_lider, pharmacy)
- Add category selector in task modal
- Classify tasks automatically when creating
- Allow manual category override"
```

---

## 📋 Siguiente: Semana 2 - Motor de Decisiones

Una vez completada la Fase 1.1, comenzar con:

### Tareas para Semana 2:

1. **DecisionAssistant Service** (2 horas)
   - Crear clase que observe state.tasks
   - Disparar conversaciones cuando aparezca tarea con categoría

2. **Assistant Modal** (2 horas)
   - Crear HTML/CSS para modal de asistente
   - Implementar openAssistantDialog()

3. **Conversation States** (2 horas)
   - Definir máquina de estados
   - Implementar transiciones

4. **Integration** (2 horas)
   - Conectar con system de notificaciones
   - Hacer testing end-to-end

---

## 💡 Tips Importantes

### 1. Mantener Compatibilidad
- No romper nada existente
- Usar feature flags si necesario
- Test en localhost antes de commit

### 2. localStorage
- Asegurarse de que se guarden categorías
- Verificar en DevTools > Application > Local Storage

### 3. Performance
- No procesar clasificación en cada keystroke
- Solo clasificar cuando se guarda tarea
- Cachear resultados de clasificación

### 4. UX
- Mostrar sugerencia de categoría al usuario
- Permitir cambiar de opinión
- Indicar claramente "Asistente en funcionamiento"

---

## 🐛 Debugging

### Verificar que TaskClassifier funciona:

```javascript
// En console del navegador:
const classifier = new TaskClassifier();
console.log(classifier.classify('Ir al gimnasio'));
// Debería mostrar: { category: 'fitness', confidence: 0.33, matches: ['gym', 'gimnasio'] }
```

### Verificar que se guarda category:

```javascript
// En console:
console.log(JSON.stringify(state.tasks[0], null, 2));
// Debería incluir: "category": "fitness"
```

### Verificar que se restaura en localStorage:

```javascript
// En console:
console.log(JSON.parse(localStorage.getItem('calendarApp')).tasks[0]);
// Debería tener category y metadata
```

---

## 📞 Contacto y Preguntas

Si tienes dudas sobre cualquier paso:

1. Revisa PLAN-ASISTENTE-DECISIONES.md (detalles técnicos)
2. Revisa QUICK-START-ASSISTANT.md (este documento)
3. Busca ejemplos en el código existente
4. Crea un issue en GitHub

---

## ✅ Checklist de Completitud (Fase 1.1)

- [ ] TaskClassifier crea en src/classifier/
- [ ] addTask() integra clasificación
- [ ] Modal tiene selector de categoría
- [ ] saveTaskFromModal() guarda categoría
- [ ] localStorage persiste categoría
- [ ] Test en navegador funciona
- [ ] Sin errores en console
- [ ] Commit hecho

**Tiempo total estimado:** 8 horas (puede hacerse en 1-2 días)

---

¡Listo! Ahora puedes empezar a implementar. 🚀
