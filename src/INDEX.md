# Estructura de Carpetas - Asistente de Decisiones

## 📁 Arbol Completo

```
src/
├── assistant/                 # Motor de decisiones
│   ├── README.md
│   ├── decisionAssistant.js   # Servicio principal
│   ├── conversationFlow.js    # Máquina de estados
│   └── constants.js           # Configuración
│
├── classifier/                # Clasificador NLP
│   ├── README.md
│   ├── taskClassifier.js      # Clasificador principal
│   └── keywords.js            # Palabras clave
│
├── fitness/                   # Escenario: Gimnasio
│   ├── README.md
│   ├── fitnessAssistant.js    # Asistente de fitness
│   ├── routineGenerator.js    # Generador de rutinas
│   ├── feedbackCollector.js   # Recolector de feedback
│   └── templates/             # Plantillas de rutinas
│       ├── weightLoss.js
│       ├── hypertrophy.js
│       └── endurance.js
│
├── shopping/                  # Escenario: Líder
│   ├── README.md
│   ├── shoppingAssistant.js   # Asistente de compras
│   ├── listManager.js         # Gestor de lista
│   ├── priceChecker.js        # Verificador de precios
│   └── cartGenerator.js       # Generador de carritos
│
├── pharmacy/                  # Escenario: Farmacia
│   ├── README.md
│   ├── pharmacyAssistant.js   # Asistente de farmacia
│   ├── medicationDetector.js  # Detector de medicamentos
│   ├── priceComparator.js     # Comparador de precios
│   └── reminderManager.js     # Gestor de recordatorios
│
├── validation/                # Validación (existente)
│   └── schemas.js
│
├── store.js                   # Zustand store
├── INTEGRATION-GUIDE.md       # Guía de integración
└── INDEX.md                   # Este archivo
```

## 🎯 Propósito de Cada Carpeta

### `assistant/`
**Orquesta todas las conversaciones inteligentes**
- Observa cambios en tareas
- Dispara diálogos según categoría
- Gestiona máquina de estados

### `classifier/`
**Clasifica automáticamente tareas**
- Detecta categoría por nombre
- Usa palabras clave
- Calcula confianza

### `fitness/`
**Maneja rutinas de entrenamiento**
- Conversación de trainer
- Generador de rutinas
- Feedback y ajustes

### `shopping/`
**Maneja listas de compras**
- Solicita productos
- Busca precios
- Genera carritos

### `pharmacy/`
**Maneja medicamentos y farmacias**
- Detecta medicamentos
- Compara precios
- Recordatorios automáticos

## 📋 Orden de Implementación

### Fase 1: Foundation (Semanas 1-2)
```
1. classifier/taskClassifier.js        (2h)
2. classifier/keywords.js              (1h)
3. Integrar en app.js                  (1h)
```

### Fase 2: Motor de Decisiones (Semanas 3-4)
```
4. assistant/decisionAssistant.js      (4h)
5. assistant/conversationFlow.js       (2h)
6. assistant/constants.js              (1h)
7. Integrar modales en HTML            (1h)
```

### Fase 3: Fitness (Semanas 5-6)
```
8. fitness/fitnessAssistant.js         (3h)
9. fitness/routineGenerator.js         (5h)
10. fitness/templates/*.js             (2h)
11. fitness/feedbackCollector.js       (2h)
12. Integrar en calendario             (3h)
```

### Fase 4: Shopping (Semanas 7-8)
```
13. shopping/shoppingAssistant.js      (2h)
14. shopping/listManager.js            (2h)
15. shopping/priceChecker.js           (6h)
16. shopping/cartGenerator.js          (6h)
```

### Fase 5: Pharmacy (Semanas 9-10)
```
17. pharmacy/pharmacyAssistant.js      (2h)
18. pharmacy/medicationDetector.js     (2h)
19. pharmacy/priceComparator.js        (8h)
20. pharmacy/reminderManager.js        (4h)
```

### Fase 6: Backend (Semanas 11-12)
```
21. Backend: Entidades + Endpoints
22. Backend: Autenticación
23. Backend: Analítica
```

## 🔗 Dependencias Entre Módulos

```
classifier/ 
  ↓
app.js (addTask, updateTask)
  ↓
assistant/ (DecisionAssistant observa tasks)
  ↓
├─ fitness/
├─ shopping/
└─ pharmacy/
  ↓
HTML Modales + Calendar + Notificaciones
```

## 📦 Archivos que Necesitan Actualización

### index.html
- [ ] Agregar modal para asistente (#assistantModal)
- [ ] Agregar estilos para conversaciones
- [ ] Selector de categoría en modal de tarea

### app.js
- [ ] Importar TaskClassifier
- [ ] Importar DecisionAssistant
- [ ] Actualizar addTask() con clasificación
- [ ] Actualizar saveTaskFromModal() con categoría
- [ ] Agregar setupDecisionAssistant() en initApp()

### styles.css
- [ ] Estilos para .assistant-message
- [ ] Estilos para .assistant-options
- [ ] Estilos para botones de respuesta
- [ ] Animaciones de aparición de modal

## 🧪 Testing por Módulo

```javascript
// classifier/taskClassifier.js
const classifier = new TaskClassifier();
console.log(classifier.classify('Ir al gimnasio'));
// { category: 'fitness', confidence: 0.33, matches: ['gym', 'gimnasio'] }

// assistant/decisionAssistant.js
const assistant = new DecisionAssistant(taskManager, uiManager);
assistant.observeTasks(state.tasks);

// fitness/routineGenerator.js
const generator = new RoutineGenerator();
const routine = generator.generateRoutine('bajar_peso', ['L', 'M', 'V'], 1.5);
// Retorna rutina personalizada

// shopping/listManager.js
const listManager = new ListManager();
listManager.addProduct({ name: 'Leche', quantity: 2, brand: 'Loncoleche' });

// pharmacy/medicationDetector.js
const detector = new MedicationDetector();
const med = detector.detect('Comprar Ibupirac');
// { medication: 'Ibuprofen', dosage: null, pharmacy: null }
```

## 📚 Documentación Relacionada

- `PLAN-ASISTENTE-DECISIONES.md` - Plan completo
- `QUICK-START-ASSISTANT.md` - Guía rápida
- `INTEGRATION-GUIDE.md` - Guía de integración
- `README.md` en cada carpeta - Detalles específicos

## ✅ Checklist de Completitud

**Estructura:**
- [x] Carpetas creadas
- [x] README.md en cada carpeta
- [x] INDEX.md con mapeo completo
- [ ] Primeros archivos .js creados

**Integración:**
- [ ] TaskClassifier integrado
- [ ] DecisionAssistant integrado
- [ ] Modales de conversación
- [ ] Estilos CSS

**Testing:**
- [ ] Clasificación funciona
- [ ] Conversaciones se disparan
- [ ] localStorage persiste datos
- [ ] No hay errores en console

---

**Estado:** ✅ Estructura lista para comenzar Fase 1
**Próximo:** Crear `src/classifier/taskClassifier.js`
