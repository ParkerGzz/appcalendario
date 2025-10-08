# 🚀 Inicio Rápido - Calendario Inteligente

Esta guía te permite empezar a usar la aplicación en **5 minutos**.

---

## ⚡ Opción 1: Modo Básico (Sin configuración)

### 1. Abrir la aplicación

```bash
cd appcalendario
python -m http.server 8000
```

O simplemente abre `index.html` en tu navegador.

### 2. Login de prueba

- **Usuario**: `demo`
- **Contraseña**: `demo123`

### 3. Configurar ubicaciones

1. Ve a **⚙️ Configuración**
2. En "Casa":
   - Escribe tu dirección (ej: "Av. Providencia 1234, Santiago")
   - Haz clic en "Obtener Coordenadas"
3. En "Trabajo":
   - Escribe tu dirección laboral
   - Haz clic en "Obtener Coordenadas"
4. Haz clic en "Guardar Configuración"

### 4. Crear tu primera tarea

1. Ve a **✅ Tareas**
2. Haz clic en "Nueva Tarea"
3. Completa:
   - **Nombre**: "Comprar en el supermercado"
   - **Ubicación**: "supermercado Jumbo"
   - **Duración**: 1 hora
   - **Prioridad**: Media
4. Haz clic en "Agregar Tarea"

### 5. Ver sugerencias

1. En la sección "💡 Sugerencias Inteligentes" verás agrupaciones
2. Haz clic en "📅 Asignar todos estos días" para aceptar una sugerencia

### 6. Planificar una ruta

1. Ve a **🗺️ Rutas**
2. Selecciona:
   - **Origen**: Casa
   - **Destino**: Trabajo
   - **Modo**: Auto 🚗
   - **Tipos de lugares**: Marca "Supermercado"
3. Haz clic en "Buscar Ruta Optimizada"
4. Verás:
   - Distancia y tiempo estimado
   - Supermercados en tu ruta
   - Tiempo de desvío para cada uno

---

## 🔥 Opción 2: Modo Avanzado (Google Maps)

### Requisitos
- Cuenta de Google Cloud
- 15-20 minutos de configuración
- Tarjeta de crédito (tiene $200/mes gratis)

### Paso 1: Google Cloud Setup

Sigue la guía completa: **[GOOGLE-MAPS-SETUP.md](GOOGLE-MAPS-SETUP.md)**

**O resumen ultra-rápido**:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea proyecto "calendario-inteligente"
3. Activa facturación (tiene $200/mes gratis)
4. Habilita APIs:
   - [Routes API](https://console.cloud.google.com/apis/library/routes.googleapis.com)
   - [Distance Matrix API](https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com)
   - [Places API (New)](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
5. Crea API Key para servidor:
   - Credenciales → Crear credenciales → Clave de API
   - Copiar key
   - Restricciones: Por IP (127.0.0.1) + Por APIs (Routes, Distance Matrix, Places)

### Paso 2: Backend Setup

```bash
cd appcalendario/backend
npm install
cp .env.example .env
```

Edita `.env`:
```bash
GMAPS_SERVER_KEY=TU_API_KEY_AQUI
PORT=3000
```

Inicia el backend:
```bash
npm start
```

Deberías ver:
```
🚀 Calendario Backend iniciado
📡 Puerto: 3000
🔑 Google Maps API: ✅ Configurada
```

### Paso 3: Activar en Frontend

Edita `appcalendario/config.js`:

```javascript
window.APP_CONFIG = {
  backendURL: 'http://localhost:3000',
  useGoogleMaps: true,  // ← Cambiar a true
  // ...
};
```

### Paso 4: Probar

1. Abre la app: `http://localhost:8000`
2. Ve a 🗺️ Rutas
3. Calcula una ruta
4. En la consola del navegador (F12) verás:
   ```
   [Route] Using Google Maps Platform
   [Google Routes] Rutas calculadas: 1
   ```

---

## 📊 Comparación Rápida

| Característica | Modo Básico | Modo Avanzado |
|----------------|-------------|---------------|
| **Setup** | 0 min | 15-20 min |
| **Costo** | Gratis | $0-15/mes* |
| **Rutas** | ✅ Básicas | ✅ Con tráfico |
| **Lugares** | ✅ Limitado | ✅ Completo |
| **Transporte** | 🚗 Auto | 🚗🚶🚴🚌 Todos |
| **Precisión** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

*$200/mes de crédito gratis. Uso típico: $8-15/mes.

---

## 🎯 Próximos Pasos

Una vez que la app esté funcionando:

1. **Configura tu horario de trabajo**:
   - ⚙️ Configuración → Horario de Trabajo
   - Define tu jornada laboral

2. **Agrega más tareas**:
   - ✅ Tareas → Nueva Tarea
   - Prueba diferentes ubicaciones y prioridades

3. **Explora sugerencias inteligentes**:
   - La app agrupa tareas cercanas automáticamente
   - Sugiere días óptimos

4. **Planifica rutas complejas**:
   - Busca múltiples tipos de lugares
   - Compara diferentes modos de transporte
   - Ve predicciones de flujo de personas

---

## ❓ Problemas Comunes

### La app no carga
- **Solución**: Abre la consola (F12) y verifica errores
- Asegúrate de que los archivos estén completos

### No encuentra direcciones
- **Solución**: Espera 1-2 segundos después de escribir
- Nominatim (API gratuita) tiene rate limit de 1 req/seg

### Backend no inicia
- **Error**: "GMAPS_SERVER_KEY no configurada"
- **Solución**: Verifica que `.env` exista y tenga la API key

### CORS Error
- **Síntoma**: Error de CORS en consola
- **Solución**: 
  - Verifica que backend esté corriendo en puerto 3000
  - Verifica `backendURL` en `config.js`

---

## 📚 Más Documentación

- **[README.md](README.md)**: Documentación completa del proyecto
- **[GOOGLE-MAPS-SETUP.md](GOOGLE-MAPS-SETUP.md)**: Guía detallada de Google Maps
- **[TASK-MANAGEMENT.md](TASK-MANAGEMENT.md)**: Sistema de tareas y sugerencias
- **[ROUTE-PLANNER.md](ROUTE-PLANNER.md)**: Planificador de rutas

---

## 🆘 Ayuda

¿Problemas? Verifica:
1. Consola del navegador (F12) para errores JavaScript
2. Logs del backend en la terminal
3. Sección Troubleshooting en [GOOGLE-MAPS-SETUP.md](GOOGLE-MAPS-SETUP.md)

---

**¡Listo para empezar!** 🎉

Elige el modo que prefieras y comienza a optimizar tu agenda.
