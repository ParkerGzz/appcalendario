// app.js - API de postulación y panel del reclutador
import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUSES, tx, parseJob, parseCandidate, SLOT_USAGE_SQL } from './db.js';
import {
  normalizePhone, whatsappLink, contactsFromCsv, toCsv, sanitizeQuestions, validateAnswers,
  generateSlots, nowLocal, googleCalendarLink, icsEvent, formatSlot,
} from './lib.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const CV_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_HOURS = 12;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const newToken = () => crypto.randomBytes(18).toString('base64url');
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);

export function createApp({ db, uploadDir, config }) {
  const {
    adminPassword, sessionSecret = adminPassword, companyName = 'Reclutamiento',
    timeZone = 'America/Santiago', countryCode = '56', publicUrl = '', maxCvMb = 5,
  } = config;
  if (!adminPassword) throw new Error('Falta ADMIN_PASSWORD');
  fs.mkdirSync(uploadDir, { recursive: true });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => cb(null, newToken() + CV_TYPES[file.mimetype]),
    }),
    limits: { fileSize: maxCvMb * 1024 * 1024, files: 1, fields: 40 },
    fileFilter: (req, file, cb) => {
      if (CV_TYPES[file.mimetype]) cb(null, true);
      else cb(new HttpError(400, 'El CV debe ser PDF o Word (.doc, .docx).'));
    },
  });

  const baseUrl = (req) => (publicUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const inviteUrl = (req, token) => `${baseUrl(req)}/?i=${token}`;
  const statusUrl = (req, token) => `${baseUrl(req)}/?t=${token}`;

  // ---------- consultas ----------
  const q = {
    job: db.prepare('SELECT * FROM jobs WHERE id = ?'),
    activeJobs: db.prepare('SELECT * FROM jobs WHERE active = 1 ORDER BY title'),
    allJobs: db.prepare(`
      SELECT j.*, (SELECT COUNT(*) FROM candidates c WHERE c.job_id = j.id AND c.submitted_at IS NOT NULL) AS applicants
      FROM jobs j ORDER BY j.active DESC, j.created_at DESC`),
    slot: db.prepare(`${SLOT_USAGE_SQL} WHERE s.id = ?`),
    openSlots: db.prepare(`${SLOT_USAGE_SQL} WHERE s.starts_at > ? ORDER BY s.starts_at`),
    adminSlots: db.prepare(`${SLOT_USAGE_SQL} WHERE s.starts_at >= ? ORDER BY s.starts_at LIMIT 1000`),
    slotPeople: db.prepare(`
      SELECT c.slot_id, c.id, c.name, j.title AS job_title FROM candidates c
      LEFT JOIN jobs j ON j.id = c.job_id
      WHERE c.slot_id IS NOT NULL AND c.status != 'descartado'`),
    byToken: db.prepare('SELECT * FROM candidates WHERE token = ?'),
    byId: db.prepare('SELECT * FROM candidates WHERE id = ?'),
    dupEmail: db.prepare('SELECT id FROM candidates WHERE job_id = ? AND lower(email) = lower(?) AND submitted_at IS NOT NULL AND id != ?'),
  };

  function slotWithRoom(slotId, ignoreCandidateId = 0) {
    const slot = q.slot.get(slotId);
    if (!slot) throw new HttpError(400, 'Ese horario ya no existe. Elige otro.');
    if (slot.starts_at <= nowLocal(timeZone)) throw new HttpError(400, 'Ese horario ya pasó. Elige otro.');
    const mine = ignoreCandidateId && q.byId.get(ignoreCandidateId)?.slot_id === slot.id ? 1 : 0;
    if (slot.taken - mine >= slot.capacity) throw new HttpError(409, 'Ese horario se acaba de llenar. Elige otro.');
    return slot;
  }

  function interviewInfo(req, candidate) {
    const job = parseJob(q.job.get(candidate.job_id));
    const slot = candidate.slot_id ? q.slot.get(candidate.slot_id) : null;
    const title = `Entrevista ${job?.title ?? ''} - ${companyName}`.trim();
    const details = `Entrevista para ${job?.title ?? 'el cargo'} en ${companyName}.\nVer o cambiar horario: ${statusUrl(req, candidate.token)}`;
    return {
      job, slot, title, details,
      calendar: slot && googleCalendarLink({ title, startsAt: slot.starts_at, durationMin: slot.duration_min, details, place: slot.place, timeZone }),
    };
  }

  // ---------- público ----------
  app.get('/api/config', (req, res) => {
    res.json({ companyName, timeZone, maxCvMb, countryCode });
  });

  app.get('/api/jobs', (req, res) => {
    res.json(q.activeJobs.all().map(parseJob).map(({ id, title, location, description, questions, cv_required }) =>
      ({ id, title, location, description, questions, cv_required })));
  });

  app.get('/api/slots', (req, res) => {
    const slots = q.openSlots.all(nowLocal(timeZone))
      .filter((s) => s.taken < s.capacity)
      .map(({ id, starts_at, duration_min, place }) => ({ id, starts_at, duration_min, place }));
    res.json(slots);
  });

  app.get('/api/invite/:token', (req, res) => {
    const c = q.byToken.get(req.params.token);
    if (!c) throw new HttpError(404, 'Este link de invitación no es válido.');
    res.json({ name: c.name, email: c.email, phone: c.phone, job_id: c.job_id, submitted: !!c.submitted_at });
  });

  app.post('/api/applications', upload.single('cv'), (req, res) => {
    const file = req.file;
    try {
      const b = req.body;
      const invite = b.invite ? q.byToken.get(String(b.invite)) : null;
      if (b.invite && !invite) throw new HttpError(404, 'Este link de invitación no es válido.');
      if (invite?.submitted_at) throw new HttpError(409, 'Ya enviaste tu postulación. Revisa tu entrevista con el link de confirmación.');

      const job = parseJob(q.job.get(Number(b.job_id)));
      if (!job || !job.active) throw new HttpError(400, 'Elige un cargo disponible.');

      const data = {
        name: str(b.name, 120),
        document_id: str(b.document_id, 30),
        email: str(b.email, 160).toLowerCase(),
        phone: normalizePhone(str(b.phone, 30), countryCode),
        city: str(b.city, 80),
      };
      const errors = [];
      if (data.name.length < 3) errors.push('Escribe tu nombre completo.');
      if (!EMAIL_RE.test(data.email)) errors.push('Revisa tu correo electrónico.');
      if (data.phone.length < 10 || data.phone.length > 15) errors.push('Revisa tu teléfono (con código de país).');
      if (b.consent !== 'si') errors.push('Debes aceptar el uso de tus datos para el proceso.');
      if (job.cv_required && !file && !invite?.cv_file) errors.push('Adjunta tu CV.');

      let rawAnswers = {};
      try { rawAnswers = JSON.parse(b.answers || '{}'); } catch { errors.push('Respuestas inválidas.'); }
      const { answers, errors: answerErrors } = validateAnswers(job.questions, rawAnswers);
      errors.push(...answerErrors);
      if (errors.length) throw new HttpError(400, errors.join(' '));

      const token = invite?.token ?? newToken();
      const result = tx(db, () => {
        if (q.dupEmail.get(job.id, data.email, invite?.id ?? 0)) {
          throw new HttpError(409, 'Ya hay una postulación con este correo para este cargo.');
        }
        const slotId = b.slot_id ? slotWithRoom(Number(b.slot_id)).id : null;
        const status = slotId ? 'agendado' : 'nuevo';
        const values = [job.id, data.name, data.document_id, data.email, data.phone, data.city,
          JSON.stringify(answers), file?.filename ?? invite?.cv_file ?? null,
          file ? str(file.originalname, 200) : invite?.cv_name ?? null, slotId, status];
        if (invite) {
          db.prepare(`UPDATE candidates SET job_id=?, name=?, document_id=?, email=?, phone=?, city=?, answers=?,
            cv_file=?, cv_name=?, slot_id=?, status=?, submitted_at=datetime('now') WHERE id=?`).run(...values, invite.id);
        } else {
          db.prepare(`INSERT INTO candidates (job_id, name, document_id, email, phone, city, answers, cv_file, cv_name,
            slot_id, status, token, source, submitted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'web', datetime('now'))`).run(...values, token);
        }
        return { token, status };
      });
      res.status(201).json(result);
    } catch (err) {
      if (file) fs.rm(file.path, { force: true }, () => {});
      throw err;
    }
  });

  app.get('/api/applications/:token', (req, res) => {
    const c = q.byToken.get(req.params.token);
    if (!c || !c.submitted_at) throw new HttpError(404, 'No encontramos esta postulación.');
    const { job, slot, calendar } = interviewInfo(req, c);
    res.json({
      name: c.name,
      job: job?.title,
      status: c.status,
      slot: slot && { id: slot.id, starts_at: slot.starts_at, duration_min: slot.duration_min, place: slot.place },
      calendar,
      can_reschedule: ['nuevo', 'agendado'].includes(c.status),
    });
  });

  app.post('/api/applications/:token/slot', (req, res) => {
    const c = q.byToken.get(req.params.token);
    if (!c || !c.submitted_at) throw new HttpError(404, 'No encontramos esta postulación.');
    if (!['nuevo', 'agendado'].includes(c.status)) throw new HttpError(409, 'Tu postulación ya avanzó; para cambios contáctanos.');
    tx(db, () => {
      const slot = slotWithRoom(Number(req.body?.slot_id), c.id);
      db.prepare("UPDATE candidates SET slot_id = ?, status = 'agendado' WHERE id = ?").run(slot.id, c.id);
    });
    res.json({ ok: true });
  });

  app.get('/api/applications/:token/entrevista.ics', (req, res) => {
    const c = q.byToken.get(req.params.token);
    const info = c && interviewInfo(req, c);
    if (!info?.slot) throw new HttpError(404, 'Esta postulación no tiene entrevista agendada.');
    res.type('text/calendar').attachment('entrevista.ics').send(icsEvent({
      uid: `${c.token}-${info.slot.id}@reclutamiento`, title: info.title, startsAt: info.slot.starts_at,
      durationMin: info.slot.duration_min, details: info.details, place: info.slot.place, timeZone,
    }));
  });

  // ---------- sesión del reclutador ----------
  const sign = (value) => crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url');
  const readCookie = (req, name) => {
    const m = (req.headers.cookie ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`));
    return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
  };
  const safeEqual = (a, b) => {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
  };
  const isAdmin = (req) => {
    const [exp, sig] = readCookie(req, 'rec_admin').split('.');
    return !!exp && !!sig && Number(exp) > Date.now() && safeEqual(sig, sign(exp));
  };
  const cookieFlags = (req) => `Path=/; HttpOnly; SameSite=Strict${req.secure ? '; Secure' : ''}`;

  app.post('/api/admin/login', (req, res) => {
    if (!safeEqual(req.body?.password ?? '', adminPassword)) throw new HttpError(401, 'Contraseña incorrecta.');
    const exp = String(Date.now() + SESSION_HOURS * 3600 * 1000);
    res.set('Set-Cookie', `rec_admin=${exp}.${sign(exp)}; Max-Age=${SESSION_HOURS * 3600}; ${cookieFlags(req)}`);
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    res.set('Set-Cookie', `rec_admin=; Max-Age=0; ${cookieFlags(req)}`);
    res.json({ ok: true });
  });

  app.use('/api/admin', (req, res, next) => {
    if (!isAdmin(req)) throw new HttpError(401, 'Inicia sesión para continuar.');
    next();
  });

  app.get('/api/admin/me', (req, res) => res.json({ ok: true, companyName }));

  // ---------- cargos ----------
  function jobInput(body) {
    const title = str(body?.title, 120);
    if (title.length < 2) throw new HttpError(400, 'El cargo necesita un nombre.');
    return [title, str(body.location, 120), str(body.description, 3000),
      JSON.stringify(sanitizeQuestions(body.questions)), body.cv_required === false ? 0 : 1, body.active === false ? 0 : 1];
  }

  app.get('/api/admin/jobs', (req, res) => res.json(q.allJobs.all().map(parseJob)));

  app.post('/api/admin/jobs', (req, res) => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO jobs (title, location, description, questions, cv_required, active) VALUES (?,?,?,?,?,?)',
    ).run(...jobInput(req.body));
    res.status(201).json(parseJob(q.job.get(lastInsertRowid)));
  });

  app.put('/api/admin/jobs/:id', (req, res) => {
    const { changes } = db.prepare(
      'UPDATE jobs SET title=?, location=?, description=?, questions=?, cv_required=?, active=? WHERE id=?',
    ).run(...jobInput(req.body), Number(req.params.id));
    if (!changes) throw new HttpError(404, 'Cargo no encontrado.');
    res.json(parseJob(q.job.get(Number(req.params.id))));
  });

  // ---------- horarios ----------
  app.get('/api/admin/slots', (req, res) => {
    const people = new Map();
    for (const p of q.slotPeople.all()) {
      if (!people.has(p.slot_id)) people.set(p.slot_id, []);
      people.get(p.slot_id).push({ id: p.id, name: p.name, job: p.job_title });
    }
    const today = nowLocal(timeZone).slice(0, 10);
    res.json(q.adminSlots.all(today).map((s) => ({ ...s, people: people.get(s.id) ?? [] })));
  });

  app.post('/api/admin/slots/bulk', (req, res) => {
    const b = req.body ?? {};
    let times;
    try { times = generateSlots(b); } catch (err) { throw new HttpError(400, err.message); }
    const capacity = Math.min(Math.max(Number(b.capacity) || 1, 1), 50);
    const place = str(b.place, 200);
    const insert = db.prepare('INSERT OR IGNORE INTO slots (starts_at, duration_min, capacity, place) VALUES (?,?,?,?)');
    const now = nowLocal(timeZone);
    const created = tx(db, () => times.filter((t) => t > now)
      .reduce((n, t) => n + Number(insert.run(t, Number(b.duration), capacity, place).changes), 0));
    res.status(201).json({ created, skipped: times.length - created });
  });

  app.delete('/api/admin/slots/:id', (req, res) => {
    const slot = q.slot.get(Number(req.params.id));
    if (!slot) throw new HttpError(404, 'Horario no encontrado.');
    if (slot.taken > 0) throw new HttpError(409, 'Este horario tiene entrevistas agendadas. Muévelas o descártalas primero.');
    db.prepare('UPDATE candidates SET slot_id = NULL WHERE slot_id = ?').run(slot.id);
    db.prepare('DELETE FROM slots WHERE id = ?').run(slot.id);
    res.json({ ok: true });
  });

  // ---------- candidatos ----------
  function adminCandidate(req, row) {
    const c = parseCandidate(row);
    const job = c.job_title ?? '';
    const first = c.name.split(' ')[0] || '';
    let message;
    if (!c.submitted_at) {
      message = `Hola ${first}, te escribimos de ${companyName} por el cargo de ${job}. Completa tus datos y elige el día de tu entrevista aquí: ${inviteUrl(req, c.token)}`;
    } else if (c.slot_starts_at && c.status === 'agendado') {
      message = `Hola ${first}, te recordamos tu entrevista en ${companyName} para ${job} el ${formatSlot(c.slot_starts_at)}${c.slot_place ? ` en ${c.slot_place}` : ''}. Si necesitas cambiar la hora: ${statusUrl(req, c.token)}`;
    } else {
      message = `Hola ${first}, te escribimos de ${companyName} por tu postulación a ${job}.`;
    }
    return {
      ...c, token: undefined, cv_file: undefined, has_cv: !!c.cv_file,
      link: c.submitted_at ? statusUrl(req, c.token) : inviteUrl(req, c.token),
      whatsapp: whatsappLink(c.phone, message),
    };
  }

  const candidateSelect = `
    SELECT c.*, j.title AS job_title, s.starts_at AS slot_starts_at, s.duration_min AS slot_duration, s.place AS slot_place
    FROM candidates c LEFT JOIN jobs j ON j.id = c.job_id LEFT JOIN slots s ON s.id = c.slot_id`;

  function listCandidates(query) {
    const where = [];
    const args = [];
    if (query.job_id) { where.push('c.job_id = ?'); args.push(Number(query.job_id)); }
    if (query.status === 'pendiente') where.push('c.submitted_at IS NULL');
    else if (STATUSES.includes(query.status)) { where.push('c.status = ? AND c.submitted_at IS NOT NULL'); args.push(query.status); }
    if (query.q) {
      where.push('(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.document_id LIKE ?)');
      args.push(...Array(4).fill(`%${String(query.q).slice(0, 80)}%`));
    }
    const sql = `${candidateSelect} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY (c.submitted_at IS NULL), coalesce(s.starts_at, '9999'), c.created_at DESC LIMIT 2000`;
    return db.prepare(sql).all(...args);
  }

  app.get('/api/admin/candidates', (req, res) => {
    res.json(listCandidates(req.query).map((r) => adminCandidate(req, r)));
  });

  app.patch('/api/admin/candidates/:id', (req, res) => {
    const c = q.byId.get(Number(req.params.id));
    if (!c) throw new HttpError(404, 'Candidato no encontrado.');
    const status = req.body?.status ?? c.status;
    if (!STATUSES.includes(status)) throw new HttpError(400, 'Estado no válido.');
    const notes = req.body?.notes !== undefined ? str(req.body.notes, 3000) : c.notes;
    db.prepare('UPDATE candidates SET status = ?, notes = ? WHERE id = ?').run(status, notes, c.id);
    res.json(adminCandidate(req, db.prepare(`${candidateSelect} WHERE c.id = ?`).get(c.id)));
  });

  app.delete('/api/admin/candidates/:id', (req, res) => {
    const c = q.byId.get(Number(req.params.id));
    if (!c) throw new HttpError(404, 'Candidato no encontrado.');
    db.prepare('DELETE FROM candidates WHERE id = ?').run(c.id);
    if (c.cv_file) fs.rm(path.join(uploadDir, path.basename(c.cv_file)), { force: true }, () => {});
    res.json({ ok: true });
  });

  app.get('/api/admin/candidates/:id/cv', (req, res) => {
    const c = q.byId.get(Number(req.params.id));
    if (!c?.cv_file) throw new HttpError(404, 'Este candidato no tiene CV.');
    const ext = path.extname(c.cv_file);
    const safeName = `CV ${c.name}`.replace(/[^\p{L}\p{N} ._-]/gu, '').trim() + ext;
    res.download(path.join(uploadDir, path.basename(c.cv_file)), safeName);
  });

  app.get('/api/admin/export.csv', (req, res) => {
    const rows = listCandidates(req.query).map(parseCandidate);
    const jobs = new Map(q.allJobs.all().map(parseJob).map((j) => [j.id, j]));
    const questionLabels = new Map();
    for (const j of jobs.values()) for (const qq of j.questions) questionLabels.set(qq.id, qq.label);
    const qIds = [...questionLabels.keys()];
    const header = ['Nombre', 'Documento', 'Email', 'Teléfono', 'Ciudad', 'Cargo', 'Estado', 'Entrevista', 'Lugar', 'Notas', 'Postuló', ...qIds.map((id) => questionLabels.get(id))];
    const body = rows.map((c) => [
      c.name, c.document_id, c.email, c.phone ? `+${c.phone}` : '', c.city, c.job_title, c.submitted_at ? c.status : 'pendiente',
      c.slot_starts_at ? c.slot_starts_at.replace('T', ' ') : '', c.slot_place ?? '', c.notes, c.submitted_at ?? '',
      ...qIds.map((id) => c.answers[id] ?? ''),
    ]);
    res.type('text/csv').attachment('candidatos.csv').send(toCsv([header, ...body]));
  });

  // ---------- carga masiva ----------
  app.post('/api/admin/import', (req, res) => {
    const job = parseJob(q.job.get(Number(req.body?.job_id)));
    if (!job) throw new HttpError(400, 'Elige el cargo al que invitas.');
    const contacts = contactsFromCsv(req.body?.csv);
    if (!contacts.length) throw new HttpError(400, 'No encontramos contactos. Pega filas con nombre y teléfono.');
    if (contacts.length > 1000) throw new HttpError(400, 'Máximo 1000 contactos por carga.');

    const existing = new Set(db.prepare('SELECT phone FROM candidates WHERE job_id = ?').all(job.id).map((r) => r.phone));
    const insert = db.prepare(`INSERT INTO candidates (token, job_id, name, email, phone, source) VALUES (?,?,?,?,?, 'import')`);
    const skipped = [];
    const ids = tx(db, () => contacts.flatMap((c, i) => {
      const phone = normalizePhone(c.phone, countryCode);
      const email = EMAIL_RE.test(c.email) ? c.email.toLowerCase() : '';
      if (phone.length < 10 || phone.length > 15) { skipped.push({ row: i + 1, name: c.name, reason: 'Teléfono no válido' }); return []; }
      if (existing.has(phone)) { skipped.push({ row: i + 1, name: c.name, reason: 'Ya estaba invitado a este cargo' }); return []; }
      existing.add(phone);
      return [insert.run(newToken(), job.id, str(c.name, 120), email, phone).lastInsertRowid];
    }));
    const created = ids.map((id) => adminCandidate(req, db.prepare(`${candidateSelect} WHERE c.id = ?`).get(id)));
    res.status(201).json({ created, skipped });
  });

  // ---------- estáticos y errores ----------
  app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? `El CV no puede pesar más de ${maxCvMb} MB.` : 'No pudimos recibir el archivo.';
      return res.status(400).json({ error: msg });
    }
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Solicitud inválida.' });
    if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
    console.error('[error]', err);
    res.status(500).json({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
  });

  return app;
}
