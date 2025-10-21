# 🚀 Deploy a GitHub Pages - Guía Completa

## 📋 Resumen Ejecutivo

Esta guía te llevará paso a paso para hacer deploy de tu Calendario Inteligente en GitHub Pages con Google Maps funcionando de forma segura.

---

## ⚡ Guía Rápida (10 minutos)

### 1️⃣ Configurar Google Cloud Console (5 min)

**🔗 Sigue esta guía**: [SETUP-GOOGLE-CLOUD.md](SETUP-GOOGLE-CLOUD.md)

**Resumen ultra-rápido**:
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita la API key: `AIzaSyCICyMcdM47lzTGq6hJgfwuEw_Gk8FCRNM`
3. Application restrictions → HTTP referrers
4. Agrega:
   ```
   https://parkergzz.github.io/*
   https://parkergzz.github.io/appcalendario/*
   ```
5. API restrictions → Restrict key → Habilita solo:
   - Maps JavaScript API
   - Places API (New)
   - Geocoding API
6. **SAVE** ← ¡Importante!

---

### 2️⃣ Verificar Archivos Locales (1 min)

```bash
cd /Users/felipegzr/Desktop/Codigos\ Python\ Chatgpt/appcalendario

# Verificar que config.js NO esté en Git
git status | grep config.js
# Si aparece, ¡DETENTE! No debe estar en Git

# Verificar que config.public.js SÍ esté listo para Git
git status | grep config.public.js
# Debe aparecer como "modified" o "new file"
```

---

### 3️⃣ Commit y Push a GitHub (2 min)

```bash
# Ver todos los cambios
git status

# Agregar todos los archivos nuevos/modificados
git add .

# Commit con mensaje descriptivo
git commit -m "feat: Add FAB for mobile and secure Google Maps config

- Implement Floating Action Button (FAB) for mobile devices
- Add config.public.js with restricted API key for GitHub Pages
- Auto-detect environment (localhost vs github.io)
- Add security documentation (GOOGLE-MAPS-SECURITY.md, SETUP-GOOGLE-CLOUD.md)
- Fix config.js loading issue (removed duplicate)
- config.js excluded from Git via .gitignore

✅ Ready for GitHub Pages deployment"

# Push a GitHub
git push origin main
```

---

### 4️⃣ Habilitar GitHub Pages (2 min)

1. Ve a tu repositorio en GitHub:
   ```
   https://github.com/parkergzz/appcalendario
   ```

2. Click en **Settings** (⚙️)

3. En el menú lateral, click en **Pages**

4. En **Source**, selecciona:
   - Branch: `main`
   - Folder: `/ (root)`

5. Click en **Save**

6. Espera 1-2 minutos

7. Verás un mensaje:
   ```
   ✅ Your site is live at https://parkergzz.github.io/appcalendario/
   ```

---

### 5️⃣ Verificar que Funciona (1 min)

1. Abre: https://parkergzz.github.io/appcalendario/

2. Abre la consola del navegador (F12)

3. Busca estos mensajes:
   ```
   ✅ Google Maps JavaScript API cargada
   📦 Cargando configuración: config.public.js
   📍 Google Maps: ✅ Habilitado
   ```

4. **Prueba crear una tarea con ubicación**:
   - Click en ➕ (FAB en móvil) o "Nueva Tarea" (desktop)
   - Escribe en el campo "Ubicación/Lugar": "Starbucks"
   - Deberías ver sugerencias de Google Places

5. **Si funciona**: ¡Éxito! 🎉

6. **Si NO funciona**: Ver sección de Troubleshooting abajo

---

## 🔍 Troubleshooting

### ❌ Error: "RefererNotAllowedMapError"

**Síntoma**: Mapa no carga, error en consola

**Causa**: Los referrers en Google Cloud Console no están configurados correctamente

**Solución**:
1. Ve a Google Cloud Console
2. Verifica que los referrers sean **exactamente**:
   ```
   https://parkergzz.github.io/*
   https://parkergzz.github.io/appcalendario/*
   ```
3. Nota: `https://` (con S), no `http://`
4. Guarda los cambios
5. Espera 2-3 minutos
6. Recarga la página (Ctrl+F5 o Cmd+Shift+R)

---

### ❌ Error: "404 - config.public.js not found"

**Síntoma**: Consola muestra error 404 al cargar config.public.js

**Causa**: El archivo no se subió a GitHub

**Solución**:
```bash
# Verificar que el archivo existe
ls -la config.public.js

# Agregarlo a Git
git add config.public.js

# Commit
git commit -m "Add config.public.js"

# Push
git push origin main

# Espera 1-2 minutos y recarga
```

---

### ❌ No aparecen sugerencias de lugares

**Síntoma**: Al escribir ubicación, no hay sugerencias

**Causa**: Places API (New) no está habilitada

**Solución**:
1. Google Cloud Console → API restrictions
2. Verifica que **Places API (New)** esté marcada
3. Si no está, márcala y guarda
4. Espera 2-3 minutos
5. Recarga la página

---

### ❌ GitHub Pages muestra página en blanco

**Síntoma**: https://parkergzz.github.io/appcalendario/ está en blanco

**Causa**: Archivo index.html no está en la raíz o hay error de JavaScript

**Solución**:
1. Verifica que `index.html` esté en la raíz del repo:
   ```bash
   ls -la index.html
   ```
2. Abre la consola del navegador (F12) y busca errores
3. Si hay errores de carga de archivos, verifica las rutas

---

## 📁 Estructura de Archivos en Git

### ✅ Archivos que DEBEN estar en Git:

```
appcalendario/
├── index.html                      ✅ Página principal
├── config.public.js                ✅ Config para GitHub Pages
├── config.example.js               ✅ Template para otros devs
├── styles-fab.css                  ✅ Estilos del FAB
├── fab.js                          ✅ JavaScript del FAB
├── SETUP-GOOGLE-CLOUD.md          ✅ Instrucciones Google Cloud
├── GOOGLE-MAPS-SECURITY.md        ✅ Documentación seguridad
├── DEPLOY-GITHUB-PAGES.md         ✅ Esta guía
├── FAB-IMPLEMENTATION.md          ✅ Docs del FAB
├── .gitignore                     ✅ Excluye config.js
└── (todos los demás archivos)     ✅
```

### ❌ Archivos que NO deben estar en Git:

```
appcalendario/
├── config.js                       ❌ Tu API key personal
├── .env                           ❌ Variables de entorno
└── node_modules/                  ❌ Dependencias
```

---

## 🔒 Seguridad - Checklist

Antes de hacer push a GitHub:

- [ ] `config.js` está en `.gitignore`
- [ ] `config.js` NO aparece en `git status`
- [ ] `config.public.js` tiene la API key con restricciones
- [ ] Google Cloud Console tiene los referrers de GitHub Pages
- [ ] Solo APIs necesarias habilitadas (Maps JS, Places, Geocoding)
- [ ] Alertas de presupuesto configuradas
- [ ] Límites de cuotas configurados

---

## 📊 Monitoreo Post-Deploy

### Verificar Uso de API

1. Ve a: https://console.cloud.google.com/apis/dashboard
2. Selecciona **Maps JavaScript API**
3. Revisa gráficos de uso
4. Si ves picos inesperados, investiga

### Configurar Alertas de Presupuesto

1. Ve a: https://console.cloud.google.com/billing/budgets
2. Crea un presupuesto de $10-20 USD/mes
3. Configura alertas al 50%, 90%, 100%
4. Agrega tu email

---

## 🎉 ¡Éxito!

Si llegaste hasta aquí y todo funciona, ¡felicidades! Tu Calendario Inteligente está funcionando en GitHub Pages con Google Maps de forma segura.

### Comparte tu trabajo:

```
🎉 Mi Calendario Inteligente está live!
🔗 https://parkergzz.github.io/appcalendario/

✨ Características:
- 📱 Responsive con FAB para móvil
- 🗺️ Google Maps integrado
- 📍 Autocompletado de lugares
- 🔒 API key segura con restricciones
```

---

## 📚 Próximos Pasos (Opcional)

1. **Dominio Personalizado**:
   - Compra un dominio (ej: `calendario.com`)
   - Configúralo en GitHub Pages Settings
   - Actualiza los referrers en Google Cloud

2. **Analytics**:
   - Agrega Google Analytics
   - Monitorea uso y visitantes

3. **SEO**:
   - Agrega meta tags
   - Crea sitemap.xml
   - Optimiza imágenes

4. **PWA**:
   - Agrega manifest.json
   - Implementa Service Worker
   - Habilita instalación

---

## 🆘 Ayuda

Si algo no funciona:

1. **Lee los errores en consola** (F12)
2. **Verifica la configuración** en Google Cloud Console
3. **Espera 2-3 minutos** después de cambios
4. **Recarga con caché limpio** (Ctrl+F5 / Cmd+Shift+R)
5. **Revisa la documentación**:
   - [SETUP-GOOGLE-CLOUD.md](SETUP-GOOGLE-CLOUD.md)
   - [GOOGLE-MAPS-SECURITY.md](GOOGLE-MAPS-SECURITY.md)

---

**¡Buena suerte con tu deploy! 🚀**
