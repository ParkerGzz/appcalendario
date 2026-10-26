// app.test.js - Pruebas de la API (node --test)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { normalizePhone, contactsFromCsv, generateSlots, nowLocal } from '../src/lib.js';

const TZ = 'America/Santiago';
let server, base, dir, cookie;

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-'));
  const app = createApp({
    db: openDb(':memory:'), uploadDir: path.join(dir, 'cv'),
    config: { adminPassword: 'secreto', companyName: 'Prueba', timeZone: TZ },
  });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); });

const req = (url, { method = 'GET', body, form, auth = true } = {}) => fetch(base + url, {
  method,
  headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth && cookie ? { cookie } : {}) },
  body: form ?? (body ? JSON.stringify(body) : undefined),
});

const tomorrow = () => {
  const d = new Date(`${nowLocal(TZ).slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

function application(fields, cv = true) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (cv) form.append('cv', new Blob(['%PDF-1.4 cv'], { type: 'application/pdf' }), 'mi cv.pdf');
  return form;
}

test('teléfonos y CSV', () => {
  assert.equal(normalizePhone('+56 9 1234 5678'), '56912345678');
  assert.equal(normalizePhone('9 1234 5678'), '56912345678');
  assert.equal(normalizePhone('56912345678'), '56912345678');
  assert.equal(normalizePhone('0054 11 5555 4444'), '541155554444');
  assert.deepEqual(contactsFromCsv('Nombre;Celular;Correo\n"Pérez; Ana";912345678;ana@x.cl\n\nLuis,,'), [
    { name: 'Pérez; Ana', phone: '912345678', email: 'ana@x.cl' },
    { name: 'Luis,,', phone: '', email: '' },
  ]);
  assert.equal(generateSlots({ dateFrom: '2026-11-02', dateTo: '2026-11-08', weekdays: [1, 3], start: '10:00', end: '11:00', duration: 30 }).length, 4);
});

test('el panel exige sesión', async () => {
  assert.equal((await req('/api/admin/jobs', { auth: false })).status, 401);
  assert.equal((await req('/api/admin/login', { method: 'POST', body: { password: 'mala' } })).status, 401);
  const res = await req('/api/admin/login', { method: 'POST', body: { password: 'secreto' } });
  assert.equal(res.status, 200);
  cookie = res.headers.get('set-cookie').split(';')[0];
  assert.equal((await req('/api/admin/me')).status, 200);
});

test('postulación completa: cargo, horario, CV, agenda y cupos', async () => {
  const job = await (await req('/api/admin/jobs', { method: 'POST', body: {
    title: 'Cajero', questions: [{ id: 'exp', label: 'Experiencia', type: 'select', options: 'Nada, Poca, Mucha', required: true }],
  } })).json();
  assert.deepEqual(job.questions[0].options, ['Nada', 'Poca', 'Mucha']);

  const bulk = await (await req('/api/admin/slots/bulk', { method: 'POST', body: {
    dateFrom: tomorrow(), dateTo: tomorrow(), weekdays: [0, 1, 2, 3, 4, 5, 6], start: '10:00', end: '11:00', duration: 30, capacity: 1, place: 'Oficina',
  } })).json();
  assert.equal(bulk.created, 2);

  const slots = await (await req('/api/slots', { auth: false })).json();
  assert.equal(slots.length, 2);

  const base = { job_id: job.id, name: 'Ana Pérez', email: 'ana@correo.cl', phone: '912345678', consent: 'si', answers: JSON.stringify({ exp: 'Poca' }), slot_id: slots[0].id };

  // Falta responder la pregunta obligatoria
  let res = await req('/api/applications', { method: 'POST', auth: false, form: application({ ...base, answers: '{}' }) });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /Experiencia/);

  res = await req('/api/applications', { method: 'POST', auth: false, form: application(base) });
  assert.equal(res.status, 201);
  const { token, status } = await res.json();
  assert.equal(status, 'agendado');

  // El horario quedó lleno
  assert.equal((await (await req('/api/slots', { auth: false })).json()).length, 1);
  res = await req('/api/applications', { method: 'POST', auth: false, form: application({ ...base, email: 'otro@correo.cl' }) });
  assert.equal(res.status, 409);

  // Mismo correo al mismo cargo
  res = await req('/api/applications', { method: 'POST', auth: false, form: application({ ...base, slot_id: slots[1].id }) });
  assert.equal(res.status, 409);

  const info = await (await req(`/api/applications/${token}`, { auth: false })).json();
  assert.equal(info.slot.place, 'Oficina');
  assert.match(info.calendar, /calendar\.google\.com/);
  const ics = await (await req(`/api/applications/${token}/entrevista.ics`, { auth: false })).text();
  assert.match(ics, /DTSTART;TZID=America\/Santiago:\d{8}T100000/);

  // Cambiar de horario libera el anterior
  res = await req(`/api/applications/${token}/slot`, { method: 'POST', auth: false, body: { slot_id: slots[1].id } });
  assert.equal(res.status, 200);
  assert.equal((await (await req('/api/slots', { auth: false })).json())[0].id, slots[0].id);

  // El reclutador lo ve, con CV y WhatsApp
  const list = await (await req('/api/admin/candidates')).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].token, undefined);
  assert.match(list[0].whatsapp, /^https:\/\/wa\.me\/56912345678\?text=/);
  const cv = await req(`/api/admin/candidates/${list[0].id}/cv`);
  assert.equal(cv.status, 200);
  assert.equal(await cv.text(), '%PDF-1.4 cv');
  assert.equal((await req(`/api/admin/candidates/${list[0].id}/cv`, { auth: false })).status, 401);

  const csv = await (await req('/api/admin/export.csv')).text();
  assert.match(csv, /Ana Pérez;.*Poca/);
});

test('invitación masiva y postulación desde el link', async () => {
  const job = await (await req('/api/admin/jobs', { method: 'POST', body: { title: 'Bodeguero', cv_required: false } })).json();
  const res = await req('/api/admin/import', { method: 'POST', body: { job_id: job.id, csv: 'nombre;telefono\nLuis Soto;+56 9 8765 4321\nSin Fono;12\nLuis Repetido;987654321' } });
  const { created, skipped } = await res.json();
  assert.equal(created.length, 1);
  assert.equal(skipped.length, 2);
  assert.match(decodeURIComponent(created[0].whatsapp), /\?i=/);

  const inviteToken = new URL(created[0].link).searchParams.get('i');
  const inv = await (await req(`/api/invite/${inviteToken}`, { auth: false })).json();
  assert.equal(inv.name, 'Luis Soto');
  assert.equal(inv.job_id, job.id);

  const form = application({ invite: inviteToken, job_id: job.id, name: 'Luis Soto', email: 'luis@correo.cl', phone: '+56987654321', consent: 'si' }, false);
  const sent = await req('/api/applications', { method: 'POST', auth: false, form });
  assert.equal(sent.status, 201);
  assert.equal((await sent.json()).token, inviteToken);

  const again = await req('/api/applications', { method: 'POST', auth: false, form: application({ invite: inviteToken, job_id: job.id, name: 'X', email: 'x@x.cl', phone: '987654321', consent: 'si' }, false) });
  assert.equal(again.status, 409);
});

test('rechaza archivos que no son CV', async () => {
  const [job] = await (await req('/api/jobs', { auth: false })).json();
  const form = new FormData();
  form.append('job_id', job.id);
  form.append('cv', new Blob(['<script>'], { type: 'text/html' }), 'cv.html');
  const res = await req('/api/applications', { method: 'POST', auth: false, form });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /PDF o Word/);
});
