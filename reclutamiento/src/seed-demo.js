// seed-demo.js - Crea un cargo y horarios de ejemplo para probar la app
import path from 'node:path';
import { openDb } from './db.js';
import { generateSlots, nowLocal } from './lib.js';

const db = openDb(path.join(path.resolve(process.env.DATA_DIR || 'data'), 'reclutamiento.db'));
const timeZone = process.env.TIME_ZONE || 'America/Santiago';

if (db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n === 0) {
  db.prepare('INSERT INTO jobs (title, location, description, questions, cv_required) VALUES (?,?,?,?,?)').run(
    'Ejemplo: Asistente administrativo',
    'Santiago Centro',
    'Cargo de ejemplo. Edítalo o desactívalo desde el panel.',
    JSON.stringify([
      { id: 'experiencia', label: '¿Cuántos años de experiencia tienes en el área?', type: 'select', options: ['Sin experiencia', 'Menos de 1 año', '1 a 3 años', 'Más de 3 años'], required: true },
      { id: 'disponibilidad', label: '¿Tienes disponibilidad inmediata?', type: 'yesno', options: [], required: true },
      { id: 'renta', label: 'Pretensión de renta líquida', type: 'text', options: [], required: false },
    ]),
    1,
  );
  console.log('Cargo de ejemplo creado.');
}

const today = nowLocal(timeZone).slice(0, 10);
const inTwoWeeks = new Date(`${today}T00:00:00Z`);
inTwoWeeks.setUTCDate(inTwoWeeks.getUTCDate() + 14);
const times = generateSlots({
  dateFrom: today, dateTo: inTwoWeeks.toISOString().slice(0, 10),
  weekdays: [1, 2, 3, 4, 5], start: '10:00', end: '13:00', duration: 30,
});
const insert = db.prepare('INSERT OR IGNORE INTO slots (starts_at, duration_min, capacity, place) VALUES (?, 30, 1, ?)');
let n = 0;
for (const t of times) if (t > nowLocal(timeZone)) n += Number(insert.run(t, 'Oficina central').changes);
console.log(`${n} horarios de ejemplo creados.`);
