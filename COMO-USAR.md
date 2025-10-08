# 🚀 Cómo Usar el Calendario Inteligente

## Paso 1: Abrir la Aplicación

### Opción A: Abrir directamente (más simple)
1. Ve a la carpeta `appcalendario`
2. Haz **doble clic** en el archivo `index.html`
3. Se abrirá en tu navegador predeterminado

### Opción B: Con servidor local (recomendado)

#### Si tienes Python instalado:
```bash
# En la terminal, navega a la carpeta
cd /Users/felipegzr/Desktop/Codigos\ Python\ Chatgpt/appcalendario

# Inicia el servidor
python3 -m http.server 8000

# Abre en el navegador:
# http://localhost:8000
```

#### Si tienes Node.js:
```bash
# Instala http-server (solo una vez)
npm install -g http-server

# Inicia el servidor
cd /Users/felipegzr/Desktop/Codigos\ Python\ Chatgpt/appcalendario
http-server -p 8000

# Abre: http://localhost:8000
```

#### Si tienes VS Code:
1. Instala la extensión **Live Server**
2. Haz clic derecho en `index.html`
3. Selecciona **"Open with Live Server"**

---

## Paso 2: Configurar Ubicaciones 📍

### 2.1 Configurar Casa
1. Busca la sección **"📍 Configurar Ubicaciones"** (primera sección)
2. En el campo **"Dirección de casa"**:
   - **Opción A - GPS**: Haz clic en **"📍 Detectar mi ubicación actual"**
     - Tu navegador pedirá permiso → Acepta
     - Espera unos segundos
     - Verás tu dirección y coordenadas aparecer

   - **Opción B - Escribir**: Escribe tu dirección
     ```
     Ejemplo: Av Paulista 1578, São Paulo
     ```
     - Después de escribir 3 letras, aparecerán **sugerencias**
     - Selecciona la correcta con el mouse o flechas ↑↓ + Enter

### 2.2 Configurar Trabajo
1. Repite el proceso para **"Dirección del trabajo"**
2. Usa GPS o escribe la dirección

### 2.3 Calcular Tiempos de Traslado
1. Una vez que tengas ambas direcciones configuradas
2. Haz clic en **"🚗 Calcular automáticamente"**
3. El sistema calculará:
   - Casa → Trabajo: X minutos
   - Trabajo → Casa: Y minutos
   - También puedes escribir los tiempos manualmente

### 2.4 Guardar
1. Haz clic en **"Guardar Ubicaciones"** (botón verde grande)
2. Verás un resumen de tu configuración abajo

**Ejemplo de configuración completa:**
```
🏠 Casa: Av. Providencia 1234, Santiago, Chile
💼 Trabajo: Av. Apoquindo 5678, Las Condes, Chile

Tiempos de traslado:
Casa → Trabajo: 25 minutos
Trabajo → Casa: 30 minutos

📏 Distancia: 8.5 km
```

---

## Paso 3: Configurar Horario Laboral ⏰

1. Busca la sección **"⏰ Configurar Horario Laboral"**
2. Ajusta tu horario:
   - **Hora de inicio**: `08:00` (o tu hora de entrada)
   - **Hora de fin**: `17:30` (o tu hora de salida)
3. Haz clic en **"Guardar Horario"**

**Verás información útil:**
```
Horario configurado:
Trabajo: 08:00 - 17:30 (9.50 horas)
Tiempo libre: Antes 8.00h | Después 6.50h

Considerando traslados:
Salir de casa a las 07:30 para llegar a tiempo
Llegada estimada a casa: 18:00
```

---

## Paso 4: Agregar Tareas ➕

1. Busca la sección **"➕ Añadir Nueva Tarea"**

### Ejemplo 1: Cita médica
```
Nombre: Cita con el doctor
Duración: 2 horas
Ubicación: Clínica Santa María
Dirección: Av. Santa María 500, Providencia
           (espera sugerencias al escribir)
Prioridad: Alta
Fecha límite: (selecciona una fecha)
```

### Ejemplo 2: Comprar verduras
```
Nombre: Comprar verduras
Duración: 0.75 horas (45 minutos)
Ubicación: Supermercado
Dirección: Jumbo Los Domínicos
Prioridad: Media
Fecha límite: (opcional)
```

### Ejemplo 3: Comprar remedios
```
Nombre: Comprar remedios en farmacia
Duración: 0.5 horas (30 minutos)
Ubicación: Farmacia Cruz Verde
Dirección: (cerca del supermercado anterior)
Prioridad: Media
```

2. Haz clic en **"Añadir Tarea"**
3. La tarea aparecerá en la lista de **"Tareas sin asignar"**

---

## Paso 5: Ver Sugerencias Inteligentes 💡

La aplicación analiza tus tareas y te hace sugerencias automáticamente:

### Ejemplo de Sugerencias que Verás:

#### 🗺️ Tareas cercanas
```
Estas tareas están muy cerca una de otra (menos de 2km).
Puedes ahorrar 15 minutos haciéndolas el mismo día.

Tareas:
• Comprar verduras (0.75h) - Jumbo Los Domínicos
• Comprar remedios en farmacia (0.5h) - Farmacia Cruz Verde

Duración total: 1.25 horas

[Asignar "Comprar verduras"]  [Asignar "Comprar remedios"]
```

#### ⚠️ Tarea urgente
```
Esta tarea es urgente y debería hacerse lo antes posible.

Tareas:
• Cita con el doctor (2h)

[Asignar "Cita con el doctor" a Lun 7 Oct]
```

---

## Paso 6: Asignar Tareas al Calendario 📆

### Opción A: Aceptar Sugerencias
1. En el panel **"💡 Sugerencias Inteligentes"**
2. Haz clic en el botón verde de la sugerencia
3. La tarea se asignará automáticamente al mejor día

### Opción B: Asignar Manualmente
1. En **"Tareas sin asignar"**, busca tu tarea
2. Haz clic en **"Asignar a día"**
3. Ingresa la fecha en formato: `2025-10-07`
4. La tarea aparecerá en el calendario

---

## Paso 7: Ver y Gestionar el Calendario 📅

### Vista Semanal
- El calendario muestra de **Lunes a Domingo**
- Cada día tiene:
  - **Bloque rojo**: Tu horario de trabajo (💼 Trabajo 08:00-17:30)
  - **Bloques de colores**: Tus tareas asignadas
    - Rojo: Urgente
    - Naranja: Alta prioridad
    - Azul: Media prioridad
    - Verde: Baja prioridad

### Navegar entre Semanas
- **← Semana Anterior**: Ver semana pasada
- **Semana Siguiente →**: Ver próxima semana
- En el centro verás: `Lun 7 Oct - Dom 13 Oct`

### Editar Tareas Asignadas
- **Haz clic** en una tarea del calendario
- Se desasignará (volverá a "Tareas sin asignar")
- Puedes reasignarla a otro día

---

## Paso 8: Revisar Todas las Tareas 📋

En la sección **"📋 Todas las Tareas"** verás:

### Información Completa de Cada Tarea:
```
[Comprar verduras] [MEDIA]
⏱️ Duración: 0.75 hora(s)
📍 Ubicación: Supermercado
🗺️ Dirección: Jumbo Los Domínicos
🏠→📍 3.2km (≈6 min) | 💼→📍 5.8km (≈12 min)
✅ Asignada: Lun 7 Oct a las 18:30

[Desasignar] [Eliminar]
```

**Explicación de los íconos:**
- 🏠→📍: Distancia y tiempo desde tu casa
- 💼→📍: Distancia y tiempo desde tu trabajo
- ✅: Fecha y hora asignada

---

## Paso 9: Entender las Distancias

Cuando agregas una dirección específica a una tarea, la app te muestra:

```
🏠→📍 3.2km (≈6 min)    ← Desde tu casa
💼→📍 5.8km (≈12 min)   ← Desde tu trabajo
```

Esto te ayuda a decidir:
- **Si está cerca de casa**: Mejor hacerlo antes de ir al trabajo o después de volver
- **Si está cerca del trabajo**: Mejor hacerlo en el almuerzo o al salir
- **Si está lejos de ambos**: Planificar con más tiempo

---

## Ejemplo Completo de Uso 🎯

### Situación:
```
Trabajo: Lunes a Viernes, 8:00 - 17:30
Tengo que:
1. Cita doctor (2 horas) - importante
2. Comprar verduras (45 min)
3. Comprar remedios (30 min)
```

### Lo que hace la app:

1. **Detecta** que verduras y remedios están cerca
2. **Sugiere** agruparlos el mismo día → ahorras 15 min
3. **Calcula** que después del trabajo (18:00) tienes tiempo
4. **Propone**:
   - **Lunes**: Cita doctor (día con menos carga)
   - **Martes**: Comprar verduras + remedios (están cerca)

### Calendario Resultante:

```
LUNES 7
💼 Trabajo 08:00-17:30
🩺 Cita doctor 18:30-20:30 (2h)

MARTES 8
💼 Trabajo 08:00-17:30
🥬 Comprar verduras 18:30-19:15 (0.75h)
💊 Comprar remedios 19:20-19:50 (0.5h)
```

**Beneficios:**
- No haces todo el mismo día (evitas cansancio)
- Aprovechas que verduras/remedios están cerca
- Llegas a casa a las 20:00 máximo

---

## Tips y Trucos 💡

### 1. Autocompletado de Direcciones
- **Mínimo 3 letras** para que aparezcan sugerencias
- Usa **flechas ↑↓** para navegar
- Presiona **Enter** para seleccionar
- Presiona **Esc** para cerrar

### 2. Prioridades
- **Urgente**: Tareas críticas (se priorizan primero)
- **Alta**: Importantes pero no urgentes
- **Media**: Tareas normales
- **Baja**: Pueden esperar

### 3. Fechas Límite
- Si pones fecha límite, la app te alertará cuando esté cerca
- Sugerencias consideran deadlines

### 4. Persistencia
- Todo se guarda automáticamente en tu navegador
- Puedes cerrar y volver más tarde
- Tus datos están solo en tu computadora (privacidad total)

### 5. Permisos de Ubicación
Si el navegador pide permiso para tu ubicación:
- **Permitir** → Puedes usar GPS
- **Bloquear** → Debes escribir direcciones manualmente

---

## Solución de Problemas 🔧

### Problema: No aparecen sugerencias de direcciones
**Solución**:
- Verifica tu conexión a internet
- Espera medio segundo después de escribir
- Escribe al menos 3 caracteres

### Problema: "Error al calcular tiempo de traslado"
**Solución**:
- Verifica que ambas direcciones estén configuradas
- Verifica tu conexión a internet
- Ingresa los tiempos manualmente como alternativa

### Problema: Las tareas no se guardan
**Solución**:
- Verifica que no estés en modo "Privado/Incógnito"
- LocalStorage debe estar habilitado
- Intenta en otro navegador (Chrome, Firefox, Safari)

### Problema: Calendario no se ve bien en móvil
**Solución**:
- Usa modo horizontal en tu teléfono
- O usa una tableta/computadora (mejor experiencia)

---

## Navegadores Compatibles ✅

- ✅ **Chrome** 90+ (Recomendado)
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+
- ⚠️ Internet Explorer (No soportado)

---

## Próximos Pasos 🚀

Una vez que domines lo básico:
1. Experimenta con diferentes prioridades
2. Agrega más ubicaciones frecuentes
3. Usa fechas límite para planificar mejor
4. Observa cómo mejoran las sugerencias con más datos

---

## ¿Necesitas Ayuda? 🆘

Si tienes dudas o encuentras problemas:
1. Revisa esta guía de nuevo
2. Revisa el [README.md](README.md) para información técnica
3. Abre un issue en GitHub (si aplica)

---

**¡Feliz planificación! 📅✨**
