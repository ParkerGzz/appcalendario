# Módulo Pharmacy

## Propósito
Maneja búsqueda de medicamentos y comparación de precios en farmacias.

## Archivos
- `pharmacyAssistant.js` - Orquesta conversaciones de farmacia
- `medicationDetector.js` - Identifica medicamentos
- `priceComparator.js` - Compara precios entre farmacias
- `reminderManager.js` - Gestiona recordatorios de reabastecimiento

## Responsabilidades
- Detectar medicamentos en nombres de tareas
- Solicitar dosis y principios activos
- Comparar precios entre farmacias
- Generar alertas de reabastecimiento
- Integrar con calendario para retiros

## Farmacias Integradas
- Cruz Verde
- Salcobrand
- Ahumada

## Integración Backend
- Endpoint GET /pharmacy-offers?medication=...
- Cron para actualizar precios diariamente
- Tabla pharmacy_prices para almacenar historiales
