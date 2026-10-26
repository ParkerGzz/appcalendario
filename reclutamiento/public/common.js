// common.js - Utilidades compartidas entre la postulación y el panel

export async function api(url, { method = 'GET', body, form } = {}) {
  const opts = { method, headers: {} };
  if (form) opts.body = form;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw Object.assign(new Error('Sin conexión. Revisa tu internet e intenta de nuevo.'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Ocurrió un error. Intenta de nuevo.'), { status: res.status });
  return data;
}

// Las fechas de los horarios son hora local de la oficina; se formatean en UTC para no desplazarlas
const asDate = (localIso) => new Date(`${localIso.slice(0, 10)}T12:00:00Z`);
const fmt = (opts) => new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', ...opts });

export const fmtDayLong = (iso) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(asDate(iso));
export const fmtWhen = (iso) => `${capitalize(fmtDayLong(iso))}, ${iso.slice(11, 16)} h`;
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

// Selector de día + hora. onChange recibe el horario elegido o null.
export function slotPicker({ daysEl, timesEl, placeEl, slots, onChange, excludeId }) {
  const byDay = new Map();
  for (const s of slots) {
    if (s.id === excludeId) continue;
    const day = s.starts_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(s);
  }
  let selectedDay = null;
  let selected = null;

  function renderTimes() {
    timesEl.replaceChildren(...(byDay.get(selectedDay) ?? []).map((s) => el('button', {
      type: 'button', class: 'time', 'aria-pressed': String(selected?.id === s.id), text: s.starts_at.slice(11, 16),
      onclick: () => { selected = s; renderTimes(); onChange(s); },
    })));
    if (placeEl) placeEl.textContent = selected?.place ? `Lugar: ${selected.place} · ${selected.duration_min} min` : '';
  }

  function renderDays() {
    daysEl.replaceChildren(...[...byDay.keys()].map((day) => {
      const d = asDate(day);
      return el('button', {
        type: 'button', class: 'day', 'aria-pressed': String(day === selectedDay),
        'aria-label': fmtDayLong(day),
        onclick: () => {
          selectedDay = day;
          if (selected && selected.starts_at.slice(0, 10) !== day) { selected = null; onChange(null); }
          renderDays(); renderTimes();
        },
      },
      el('span', { class: 'dow', text: fmt({ weekday: 'short' }).format(d).replace('.', '') }),
      el('span', { class: 'num', text: fmt({ day: 'numeric' }).format(d) }),
      el('span', { class: 'mon', text: fmt({ month: 'short' }).format(d).replace('.', '') }));
    }));
  }

  selectedDay = byDay.keys().next().value ?? null;
  renderDays();
  renderTimes();
  return { isEmpty: byDay.size === 0, get selected() { return selected; } };
}

export async function copyText(text, input) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    input?.select();
    return false;
  }
}

export function toast(message) {
  const t = el('div', { class: 'toast', role: 'status', text: message });
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
