# 🚀 Instalación Segura - Calendario Inteligente

## ⚡ Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu API key de Google Maps

# 3. Iniciar aplicación
npm run dev
```

La aplicación se abrirá automáticamente en `http://localhost:8000`

---

## 📋 Requisitos

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Google Maps API Key** con las siguientes APIs habilitadas:
  - Maps JavaScript API
  - Places API (New)
  - Geocoding API
  - Routes API (opcional)
  - Distance Matrix API (opcional)

---

## 🔐 Configuración de Variables de Entorno

### 1. Crear archivo `.env`

```bash
cp .env.example .env
```

### 2. Obtener Google Maps API Key

1. Ir a [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar las APIs necesarias (ver sección anterior)
4. Crear credenciales > Clave de API
5. Configurar restricciones de HTTP referrer:
   - `http://localhost:*/*`
   - `http://127.0.0.1:*/*`
   - `file:///*`
   - Tu dominio de producción

### 3. Configurar `.env`

Editar el archivo `.env` y reemplazar:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

Con tu API key real:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...tu_clave_real
```

**⚠️ IMPORTANTE:**
- ✅ `.env` ya está en `.gitignore`
- ❌ NUNCA commitear el archivo `.env`
- ✅ Solo commitear `.env.example` (sin secretos)

---

## 🛠️ Scripts Disponibles

### Desarrollo

```bash
npm run dev
```

Inicia servidor de desarrollo con:
- ✅ Hot Module Replacement (HMR)
- ✅ Puerto 8000
- ✅ Abre navegador automáticamente

### Producción

```bash
npm run build
```

Genera build optimizado en carpeta `dist/`:
- ✅ Minificación de código
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Asset optimization

### Preview del Build

```bash
npm run preview
```

Previsualiza el build de producción localmente

### Backend (separado)

```bash
npm run backend
```

Inicia el servidor backend Node.js en puerto 3000

---

## 📁 Estructura del Proyecto

```
appcalendario/
├─ src/                    # Código fuente modular
│  ├─ main.js             # Punto de entrada
│  ├─ state/              # Gestión de estado
│  │  └─ store.js
│  ├─ services/           # APIs y llamadas externas
│  ├─ views/              # Componentes UI
│  └─ utils/              # Utilidades
│     ├─ security.js      # Sanitización XSS
│     └─ eventDelegation.js
│
├─ backend/               # Backend Node.js
│  ├─ server.js
│  └─ .env               # Variables del backend
│
├─ .env                   # Variables de entorno (NO COMMITEAR)
├─ .env.example           # Plantilla de variables
├─ config.js              # Configuración (usa .env)
├─ config.example.js      # Plantilla de config
├─ vite.config.js         # Configuración Vite
├─ index.html             # HTML principal
├─ app.js                 # Código legacy (migración gradual)
└─ package.json           # Dependencias
```

---

## 🔒 Seguridad

### API Keys Protegidas

✅ Las API keys se cargan desde variables de entorno
✅ `.env` está en `.gitignore`
✅ `config.example.js` no contiene secretos

### Prevención XSS

✅ Todas las entradas de usuario pasan por `escapeHtml()`
✅ Datos de APIs externas sanitizados
✅ URLs validadas con `sanitizeUrl()`

### Event Listeners Optimizados

✅ Delegación de eventos en lugar de múltiples listeners
✅ Sin memory leaks

---

## 🌐 Uso con Backend

Si quieres usar las funciones avanzadas de rutas y tráfico:

### Terminal 1: Frontend
```bash
npm run dev
```

### Terminal 2: Backend
```bash
npm run backend
```

O usar el script de inicio conjunto:

```bash
./start-all.sh
```

---

## 🐛 Troubleshooting

### "Error: API key no configurada"

**Solución:**
1. Verificar que `.env` existe
2. Verificar que contiene `VITE_GOOGLE_MAPS_API_KEY=...`
3. Reiniciar el servidor de desarrollo

### "Google Maps API no carga"

**Solución:**
1. Verificar que la API key es válida
2. Verificar que las APIs están habilitadas en Google Cloud Console
3. Verificar restricciones de HTTP referrer
4. Revisar la consola del navegador para errores específicos

### "Cannot find module 'vite'"

**Solución:**
```bash
npm install
```

---

## 🚀 Deploy a Producción

### 1. Build

```bash
npm run build
```

### 2. Configurar Variables de Entorno

En tu servidor/plataforma (Vercel, Netlify, etc.):

```env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_produccion
VITE_APP_NAME=Calendario Inteligente
VITE_APP_VERSION=2.0.0
VITE_APP_TIMEZONE=America/Santiago
VITE_APP_LANGUAGE=es
```

### 3. Subir carpeta `dist/`

La carpeta `dist/` contiene todos los archivos estáticos optimizados.

### Plataformas recomendadas:

- **Vercel**: Deploy automático desde GitHub
- **Netlify**: Drag & drop de `dist/`
- **GitHub Pages**: Configurar workflow de GitHub Actions

---

## 📝 Notas Adicionales

### Modo Demo

Por defecto, la aplicación usa autenticación demo:

- **Usuario:** demo@demo.com
- **Contraseña:** demo123

Cambiar en `config.js`:

```javascript
auth: {
  demoEnabled: false  // Deshabilitar demo
}
```

### APIs Fallback

Si Google Maps no está disponible, la app usa:

- **Nominatim** (OpenStreetMap) para geocoding
- **OSRM** para routing

---

## 📚 Más Información

- [SECURITY-IMPROVEMENTS.md](./SECURITY-IMPROVEMENTS.md) - Detalle de mejoras de seguridad
- [README.md](./README.md) - Documentación general
- [SETUP.md](./SETUP.md) - Guía de configuración completa

---

## ✅ Checklist Pre-Deploy

- [ ] ✅ `.env` no está en el repositorio
- [ ] ✅ API key de producción configurada
- [ ] ✅ Restricciones de HTTP referrer actualizadas
- [ ] ✅ Build ejecutado sin errores (`npm run build`)
- [ ] ✅ Preview testeado (`npm run preview`)
- [ ] ✅ Variables de entorno configuradas en plataforma de deploy
- [ ] ✅ Backend desplegado (si aplica)
- [ ] ✅ URLs del backend actualizadas en config

---

**¡Listo para producción! 🎉**
