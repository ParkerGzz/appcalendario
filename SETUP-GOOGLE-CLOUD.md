# 🔧 Configuración Rápida de Google Cloud Console

## ⚡ Guía en 5 Minutos

### 🎯 Objetivo
Configurar tu API key de Google Maps para que funcione **solo** en `https://parkergzz.github.io`

---

## 📋 Pasos

### 1️⃣ Acceder a Google Cloud Console

🔗 **URL directa**: https://console.cloud.google.com/apis/credentials

- Inicia sesión con tu cuenta de Google
- Selecciona tu proyecto (o crea uno nuevo)

---

### 2️⃣ Localizar tu API Key

Busca en la lista de credenciales:

```
AIzaSyCICyMcdM47lzTGq6hJgfwuEw_Gk8FCRNM
```

Click en el **nombre de la API key** o en el ícono de editar (✏️)

---

### 3️⃣ Configurar Restricciones de Aplicación

En la sección **"Application restrictions"**:

1. Selecciona: **HTTP referrers (web sites)**

2. Click en **"ADD AN ITEM"**

3. Agrega estos referrers **exactamente como aparecen**:

```
https://parkergzz.github.io/*
```

4. Click en **"ADD AN ITEM"** nuevamente y agrega:

```
https://parkergzz.github.io/appcalendario/*
```

**✅ Resultado esperado:**

```
Application restrictions: HTTP referrers (web sites)
Website restrictions:
  ✓ https://parkergzz.github.io/*
  ✓ https://parkergzz.github.io/appcalendario/*
```

---

### 4️⃣ Configurar Restricciones de API

En la sección **"API restrictions"**:

1. Selecciona: **Restrict key**

2. En el dropdown, busca y marca **solo estas APIs**:

   - ✅ **Maps JavaScript API**
   - ✅ **Places API (New)**
   - ✅ **Geocoding API**

3. **Desmarca** todas las demás APIs

**✅ Resultado esperado:**

```
API restrictions: Restrict key
Selected APIs:
  ✓ Maps JavaScript API
  ✓ Places API (New)
  ✓ Geocoding API
```

---

### 5️⃣ Guardar Cambios

1. Scroll hasta abajo de la página
2. Click en **"SAVE"** (botón azul)
3. Espera la confirmación: "API key saved"

---

## ✅ Verificación

### Probar que funciona:

1. Abre tu sitio en GitHub Pages:
   ```
   https://parkergzz.github.io/appcalendario
   ```

2. Abre la consola del navegador (F12)

3. Deberías ver:
   ```
   ✅ Google Maps JavaScript API cargada
   ✅ config.public.js cargado
   ```

4. Si ves errores, verifica que los referrers estén exactamente como se indica arriba

---

## ❌ Solución de Problemas

### Error: "RefererNotAllowedMapError"

**Causa**: El referrer de HTTP no coincide con los configurados

**Solución**:
1. Verifica que los referrers en Google Cloud Console sean **exactamente**:
   ```
   https://parkergzz.github.io/*
   https://parkergzz.github.io/appcalendario/*
   ```
2. Nota: NO uses `http://` (sin S), debe ser `https://`
3. El `/*` al final es importante

### Error: "ApiNotActivatedMapError"

**Causa**: Alguna API necesaria no está habilitada

**Solución**:
1. Ve a "API restrictions"
2. Asegúrate que **Maps JavaScript API** y **Places API (New)** estén marcadas
3. Guarda los cambios

### Error: "ApiProjectMapError"

**Causa**: La API key no tiene un proyecto válido

**Solución**:
1. Asegúrate que tu proyecto tenga billing habilitado
2. Verifica que las APIs estén habilitadas en el proyecto

---

## 🔒 Seguridad - ¿Por qué esto es importante?

### Sin restricciones:
```
❌ Cualquiera puede usar tu API key
❌ Podrías tener cargos inesperados
❌ No hay control de uso
```

### Con restricciones:
```
✅ Solo funciona en parkergzz.github.io
✅ Solo las APIs que necesitas están habilitadas
✅ Si alguien roba tu key, no puede usarla
```

---

## 💰 Costos

### Cuota Gratuita de Google Maps Platform:

- **$200 USD/mes** en crédito gratuito
- **28,000** cargas de mapas gratis al mes
- **40,000** geocodificaciones gratis al mes

### Recomendación:

1. Configura alertas de presupuesto
2. Ve a: https://console.cloud.google.com/billing/budgets
3. Crea un presupuesto de $20 USD/mes
4. Configura alertas al 50%, 90%, 100%

---

## 📚 Links Útiles

- **Google Cloud Console**: https://console.cloud.google.com/
- **API Credentials**: https://console.cloud.google.com/apis/credentials
- **Billing**: https://console.cloud.google.com/billing
- **Documentación**: https://developers.google.com/maps/documentation

---

## ✅ Checklist Final

Antes de hacer deploy a GitHub Pages:

- [ ] API key configurada con restricciones de HTTP referrer
- [ ] Referrers incluyen `https://parkergzz.github.io/*`
- [ ] Solo 3 APIs habilitadas (Maps JavaScript, Places New, Geocoding)
- [ ] Cambios guardados en Google Cloud Console
- [ ] Alertas de presupuesto configuradas
- [ ] Probado en local que funciona
- [ ] Probado en GitHub Pages que funciona

---

## 🎉 ¡Listo!

Tu API key está configurada y lista para usar en GitHub Pages de forma segura.

**Recuerda**: Estos cambios pueden tardar unos minutos en aplicarse. Si no funciona inmediatamente, espera 2-3 minutos y recarga la página.
