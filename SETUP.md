# 🚀 Guía de Configuración - Calendario Inteligente

## 📋 Requisitos Previos

- Node.js 16+ instalado
- Cuenta de Google Cloud Platform
- Git instalado

---

## ⚙️ Configuración Inicial

### **Paso 1: Clonar el Repositorio**

```bash
git clone https://github.com/TU_USUARIO/calendario-inteligente.git
cd calendario-inteligente
```

### **Paso 2: Configurar Google Maps API**

#### **2.1. Obtener API Key**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs y servicios** > **Credenciales**
4. Haz clic en **"Crear credenciales"** > **"Clave de API"**
5. Copia tu API Key

#### **2.2. Habilitar APIs Necesarias**

Habilita las siguientes APIs en Google Cloud Console:

- ✅ **Maps JavaScript API**
- ✅ **Places API (New)** ← Obligatoria
- ✅ **Geocoding API**
- ✅ **Routes API** (opcional, para backend)
- ✅ **Distance Matrix API** (opcional, para backend)

**Enlaces directos:**
- [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- [Places API (New)](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
- [Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)

#### **2.3. Configurar Restricciones de Seguridad**

⚠️ **IMPORTANTE:** Configura restricciones para proteger tu API Key:

1. En **Credenciales**, haz clic en tu API Key
2. En **"Restricciones de aplicación"**, selecciona:
   - Tipo: **HTTP referrers (sitios web)**
   - Referentes:
     ```
     http://localhost:*/*
     http://127.0.0.1:*/*
     https://tudominio.com/*  (en producción)
     ```

3. En **"Restricciones de API"**, selecciona:
   - **Restringir clave**
   - Marca solo las APIs que habilitaste arriba

4. Haz clic en **"GUARDAR"**

### **Paso 3: Configurar Frontend**

#### **3.1. Copiar config.example.js**

```bash
cp config.example.js config.js
```

#### **3.2. Editar config.js**

Abre `config.js` y reemplaza `YOUR_GOOGLE_MAPS_API_KEY_HERE` con tu API Key:

```javascript
window.APP_CONFIG = {
  googleMaps: {
    apiKey: 'TU_API_KEY_AQUI',  // ← Pega tu API Key aquí
    enabled: true,
  },
  // ... resto de la configuración
}
```

⚠️ **IMPORTANTE:** `config.js` está en `.gitignore` - NUNCA lo subas a GitHub.

### **Paso 4: Configurar Backend (Opcional)**

El backend es necesario para funciones avanzadas como tráfico en tiempo real y optimización de rutas.

#### **4.1. Instalar dependencias**

```bash
cd backend
npm install
```

#### **4.2. Crear archivo .env**

```bash
cp .env.example .env
```

#### **4.3. Editar .env**

Abre `backend/.env` y configura:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8000

# Google Maps API Keys
GMAPS_SERVER_KEY=TU_API_KEY_AQUI
GMAPS_FRONTEND_KEY=TU_API_KEY_AQUI
GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI

# CORS
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

LOG_LEVEL=debug
```

⚠️ **IMPORTANTE:** `.env` está en `.gitignore` - NUNCA lo subas a GitHub.

#### **4.4. Iniciar el backend**

```bash
npm start
```

Deberías ver:
```
🚀 ================================
🚀 Calendario Backend iniciado
🚀 ================================
📡 Puerto: 3000
🔑 Google Maps API: ✅ Configurada
```

### **Paso 5: Abrir la Aplicación**

1. Abre `index.html` en tu navegador
   - Doble clic en el archivo, o
   - Usa un servidor local: `python -m http.server 8000`

2. Deberías ver en la consola del navegador (F12):
   ```
   ✅ Google Maps JavaScript API cargada

   ╔════════════════════════════════════════╗
   ║  Calendario Inteligente v2.0.0          ║
   ╚════════════════════════════════════════╝

   📍 Google Maps: ✅ Habilitado
   ```

3. Prueba el autocompletado:
   - Haz clic en **"+ Nueva Tarea"**
   - Escribe en **"Ubicación/Lugar"** (ej: "Starbucks")
   - Deberías ver **4 sugerencias** de Google Places

---

## 🧪 Verificar que Todo Funciona

### **✅ Checklist:**

- [ ] Google Maps JavaScript API cargada (ver consola)
- [ ] Backend iniciado correctamente (si lo usas)
- [ ] Autocompletado muestra sugerencias de Google Places
- [ ] Puedes crear tareas con ubicaciones
- [ ] Las tareas aparecen en el calendario
- [ ] No hay errores en la consola del navegador

### **❌ Problemas Comunes:**

#### **"Google Places API no está cargada"**
- Verifica que `config.js` tenga tu API Key
- Verifica que Places API (New) esté habilitada
- Espera 5 minutos después de habilitar la API

#### **"This API project is not authorized"**
- Verifica que las APIs estén habilitadas en Google Cloud Console
- Verifica que las restricciones de la API Key permitan `localhost`

#### **Backend no inicia**
- Verifica que `backend/.env` exista y tenga la API Key
- Ejecuta `npm install` en `backend/`
- Verifica que el puerto 3000 esté libre

#### **No aparecen sugerencias**
- Abre la consola (F12) y busca errores
- Verifica que Places API (New) esté habilitada
- Verifica que la API Key sea correcta

---

## 📁 Estructura del Proyecto

```
calendario-inteligente/
├── index.html              # Aplicación principal
├── app.js                  # Lógica de la aplicación
├── styles.css              # Estilos
├── config.example.js       # Plantilla de configuración
├── config.js               # Tu configuración (NO subir a GitHub)
├── backend/
│   ├── src/
│   │   └── server.js       # Servidor Express
│   ├── .env.example        # Plantilla de variables de entorno
│   ├── .env                # Tus variables (NO subir a GitHub)
│   └── package.json
├── .gitignore              # Archivos a ignorar
├── SECURITY.md             # Guía de seguridad
└── README.md               # Documentación principal
```

---

## 🔒 Seguridad

⚠️ **IMPORTANTE:** Lee [SECURITY.md](SECURITY.md) para proteger tu API Key.

**Nunca subas a GitHub:**
- `config.js`
- `backend/.env`
- Cualquier archivo con tu API Key

**Siempre verifica antes de hacer push:**
```bash
# Buscar API Keys accidentales
grep -r "AIzaSy" .

# Ver qué se va a subir
git diff --cached

# Ver estado de git
git status
```

---

## 💰 Costos

Con uso moderado (20-50 búsquedas/día):
- **Google Maps API:** ~$2-5/mes
- **Google ofrece:** $200 USD gratis/mes
- **Resultado:** $0/mes (dentro del plan gratuito)

---

## 📚 Recursos

- [Documentación de Google Maps Platform](https://developers.google.com/maps)
- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [API Security Best Practices](https://developers.google.com/maps/api-security-best-practices)

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para errores
2. Verifica que todas las APIs estén habilitadas
3. Revisa [SECURITY.md](SECURITY.md) para problemas de API Keys
4. Abre un issue en GitHub

---

**Última actualización:** 2025-10-09
**Versión:** 2.0.0
