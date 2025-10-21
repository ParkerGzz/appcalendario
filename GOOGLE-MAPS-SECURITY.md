# 🔐 Seguridad de Google Maps API - Guía Completa

## 📋 Tabla de Contenidos
1. [Resumen del Problema](#resumen-del-problema)
2. [Solución Implementada](#solución-implementada)
3. [Configurar Restricciones en Google Cloud](#configurar-restricciones-en-google-cloud)
4. [Archivos de Configuración](#archivos-de-configuración)
5. [Cómo Funciona](#cómo-funciona)
6. [Monitoreo y Alertas](#monitoreo-y-alertas)

---

## 🎯 Resumen del Problema

### El Desafío
Necesitas que tu aplicación funcione en **GitHub Pages** (público), pero no quieres que tu API key de Google Maps sea robada y usada por otras personas en sus aplicaciones.

### La Realidad
⚠️ **IMPORTANTE**: En aplicaciones frontend (JavaScript en el navegador), la API key **siempre será visible** en el código fuente. No hay forma de ocultarla completamente.

### La Solución
✅ **Usar restricciones de API** en Google Cloud Console para limitar dónde y cómo se puede usar tu API key.

---

## 🛡️ Solución Implementada

### Arquitectura de Archivos

```
appcalendario/
├── config.js              ← Tu API key real (NO en Git) ❌
├── config.example.js      ← Plantilla pública (SÍ en Git) ✅
├── config.public.js       ← API key restringida (SÍ en Git) ✅
└── .gitignore            ← Excluye config.js ✅
```

### Flujo de Carga

```javascript
// En index.html
if (hostname.includes('github.io')) {
    → Cargar config.public.js  // GitHub Pages
} else {
    → Cargar config.js         // Desarrollo local
    → Si no existe: config.public.js (fallback)
}
```

---

## 🔧 Configurar Restricciones en Google Cloud

### Paso 1: Acceder a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto
3. Menú ☰ → **APIs & Services** → **Credentials**

### Paso 2: Crear una API Key Restringida para GitHub Pages

#### Opción A: Crear Nueva API Key (Recomendado)

1. Click en **+ CREATE CREDENTIALS** → **API key**
2. Copia la key generada
3. Click en **RESTRICT KEY** (o el nombre de la key recién creada)

#### Configuración de Restricciones

##### 1️⃣ **Application restrictions** (HTTP referrers)

Selecciona: **HTTP referrers (web sites)**

Agrega estos referrers (uno por línea):

```
https://TU-USUARIO.github.io/*
https://TU-USUARIO.github.io/appcalendario/*
```

**Ejemplo:**
```
https://felipegzr.github.io/*
https://felipegzr.github.io/appcalendario/*
```

⚠️ **Importante**:
- Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub
- El `/*` al final permite todas las páginas del dominio
- **NO uses** `file:///*` en producción (solo para desarrollo local)

##### 2️⃣ **API restrictions**

Selecciona: **Restrict key**

Habilita **solo estas APIs**:

- ✅ **Maps JavaScript API**
- ✅ **Places API (New)** ← OBLIGATORIA para autocompletado
- ✅ **Geocoding API**
- ❌ Directions API (opcional, solo si usas rutas)
- ❌ Distance Matrix API (opcional, solo si usas distancias)

##### 3️⃣ Guardar

Click en **SAVE** al final de la página.

### Paso 3: Configurar API Key Local (Desarrollo)

Si quieres una key diferente para desarrollo local:

1. Crea otra API key
2. Application restrictions: **HTTP referrers**
3. Agrega:
   ```
   http://localhost/*
   http://127.0.0.1/*
   file:///*
   ```
4. API restrictions: Mismas que arriba
5. Usa esta key en `config.js` (no commiteado)

---

## 📁 Archivos de Configuración

### 1. `config.js` (Desarrollo Local - NO en Git)

```javascript
// Tu API key personal para desarrollo
window.APP_CONFIG = {
  googleMaps: {
    enabled: true,
    apiKey: 'TU_API_KEY_DE_DESARROLLO',
    // ...
  }
};
```

**Estado en Git**: ❌ Excluido por `.gitignore`

### 2. `config.public.js` (GitHub Pages - SÍ en Git)

```javascript
// API key restringida para GitHub Pages
window.APP_CONFIG = {
  googleMaps: {
    enabled: true,
    apiKey: 'AIzaSyCICyMcdM47lzTGq6hJgfwuEw_Gk8FCRNM', // Restringida
    // ...
  }
};
```

**Estado en Git**: ✅ Incluido, seguro con restricciones

**Restricciones aplicadas**:
- ✅ Solo funciona en `tu-usuario.github.io`
- ✅ Solo APIs específicas habilitadas
- ✅ Si alguien roba la key, no puede usarla en su dominio

### 3. `config.example.js` (Plantilla - SÍ en Git)

```javascript
// Plantilla para que otros desarrolladores configuren su propia key
window.APP_CONFIG = {
  googleMaps: {
    enabled: true,
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Placeholder
    // ...
  }
};
```

**Estado en Git**: ✅ Incluido como referencia

---

## ⚙️ Cómo Funciona

### Desarrollo Local

1. Abres `index.html` en tu navegador
2. Detecta que NO estás en `github.io`
3. Intenta cargar `config.js`
4. Si no existe, carga `config.public.js` (fallback)
5. Google Maps se carga con la API key disponible

```bash
# Primera vez (local)
$ cp config.example.js config.js
$ # Edita config.js con tu API key personal
$ # Abre index.html en el navegador
```

### GitHub Pages (Producción)

1. Usuario abre `https://tu-usuario.github.io/appcalendario`
2. Detecta que está en `github.io`
3. Carga `config.public.js` (único archivo disponible en Git)
4. Google Maps se carga con la API key restringida
5. ✅ Funciona porque el referrer coincide con las restricciones

### Si Alguien Roba tu API Key

1. Persona maliciosa copia tu API key de `config.public.js`
2. Intenta usarla en `https://su-sitio-web.com`
3. ❌ **Google rechaza la petición** porque el referrer no coincide
4. Error en consola: `RefererNotAllowedMapError`

---

## 📊 Monitoreo y Alertas

### Ver Uso de API en Google Cloud

1. Google Cloud Console → **APIs & Services** → **Dashboard**
2. Selecciona **Maps JavaScript API**
3. Ve gráficos de uso

### Configurar Alertas de Presupuesto

1. Google Cloud Console → **Billing** → **Budgets & alerts**
2. Click **CREATE BUDGET**
3. Configura:
   - Nombre: "Google Maps API - Alerta"
   - Budget amount: $20 USD/mes (ejemplo)
   - Threshold: 50%, 90%, 100%
4. Agrega tu email para recibir alertas

### Configurar Cuotas (Rate Limiting)

1. Google Cloud Console → **APIs & Services** → **Maps JavaScript API**
2. Click en **QUOTAS**
3. Ajusta límites:
   - Requests per day: 25,000 (gratis)
   - Requests per minute: 100

---

## 🚀 Guía Rápida de Setup

### Para ti (Desarrollo Local)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/appcalendario.git
cd appcalendario

# 2. Crear tu configuración local
cp config.example.js config.js

# 3. Editar config.js con tu API key personal
# nano config.js  # o usa tu editor favorito

# 4. Abrir en navegador
open index.html
```

### Para GitHub Pages (Deploy)

```bash
# 1. Asegúrate que config.public.js tiene la API key restringida
cat config.public.js | grep apiKey

# 2. Verifica que config.js NO esté en git
git status  # No debe aparecer config.js

# 3. Commit y push
git add .
git commit -m "Update config"
git push origin main

# 4. Espera unos minutos y verifica
# https://tu-usuario.github.io/appcalendario
```

---

## ❓ FAQ - Preguntas Frecuentes

### ¿Qué pasa si alguien roba mi API key de `config.public.js`?

**R:** No pueden usarla en otro dominio gracias a las restricciones de HTTP referrer. Solo funciona en tu GitHub Pages.

### ¿Puedo tener cuotas ilimitadas gratis?

**R:** No. Google Maps Platform tiene un crédito de $200 USD/mes. Después pagas. Configura alertas de presupuesto.

### ¿Necesito una tarjeta de crédito?

**R:** Sí, Google requiere una tarjeta de crédito para usar Google Maps Platform, incluso con el tier gratis.

### ¿Qué pasa si me paso de las cuotas gratuitas?

**R:** Google te cobrará. Configura alertas de presupuesto y límites de cuotas para evitarlo.

### ¿Puedo ocultar completamente la API key en frontend?

**R:** **NO**. En aplicaciones frontend (JavaScript puro), la API key siempre será visible. La única forma de ocultarla es usar un backend (Node.js, Python, etc.) que haga las peticiones a Google Maps.

### ¿Es seguro usar la API key en `config.public.js`?

**R:** **SÍ**, siempre y cuando:
1. ✅ Tengas restricciones de HTTP referrer configuradas
2. ✅ Solo habilites las APIs que necesitas
3. ✅ Configures alertas de presupuesto
4. ✅ Monitorees el uso regularmente

---

## 📚 Referencias Oficiales

- [Google Maps Platform - API Security Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Using API Keys](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions)
- [Billing and Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

---

## ✅ Checklist de Seguridad

Antes de hacer deploy a GitHub Pages:

- [ ] API key en `config.public.js` tiene restricciones de HTTP referrer
- [ ] Restricciones incluyen `https://TU-USUARIO.github.io/*`
- [ ] Solo APIs necesarias habilitadas (Maps JavaScript API, Places API, Geocoding API)
- [ ] `config.js` está en `.gitignore`
- [ ] `config.js` NO aparece en `git status`
- [ ] Alertas de presupuesto configuradas
- [ ] Límites de cuotas configurados
- [ ] Probado en local que funciona
- [ ] Probado en GitHub Pages que funciona

---

## 🎉 Conclusión

Con esta configuración:

✅ Tu app funciona en GitHub Pages
✅ Tu API key está protegida con restricciones
✅ Si alguien roba la key, no puede usarla en otro dominio
✅ Tienes alertas si alguien abusa del uso
✅ Tu `config.js` local nunca se sube a Git

**Recuerda**: La seguridad en frontend es limitada. Para máxima seguridad, usa un backend que oculte las API keys.
