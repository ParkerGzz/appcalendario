# 🌐 Configurar API Key para GitHub Pages

## Problema
La API key de Google Maps no funciona desde GitHub Pages (celular) porque las **restricciones de HTTP referrer** están configuradas solo para `localhost`.

---

## ✅ Solución

### Paso 1: Ir a Google Cloud Console

1. Abre [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Selecciona tu proyecto
3. Busca tu API Key (la que termina en `...FCRNM`)
4. Haz clic en ella para editarla

### Paso 2: Configurar HTTP Referrers

En la sección **"Application restrictions"** → **"HTTP referrers"**, agrega:

```
http://localhost:*/*
http://127.0.0.1:*/*
file:///*
https://TU-USUARIO.github.io/*
https://*.github.io/*
```

**Reemplaza `TU-USUARIO`** con tu nombre de usuario de GitHub.

### Paso 3: Verificar APIs habilitadas

Asegúrate de tener habilitadas:
- ✅ Maps JavaScript API
- ✅ Places API (New)
- ✅ Geocoding API
- ✅ Directions API (opcional)
- ✅ Distance Matrix API (opcional)

---

## 🚀 Deploy a GitHub Pages

### Opción A: Usar la API key directamente (Rápido)

Si tu repositorio es **privado** o no te importa exponer la API key:

```bash
# Asegúrate de que config.js tiene la API key
git add config.js
git commit -m "Update API key para GitHub Pages"
git push origin main
```

### Opción B: Usar variables de entorno (Seguro)

Si quieres mantener la API key privada:

1. **Crear archivo de configuración para producción:**

```bash
# Crear config.prod.js con tu API key
cp config.js config.prod.js
```

2. **Agregar a .gitignore:**

```
config.prod.js
```

3. **Usar GitHub Actions para build:**

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Create config with secret
        run: |
          echo "window.APP_CONFIG = { googleMaps: { apiKey: '${{ secrets.GOOGLE_MAPS_API_KEY }}', ... } };" > config.js

      - name: Build
        run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

4. **Agregar secret en GitHub:**
   - Ve a tu repositorio → Settings → Secrets → New repository secret
   - Nombre: `GOOGLE_MAPS_API_KEY`
   - Valor: Tu API key real

---

## 🧪 Probar en Celular

### Método 1: GitHub Pages
```
https://TU-USUARIO.github.io/appcalendario/
```

### Método 2: Acceso local en red

Si estás en la misma WiFi:

```bash
# En tu computadora
cd appcalendario
python3 -m http.server 8000

# En tu celular, abre:
http://IP-DE-TU-COMPUTADORA:8000
# Ejemplo: http://192.168.1.100:8000
```

Para saber tu IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

---

## ⚠️ Troubleshooting

### Error: "This API key is not authorized to use this service"

**Causa:** La API key tiene restricciones de dominio.

**Solución:**
1. Ve a Google Cloud Console
2. Edita la API key
3. Agrega `https://*.github.io/*` a los HTTP referrers
4. Espera 5 minutos para que se propague

### Error: "RefererNotAllowedMapError"

**Causa:** El dominio actual no está en la lista de referrers.

**Solución:**
1. Revisa la consola del navegador para ver el dominio exacto
2. Agrégalo a los HTTP referrers en Google Cloud Console

### Las direcciones no se autocompletan

**Causa:** Places API no está habilitada.

**Solución:**
1. Ve a [Google Cloud Console APIs](https://console.cloud.google.com/apis/library)
2. Busca "Places API (New)"
3. Haz clic en "Enable"

---

## 📝 Checklist Pre-Deploy

- [ ] API key configurada con HTTP referrers correctos
- [ ] Todas las APIs necesarias habilitadas
- [ ] Código commiteado y pusheado a GitHub
- [ ] GitHub Pages habilitado en Settings
- [ ] Probado en celular desde la URL de GitHub Pages

---

## 🔒 Seguridad: Límites de Uso

Para evitar abusos, configura **cuotas** en Google Cloud Console:

1. Ve a [Quotas](https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas)
2. Establece límites diarios:
   - Maps JavaScript API: 10,000 requests/day
   - Places API: 1,000 requests/day
   - Geocoding API: 2,000 requests/day

Esto evitará costos inesperados si alguien abusa de tu API key.

---

## 💡 Recomendación Final

Para **producción real**, considera:

1. **Backend Proxy**: Crear un servidor que maneje las llamadas a Google Maps
2. **API Key Server-Side**: La API key solo existe en el servidor
3. **Rate Limiting**: Limitar requests por IP
4. **Autenticación**: Solo usuarios autenticados pueden usar el servicio

Ejemplo de arquitectura:
```
Usuario → GitHub Pages → Tu Backend (Vercel/Heroku) → Google Maps API
```

Esto protege completamente tu API key y te da control total sobre el uso.
