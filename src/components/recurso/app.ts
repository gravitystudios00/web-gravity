/**
 * Lógica de /recurso. Vistas: gate (datos) → survey (encuesta) → panel.
 * El código del usuario se guarda en localStorage (y llega por ?u= desde el
 * link de Cleo): con él se retoma todo lo generado.
 */
import { recurso, nudgeMessage } from '../../data/recurso';
import { renderMarkdown, plainText } from './md';

type Tipo = 'oferta' | 'avatar' | 'guion';
type Gen = { id: number; tipo: Tipo; formato: string | null; servicio: string | null; texto: string };
type Encuesta = {
  profesion: string;
  servicios: { nombre: string; estrella: boolean }[];
  ciudades: string[];
  pais: string;
  precio?: string | null;
  diferencial?: string | null;
};
type Estado = {
  nombre: string;
  encuesta: Encuesta | null;
  generaciones: Gen[];
  restantes: Record<Tipo, number>;
};

const KEY = 'g_recurso';
const root = document.querySelector<HTMLElement>('[data-recurso]')!;
const $ = <T extends HTMLElement = HTMLElement>(sel: string, el: ParentNode = root) => el.querySelector<T>(sel)!;
const views = {
  gate: $<HTMLFormElement>('[data-view="gate"]'),
  survey: $<HTMLFormElement>('[data-view="survey"]'),
  panel: $('[data-view="panel"]'),
};
const fatal = $('[data-fatal]');
const nudge = document.querySelector<HTMLDialogElement>('[data-nudge]')!;
const floating = document.querySelector<HTMLAnchorElement>('.rfloat')!;

let codigo = '';
let estado: Estado | null = null;
let generando = false;

const storage = {
  get: () => {
    try {
      return localStorage.getItem(KEY) || '';
    } catch {
      return '';
    }
  },
  set: (v: string) => {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  },
  flag: (k: string) => {
    try {
      if (localStorage.getItem(`${KEY}_${k}`)) return true;
      localStorage.setItem(`${KEY}_${k}`, '1');
    } catch {}
    return false;
  },
};

const track = (event: string, props: Record<string, unknown> = {}) => (window as any).gTrack?.(event, props);

/** Log en la base (copiar, cartel, WhatsApp…). No espera respuesta. */
function logEvento(evento: string, dato = '') {
  if (!codigo) return;
  fetch('/api/recurso/evento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: codigo, evento, dato, url: location.href.split('#')[0] }),
    keepalive: true,
  }).catch(() => {});
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/recurso/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Algo falló. Probá de nuevo.'), { status: res.status, data });
  return data;
}

function show(view: keyof typeof views) {
  for (const [k, el] of Object.entries(views)) el.hidden = k !== view;
  floating.hidden = view === 'gate';
}

function scrollToApp() {
  const top = root.getBoundingClientRect().top;
  if (top < 0 || top > innerHeight * 0.6) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* --- WhatsApp ------------------------------------------------------------- */

function waHref() {
  const e = estado?.encuesta;
  const estrella = e?.servicios.filter((s) => s.estrella).map((s) => s.nombre).join(' y ') || '';
  const msg = nudgeMessage(estado?.nombre || '', e?.profesion || '', estrella);
  return `https://wa.me/${root.dataset.phone}?text=${encodeURIComponent(msg)}`;
}

function refreshWa() {
  document.querySelectorAll<HTMLAnchorElement>('[data-wa]').forEach((a) => (a.href = waHref()));
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-wa]');
  if (!a) return;
  a.href = waHref();
  logEvento('whatsapp_click', a.dataset.wa);
  track('whatsapp_click', { source: `recurso_${a.dataset.wa}` });
  if (nudge.open) nudge.close();
});

/** El cartel sale una sola vez por momento (oferta, primer guion). */
function abrirCartel(momento: string) {
  if (storage.flag(`cartel_${momento}`)) return;
  refreshWa();
  setTimeout(() => {
    nudge.showModal();
    logEvento('cartel_visto', momento);
  }, 900);
}

document.querySelector('[data-nudge-close]')!.addEventListener('click', () => {
  nudge.close();
  logEvento('cartel_cerrado');
});
nudge.addEventListener('click', (e) => {
  if (e.target === nudge) nudge.close();
});

/* --- 1. Datos ------------------------------------------------------------- */

function fail(form: HTMLFormElement, input: HTMLElement | null, msg: string) {
  input?.setAttribute('aria-invalid', 'true');
  $('[data-error]', form).textContent = msg;
  input?.focus();
}

for (const form of [views.gate, views.survey]) {
  form.addEventListener('input', (e) => {
    (e.target as HTMLElement).removeAttribute('aria-invalid');
    $('[data-error]', form).textContent = '';
  });
}

views.gate.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = views.gate;
  const field = (n: string) => f.elements.namedItem(n) as HTMLInputElement;
  const nombre = field('nombre').value.trim();
  const email = field('email').value.trim();
  const code = (f.elements.namedItem('country') as HTMLSelectElement).value;
  let digits = field('telefono').value.replace(/[^\d]/g, '');
  if (code) digits = code + digits.replace(/^0+/, '');

  if (nombre.length < 2) return fail(f, field('nombre'), 'Escribí tu nombre.');
  if (digits.length < 8 || digits.length > 15) return fail(f, field('telefono'), 'Revisá el número de WhatsApp (con código de área).');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return fail(f, field('email'), 'Revisá el email.');

  const btn = $<HTMLButtonElement>('button[type="submit"]', f);
  btn.disabled = true;
  const v = (window as any).gVisitor || {};
  try {
    const r = await api<{ codigo: string }>('registro', {
      nombre,
      telefono: '+' + digits,
      email,
      website: field('website').value,
      utm: { source: v.utm_source, medium: v.utm_medium, campaign: v.utm_campaign, content: v.utm_content, term: v.utm_term },
      fbc: v.fbc,
      url: location.href.split('#')[0],
    });
    codigo = r.codigo;
    storage.set(codigo);
    estado = { nombre, encuesta: null, generaciones: [], restantes: { oferta: 2, avatar: 2, guion: recurso.guionesGratis } };
    track('recurso_registro');
    show('survey');
    scrollToApp();
  } catch (err: any) {
    fail(f, null, err.message);
  } finally {
    btn.disabled = false;
  }
});

/* --- 2. Encuesta ---------------------------------------------------------- */

const listServicios = $('[data-servicios]');
const listCiudades = $('[data-ciudades]');
const tplServicio = document.querySelector<HTMLTemplateElement>('[data-tpl-servicio]')!;
const tplCiudad = document.querySelector<HTMLTemplateElement>('[data-tpl-ciudad]')!;
const addServicio = $<HTMLButtonElement>('[data-add-servicio]');
const addCiudad = $<HTMLButtonElement>('[data-add-ciudad]');

function addRow(list: HTMLElement, tpl: HTMLTemplateElement, value = '', star = false) {
  const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
  li.querySelector('input')!.value = value;
  li.querySelector('.rstar')?.setAttribute('aria-pressed', String(star));
  list.append(li);
  updateAddButtons();
  return li;
}

function updateAddButtons() {
  addServicio.hidden = listServicios.children.length >= recurso.survey.maxServicios;
  addCiudad.hidden = listCiudades.children.length >= recurso.survey.maxCiudades;
  // Siempre queda al menos una fila: la única no se puede quitar.
  for (const list of [listServicios, listCiudades])
    list.querySelectorAll<HTMLButtonElement>('.rdel').forEach((b) => (b.hidden = list.children.length <= 1));
}

addServicio.addEventListener('click', () => addRow(listServicios, tplServicio).querySelector('input')!.focus());
addCiudad.addEventListener('click', () => addRow(listCiudades, tplCiudad).querySelector('input')!.focus());

views.survey.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('.rdel')) {
    t.closest('li')!.remove();
    updateAddButtons();
  }
  const star = t.closest<HTMLButtonElement>('.rstar');
  if (star) {
    const on = star.getAttribute('aria-pressed') !== 'true';
    const marcadas = listServicios.querySelectorAll('.rstar[aria-pressed="true"]').length;
    if (on && marcadas >= 2) {
      $('[data-error]', views.survey).textContent = 'Podés marcar hasta dos servicios estrella.';
      return;
    }
    star.setAttribute('aria-pressed', String(on));
    $('[data-error]', views.survey).textContent = '';
  }
});

function fillSurvey(e: Encuesta | null) {
  listServicios.replaceChildren();
  listCiudades.replaceChildren();
  const f = views.survey;
  if (e) {
    (f.querySelector(`input[name="profesion"][value="${e.profesion}"]`) as HTMLInputElement | null)?.click();
    e.servicios.forEach((s) => addRow(listServicios, tplServicio, s.nombre, s.estrella));
    e.ciudades.forEach((c) => addRow(listCiudades, tplCiudad, c));
    (f.elements.namedItem('pais') as HTMLSelectElement).value = e.pais;
    (f.elements.namedItem('precio') as HTMLInputElement).value = e.precio || '';
    (f.elements.namedItem('diferencial') as HTMLTextAreaElement).value = e.diferencial || '';
  } else {
    for (let i = 0; i < 3; i++) addRow(listServicios, tplServicio);
    addRow(listCiudades, tplCiudad);
  }
  updateAddButtons();
}

views.survey.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = views.survey;
  const profesion = (f.querySelector('input[name="profesion"]:checked') as HTMLInputElement | null)?.value;
  if (!profesion) return fail(f, f.querySelector('input[name="profesion"]'), 'Elegí tu especialidad.');

  const servicios = [...listServicios.children].map((li) => ({
    nombre: li.querySelector('input')!.value.trim(),
    estrella: li.querySelector('.rstar')!.getAttribute('aria-pressed') === 'true',
  }));
  const validos = servicios.filter((s) => s.nombre.length >= 2);
  if (!validos.length) return fail(f, listServicios.querySelector('input'), 'Agregá al menos un servicio.');
  if (!validos.some((s) => s.estrella))
    return fail(f, listServicios.querySelector('.rstar'), 'Marcá con ⭐ tu servicio estrella.');

  const ciudades = [...listCiudades.querySelectorAll('input')].map((i) => i.value.trim()).filter((c) => c.length >= 2);
  if (!ciudades.length) return fail(f, listCiudades.querySelector('input'), 'Escribí al menos una ciudad.');
  const paisEl = f.elements.namedItem('pais') as HTMLSelectElement;
  if (!paisEl.value) return fail(f, paisEl, 'Elegí tu país.');

  const enc: Encuesta = {
    profesion,
    servicios: validos,
    ciudades,
    pais: paisEl.value,
    precio: (f.elements.namedItem('precio') as HTMLInputElement).value.trim(),
    diferencial: (f.elements.namedItem('diferencial') as HTMLTextAreaElement).value.trim(),
  };
  const btn = $<HTMLButtonElement>('button[type="submit"]', f);
  btn.disabled = true;
  try {
    await api('encuesta', { u: codigo, ...enc });
    estado!.encuesta = enc;
    track('recurso_encuesta', { profesion });
    renderPanel();
    show('panel');
    scrollToApp();
  } catch (err: any) {
    fail(f, null, err.message);
  } finally {
    btn.disabled = false;
  }
});

$('[data-edit]').addEventListener('click', () => {
  fillSurvey(estado!.encuesta);
  show('survey');
  scrollToApp();
});

/* --- 3. Panel ------------------------------------------------------------- */

const steps = {
  oferta: $('[data-step="oferta"]'),
  avatar: $('[data-step="avatar"]'),
  guion: $('[data-step="guion"]'),
};
const guionList = $('[data-guiones]');
const tplGuion = document.querySelector<HTMLTemplateElement>('[data-tpl-guion]')!;
const selServicio = $<HTMLSelectElement>('[data-servicio]');

const ultimo = (tipo: Tipo) => [...(estado?.generaciones || [])].reverse().find((g) => g.tipo === tipo);

function renderPanel() {
  if (!estado) return;
  $('[data-nombre]').textContent = estado.nombre.split(/\s+/)[0];
  refreshWa();

  const oferta = ultimo('oferta');
  const avatar = ultimo('avatar');

  for (const tipo of ['oferta', 'avatar'] as const) {
    const el = steps[tipo];
    const gen = tipo === 'oferta' ? oferta : avatar;
    const locked = tipo === 'avatar' && !oferta;
    el.classList.toggle('is-locked', locked);
    el.classList.toggle('is-done', !!gen);
    el.querySelector<HTMLElement>('[data-locked]')?.toggleAttribute('hidden', !locked);
    const go = $<HTMLButtonElement>('[data-generate]', el);
    go.hidden = !!gen || locked;
    const out = $('[data-out]', el);
    out.hidden = !gen;
    if (gen) {
      $('[data-md]', el).innerHTML = renderMarkdown(gen.texto);
      $('[data-bar]', el).hidden = false;
      $<HTMLButtonElement>('[data-again]', el).hidden = estado.restantes[tipo] <= 0;
    }
  }

  // Guiones
  const g = steps.guion;
  const lockedG = !avatar;
  g.classList.toggle('is-locked', lockedG);
  g.classList.toggle('is-done', estado.generaciones.some((x) => x.tipo === 'guion'));
  $('[data-locked]', g).hidden = !lockedG;
  const sinGuiones = estado.restantes.guion <= 0;
  $('[data-guion-form]', g).hidden = lockedG || sinGuiones;
  $('[data-limit]', g).hidden = !sinGuiones;
  $('[data-left]', g).textContent = `(te quedan ${estado.restantes.guion} de ${recurso.guionesGratis})`;

  const servicios = estado.encuesta?.servicios || [];
  const actual = selServicio.value;
  selServicio.replaceChildren(
    ...[...servicios]
      .sort((a, b) => Number(b.estrella) - Number(a.estrella))
      .map((s) => new Option(`${s.estrella ? '⭐ ' : ''}${s.nombre}`, s.nombre))
  );
  if (servicios.some((s) => s.nombre === actual)) selServicio.value = actual;

  guionList.replaceChildren(
    ...estado.generaciones
      .filter((x) => x.tipo === 'guion')
      .reverse()
      .map((x, i) => guionCard(x, i === 0))
  );
}

function guionCard(g: Gen, open: boolean) {
  const el = tplGuion.content.firstElementChild!.cloneNode(true) as HTMLDetailsElement;
  el.open = open;
  el.dataset.genId = String(g.id);
  const titulo = g.texto.match(/^#\s*(.+)$/m)?.[1] || 'Guion';
  $('[data-title]', el).textContent = titulo;
  $('[data-meta]', el).textContent = `${recurso.formatos.find((f) => f.key === g.formato)?.label || ''} · ${g.servicio || ''}`;
  $('[data-md]', el).innerHTML = renderMarkdown(g.texto);
  return el;
}

/** Copiar, descargar PDF y regenerar (delegado: sirve para todos los bloques). */
root.addEventListener('click', async (e) => {
  const t = e.target as HTMLElement;
  const box = t.closest<HTMLElement>('.rguion, .rstep');
  if (!box) return;
  const genId = box.dataset.genId;
  const gen = genId
    ? estado?.generaciones.find((x) => String(x.id) === genId)
    : ultimo(box.dataset.step as Tipo);

  if (t.closest('[data-copy]') && gen) {
    await navigator.clipboard?.writeText(plainText(gen.texto)).catch(() => {});
    const b = t.closest<HTMLButtonElement>('[data-copy]')!;
    b.textContent = '¡Copiado!';
    setTimeout(() => (b.textContent = 'Copiar'), 1600);
    logEvento('copiar', gen.tipo);
  }
  if (t.closest('[data-print]') && gen) {
    const step = box.closest<HTMLElement>('.rstep')!;
    document.body.classList.add('is-printing');
    step.classList.add('is-printing');
    box.classList.add('is-printing');
    if (box instanceof HTMLDetailsElement) box.open = true;
    logEvento('descargar', gen.tipo);
    print();
  }
  if (t.closest('[data-again]')) {
    const tipo = box.dataset.step as Tipo;
    if (confirm('¿Generar una versión nueva? La anterior se reemplaza.')) generar(tipo);
  }
  const go = t.closest<HTMLButtonElement>('[data-generate]');
  if (go) generar(go.dataset.generate as Tipo);
});

addEventListener('afterprint', () => {
  document.body.classList.remove('is-printing');
  document.querySelectorAll('.is-printing').forEach((el) => el.classList.remove('is-printing'));
});

/* --- Generar (texto en vivo) ---------------------------------------------- */

async function generar(tipo: Tipo) {
  if (generando || !estado) return;
  generando = true;
  fatal.hidden = true;

  const step = steps[tipo];
  const go = $<HTMLButtonElement>('[data-generate]', step);
  const loading = $('[data-loading]', step);
  go.disabled = true;
  loading.hidden = false;

  const body: Record<string, unknown> = { u: codigo, tipo };
  let md: HTMLElement;
  let card: HTMLDetailsElement | null = null;
  if (tipo === 'guion') {
    body.formato = (root.querySelector('input[name="formato"]:checked') as HTMLInputElement).value;
    body.servicio = selServicio.value;
    card = guionCard({ id: 0, tipo, formato: body.formato as string, servicio: body.servicio as string, texto: '' }, true);
    $('[data-title]', card).textContent = 'Escribiendo…';
    $('[data-bar]', card).hidden = true;
    guionList.prepend(card);
    guionList.querySelectorAll<HTMLDetailsElement>('.rguion').forEach((d) => d !== card && (d.open = false));
    md = $('[data-md]', card);
  } else {
    const out = $('[data-out]', step);
    out.hidden = false;
    $('[data-bar]', step).hidden = true;
    md = $('[data-md]', step);
    md.innerHTML = '';
  }
  md.classList.add('is-streaming');
  track('recurso_generar', { tipo });

  let texto = '';
  let frame = 0;
  const pintar = () => {
    frame = 0;
    md.innerHTML = renderMarkdown(texto);
  };

  try {
    const res = await fetch('/api/recurso/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      if (data.error === 'limite') {
        estado.restantes = data.restantes;
        throw new Error('Llegaste al límite gratis.');
      }
      throw new Error(data.error || 'No pudimos generarlo. Probá de nuevo.');
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let fin: any = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line) continue;
        const ev = JSON.parse(line);
        if (ev.d) {
          // Arranca a llegar texto: el aviso de espera ya no hace falta.
          loading.hidden = true;
          texto += ev.d;
          if (!frame) frame = requestAnimationFrame(pintar);
        } else if (ev.fin) fin = ev;
        else if (ev.error) throw new Error(ev.error);
      }
    }
    if (!fin) throw new Error('Se cortó la conexión. Probá de nuevo.');

    // Guardado: se reemplaza la versión anterior de oferta/avatar en la vista.
    const gen: Gen = {
      id: fin.id,
      tipo,
      formato: (body.formato as string) || null,
      servicio: (body.servicio as string) || null,
      texto,
    };
    if (tipo !== 'guion') estado.generaciones = estado.generaciones.filter((g) => g.tipo !== tipo);
    estado.generaciones.push(gen);
    estado.restantes = fin.restantes;
    md.classList.remove('is-streaming');
    renderPanel();
    track(`recurso_${tipo}_ok`);

    if (tipo === 'oferta') abrirCartel('oferta');
    if (tipo === 'guion' && estado.generaciones.filter((g) => g.tipo === 'guion').length === 1) abrirCartel('guion');
  } catch (err: any) {
    md.classList.remove('is-streaming');
    card?.remove();
    renderPanel();
    fatal.textContent = err.message;
    fatal.hidden = false;
    step.after(fatal);
  } finally {
    if (frame) cancelAnimationFrame(frame);
    loading.hidden = true;
    go.disabled = false;
    generando = false;
  }
}

/* --- Arranque ------------------------------------------------------------- */

async function iniciar() {
  const q = new URLSearchParams(location.search);
  const desdeLink = q.get('u');
  if (desdeLink && /^[a-z0-9]{16}$/.test(desdeLink)) {
    storage.set(desdeLink);
    q.delete('u');
    const s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? `?${s}` : '') + location.hash);
  }
  codigo = storage.get();

  if (codigo) {
    try {
      estado = await api<Estado>(`estado?u=${codigo}`);
      if (desdeLink) logEvento('retomo', 'link');
      if (estado.encuesta) {
        renderPanel();
        show('panel');
      } else {
        fillSurvey(null);
        show('survey');
      }
      return;
    } catch {
      codigo = '';
    }
  }
  fillSurvey(null);
  show('gate');
}

iniciar();
