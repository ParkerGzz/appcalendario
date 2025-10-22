# Plan de Implementación: Asistente de Decisiones Inteligente

## 📋 Objetivo General
Crear un "asistente de decisiones" que, según el tipo de tarea, abra diálogos inteligentes (gimnasio, compras en Líder, farmacia) y acompañe al usuario con planificación, seguimiento y enlaces a servicios externos.

---

## 🗂️ FASE 1: Foundation (Semanas 1-2)

### 1.1 Estructura de Datos Base
**Objetivo:** Extender el modelo de tareas con categorías e metadatos

#### Frontend (app.js, index.html)
```javascript
// Nuevas propiedades en TaskSchema
{
  id, name, duration, location, priority, // Existentes
  category: 'fitness' | 'shopping_lider' | 'pharmacy' | 'general',
  metadata: {
    intent: string,
    trainer: boolean,
    objectives: [],
    routineId: string,
    shoppingList: [],
    medication: {},
    conversationState: 'pending' | 'in_progress' | 'completed'
  },
  assistantSession: {
    sessionId: string,
    questions: [],
    answers: {},
    timestamp: date
  }
}
```

**Tareas:**
- [ ] Actualizar TaskSchema en src/validation/schemas.js
- [ ] Crear CategorySelector component en HTML
- [ ] Actualizar saveTaskFromModal() para capturar category
- [ ] Crear MetadataManager (class en app.js)

**Tiempo estimado:** 8 horas

### 1.2 Clasificador de Tareas (NLP Ligero)
**Objetivo:** Clasificar automáticamente tareas por palabras clave

#### Implementación
```javascript
// Crear: src/classifier/taskClassifier.js
class TaskClassifier {
  constructor() {
    this.rules = {
      fitness: ['gym', 'gimnasio', 'entrenar', 'entrenamiento'],
      shopping_lider: ['lider', 'compras', 'supermercado'],
      pharmacy: ['farmacia', 'remedio', 'medicina', 'pastilla']
    };
  }
  
  classify(taskName) {
    // Retornar { category, confidence }
  }
}
```

**Tareas:**
- [ ] Crear TaskClassifier class
- [ ] Integrar en addTask() y updateTask()
- [ ] Mostrar sugerencia de categoría al usuario
- [ ] Permitir confirmación/cambio de categoría

**Tiempo estimado:** 6 horas

### 1.3 Persistencia en localStorage
**Objetivo:** Guardar categorías y decisiones offline

**Tareas:**
- [ ] Extender saveToStorage() para incluir category/metadata
- [ ] Extender loadFromStorage() para restaurar datos
- [ ] Crear backup automático en IndexedDB (opcional)

**Tiempo estimado:** 4 horas

---

## 🎯 FASE 2: Motor de Decisiones (Semanas 3-4)

### 2.1 Servicio DecisionAssistant
**Objetivo:** Orquestar conversaciones según categoría

```javascript
// Crear: src/assistant/decisionAssistant.js
class DecisionAssistant {
  constructor(taskManager, uiManager) {
    this.taskManager = taskManager;
    this.uiManager = uiManager;
    this.conversations = {};
  }
  
  // Escuchar cambios en tareas
  observeTasks(tasks) {
    tasks.forEach(task => {
      if (task.category && !this.conversations[task.id]) {
        this.initiateConversation(task);
      }
    });
  }
  
  initiateConversation(task) {
    const flow = this.getFlowByCategory(task.category);
    this.conversations[task.id] = new ConversationFlow(flow, task);
  }
}
```

**Tareas:**
- [ ] Crear DecisionAssistant class
- [ ] Implementar observer pattern para state.tasks
- [ ] Crear ConversationFlow base
- [ ] Conectar con sistema de notificaciones existente

**Tiempo estimado:** 8 horas

### 2.2 Diálogos Modales Reutilizables
**Objetivo:** Crear componentes modales para conversaciones

**HTML:**
```html
<div id="assistantModal" class="modal">
  <div class="modal-content">
    <div id="assistantMessage" class="assistant-message">
      <!-- Pregunta del asistente -->
    </div>
    <div id="assistantOptions" class="assistant-options">
      <!-- Opciones de respuesta -->
    </div>
  </div>
</div>
```

**CSS:**
```css
.assistant-message {
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: white;
  padding: 16px;
  border-radius: 8px;
}

.assistant-options {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.assistant-option {
  flex: 1;
  min-width: 100px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.assistant-option:hover {
  background: var(--border);
  border-color: var(--brand);
}
```

**Tareas:**
- [ ] Crear HTML modal
- [ ] Crear CSS estilos
- [ ] Crear openAssistantDialog() en app.js
- [ ] Crear handleAssistantResponse() en app.js

**Tiempo estimado:** 6 horas

### 2.3 Estados de Conversación
**Objetivo:** Definir máquina de estados para conversaciones

```javascript
const ConversationStates = {
  FITNESS: {
    INICIAL: 'have_trainer_question',
    RUTINA: 'define_routine',
    OBJETIVO: 'define_objective',
    DIAS: 'define_days',
    CONFIRMACION: 'confirm_plan'
  },
  SHOPPING: {
    INICIAL: 'request_list',
    EDITAR: 'edit_list',
    CONFIRMAR: 'confirm_shopping'
  },
  PHARMACY: {
    INICIAL: 'request_medication',
    DOSIS: 'request_dosage',
    COMPARAR: 'compare_prices'
  }
};
```

**Tareas:**
- [ ] Definir máquina de estados por categoría
- [ ] Crear StateManager class
- [ ] Implementar transiciones de estado
- [ ] Guardar respuestas en metadata

**Tiempo estimado:** 6 horas

---

## 💪 FASE 3: Escenario Gimnasio (Semanas 5-6)

### 3.1 Flujo de Preguntas
**Objetivo:** Implementar conversación "¿Tienes personal trainer?"

**Preguntas:**
1. "¿Tienes personal trainer?" → Sí/No
2. Si No: "¿Cuál es tu objetivo?" → (Bajar peso / Hipertrofia / Resistencia)
3. "¿Qué días puedes entrenar?" → (Checkboxes L-D)
4. "¿Cuánto tiempo por sesión?" → (Input horas)
5. "¿Alguna limitación o lesión?" → (Input libre)

**Tareas:**
- [ ] Crear FitnessConversation class
- [ ] Implementar cada pregunta como estado
- [ ] Guardar respuestas en metadata.fitness
- [ ] Validar respuestas antes de avanzar

**Tiempo estimado:** 8 horas

### 3.2 Generador de Rutinas
**Objetivo:** Crear planes de entrenamiento basados en respuestas

```javascript
// Crear: src/fitness/routineGenerator.js
class RoutineGenerator {
  generateRoutine(objective, daysAvailable, timePerSession) {
    const templates = {
      'bajar_peso': this.getWeightLossTemplate(),
      'hipertrofia': this.getHypertrophyTemplate(),
      'resistencia': this.getEnduranceTemplate()
    };
    
    const template = templates[objective];
    return this.adaptTemplate(template, daysAvailable, timePerSession);
  }
}
```

**Tareas:**
- [ ] Crear RoutineGenerator class
- [ ] Crear plantillas de rutinas por objetivo
- [ ] Implementar adaptación a disponibilidad
- [ ] Guardar rutina en metadata.routine

**Tiempo estimado:** 10 horas

### 3.3 Visualización en Calendario
**Objetivo:** Mostrar sesiones de entrenamiento en el calendario

**Tareas:**
- [ ] Crear eventos de calendario para cada sesión
- [ ] Mostrar checklist de sesiones en tarjeta de tarea
- [ ] Implementar "marcar completado"
- [ ] Mostrar barra de progreso semanal

**Tiempo estimado:** 8 horas

### 3.4 Retroalimentación y Ajustes
**Objetivo:** Solicitar feedback después de sesiones

**Tareas:**
- [ ] Crear modal de feedback (esfuerzo 1-10, sensación)
- [ ] Guardar feedback en metadata
- [ ] Generar sugerencias de ajustes (aumentar carga, reducir, mantener)
- [ ] Implementar notificaciones de recomendaciones

**Tiempo estimado:** 6 horas

---

## 🛒 FASE 4: Escenario Líder (Semanas 7-8)

### 4.1 Captura de Lista de Compras
**Objetivo:** Solicitar y guardar lista de productos

```javascript
// Crear: src/shopping/shoppingAssistant.js
class ShoppingAssistant {
  async requestShoppingList(task) {
    // Modal para ingresar productos
    // Formato: { product, quantity, brand (opcional), notes }
    // Guardar en metadata.shoppingList
  }
}
```

**Tareas:**
- [ ] Crear modal de ingreso de lista
- [ ] Implementar agregar/editar/eliminar productos
- [ ] Validar productos
- [ ] Guardar en metadata.shoppingList

**Tiempo estimado:** 6 horas

### 4.2 Integración con API Líder (Fase 2)
**Objetivo:** Buscar productos en Líder y crear carrito

**Nota:** Esta es una tarea backend compleja. Hacer solo si Líder tiene API pública.

**Tareas:**
- [ ] Investigar disponibilidad de API Líder
- [ ] Si existe: Crear endpoint POST /shopping/search
- [ ] Si no existe: Usar Puppeteer para web scraping
- [ ] Crear endpoint para generar carrito prellenado

**Tiempo estimado:** 16 horas (backend)

### 4.3 Gestión de Precios y Stock
**Objetivo:** Monitorear cambios en precios

**Tareas:**
- [ ] Crear tabla shopping_history en backend
- [ ] Crear cron para actualizar precios diariamente
- [ ] Generar alertas si precio sube >10%
- [ ] Mostrar histórico de precios en frontend

**Tiempo estimado:** 12 horas (backend)

### 4.4 Interfaz de Compra
**Objetivo:** Mostrar resumen y opciones de acción

**Tareas:**
- [ ] Crear tarjeta de resumen (productos, precio estimado)
- [ ] Botón "Editar lista"
- [ ] Botón "Actualizar precios"
- [ ] Botón "Ir a Líder" (deep-link)
- [ ] Checkbox "Comprado"

**Tiempo estimado:** 6 horas

---

## 💊 FASE 5: Escenario Farmacia (Semanas 9-10)

### 5.1 Detección y Normalización de Medicamentos
**Objetivo:** Clasificar tareas de farmacia

**Tareas:**
- [ ] Crear lista de nombres de medicamentos comunes
- [ ] Implementar validación de medicamentos
- [ ] Solicitar: Principio activo, dosis, presentación
- [ ] Guardar en metadata.medication

**Tiempo estimado:** 6 horas

### 5.2 Comparador de Precios (Farmacias Chilenas)
**Objetivo:** Integrar APIs de farmacias

**Farmacias a integrar:**
- Cruz Verde
- Salcobrand
- Ahumada

**Tareas:**
- [ ] Investigar APIs disponibles
- [ ] Crear tabla pharmacy_prices
- [ ] Implementar módulo pharmacy-offers (backend)
- [ ] Crear endpoint GET /pharmacy-offers?medication=...
- [ ] Cachear resultados por 24h

**Tiempo estimado:** 20 horas (backend)

### 5.3 Alertas y Recordatorios
**Objetivo:** Sugerir reabastecimiento automático

**Tareas:**
- [ ] Detectar si es medicamento recurrente
- [ ] Calcular fecha de próximo reabastecimiento
- [ ] Crear tarea automática con fecha sugerida
- [ ] Enviar notificación 3 días antes

**Tiempo estimado:** 8 horas

### 5.4 Integración con Calendario
**Objetivo:** Mostrar retiro en calendario

**Tareas:**
- [ ] Agregar evento de "retiro farmacia"
- [ ] Calcular tiempo de traslado
- [ ] Mostrar dirección y horario de farmacia
- [ ] Integrar con mapa existente

**Tiempo estimado:** 6 horas

---

## 🔒 FASE 6: Backend, Seguridad y API (Semanas 11-12)

### 6.1 Extensión de Backend
**Objetivo:** Preparar NestJS para decisiones

**Tareas (Backend):**
- [ ] Crear entidad DecisionSession
- [ ] Crear tabla decision_history (auditoría)
- [ ] Extender TaskEntity con category, metadata
- [ ] Crear endpoints REST para decisiones
- [ ] Implementar JWT scopes para permisos

**Tiempo estimado:** 12 horas

### 6.2 Autenticación y Permisos
**Objetivo:** Proteger datos sensibles

**Tareas:**
- [ ] Definir scopes: decisions, shopping, health
- [ ] Validar permisos en cada endpoint
- [ ] Encriptar metadata sensible
- [ ] Implementar audit logging

**Tiempo estimado:** 8 horas

### 6.3 Analítica
**Objetivo:** Medir impacto del asistente

**Métricas:**
- Tiempo ahorrado en planificación
- Adherencia a rutinas (% completado)
- Ahorro en compras (% descuento)
- Tasa de uso del asistente

**Tareas:**
- [ ] Crear tabla analytics_events
- [ ] Loguear eventos de asistente
- [ ] Crear dashboard con métricas
- [ ] Exportar reportes

**Tiempo estimado:** 10 horas

---

## 📊 Resumen de Timeline

| Fase | Descripción | Duración | Total Horas |
|------|-------------|----------|------------|
| 1 | Foundation (Data + Classifier) | 2 semanas | 18 horas |
| 2 | Motor de Decisiones | 2 semanas | 20 horas |
| 3 | Escenario Gimnasio | 2 semanas | 32 horas |
| 4 | Escenario Líder | 2 semanas | 40 horas |
| 5 | Escenario Farmacia | 2 semanas | 40 horas |
| 6 | Backend + Seguridad | 2 semanas | 30 horas |
| **Total** | | **12 semanas** | **180 horas** |

---

## 🎯 Priorización Sugerida

### MVP (Mínimo Viable - 4 semanas, 70 horas)
1. Fase 1: Foundation
2. Fase 2: Motor de Decisiones
3. Fase 3.1-3.2: Conversación y Generador de Gimnasio (básico)

**Resultado:** Asistente de gimnasio funcional que genera rutinas

### Phase 2 (Próximas 4 semanas, 80 horas)
4. Fase 3.3-3.4: Visualización y feedback de gimnasio
5. Fase 4.1-4.2: Compras en Líder (sin API, manual)
6. Fase 5.1: Detección de medicamentos

### Phase 3 (Últimas 4 semanas, 30 horas)
7. Fase 4.3-4.4: Precios y interfaz Líder
8. Fase 5.2-5.4: Farmacias completo
9. Fase 6: Backend y analítica

---

## 💻 Tecnologías Recomendadas

### Frontend
- Vanilla JS (ya implementado)
- Bootstrap/Tailwind para modales
- Zod para validación (ya instalado)
- Zustand para estado (ya instalado)

### Backend
- NestJS (ya en estructura)
- PostgreSQL con pg_cron
- Redis para cache
- Bull para jobs
- Puppeteer (si se necesita scraping)

### APIs Externas
- Google Maps API (ya integrada)
- Farmacias: APIs oficiales o web scraping
- Líder: Web scraping o partnership

---

## 🚨 Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| APIs de Líder/farmacias no disponibles | Alto | Usar web scraping o versión manual |
| Cambios en APIs de farmacias | Medio | Implementar fallbacks y alertas |
| Rendimiento con muchas conversaciones | Medio | Cachear respuestas, usar workers |
| Privacidad de datos de salud | Alto | Encriptar metadata, cumplir LGPD |
| Complejidad del NLP | Medio | Empezar simple, iterar con feedback |

---

## ✅ Checklist de Inicio

- [ ] Crear rama `feature/decision-assistant`
- [ ] Crear carpeta `src/assistant/` en frontend
- [ ] Crear carpeta `src/fitness/` en frontend
- [ ] Crear carpeta `src/shopping/` en frontend
- [ ] Crear carpeta `src/pharmacy/` en frontend
- [ ] Setup backend: entidades DecisionSession
- [ ] Documentar en Notion/GitHub
- [ ] Crear issues en GitHub por fase

---

## 📞 Próximos Pasos

1. **Revisar este plan** con stakeholders
2. **Validar priorización** (MVP vs Phase 2)
3. **Investigar APIs** (Líder, farmacias)
4. **Empezar Fase 1** (2 semanas)
5. **Iteración semanal** con demos

