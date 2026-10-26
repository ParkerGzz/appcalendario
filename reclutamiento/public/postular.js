// postular.js - Flujo del candidato: cargo, datos, CV, horario, envío y confirmación
import { api, el, slotPicker, fmtWhen, copyText, toast } from './common.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const inviteToken = params.get('i');
const statusToken = params.get('t');
const STEP_COUNT = 5;

const state = { step: 0, jobs: [], job: null, slots: [], picker: null, file: null, config: {} };

function showError(msg, target = $('error')) {
  target.textContent = msg;
  target.hidden = !msg;
}

function fatal(msg) {
  $('loading').hidden = true;
  $('apply').hidden = true;
  $('fatal').textContent = msg;
  $('fatal').hidden = false;
}

// ---------- pasos ----------
function goTo(step) {
  state.step = step;
  document.querySelectorAll('[data-step]').forEach((s) => { s.hidden = Number(s.dataset.step) !== step; });
  [...$('steps').children].forEach((li, i) => {
    li.className = i < step ? 'done' : i === step ? 'current' : '';
    if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  $('back').hidden = step === 0 || (step === 1 && state.lockJob);
  $('next').textContent = step === STEP_COUNT - 1 ? 'Enviar postulación' : 'Continuar';
  showError('');
  if (step === 4) renderSummary();
  document.querySelector(`[data-step="${step}"]`).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function validateStep(step) {
  if (step === 0 && !state.job) return 'Elige un cargo.';
  if (step === 1) {
    if ($('name').value.trim().length < 3) return 'Escribe tu nombre completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('email').value.trim())) return 'Revisa tu correo electrónico.';
    if ($('phone').value.replace(/\D/g, '').length < 8) return 'Revisa tu número de celular.';
    for (const q of state.job.questions) {
      if (q.required && !answerFor(q)) return `Falta responder: ${q.label}`;
    }
  }
  if (step === 2 && state.job.cv_required && !state.file && !state.inviteHasCv) return 'Adjunta tu CV para continuar.';
  if (step === 3 && !state.picker.isEmpty && !state.picker.selected) return 'Elige un día y una hora.';
  if (step === 4 && !$('consent').checked) return 'Marca la casilla para aceptar el uso de tus datos.';
  return '';
}

// ---------- cargo y preguntas ----------
function renderJobs() {
  $('no-jobs').hidden = state.jobs.length > 0;
  $('jobs').replaceChildren(...state.jobs.map((job) => el('label', { class: 'choice' },
    el('input', {
      type: 'radio', name: 'job', value: job.id, checked: state.job?.id === job.id,
      onchange: () => selectJob(job),
    }),
    el('span', { class: 'job-option' },
      el('strong', { text: job.title }),
      job.location ? el('span', { class: 'muted small', text: job.location }) : null))));
}

function selectJob(job) {
  state.job = job;
  $('job-desc').textContent = job.description || '';
  $('cv-optional').hidden = job.cv_required;
  renderQuestions();
}

function renderQuestions() {
  $('questions').replaceChildren(...state.job.questions.map((q) => {
    const id = `q_${q.id}`;
    const label = q.label + (q.required ? '' : ' (opcional)');
    if (q.type === 'yesno') {
      return el('fieldset', { class: 'stack', style: 'border:0;padding:0;margin:0;gap:6px' },
        el('legend', { class: 'field', style: 'font-weight:600;padding:0;margin-bottom:6px', text: label }),
        el('div', { class: 'yesno' }, ...['Sí', 'No'].map((v) => el('label', { class: 'choice' },
          el('input', { type: 'radio', name: id, value: v }), el('span', { text: v })))));
    }
    if (q.type === 'select') {
      return el('label', { class: 'field' }, label,
        el('select', { id }, el('option', { value: '', text: 'Elige una opción' }),
          ...q.options.map((o) => el('option', { value: o, text: o }))));
    }
    const tag = q.type === 'textarea' ? 'textarea' : 'input';
    return el('label', { class: 'field' }, label, el(tag, { id, maxlength: 2000 }));
  }));
}

function answerFor(q) {
  if (q.type === 'yesno') return document.querySelector(`input[name="q_${q.id}"]:checked`)?.value ?? '';
  return document.getElementById(`q_${q.id}`)?.value.trim() ?? '';
}

// ---------- CV ----------
function setFile(file) {
  showError('');
  if (!file) return;
  const okType = /\.(pdf|docx?)$/i.test(file.name);
  if (!okType) return showError('El CV debe ser PDF o Word (.doc, .docx).');
  if (file.size > state.config.maxCvMb * 1024 * 1024) return showError(`El CV no puede pesar más de ${state.config.maxCvMb} MB.`);
  state.file = file;
  $('file-chip').replaceChildren(el('span', { 'aria-hidden': 'true', text: '📄' }),
    el('span', { class: 'grow', text: `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` }),
    el('button', { type: 'button', class: 'btn small', text: 'Quitar', onclick: () => { state.file = null; $('cv').value = ''; $('file-chip').hidden = true; } }));
  $('file-chip').hidden = false;
}

function setupDropzone() {
  const dz = $('dropzone');
  $('cv').addEventListener('change', (e) => setFile(e.target.files[0]));
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); setFile(e.dataTransfer.files[0]); });
}

// ---------- horario ----------
async function loadSlots() {
  state.slots = await api('/api/slots');
  state.picker = slotPicker({
    daysEl: $('days'), timesEl: $('times'), placeEl: $('slot-place'), slots: state.slots,
    onChange: () => showError(''),
  });
  $('no-slots').hidden = !state.picker.isEmpty;
}

function renderSummary() {
  const s = state.picker.selected;
  const rows = [
    ['Cargo', state.job.title],
    ['Nombre', $('name').value.trim()],
    ['Correo', $('email').value.trim()],
    ['Celular', $('phone').value.trim()],
    ['CV', state.file?.name ?? (state.inviteHasCv ? 'Ya enviado' : 'Sin CV')],
    ['Entrevista', s ? fmtWhen(s.starts_at) + (s.place ? ` · ${s.place}` : '') : 'Por coordinar'],
  ];
  $('summary').replaceChildren(...rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));
}

// ---------- envío ----------
async function submit() {
  const form = new FormData();
  if (inviteToken) form.append('invite', inviteToken);
  form.append('job_id', state.job.id);
  for (const f of ['name', 'document_id', 'email', 'phone', 'city']) form.append(f, $(f).value.trim());
  form.append('answers', JSON.stringify(Object.fromEntries(state.job.questions.map((q) => [q.id, answerFor(q)]))));
  if (state.picker.selected) form.append('slot_id', state.picker.selected.id);
  form.append('consent', 'si');
  if (state.file) form.append('cv', state.file);

  $('next').disabled = true;
  $('next').textContent = 'Enviando…';
  try {
    const { token } = await api('/api/applications', { method: 'POST', form });
    history.replaceState(null, '', `/?t=${token}`);
    await showStatus(token, true);
  } catch (err) {
    showError(err.message);
    // Si el horario se llenó, recargamos los disponibles y volvemos a ese paso
    if (err.status === 409 && /horario/i.test(err.message)) { await loadSlots(); goTo(3); showError(err.message); }
  } finally {
    $('next').disabled = false;
    if (state.step === STEP_COUNT - 1) $('next').textContent = 'Enviar postulación';
  }
}

// ---------- confirmación ----------
async function showStatus(token, justSubmitted = false) {
  const info = await api(`/api/applications/${encodeURIComponent(token)}`);
  $('loading').hidden = true;
  $('apply').hidden = true;
  $('status').hidden = false;
  const first = info.name.split(' ')[0];
  $('status-title').textContent = justSubmitted ? `¡Listo, ${first}!` : `Hola, ${first}`;
  $('status-sub').textContent = info.slot
    ? `Recibimos tu postulación a ${info.job}. Te esperamos en tu entrevista.`
    : `Recibimos tu postulación a ${info.job}. Te contactaremos para coordinar la entrevista.`;
  if (['seleccionado', 'descartado', 'entrevistado'].includes(info.status)) {
    $('status-sub').textContent = `Tu postulación a ${info.job} ya fue revisada. Te contactaremos con novedades.`;
  }

  $('ticket').hidden = !info.slot;
  $('cal-actions').hidden = !info.slot;
  if (info.slot) {
    $('when').textContent = fmtWhen(info.slot.starts_at);
    $('where').textContent = [info.slot.place, `${info.slot.duration_min} minutos`].filter(Boolean).join(' · ');
    $('gcal').href = info.calendar;
    $('ics').href = `/api/applications/${encodeURIComponent(token)}/entrevista.ics`;
  }

  const link = `${location.origin}/?t=${token}`;
  $('my-link').value = link;
  $('copy').onclick = async () => toast((await copyText(link, $('my-link'))) ? 'Link copiado' : 'Selecciona el link y cópialo');

  $('reschedule').hidden = !info.can_reschedule;
  if (info.can_reschedule) {
    const slots = await api('/api/slots');
    let picked = null;
    const picker = slotPicker({
      daysEl: $('r-days'), timesEl: $('r-times'), slots, excludeId: info.slot?.id,
      onChange: (s) => { picked = s; $('r-save').disabled = !s; showError('', $('r-error')); },
    });
    $('reschedule').querySelector('h3').textContent = info.slot ? '¿No puedes ese día?' : 'Elige el día de tu entrevista';
    $('r-none').hidden = !picker.isEmpty;
    $('r-save').hidden = picker.isEmpty;
    $('r-save').onclick = async () => {
      $('r-save').disabled = true;
      try {
        await api(`/api/applications/${encodeURIComponent(token)}/slot`, { method: 'POST', body: { slot_id: picked.id } });
        toast('Horario actualizado');
        await showStatus(token);
        scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        showError(err.message, $('r-error'));
        $('r-save').disabled = false;
      }
    };
  }
}

// ---------- inicio ----------
async function init() {
  state.config = await api('/api/config');
  $('company').textContent = state.config.companyName;
  document.title = `Postulación · ${state.config.companyName}`;
  document.querySelectorAll('.company-name').forEach((n) => { n.textContent = state.config.companyName; });
  $('max-mb').textContent = state.config.maxCvMb;

  if (statusToken) return showStatus(statusToken);

  state.jobs = await api('/api/jobs');
  if (inviteToken) {
    const inv = await api(`/api/invite/${encodeURIComponent(inviteToken)}`);
    if (inv.submitted) {
      fatal('Ya enviaste tu postulación con este link. Revisa el link de confirmación que guardaste, o contáctanos.');
      return;
    }
    $('name').value = inv.name;
    $('email').value = inv.email;
    $('phone').value = inv.phone ? `+${inv.phone}` : '';
    const job = state.jobs.find((j) => j.id === inv.job_id);
    if (job) { state.lockJob = true; selectJob(job); }
    if (inv.name) $('hello').textContent = `Hola ${inv.name.split(' ')[0]}, agenda tu entrevista`;
  }
  if (!state.job && state.jobs.length === 1) selectJob(state.jobs[0]);
  renderJobs();
  setupDropzone();
  await loadSlots();

  $('loading').hidden = true;
  $('apply').hidden = false;
  goTo(state.lockJob ? 1 : 0);

  $('back').addEventListener('click', () => goTo(Math.max(0, state.step - 1)));
  $('apply').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = validateStep(state.step);
    if (err) return showError(err);
    if (state.step < STEP_COUNT - 1) goTo(state.step + 1);
    else submit();
  });
}

init().catch((err) => fatal(err.message));
