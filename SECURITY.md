# 🔒 Guía de Seguridad - Protección de API Keys

## ⚠️ IMPORTANTE: Archivos Sensibles

Este proyecto usa Google Maps API que requiere una API Key. **NUNCA** subas tu API Key a GitHub.

---

## 📋 Archivos Protegidos

Los siguientes archivos están en `.gitignore` y **NO** deben subirse a GitHub:

### **Configuración:**
- `config.js` - Contiene tu API Key configurada
- `backend/.env` - Variables de entorno del backend con API Keys

### **Documentación Local (contiene ejemplos con tu API Key):**
- `HABILITAR-PLACES-API-NEW.md`
- `AUTOCOMPLETADO-CONFIGURADO.md`
- `SOLUCION-PROBLEMA-APIS.md`
- `CONFIGURACION-RAPIDA.md`
- `LEEME-PRIMERO.md`

---

## ✅ Archivos Seguros para GitHub

Estos archivos NO contienen API Keys y SÍ deben subirse:

- `config.example.js` - Plantilla de configuración (sin API Key real)
- `backend/.env.example` - Plantilla de variables de entorno
- `.gitignore` - Lista de archivos a ignorar
- `README.md` - Documentación pública
- Todo el código fuente (`app.js`, `index.html`, etc.)

---

## 🛡️ Cómo Proteger tu API Key

### **1. Verificar antes de hacer commit**

Antes de subir cambios a GitHub:

```bash
# Ver qué archivos se van a subir
git status

# Ver el contenido de lo que vas a subir
git diff

# Buscar si hay API keys accidentalmente incluidas
grep -r "AIzaSy" .
```

Si ves tu API Key, **NO HAGAS COMMIT**.

### **2. Si ya commiteaste tu API Key**

**⚠️ EMERGENCIA:** Si accidentalmente subiste tu API Key a GitHub:

#### **Paso 1: Rotar la API Key inmediatamente**
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Encuentra tu API Key
3. Haz clic en **"Regenerar Key"** o crea una nueva
4. Elimina la clave comprometida
5. Actualiza `config.js` con la nueva key

#### **Paso 2: Limpiar el historial de Git**
```bash
# Eliminar el archivo del historial (mantenerlo en disco)
git rm --cached config.js

# Hacer commit del cambio
git commit -m "Remove API key from repository"

# Forzar push (CUIDADO: reescribe historial)
git push --force
```

⚠️ **IMPORTANTE:** Esto solo elimina la key de commits futuros. La key comprometida seguirá en el historial antiguo. Por eso es crítico ROTAR la key.

---

## 🔑 Buenas Prácticas

### **1. Usar Variables de Entorno**

Para producción, NO uses `config.js`. Usa variables de entorno:

```javascript
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
```

### **2. Restricciones de API Key**

En Google Cloud Console, SIEMPRE configura restricciones:

#### **Restricciones de Aplicación:**
- Tipo: **HTTP referrers (sitios web)**
- Referrers permitidos:
  ```
  https://tudominio.com/*
  http://localhost:*/*
  ```

#### **Restricciones de API:**
- Restringir a solo las APIs que uses:
  - ✅ Maps JavaScript API
  - ✅ Places API (New)
  - ✅ Geocoding API
  - ✅ Routes API
  - ✅ Distance Matrix API
  - ❌ TODO lo demás deshabilitado

### **3. Monitorear Uso**

1. Ve a: https://console.cloud.google.com/google/maps-apis/metrics
2. Configura alertas para:
   - Uso inusual (más de X requests/día)
   - Errores 403 (acceso no autorizado)
   - Costos elevados

### **4. Usar Diferentes Keys**

- **Desarrollo:** `GOOGLE_MAPS_DEV_KEY` (con localhost)
- **Producción:** `GOOGLE_MAPS_PROD_KEY` (con tu dominio)

---

## 📝 Checklist de Seguridad

Antes de hacer `git push`:

- [ ] Verificar que `config.js` NO está en el commit
- [ ] Verificar que `backend/.env` NO está en el commit
- [ ] Verificar que ningún archivo de documentación con tu API Key está incluido
- [ ] Ejecutar `git diff` para revisar cambios
- [ ] Ejecutar `grep -r "AIzaSy" .` para buscar API Keys accidentales
- [ ] Verificar que `.gitignore` está actualizado

---

## 🚨 Si Comprometiste tu API Key

### **Síntomas de una key comprometida:**
- Uso de API repentinamente alto
- Requests desde ubicaciones desconocidas
- Errores 403 en tu aplicación
- Cargos inesperados en Google Cloud

### **Acción inmediata:**
1. ✅ **Rotar la API Key** inmediatamente
2. ✅ **Revisar logs** en Google Cloud Console
3. ✅ **Configurar restricciones** estrictas
4. ✅ **Limpiar historial de Git** (si es necesario)
5. ✅ **Notificar** a tu equipo si es un proyecto compartido

---

## 📚 Recursos

- [Google Maps API Security Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Git - Remove Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [.gitignore Documentation](https://git-scm.com/docs/gitignore)

---

## 💡 Configuración Recomendada

### **Para Desarrollo Local:**

```javascript
// config.js (NO subir a GitHub)
window.APP_CONFIG = {
  googleMaps: {
    apiKey: 'TU_API_KEY_AQUI'  // ← Tu key real
  }
}
```

### **Para Producción:**

```javascript
// config.js (SÍ subir a GitHub)
window.APP_CONFIG = {
  googleMaps: {
    apiKey: window.ENV.GOOGLE_MAPS_KEY  // ← Inyectada por servidor
  }
}
```

---

## ✅ Resumen

1. **NUNCA** subas `config.js` con tu API Key real
2. **SIEMPRE** usa `config.example.js` como plantilla
3. **CONFIGURA** restricciones en Google Cloud Console
4. **MONITOREA** el uso de tu API Key regularmente
5. **ROTA** la key inmediatamente si se compromete

---

**Última actualización:** 2025-10-09
