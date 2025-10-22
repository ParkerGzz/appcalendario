# Módulo Assistant

## Propósito
Contiene el motor de decisiones que orquesta conversaciones inteligentes según la categoría de la tarea.

## Archivos
- `decisionAssistant.js` - Servicio principal que observa tareas y dispara conversaciones
- `conversationFlow.js` - Base para máquina de estados de conversaciones
- `constants.js` - Estados y configuración de conversaciones

## Responsabilidades
- Observar cambios en state.tasks
- Detectar tareas con categoría
- Iniciar diálogos modales según categoría
- Gestionar estado de conversación
- Guardar respuestas en metadata

## Integración
Se integra con el sistema de notificaciones y modales existentes.
