// A few helpers for drawing graphs in SVG. Colours come from CSS classes (see css/base.css):
// f-<colour> fills, s-<colour> strokes, with colours ink, muted, hair, plum, blue, orange, green, red.

const NS = 'http://www.w3.org/2000/svg';

/** An SVG element, with attributes, added to parent if given. */
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

/** An <svg> of width w and height h (in its own units: it scales to its box), with a description. */
export function svg(w, h, label) {
  const s = el('svg', { viewBox: `0 0 ${w} ${h}`, class: 'chart', role: 'img', 'aria-label': label || null });
  return s;
}

export function clear(g) { while (g.firstChild) g.firstChild.remove(); return g; }

export function text(parent, x, y, str, attrs = {}) {
  const t = el('text', { x, y, ...attrs }, parent);
  t.textContent = str;
  return t;
}

/** A linear scale from domain [d0, d1] to range [r0, r1], with .invert(). */
export function linear([d0, d1], [r0, r1]) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (x) => r0 + (x - d0) * k;
  f.invert = (y) => d0 + (y - r0) / k;
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

/** Round tick values between a and b, about n of them. */
export function ticks(a, b, n = 5) {
  const span = b - a;
  if (!(span > 0)) return [a];
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

/** 'M x y L x y ...' from points [[x, y], ...]. */
export function line(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
}

/** A closed area under the points, down to y0. */
export function area(pts, y0) {
  if (!pts.length) return '';
  return `${line(pts)}L${pts[pts.length - 1][0].toFixed(1)} ${y0}L${pts[0][0].toFixed(1)} ${y0}Z`;
}

/** A horizontal axis at y: a line, ticks and labels. Options: values, format, label (under the axis). */
export function axisX(parent, x, y, { values, format = (v) => String(v), label, tickLen = 5 } = {}) {
  const g = el('g', { class: 'axis' }, parent);
  const [r0, r1] = x.range;
  el('line', { x1: r0, x2: r1, y1: y, y2: y, class: 's-muted' }, g);
  for (const v of values || ticks(...x.domain)) {
    const px = x(v);
    el('line', { x1: px, x2: px, y1: y, y2: y + tickLen, class: 's-muted' }, g);
    text(g, px, y + tickLen + 14, format(v), { 'text-anchor': 'middle', class: 'tick' });
  }
  if (label) text(g, (r0 + r1) / 2, y + tickLen + 34, label, { 'text-anchor': 'middle', class: 'axis-label' });
  return g;
}

/** A vertical axis at x, with light grid lines across to x2 if given. */
export function axisY(parent, y, x, { values, format = (v) => String(v), label, grid } = {}) {
  const g = el('g', { class: 'axis' }, parent);
  for (const v of values || ticks(...y.domain)) {
    const py = y(v);
    if (grid) el('line', { x1: x, x2: grid, y1: py, y2: py, class: 's-hair' }, g);
    text(g, x - 8, py + 5, format(v), { 'text-anchor': 'end', class: 'tick' });
  }
  if (label) {
    const [r0, r1] = y.range;
    const t = text(g, 0, 0, label, { 'text-anchor': 'middle', class: 'axis-label' });
    t.setAttribute('transform', `translate(${x - 44} ${(r0 + r1) / 2}) rotate(-90)`);
  }
  return g;
}

/** Counts of xs in bins of width w starting at x0: [{x0, x1, n}]. */
export function bins(xs, x0, x1, w) {
  const k = Math.ceil((x1 - x0) / w);
  const out = Array.from({ length: k }, (_, i) => ({ x0: x0 + i * w, x1: x0 + (i + 1) * w, n: 0 }));
  for (const v of xs) {
    const i = Math.floor((v - x0) / w);
    if (i >= 0 && i < k) out[i].n++;
    else if (i >= k && Math.abs(v - x1) < 1e-9) out[k - 1].n++;
  }
  return out;
}
