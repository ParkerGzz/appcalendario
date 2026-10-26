// admin.js - Panel del reclutador: postulantes, agenda, cargos e invitaciones
import { api, el, fmtWhen, fmtDayLong, capitalize, copyText, toast } from './common.js';

const $ = (id) => document.getElementById(id);
const STATUS_LABELS = {
  pendiente: 'Sin completar', nuevo: 'Nuevo', agendado: 'Agendado',
  entrevistado: 'Entrevistado', seleccionado: 'Seleccionado', descartado: 'Descartado',
};
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const state = { jobs: [], candidates: [], filterStatus: '', config: {} };

const statusOf = (c) => (c.submitted_at ? c.status : 'pendiente');
const pill = (status) => el('span', { class: `pill ${status}`, text: STATUS_LABELS[status] });

function flash(target, message, kind = 'ok') {
  target.className = `alert ${kind}`;
  target.textContent = message;
  target.hidden = !message;
}

// Los 401 llevan a la pantalla de ingreso
async function call(url, opts) {
  try {
    return await api(url, opts);
  } catch (err) {
    if (err.status === 401) showLogin();
    throw err;
  }
}

// ---------- sesión ----------
function showLogin() {
  $('app').hidden = true;
  $('login').hidden = false;
  $('password').focus();
}

$('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/admin/login', { method: 'POST', body: { password: $('password').value } });
    $('password').value = '';
    $('login').hidden = true;
    await start();
  } catch (err) {
    flash($('login-error'), err.message, 'error');
  }
});

$('logout').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

// ---------- pestañas ----------
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => openTab(tab.dataset.tab)));

function openTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
  if (name === 'candidatos') loadCandidates();
  if (name === 'agenda') loadSlots();
  if (name === 'cargos') loadJobs();
  history.replaceState(null, '', `#${name}`);
}

// ---------- postulantes ----------
let searchTimer;
$('f-q').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadCandidates, 250); });
$('f-job').addEventListener('change', loadCandidates);

async function loadCandidates() {
  const params = new URLSearchParams();
  if ($('f-q').value.trim()) params.set('q', $('f-q').value.trim());
  if ($('f-job').value) params.set('job_id', $('f-job').value);
  $('export').href = `/api/admin/export.csv?${params}`;
  state.candidates = await call(`/api/admin/candidates?${params}`);
  renderCandidates();
}

function renderCandidates() {
  const counts = { '': state.candidates.length };
  for (const c of state.candidates) counts[statusOf(c)] = (counts[statusOf(c)] ?? 0) + 1;
  $('f-status').replaceChildren(...['', ...Object.keys(STATUS_LABELS)].map((s) => el('button', {
    type: 'button', class: 'count', 'aria-pressed': String(state.filterStatus === s),
    text: `${s ? STATUS_LABELS[s] : 'Todos'} · ${counts[s] ?? 0}`,
    onclick: () => { state.filterStatus = s; renderCandidates(); },
  })));

  const rows = state.candidates.filter((c) => !state.filterStatus || statusOf(c) === state.filterStatus);
  $('candidates-empty').hidden = rows.length > 0;
  $('candidates').replaceChildren(...rows.map((c) => el('tr', { class: 'clickable', onclick: () => openCandidate(c.id) },
    el('td', {}, el('div', { style: 'font-weight:600', text: c.name || '(sin nombre)' }),
      el('div', { class: 'muted small', text: c.email || (c.phone ? `+${c.phone}` : '') })),
    el('td', { text: c.job_title ?? '—' }),
    el('td', { class: 'num', text: c.slot_starts_at ? fmtWhen(c.slot_starts_at) : '—' }),
    el('td', {}, pill(statusOf(c))),
    el('td', { onclick: (e) => e.stopPropagation() }, el('div', { class: 'row', style: 'gap:6px;flex-wrap:nowrap' },
      c.whatsapp ? el('a', { class: 'btn small wa', href: c.whatsapp, target: '_blank', rel: 'noopener', text: 'WhatsApp' }) : null,
      c.has_cv ? el('a', { class: 'btn small', href: `/api/admin/candidates/${c.id}/cv`, text: 'CV' }) : null)))));
}

function openCandidate(id) {
  const c = state.candidates.find((x) => x.id === id);
  const job = state.jobs.find((j) => j.id === c.job_id);
  const answers = (job?.questions ?? []).filter((q) => c.answers[q.id]).map((q) => [q.label, c.answers[q.id]]);
  const fields = [
    ['Cargo', c.job_title], ['Correo', c.email], ['Celular', c.phone ? `+${c.phone}` : ''], ['RUT / documento', c.document_id],
    ['Comuna / ciudad', c.city], ['Entrevista', c.slot_starts_at ? `${fmtWhen(c.slot_starts_at)}${c.slot_place ? ` · ${c.slot_place}` : ''}` : 'Sin agendar'],
    ['Origen', c.source === 'import' ? 'Invitado desde lista' : 'Postuló por el link'], ...answers,
  ].filter(([, v]) => v);

  const status = el('select', { id: 'd-status' }, ...Object.entries(STATUS_LABELS).filter(([k]) => k !== 'pendiente')
    .map(([k, v]) => el('option', { value: k, text: v, selected: c.status === k })));
  const notes = el('textarea', { id: 'd-notes', maxlength: 3000, placeholder: 'Impresiones de la entrevista, próximos pasos…' });
  notes.value = c.notes;
  const msg = el('div', { class: 'alert', hidden: true, role: 'status' });
  const linkInput = el('input', { readonly: true, value: c.link, class: 'grow', 'aria-label': 'Link del candidato' });
  const confirmBox = el('div', { class: 'alert warn row', hidden: true },
    el('span', { class: 'grow', text: 'Se borrarán sus datos y su CV. No se puede deshacer.' }),
    el('button', { class: 'btn small danger', type: 'button', text: 'Sí, eliminar', onclick: async () => {
      await call(`/api/admin/candidates/${c.id}`, { method: 'DELETE' });
      $('cand-dialog').close();
      toast('Candidato eliminado');
      loadCandidates();
    } }));

  $('cand-body').replaceChildren(
    el('div', { class: 'row' }, el('h2', { class: 'grow', text: c.name || '(sin nombre)' }), pill(statusOf(c))),
    !c.submitted_at ? el('p', { class: 'alert warn', text: 'Invitado, aún no completa su postulación. Reenvíale su link por WhatsApp.' }) : null,
    el('dl', { class: 'summary' }, ...fields.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
    el('div', { class: 'row' },
      c.whatsapp ? el('a', { class: 'btn wa', href: c.whatsapp, target: '_blank', rel: 'noopener', text: 'Escribir por WhatsApp' }) : null,
      c.has_cv ? el('a', { class: 'btn', href: `/api/admin/candidates/${c.id}/cv`, text: `Descargar CV` }) : null),
    el('div', { class: 'row' }, linkInput, el('button', { class: 'btn', type: 'button', text: 'Copiar link',
      onclick: async () => toast((await copyText(c.link, linkInput)) ? 'Link copiado' : 'Selecciona el link y cópialo') })),
    c.submitted_at ? el('label', { class: 'field' }, 'Estado', status) : null,
    el('label', { class: 'field' }, 'Notas internas', notes),
    msg,
    confirmBox,
    el('div', { class: 'nav' },
      el('button', { class: 'btn danger', type: 'button', text: 'Eliminar', onclick: () => { confirmBox.hidden = false; } }),
      el('button', { class: 'btn', type: 'button', text: 'Cerrar', onclick: () => $('cand-dialog').close() }),
      el('button', { class: 'btn primary', type: 'button', text: 'Guardar', onclick: async () => {
        try {
          const body = { notes: notes.value };
          if (c.submitted_at) body.status = status.value;
          await call(`/api/admin/candidates/${c.id}`, { method: 'PATCH', body });
          $('cand-dialog').close();
          toast('Cambios guardados');
          loadCandidates();
        } catch (err) { flash(msg, err.message, 'error'); }
      } })),
  );
  $('cand-dialog').showModal();
}

// ---------- agenda ----------
function setupSlotForm() {
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const plus = new Date(today); plus.setDate(plus.getDate() + 13);
  $('s-from').value = iso(today);
  $('s-to').value = iso(plus);
  $('s-days').append(...[1, 2, 3, 4, 5, 6, 0].map((d) => el('label', { class: 'choice', style: 'padding:8px 12px' },
    el('input', { type: 'checkbox', value: d, checked: d >= 1 && d <= 5 }), el('span', { text: DAY_NAMES[d] }))));

  $('slot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { created, skipped } = await call('/api/admin/slots/bulk', { method: 'POST', body: {
        dateFrom: $('s-from').value, dateTo: $('s-to').value, start: $('s-start').value, end: $('s-end').value,
        duration: Number($('s-duration').value), capacity: Number($('s-capacity').value), place: $('s-place').value,
        weekdays: [...$('s-days').querySelectorAll('input:checked')].map((i) => Number(i.value)),
      } });
      flash($('slot-msg'), `${created} horarios creados${skipped ? ` (${skipped} ya existían o ya pasaron)` : ''}.`);
      loadSlots();
    } catch (err) { flash($('slot-msg'), err.message, 'error'); }
  });
}

async function loadSlots() {
  const slots = await call('/api/admin/slots');
  const byDay = new Map();
  for (const s of slots) {
    const day = s.starts_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(s);
  }
  $('slots-empty').hidden = slots.length > 0;
  $('slots').replaceChildren(...[...byDay].map(([day, list]) => {
    const taken = list.reduce((n, s) => n + s.taken, 0);
    return el('div', { class: 'day-group' },
      el('div', { class: 'row' }, el('h3', { class: 'grow', text: capitalize(fmtDayLong(day)) }),
        el('span', { class: 'muted small', text: `${taken} agendados` })),
      el('div', { class: 'slot-list' }, ...list.map((s) => el('div', { class: `slot${s.taken >= s.capacity ? ' full' : ''}` },
        el('div', { class: 't' }, el('span', { text: `${s.starts_at.slice(11, 16)} · ${s.duration_min} min` }),
          el('span', { class: 'muted small', text: `${s.taken}/${s.capacity}` })),
        s.place ? el('div', { class: 'who', text: s.place }) : null,
        ...s.people.map((p) => el('div', { class: 'who', text: `${p.name} · ${p.job ?? ''}` })),
        s.taken === 0 ? el('div', {}, el('button', { class: 'btn small danger', type: 'button', text: 'Quitar', onclick: async () => {
          try { await call(`/api/admin/slots/${s.id}`, { method: 'DELETE' }); loadSlots(); } catch (err) { toast(err.message); }
        } })) : null))));
  }));
}

// ---------- cargos ----------
async function loadJobs() {
  state.jobs = await call('/api/admin/jobs');
  $('jobs-empty').hidden = state.jobs.length > 0;
  $('jobs').replaceChildren(...state.jobs.map((j) => el('div', { class: 'card' },
    el('div', { class: 'row' }, el('h3', { class: 'grow', text: j.title }),
      el('span', { class: `pill ${j.active ? 'seleccionado' : 'pendiente'}`, text: j.active ? 'Activo' : 'Cerrado' })),
    j.location ? el('p', { class: 'muted small', text: j.location }) : null,
    el('p', { class: 'small', text: `${j.applicants} postulaciones · ${j.questions.length} preguntas${j.cv_required ? ' · pide CV' : ''}` }),
    el('div', {}, el('button', { class: 'btn small', type: 'button', text: 'Editar', onclick: () => openJob(j) })))));
  const options = state.jobs.map((j) => el('option', { value: j.id, text: j.title + (j.active ? '' : ' (cerrado)') }));
  const current = $('f-job').value;
  $('f-job').replaceChildren(el('option', { value: '', text: 'Todos los cargos' }), ...options.map((o) => o.cloneNode(true)));
  $('f-job').value = current;
  const currentImport = $('i-job').value;
  $('i-job').replaceChildren(...state.jobs.filter((j) => j.active).map((j) => el('option', { value: j.id, text: j.title })));
  if (currentImport) $('i-job').value = currentImport;
}

let editingJob = null;
function questionRow(q = { label: '', type: 'text', options: [], required: true }) {
  const opts = el('input', { type: 'text', class: 'opts', placeholder: 'Opciones separadas por coma', value: q.options.join(', '), hidden: q.type !== 'select' });
  const type = el('select', { class: 'q-type', 'aria-label': 'Tipo de respuesta', onchange: () => { opts.hidden = type.value !== 'select'; } },
    ...[['text', 'Texto corto'], ['textarea', 'Texto largo'], ['select', 'Opciones'], ['yesno', 'Sí / No']]
      .map(([v, t]) => el('option', { value: v, text: t, selected: q.type === v })));
  const row = el('div', { class: 'q-row', 'data-id': q.id ?? '' },
    el('input', { type: 'text', class: 'q-label', placeholder: 'Ej: ¿Tienes disponibilidad los fines de semana?', value: q.label, 'aria-label': 'Pregunta' }),
    type,
    el('label', { class: 'row small', style: 'gap:6px;flex-wrap:nowrap' }, el('input', { type: 'checkbox', class: 'q-req', checked: q.required }), 'Obligatoria'),
    el('button', { class: 'btn small danger', type: 'button', text: 'Quitar', onclick: () => row.remove() }),
    opts);
  return row;
}

function openJob(job) {
  editingJob = job ?? null;
  $('job-dialog-title').textContent = job ? 'Editar cargo' : 'Nuevo cargo';
  $('j-title').value = job?.title ?? '';
  $('j-location').value = job?.location ?? '';
  $('j-description').value = job?.description ?? '';
  $('j-cv').checked = job?.cv_required ?? true;
  $('j-active').checked = job?.active ?? true;
  $('j-questions').replaceChildren(...(job?.questions ?? []).map((q) => questionRow(q)));
  flash($('job-error'), '', 'error');
  $('job-dialog').showModal();
}

function setupJobForm() {
  $('new-job').addEventListener('click', () => openJob(null));
  $('add-q').addEventListener('click', () => $('j-questions').append(questionRow()));
  $('job-cancel').addEventListener('click', () => $('job-dialog').close());
  $('job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const questions = [...$('j-questions').children].map((row) => ({
      id: row.dataset.id || undefined,
      label: row.querySelector('.q-label').value,
      type: row.querySelector('.q-type').value,
      options: row.querySelector('.opts').value.split(','),
      required: row.querySelector('.q-req').checked,
    }));
    const body = {
      title: $('j-title').value, location: $('j-location').value, description: $('j-description').value,
      cv_required: $('j-cv').checked, active: $('j-active').checked, questions,
    };
    try {
      if (editingJob) await call(`/api/admin/jobs/${editingJob.id}`, { method: 'PUT', body });
      else await call('/api/admin/jobs', { method: 'POST', body });
      $('job-dialog').close();
      toast('Cargo guardado');
      loadJobs();
    } catch (err) { flash($('job-error'), err.message, 'error'); }
  });

  const link = `${location.origin}/`;
  $('public-link').value = link;
  $('copy-public').addEventListener('click', async () => toast((await copyText(link, $('public-link'))) ? 'Link copiado' : 'Selecciona el link y cópialo'));
  $('share-public').href = `https://wa.me/?text=${encodeURIComponent(`Estamos buscando personas para trabajar en ${state.config.companyName}. Postula y agenda tu entrevista aquí: ${link}`)}`;
}

// ---------- invitaciones ----------
function setupImport() {
  $('cc').textContent = `+${state.config.countryCode}`;
  $('i-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) $('i-csv').value = await file.text();
  });
  $('import-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Excel pega con tabulaciones; las pasamos a punto y coma
    const csv = $('i-csv').value.replace(/\t/g, ';');
    try {
      const { created, skipped } = await call('/api/admin/import', { method: 'POST', body: { job_id: Number($('i-job').value), csv } });
      flash($('import-msg'), `${created.length} invitaciones creadas.${skipped.length ? ` Omitidos: ${skipped.map((s) => `fila ${s.row} (${s.reason})`).join(', ')}.` : ''}`, skipped.length ? 'warn' : 'ok');
      $('import-result').hidden = created.length === 0;
      $('import-rows').replaceChildren(...created.map((c) => el('tr', {},
        el('td', { text: c.name || '(sin nombre)' }),
        el('td', { class: 'num', text: `+${c.phone}` }),
        el('td', {}, el('a', { class: 'btn small wa', href: c.whatsapp, target: '_blank', rel: 'noopener', text: 'Enviar por WhatsApp',
          onclick: (ev) => { ev.currentTarget.textContent = 'Abierto ✓'; } })))));
      if (created.length) $('i-csv').value = '';
    } catch (err) { flash($('import-msg'), err.message, 'error'); }
  });
}

// ---------- inicio ----------
let started = false;
async function start() {
  state.config = await api('/api/config');
  $('company').textContent = state.config.companyName;
  $('app').hidden = false;
  if (!started) {
    started = true;
    setupSlotForm();
    setupJobForm();
    setupImport();
  }
  await loadJobs();
  const tab = location.hash.slice(1);
  openTab(['candidatos', 'agenda', 'cargos', 'invitar'].includes(tab) ? tab : 'candidatos');
}

api('/api/admin/me').then(start).catch(showLogin);
