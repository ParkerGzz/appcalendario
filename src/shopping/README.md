# Módulo Shopping

## Propósito
Maneja listas de compras, precios y ofertas de supermercados.

## Archivos
- `shoppingAssistant.js` - Orquesta conversaciones de compras
- `listManager.js` - Maneja lista de productos
- `priceChecker.js` - Verifica precios y ofertas
- `cartGenerator.js` - Crea carritos prellenados

## Responsabilidades
- Solicitar lista de productos al usuario
- Validar y normalizar productos
- Buscar precios en APIs/scraping
- Generar links a carritos
- Monitorear cambios de precio
- Alertar sobre ofertas

## Integración Backend
- Endpoint POST /shopping/search
- Endpoint GET /shopping/prices
- Cron para actualizar precios diariamente
