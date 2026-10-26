// lib.js - Funciones puras: teléfonos, CSV, preguntas, bloques horarios, calendario

const QUESTION_TYPES = ['text', 'textarea', 'select', 'yesno'];

// Deja el teléfono en formato internacional sin "+" (lo que pide wa.me).
// Números sin código de país reciben el código por defecto.
export function normalizePhone(raw, defaultCountryCode = '56') {
  const input = String(raw ?? '').trim();
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  if (input.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith(defaultCountryCode) && digits.length > 10) return digits;
  digits = digits.replace(/^0+/, '');
  return defaultCountryCode + digits;
}

export function whatsappLink(phone, text) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// CSV simple con comillas; acepta coma o punto y coma (Excel en español usa ";")
export function parseCsv(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

const HEADER_ALIASES = {
  name: ['nombre', 'name', 'nombre completo', 'candidato'],
  phone: ['telefono', 'teléfono', 'celular', 'phone', 'whatsapp', 'movil', 'móvil', 'fono'],
  email: ['email', 'correo', 'e-mail', 'mail', 'correo electronico', 'correo electrónico'],
};

// Convierte filas CSV en contactos. Si no hay encabezado reconocible asume nombre, teléfono, email.
export function contactsFromCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx >= 0) col[key] = idx;
  }
  const hasHeader = col.name !== undefined || col.phone !== undefined;
  const body = hasHeader ? rows.slice(1) : rows;
  const idx = hasHeader ? col : { name: 0, phone: 1, email: 2 };
  return body
    .map((r) => ({
      name: (r[idx.name] ?? '').trim(),
      phone: (r[idx.phone] ?? '').trim(),
      email: (r[idx.email] ?? '').trim(),
    }))
    .filter((c) => c.name || c.phone || c.email);
}

export function toCsv(rows) {
  const cell = (v) => {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Punto y coma para que Excel en español lo abra en columnas
  return '\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
}

// Limpia la lista de preguntas que define el reclutador para un cargo
export function sanitizeQuestions(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  return input
    .map((q, i) => {
      const label = String(q?.label ?? '').trim().slice(0, 200);
      const type = QUESTION_TYPES.includes(q?.type) ? q.type : 'text';
      let id = String(q?.id ?? '').replace(/[^a-z0-9_]/gi, '').slice(0, 40) || `p${i + 1}`;
      while (seen.has(id)) id += '_';
      seen.add(id);
      const options = type === 'select'
        ? (Array.isArray(q.options) ? q.options : String(q.options ?? '').split(','))
          .map((o) => String(o).trim()).filter(Boolean).slice(0, 20)
        : [];
      return { id, label, type, options, required: !!q?.required };
    })
    .filter((q) => q.label && (q.type !== 'select' || q.options.length));
}

// Valida las respuestas del candidato contra las preguntas del cargo
export function validateAnswers(questions, raw) {
  const answers = {};
  const errors = [];
  for (const q of questions) {
    const value = String(raw?.[q.id] ?? '').trim().slice(0, 2000);
    if (!value) {
      if (q.required) errors.push(`Falta responder: ${q.label}`);
      continue;
    }
    if (q.type === 'select' && !q.options.includes(value)) errors.push(`Opción no válida en: ${q.label}`);
    else if (q.type === 'yesno' && !['Sí', 'No'].includes(value)) errors.push(`Responde Sí o No en: ${q.label}`);
    else answers[q.id] = value;
  }
  return { answers, errors };
}

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''));
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v >= 0 && v < 24 * 60 ? v : null;
};

// Genera bloques de entrevista entre dos fechas, en los días de semana indicados
// (0 = domingo ... 6 = sábado), cada `duration` minutos entre `start` y `end`.
export function generateSlots({ dateFrom, dateTo, weekdays, start, end, duration }) {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(dateFrom ?? '') ? new Date(`${dateFrom}T00:00:00Z`) : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(dateTo ?? '') ? new Date(`${dateTo}T00:00:00Z`) : null;
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  const dur = Number(duration);
  if (!from || !to || isNaN(from) || isNaN(to) || to < from) throw new Error('Revisa el rango de fechas.');
  if (startMin === null || endMin === null || endMin <= startMin) throw new Error('La hora de término debe ser posterior a la de inicio.');
  if (!Number.isInteger(dur) || dur < 5 || dur > 480) throw new Error('La duración debe estar entre 5 y 480 minutos.');
  if ((to - from) / 86400000 > 120) throw new Error('El rango no puede superar 120 días.');
  const days = new Set((weekdays ?? []).map(Number));
  if (!days.size) throw new Error('Elige al menos un día de la semana.');

  const out = [];
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (!days.has(d.getUTCDay())) continue;
    const date = d.toISOString().slice(0, 10);
    for (let m = startMin; m + dur <= endMin; m += dur) {
      out.push(`${date}T${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
  }
  if (out.length > 2000) throw new Error('Son demasiados bloques de una vez (máximo 2000).');
  return out;
}

// "Hora local de la oficina" actual en formato YYYY-MM-DDTHH:MM
export function nowLocal(timeZone, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function addMinutes(localIso, minutes) {
  const d = new Date(`${localIso}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 16);
}

const compact = (localIso) => localIso.replace(/[-:]/g, '') + '00';

export function googleCalendarLink({ title, startsAt, durationMin, details, place, timeZone }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${compact(startsAt)}/${compact(addMinutes(startsAt, durationMin))}`,
    details: details ?? '',
    location: place ?? '',
    ctz: timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const icsText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);

export function icsEvent({ uid, title, startsAt, durationMin, details, place, timeZone }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//reclutamiento//entrevistas//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${timeZone}:${compact(startsAt)}`,
    `DTEND;TZID=${timeZone}:${compact(addMinutes(startsAt, durationMin))}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(details)}`,
    `LOCATION:${icsText(place)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function formatSlot(localIso, locale = 'es-CL') {
  const d = new Date(`${localIso}:00Z`);
  const date = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d);
  return `${date}, ${localIso.slice(11, 16)} h`;
}
