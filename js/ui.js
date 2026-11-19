// Small helpers shared by the pages and the graphs: building elements, formatting numbers, controls.

/** h('div', {class: 'x', onclick: f}, child, ...): an element. Attributes 'html' and 'text' set its content. */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------------------------------------------------------------- numbers

const nf = (d) => new Intl.NumberFormat('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const cache = {};
/** A number with a thousands separator and d decimals: num(2945.4) is "2,945". */
export function num(x, d = 0) {
  if (!isFinite(x)) return '–';
  const f = cache[d] || (cache[d] = nf(d));
  return f.format(x).replace('-', '−');
}
/** A proportion as a percentage: pct(0.534) is "53%". */
export const pct = (x, d = 0) => `${num(100 * x, d)}%`;
/** A p-value as the lectures write it: P = 0.007, P = 0.04, P = 0.42, P < 0.001. */
export function pval(p) {
  if (!isFinite(p)) return 'P = –';
  if (p < 0.001) return 'P < 0.001';
  if (p < 0.01) return `P = ${p.toFixed(3)}`;
  if (p < 0.1) return `P = ${p.toFixed(3).replace(/0$/, '')}`;
  return `P = ${p.toFixed(2)}`;
}
/** The number part of pval(): "0.007" or "< 0.001". */
export function pnum(p) { const t = pval(p); return t.startsWith('P = ') ? t.slice(4) : t.slice(2); }
/** Plain text from a little HTML (for labels and aria). */
export const plain = (html) => String(html).replace(/<[^>]+>/g, '');

// ---------------------------------------------------------------- motion

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs step(t) for t from 0 to 1 over ms milliseconds (at once if motion is reduced). Returns a cancel function. */
export function animate(ms, step, done) {
  if (reducedMotion() || ms <= 0) { step(1); done && done(); return () => {}; }
  let stop = false;
  const t0 = performance.now();
  const frame = (now) => {
    if (stop) return;
    const t = Math.min(1, (now - t0) / ms);
    step(t);
    if (t < 1) requestAnimationFrame(frame);
    else if (done) done();
  };
  requestAnimationFrame(frame);
  return () => { stop = true; };
}
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// ---------------------------------------------------------------- controls for the graphs

let uid = 0;
/** A labelled slider: { el, input, value(), set(v) }. format(v) gives the text beside it. */
export function slider({ label, min, max, step = 1, value, format = (v) => String(v), oninput }) {
  const id = `ctl${++uid}`;
  const out = h('output', { for: id });
  const input = h('input', { type: 'range', id, min, max, step, value });
  const show = () => { out.textContent = format(Number(input.value)); };
  input.addEventListener('input', () => { show(); oninput && oninput(Number(input.value)); });
  show();
  const el = h('div', { class: 'ctl ctl-slider' }, h('label', { for: id }, label), input, out);
  return {
    el, input,
    value: () => Number(input.value),
    set(v) { input.value = v; show(); },
  };
}

/** A row of buttons, one of which is pressed: { el, value(), set(v) }. */
export function choice({ label, options, value, onchange }) {
  let current = value;
  const buttons = options.map((o) => h('button', {
    type: 'button', class: 'seg-btn', 'aria-pressed': String(o.value === value),
    onclick: () => { set(o.value); onchange && onchange(o.value); },
  }, o.text));
  function set(v) {
    current = v;
    options.forEach((o, i) => buttons[i].setAttribute('aria-pressed', String(o.value === v)));
  }
  const el = h('div', { class: 'ctl ctl-choice', role: 'group', 'aria-label': label },
    label ? h('span', { class: 'ctl-label' }, label) : null, h('div', { class: 'seg' }, buttons));
  return { el, value: () => current, set };
}

export function button(text, onclick, cls = '') {
  return h('button', { type: 'button', class: `btn ${cls}`.trim(), onclick }, text);
}

/** A line of figures under a graph: readout([['Mean', '130 lb'], ...]). Returns { el, set(items) }. */
export function readout(items = []) {
  const el = h('dl', { class: 'readout' });
  const set = (list) => {
    el.replaceChildren(...list.filter(Boolean).map(([k, v, cls]) => h('div', { class: cls || null }, h('dt', { html: k }), h('dd', { html: v }))));
  };
  set(items);
  return { el, set };
}

/** A short-lived message in a corner of the page. */
export function toast(text, ms = 2600) {
  let box = $('#toasts');
  if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: 'toast' }, text);
  box.append(t);
  setTimeout(() => t.remove(), ms);
}
