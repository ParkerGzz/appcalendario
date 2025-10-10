# ⚡ Configuración Rápida - APIs de Google Maps

## ❌ Problemas Detectados

1. **Backend no tiene `node_modules`** → Las funciones avanzadas no funcionarán
2. **Backend no tiene `.env`** → ✅ Ya creado
3. **API Key necesita restricciones correctas** → Hay que configurar en Google Cloud

---

## ✅ Solución Paso a Paso

### Paso 1: Instalar Dependencias del Backend

```bash
cd appcalendario/backend
npm install
```

**Esto instalará**:
- Express (servidor)
- Google Maps Services (para Routes, Distance Matrix, Places)
- CORS
- Otras dependencias necesarias

⏱️ Tomará 1-2 minutos.

---

### Paso 2: Iniciar el Backend

```bash
# Desde appcalendario/backend/
npm start
```

**Deberías ver**:
```
✅ Servidor iniciado en puerto 3000
✅ CORS configurado para: http://localhost:8000
```

**Mantén esta terminal abierta** mientras usas la aplicación.

---

### Paso 3: Configurar API Key en Google Cloud Console

#### 3.1. Ir a Google Cloud Console

https://console.cloud.google.com/

#### 3.2. Habilitar las APIs Necesarias

Ve a **APIs & Services** → **Library** y habilita:

- ✅ **Maps JavaScript API**
- ✅ **Places API (New)**
- ✅ **Geocoding API**
- ✅ **Routes API**
- ✅ **Distance Matrix API**

#### 3.3. Configurar Restricciones de la API Key

Ve a **APIs & Services** → **Credentials** → Click en tu API Key

**Application restrictions**:
- Selecciona: **HTTP referrers (web sites)**
- Agregar:
  ```
  http://localhost:*/*
  http://127.0.0.1:*/*
  http://localhost:8000/*
  http://127.0.0.1:8000/*
  ```

**API restrictions**:
- Selecciona: **Restrict key**
- Marca:
  - Maps JavaScript API
  - Places API (New)
  - Geocoding API
  - Routes API
  - Distance Matrix API

**Guardar**.

---

### Paso 4: Abrir la Aplicación

Abre `index.html` en tu navegador:

**Opción A**: Con Live Server (VS Code)
- Click derecho en `index.html` → "Open with Live Server"
- Se abrirá en `http://localhost:5500` o `http://127.0.0.1:5500`

**Opción B**: Directamente en el navegador
- Arrastra `index.html` al navegador
- URL será `file:///...` (algunas APIs podrían no funcionar)

**Opción C**: Con Python (recomendado)
```bash
# Desde appcalendario/
python3 -m http.server 8000
```
- Abre: http://localhost:8000

---

### Paso 5: Verificar que Funciona

#### 5.1. Abrir Consola del Navegador

Presiona **F12** → pestaña **Console**

Deberías ver:
```
✅ Google Maps API functions loaded
✅ Google Maps JavaScript API cargada
✅ FullCalendar cargado
```

**Si ves errores**, cópialos y compártelos.

#### 5.2. Probar Autocompletado

1. Click en **"➕ Nueva Tarea"**
2. En "Dirección específica", escribe: **"starbucks"**
3. Espera 1-2 segundos

**Deberías ver**:
```
▼ Starbucks - Av. Providencia ...
  Santiago, Región Metropolitana
```

**Si NO aparecen sugerencias**:
- Revisa restricciones de API Key
- Mira errores en consola (F12)

#### 5.3. Probar Tráfico (requiere backend)

1. Crea una tarea con ubicación de Google
2. Asígnala a HOY
3. Click en **"🚗 Ver tráfico"**

**Deberías ver**:
```
🚗 Ruta a [nombre]:
📏 Distancia: X km
⏱️ Sin tráfico: X min
🚦 CON tráfico: X min
```

**Si dice "Error al calcular tráfico"**:
- Verifica que el backend esté corriendo (`npm start`)
- Revisa que el puerto sea 3000
- Mira errores en la terminal del backend

---

## 🔧 Troubleshooting

### Error: "Google Maps JavaScript API cargada" NO aparece

**Causa**: API Key incorrecta o restricciones mal configuradas

**Solución**:
1. Verifica que `config.js` tenga:
   ```javascript
   useGoogleMaps: true,
   googleMapsFrontendKey: 'TU_API_KEY_AQUI'
   ```
2. Verifica restricciones en Google Cloud Console
3. Espera 5 minutos (los cambios tardan en propagarse)

---

### Error: "Error al calcular tráfico"

**Causa**: Backend no está corriendo o no tiene acceso a la API

**Solución**:
1. Inicia el backend:
   ```bash
   cd appcalendario/backend
   npm start
   ```
2. Verifica que `.env` tenga `GMAPS_SERVER_KEY`
3. Verifica que la API Key del servidor tenga habilitadas:
   - Routes API
   - Distance Matrix API

---

### Error: "No se encontraron sugerencias"

**Causa 1**: Escribiste muy pocas letras
- Escribe al menos 3 caracteres

**Causa 2**: API Key sin permisos de Places API
- Ve a Google Cloud Console
- Habilita **Places API (New)**

**Causa 3**: Restricciones muy estrictas
- Agrega `http://localhost:*/*` en HTTP referrers

---

### Las sugerencias son de OpenStreetMap, no Google

**Síntoma**: Las direcciones son largas y genéricas:
```
Providencia, Santiago, Región Metropolitana, Chile
```

**Causa**: Google Maps API no está cargada

**Solución**:
1. Revisa consola (F12)
2. Busca: "ℹ️ Google Maps desactivado o sin API key"
3. Significa que `config.js` no está bien configurado

---

## 📋 Checklist de Configuración

Marca cada ítem cuando lo completes:

- [ ] Backend instalado (`npm install` en backend/)
- [ ] Backend corriendo (`npm start`, puerto 3000)
- [ ] Archivo `.env` creado en backend/
- [ ] APIs habilitadas en Google Cloud Console:
  - [ ] Maps JavaScript API
  - [ ] Places API (New)
  - [ ] Geocoding API
  - [ ] Routes API
  - [ ] Distance Matrix API
- [ ] API Key configurada con restricciones:
  - [ ] HTTP referrers: `http://localhost:*/*`
  - [ ] API restrictions: Solo las 5 APIs marcadas arriba
- [ ] `config.js` tiene:
  - [ ] `useGoogleMaps: true`
  - [ ] `googleMapsFrontendKey: 'TU_API_KEY'`
- [ ] Aplicación abierta en navegador
- [ ] Consola muestra "✅ Google Maps JavaScript API cargada"
- [ ] Autocompletado funciona (prueba con "starbucks")
- [ ] Tráfico funciona (botón "🚗 Ver tráfico")

---

## 🎯 Comandos Rápidos

### Iniciar todo de una vez

**Terminal 1** (Backend):
```bash
cd appcalendario/backend
npm install  # Solo la primera vez
npm start
```

**Terminal 2** (Frontend):
```bash
cd appcalendario
python3 -m http.server 8000
```

**Navegador**:
```
http://localhost:8000
```

---

## 💡 Alternativa Sin Backend (Solo Frontend)

Si **NO quieres usar el backend**, aún puedes usar:

✅ Autocompletado de Google Places
✅ Información de lugares (horarios, ratings)
✅ Geocoding

❌ NO funcionarán:
- Cálculo de tráfico
- Optimización de rutas
- Lugares en ruta

Para esto, solo necesitas:
1. API Key configurada en `config.js`
2. Maps JavaScript API + Places API + Geocoding API habilitadas
3. Abrir `index.html` en el navegador

---

## 📞 Necesitas Ayuda?

Si sigues teniendo problemas:

1. **Abre la consola** (F12) y copia TODOS los errores
2. **Copia la salida** de la terminal del backend
3. **Verifica** que la API Key no esté revocada o sin cuota

Comparte esos 3 elementos para diagnosticar el problema.

---

**Última actualización**: 9 de Octubre, 2025
