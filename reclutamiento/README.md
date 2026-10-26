# Reclutamiento

App web para recibir postulaciones y agendar entrevistas.

**El candidato** entra a un link (desde el celular o el computador), elige el cargo, completa sus datos y las preguntas del cargo, sube su CV y elige el día y la hora de su entrevista. Al terminar puede agregar la entrevista a Google Calendar o al calendario del iPhone/Outlook, y recibe un link para cambiar la hora si lo necesita.

**El reclutador** entra a `/admin` con contraseña y puede:

- **Postulantes**: ver la lista, filtrarla por cargo o estado, descargar CV, cambiar el estado (nuevo → agendado → entrevistado → seleccionado/descartado), dejar notas, escribir por WhatsApp con el mensaje listo y descargar todo en Excel (CSV).
- **Agenda**: abrir horarios de entrevista en bloque (ej: lunes a viernes de 9:00 a 13:00, cada 30 min) y ver quién viene en cada uno.
- **Cargos**: crear cargos con sus propias preguntas (texto, opciones o sí/no), definir si piden CV y compartir el link de postulación.
- **Invitar por WhatsApp**: pegar una lista desde Excel (nombre, teléfono, correo). Cada persona recibe su propio link con sus datos ya escritos, y un botón abre WhatsApp con el mensaje de invitación listo para enviar.

## Probarla en tu computador

Necesitas Node.js 22.13 o superior.

```bash
cd reclutamiento
npm install
cp .env.example .env      # y edita ADMIN_PASSWORD y COMPANY_NAME
npm run demo              # opcional: crea un cargo y horarios de ejemplo
npm start
```

- Postulación: http://localhost:3100
- Panel: http://localhost:3100/admin

## Publicarla en internet

Para que los candidatos la usen, la app tiene que estar en un servidor. Sirve cualquier servicio que corra Node.js **con disco persistente**, porque la base de datos (SQLite) y los CV se guardan en la carpeta `DATA_DIR`. Por ejemplo, Render (Web Service + Disk), Railway (con Volume), Fly.io (con Volume) o un VPS.

1. Comando de inicio: `npm start` (en la carpeta `reclutamiento`).
2. Variables: `ADMIN_PASSWORD`, `COMPANY_NAME`, `PUBLIC_URL` (la dirección pública) y `DATA_DIR` apuntando al disco persistente.
3. Usa HTTPS (estos servicios lo incluyen).

## Sobre WhatsApp

Los botones de WhatsApp abren un chat con el mensaje escrito (`wa.me`); tú tocas enviar. Es gratis y no necesita aprobación, pero se envía uno por uno. Si mandas muchos mensajes a personas que no te tienen guardado y te reportan, WhatsApp puede bloquear el número. Para envíos automáticos (por ejemplo, recordatorios el día antes) hay que conectar la API de WhatsApp Business (Cloud API de Meta), que requiere plantillas aprobadas y tiene costo por mensaje.

## Datos personales

La app guarda datos personales y CV. El candidato debe aceptar su uso antes de enviar. Desde el panel puedes eliminar a un candidato junto con su CV. Respalda la carpeta `DATA_DIR` y no la compartas.

## Pruebas

```bash
npm test
```
