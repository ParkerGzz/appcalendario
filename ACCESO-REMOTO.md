# 🌍 Guía de Acceso Remoto - Calendario Inteligente

## 📱 Acceder desde Cualquier Dispositivo

Tu aplicación está configurada para funcionar desde cualquier dispositivo en cualquier red.

---

## 🔧 Configuración Completada

✅ **Backend configurado para aceptar conexiones de cualquier origen**
✅ **CORS habilitado para acceso universal**
✅ **API Key sin restricciones de referrer**
✅ **Auto-detección de URL del backend**

---

## 🖥️ Servidor (Tu Computador)

### **Paso 1: Obtener tu IP**

```bash
# En Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# En Windows:
ipconfig
```

**Tu IP actual:** `192.168.0.186` (ejemplo)

### **Paso 2: Iniciar el Backend**

```bash
cd backend
npm start
```

Deberías ver:
```
🚀 Calendario Backend iniciado
📡 Puerto: 3000
🌐 Host: 0.0.0.0
🌐 URL Local: http://localhost:3000
🌍 URL Red: http://<TU_IP>:3000
```

### **Paso 3: Servir el Frontend**

**Opción A - Servidor HTTP simple (Python):**
```bash
# En la carpeta raíz del proyecto
python3 -m http.server 8000
```

**Opción B - Live Server (VSCode):**
1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

**Opción C - Node http-server:**
```bash
npm install -g http-server
http-server -p 8000
```

---

## 📱 Dispositivos Remotos (Teléfono, Tablet, Otro PC)

### **Acceso desde la Misma Red WiFi**

1. **Conecta el dispositivo a la misma red WiFi** que tu computador
2. **Abre el navegador** en el dispositivo
3. **Escribe la URL:**
   ```
   http://192.168.0.186:8000
   ```
   (Reemplaza `192.168.0.186` con la IP de tu computador)

### **Acceso desde Internet (Fuera de tu Red)**

Para acceder desde cualquier lugar del mundo, necesitas exponer tu servidor:

#### **Opción 1: ngrok (Más Fácil)** ⭐ Recomendado

1. **Instala ngrok:**
   ```bash
   # Mac (con Homebrew)
   brew install ngrok

   # Windows/Linux - descarga de https://ngrok.com/download
   ```

2. **Expón el frontend:**
   ```bash
   ngrok http 8000
   ```

3. **Expón el backend (en otra terminal):**
   ```bash
   ngrok http 3000
   ```

4. **Copia las URLs públicas:**
   ```
   Frontend: https://abc123.ngrok.io
   Backend: https://def456.ngrok.io
   ```

5. **Actualiza config.js:**
   ```javascript
   backend: {
     url: 'https://def456.ngrok.io',
   }
   ```

6. **Accede desde cualquier dispositivo:**
   ```
   https://abc123.ngrok.io
   ```

#### **Opción 2: Cloudflare Tunnel**

1. **Instala cloudflared:**
   ```bash
   # Mac
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Inicia el túnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```

3. **Usa la URL pública generada**

#### **Opción 3: Serveo (Sin instalación)**

```bash
# Frontend
ssh -R 80:localhost:8000 serveo.net

# Backend
ssh -R 80:localhost:3000 serveo.net
```

---

## 🔒 Configurar Google Maps API para Acceso Universal

### **Paso 1: Ir a Google Cloud Console**

https://console.cloud.google.com/apis/credentials

### **Paso 2: Editar tu API Key**

1. Haz clic en tu API Key
2. En **"Restricciones de aplicación"**:
   - Selecciona: **"Ninguna"** o **"HTTP referrers"**

3. Si eliges **HTTP referrers**, agrega:
   ```
   */*                          (Permitir todo - SOLO para desarrollo)
   http://*:*/*                 (Cualquier HTTP)
   https://*:*/*                (Cualquier HTTPS)
   ```

4. En **"Restricciones de API"**:
   - Selecciona: **"No restringir clave"** o
   - Marca solo las APIs que usas:
     - Maps JavaScript API
     - Places API (New)
     - Geocoding API
     - Routes API
     - Distance Matrix API

5. **Guarda los cambios**

⚠️ **IMPORTANTE:** Esta configuración es para desarrollo. En producción, usa restricciones específicas.

---

## 🧪 Probar el Acceso

### **Desde el mismo dispositivo:**
```
http://localhost:8000
```

### **Desde otro dispositivo en la misma WiFi:**
```
http://192.168.0.186:8000
```
(Reemplaza con tu IP)

### **Desde Internet (con ngrok):**
```
https://abc123.ngrok.io
```

---

## 🐛 Solución de Problemas

### **1. "No se puede conectar al backend"**

**Verificar que el backend esté corriendo:**
```bash
curl http://localhost:3000/health
```

Debería devolver:
```json
{"status":"ok","timestamp":"...","service":"Calendario Backend"}
```

**Verificar desde otro dispositivo:**
```bash
curl http://192.168.0.186:3000/health
```

**Solución:**
- Verifica que el backend esté iniciado
- Verifica que el firewall no bloquee el puerto 3000

### **2. "API Key no funciona"**

**Verificar en la consola del navegador (F12):**
- Busca errores de Google Maps
- Verifica que veas: `✅ Google Maps JavaScript API cargada`

**Solución:**
- Ve a Google Cloud Console
- Verifica que las APIs estén habilitadas
- Verifica que no haya restricciones de referrer
- Espera 5 minutos después de cambiar restricciones

### **3. "CORS error"**

**Error típico:**
```
Access to fetch at 'http://...' has been blocked by CORS policy
```

**Solución:**
- Verifica que `backend/.env` tenga `CORS_ORIGINS=*`
- Reinicia el backend
- Limpia la caché del navegador

### **4. Firewall bloquea las conexiones**

**Mac:**
```bash
# Permitir puerto 3000
sudo pfctl -f /etc/pf.conf
```

**Windows:**
1. Panel de Control > Firewall de Windows
2. Configuración avanzada > Reglas de entrada
3. Nueva regla > Puerto > TCP > 3000
4. Permitir la conexión

**Linux (Ubuntu):**
```bash
sudo ufw allow 3000
sudo ufw allow 8000
```

---

## 📊 Puertos Utilizados

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 8000 | Frontend | Aplicación web |
| 3000 | Backend | API del servidor |

---

## ⚡ Inicio Rápido

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
python3 -m http.server 8000

# Acceder:
# - Mismo PC: http://localhost:8000
# - Misma WiFi: http://192.168.0.186:8000
# - Internet: Usar ngrok
```

---

## 🔐 Seguridad

### **⚠️ Para Desarrollo:**
- ✅ CORS abierto (`*`)
- ✅ API Key sin restricciones
- ✅ Servidor escuchando en todas las interfaces

### **✅ Para Producción:**
- ❌ Restringir CORS a dominios específicos
- ❌ Restringir API Key por HTTP referrer
- ❌ Usar HTTPS
- ❌ Implementar autenticación
- ❌ Limitar rate limiting

---

## 📱 Ejemplo de Uso

**Escenario:** Quieres usar la app desde tu teléfono mientras estás en casa

1. **En tu computador:**
   ```bash
   # Terminal 1
   cd backend
   npm start

   # Terminal 2
   python3 -m http.server 8000
   ```

2. **Obtén tu IP:**
   ```bash
   ifconfig | grep "inet "
   # Ejemplo: 192.168.0.186
   ```

3. **En tu teléfono:**
   - Conéctate a la misma WiFi
   - Abre el navegador
   - Ve a: `http://192.168.0.186:8000`
   - ¡Listo! La app funciona

---

## 🌐 Hacer la App Permanente en Internet

### **Opción 1: Deploy en Netlify + Railway**

**Frontend (Netlify):**
1. Conecta tu repo de GitHub
2. Deploy automático
3. URL: `https://tu-app.netlify.app`

**Backend (Railway):**
1. Conecta tu repo
2. Agrega variables de entorno
3. URL: `https://tu-backend.railway.app`

### **Opción 2: Deploy en Vercel**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy frontend
vercel

# Deploy backend
cd backend
vercel
```

---

## ✅ Checklist Final

- [ ] Backend corriendo en `0.0.0.0:3000`
- [ ] Frontend servido en puerto 8000
- [ ] API Key sin restricciones en Google Cloud
- [ ] CORS configurado en `*`
- [ ] Firewall permite puertos 3000 y 8000
- [ ] Probado desde otro dispositivo en la misma red

---

**¡Tu aplicación ahora es accesible desde cualquier dispositivo!** 🎉
