# 📖 LEE ESTO PRIMERO - Calendario Inteligente

## 🎯 ¿Por Qué las APIs No Funcionan?

Si las **sugerencias de Google Maps** no aparecen o el **tráfico** no se calcula, es porque:

1. ❌ **Backend no está instalado/corriendo** → Necesitas ejecutar `npm install` y `npm start`
2. ❌ **APIs no habilitadas** → Debes habilitar 5 APIs en Google Cloud Console
3. ❌ **Restricciones incorrectas** → La API Key necesita configuración específica

---

## ⚡ Solución Rápida (15 minutos)

### Lee este archivo:

**[📄 SOLUCION-PROBLEMA-APIS.md](SOLUCION-PROBLEMA-APIS.md)**

Ese archivo tiene **TODOS los pasos detallados** con:
- ✅ Comandos exactos a ejecutar
- ✅ Screenshots de Google Cloud
- ✅ Troubleshooting completo
- ✅ Checklist para verificar

---

## 📚 Documentación Completa

Una vez que todo funcione, lee:

### 1. **Configuración Rápida**
[📄 CONFIGURACION-RAPIDA.md](CONFIGURACION-RAPIDA.md)
- Cómo iniciar backend
- Cómo configurar Google Cloud
- Comandos útiles

### 2. **Guía Completa de Funcionalidades**
[📄 COMPLETE-FEATURES-GUIDE.md](COMPLETE-FEATURES-GUIDE.md)
- Todas las funcionalidades implementadas
- Casos de uso
- Ejemplos prácticos
- Arquitectura técnica

### 3. **Funcionalidades Avanzadas**
[📄 GOOGLE-PLACES-ADVANCED-FEATURES.md](GOOGLE-PLACES-ADVANCED-FEATURES.md)
- Google Places Details
- Tráfico en tiempo real
- Optimización de rutas
- Lugares en ruta
- Alertas inteligentes

---

## 🚀 Inicio Rápido

### Terminal 1 - Backend:
```bash
cd backend
npm install  # Solo la primera vez
npm start    # Cada vez que uses la app
```

### Terminal 2 - Frontend:
```bash
python3 -m http.server 8000
```

### Navegador:
```
http://localhost:8000
```

---

## ✅ Checklist

Antes de decir "no funciona", verifica:

- [ ] Backend instalado (`backend/node_modules/` existe)
- [ ] Backend corriendo (`npm start`, puerto 3000)
- [ ] Archivo `backend/.env` existe
- [ ] 5 APIs habilitadas en Google Cloud Console
- [ ] Restricciones configuradas en API Key
- [ ] Navegador muestra: "✅ Google Maps JavaScript API cargada"

**Si TODO está marcado** → Funcionará perfectamente ✨

**Si algo NO está marcado** → Lee [SOLUCION-PROBLEMA-APIS.md](SOLUCION-PROBLEMA-APIS.md)

---

## 💡 Ayuda Rápida

### ¿Cómo sé si Google Maps está cargado?

1. Abre la app
2. Presiona **F12**
3. Ve a **Console**
4. Busca: `✅ Google Maps JavaScript API cargada`

**Si dice**: `ℹ️ Google Maps desactivado` → API Key no configurada

---

### ¿Cómo sé si el backend funciona?

1. Abre: http://localhost:3000
2. Deberías ver: `Cannot GET /`
3. Eso es **CORRECTO** (el backend está corriendo)

**Si no carga** → Backend no está corriendo

---

### ¿Las sugerencias son de Google o de OpenStreetMap?

**Google Places** (correcto ✅):
```
▼ Starbucks Coffee
  Av. Providencia 2133, Santiago
```

**Nominatim** (incorrecto ❌):
```
▼ Providencia, Santiago, Región Metropolitana,
  Chile, 7500000
```

Si ves el segundo, Google NO está funcionando.

---

## 🆘 ¿Necesitas Ayuda?

1. **Lee primero**: [SOLUCION-PROBLEMA-APIS.md](SOLUCION-PROBLEMA-APIS.md)
2. **Sigue TODOS los pasos**
3. **Si aún falla**, comparte:
   - Contenido de la consola (F12)
   - Salida del backend (`npm start`)
   - Errores de Google Cloud Console

---

## 🎉 Una Vez Configurado

Tendrás un calendario **completamente inteligente** con:

🗺️ Información de lugares en tiempo real
🚦 Cálculo de tráfico
🎯 Optimización automática de rutas
📍 Búsqueda de lugares en tu camino
⚠️ Alertas inteligentes
💰 Todo gratis (plan de Google: $200/mes)

**¡Vale la pena configurarlo!** 🚀

---

**Creado**: 9 de Octubre, 2025
**Última actualización**: 9 de Octubre, 2025
