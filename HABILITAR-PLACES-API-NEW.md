# 🔧 Cómo Habilitar Places API (New) en Google Cloud Console

## ❌ Error Actual

```
You're calling a legacy API, which is not enabled for your project.
To get newer features and more functionality, switch to the Places API (New)
```

Este error significa que tu proyecto está intentando usar la **Places API (New)** pero no está habilitada en tu proyecto de Google Cloud.

---

## ✅ Solución: Habilitar Places API (New)

### Paso 1: Ir a Google Cloud Console

1. Abre tu navegador y ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google

### Paso 2: Seleccionar tu Proyecto

1. En la parte superior, haz clic en el selector de proyectos
2. Selecciona el proyecto que contiene tu API Key: `YOUR_GOOGLE_MAPS_API_KEY_HERE`

### Paso 3: Habilitar Places API (New)

1. **Opción A - Enlace directo:**
   - Ve directamente a: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
   - Haz clic en **"HABILITAR"** (ENABLE)

2. **Opción B - Búsqueda manual:**
   - En el menú lateral, ve a: **APIs y servicios** > **Biblioteca**
   - En el buscador, escribe: `Places API (New)`
   - Haz clic en **"Places API (New)"** (asegúrate que diga "New")
   - Haz clic en el botón **"HABILITAR"** (ENABLE)

### Paso 4: Verificar que la API está Habilitada

1. Ve a: **APIs y servicios** > **APIs y servicios habilitados**
2. Busca en la lista: **"Places API (New)"**
3. Debería aparecer con estado "Habilitado"

---

## 📋 Lista Completa de APIs Necesarias

Para que la aplicación funcione completamente, necesitas tener habilitadas estas APIs:

### ✅ APIs Requeridas (Frontend):

1. ✅ **Maps JavaScript API** - Para mostrar mapas
2. ✅ **Places API (New)** - Para autocompletado y detalles de lugares
3. ✅ **Geocoding API** - Para convertir direcciones en coordenadas

### ✅ APIs Opcionales (Backend):

4. ⚙️ **Routes API** - Para cálculo de rutas optimizadas
5. ⚙️ **Distance Matrix API** - Para tiempos de viaje con tráfico

---

## 🔑 Configurar Restricciones de la API Key

Después de habilitar las APIs, configura las restricciones:

### 1. Ir a Credenciales

1. Ve a: **APIs y servicios** > **Credenciales**
2. Encuentra tu API Key y haz clic en el ícono de editar (lápiz)

### 2. Restricciones de Aplicación

En **"Restricciones de aplicación"**, selecciona:
- **Referentes HTTP (sitios web)**

Agrega estos referentes permitidos:
```
http://localhost:*/*
http://127.0.0.1:*/*
file:///*
```

### 3. Restricciones de API

En **"Restricciones de la API"**, selecciona:
- **Restringir clave**

Marca SOLO estas APIs:
- ✅ Maps JavaScript API
- ✅ Places API (New)
- ✅ Geocoding API
- ✅ Routes API (opcional)
- ✅ Distance Matrix API (opcional)

### 4. Guardar Cambios

Haz clic en **"GUARDAR"** en la parte inferior.

⚠️ **IMPORTANTE:** Los cambios pueden tardar hasta 5 minutos en propagarse.

---

## 🧪 Probar la Aplicación

Después de habilitar las APIs y esperar 5 minutos:

1. Abre `index.html` en tu navegador
2. Recarga con **Ctrl + F5** (o Cmd + Shift + R en Mac)
3. Abre la consola del navegador (F12)
4. Deberías ver: `✅ Google Maps JavaScript API cargada`
5. Crea una tarea y escribe en "Ubicación/Lugar"
6. Deberías ver sugerencias de Google Places aparecer

---

## ❓ Si Aún No Funciona

Si después de habilitar las APIs sigues viendo errores:

### Error: "This API project is not authorized to use this API"

**Solución:**
1. Verifica que hayas habilitado **"Places API (New)"** (no la antigua "Places API")
2. Espera 5-10 minutos para que los cambios se propaguen
3. Limpia la caché del navegador (Ctrl + Shift + Delete)
4. Recarga la página

### Error: "API key not valid"

**Solución:**
1. Verifica que la API Key en `config.js` sea correcta
2. Verifica que las restricciones de HTTP referrer incluyan `localhost:*/*`
3. Verifica que "Places API (New)" esté en la lista de APIs permitidas

### Error: "REQUEST_DENIED"

**Solución:**
1. Verifica que hayas guardado los cambios en Google Cloud Console
2. Espera 5-10 minutos
3. Verifica que tu cuenta no haya excedido las cuotas gratuitas

---

## 💰 Costos Estimados

Con uso moderado (50-100 búsquedas por día):

| API                  | Costo por 1000 requests | Estimado mensual |
|----------------------|-------------------------|------------------|
| Places API (New)     | $0.00                   | $0.00            |
| Autocomplete         | $2.83                   | ~$0.50           |
| Place Details        | $17.00                  | ~$1.00           |
| **TOTAL**            |                         | **~$1.50/mes**   |

🎁 **Google ofrece $200 USD gratis por mes**, así que no deberías pagar nada.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para ver errores específicos
2. Verifica que las APIs estén habilitadas en Google Cloud Console
3. Espera 5-10 minutos después de hacer cambios

---

## ✅ Checklist Final

- [ ] Habilité "Places API (New)" en Google Cloud Console
- [ ] Configuré las restricciones de HTTP referrer
- [ ] Configuré las restricciones de API
- [ ] Guardé los cambios
- [ ] Esperé 5 minutos
- [ ] Limpié la caché del navegador
- [ ] Recargar la página con Ctrl + F5
- [ ] Las sugerencias de Google Places aparecen correctamente

---

**Última actualización:** 2025-10-09
