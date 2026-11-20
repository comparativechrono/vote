// Helpers shared by the interactive graphs of every week (js/demos.js, js/demos-week4.js, ...).

import { h } from './ui.js';
import { el, svg } from './svg.js';
import * as S from './stats.js';

/** The width of every graph, in its own units: it scales to the space it is given. */
export const W = 540;

/** The two-sided p-value of t, with the normal for large samples. */
export const pT2 = (t, df) => (df > 1000 ? 2 * (1 - S.normCdf(Math.abs(t))) : S.tP2(t, df));
export const code = (s) => `<code>${s}</code>`;

/** A new SVG of height H, added to root. */
export function frame(root, H, label) {
  const s = svg(W, H, label);
  root.append(s);
  return s;
}

/** A row of controls under a graph. */
export function controls(root, ...items) {
  const c = h('div', { class: 'demo-controls' }, items);
  root.append(c);
  return c;
}

/** A small note under a graph, such as where its data come from. */
export function note(root, words) { root.append(h('p', { class: 'demo-note' }, words)); }

export const g = (parent, cls) => el('g', { class: cls || null }, parent);

/** Normal values with exactly the given mean and SD (so the graphs match the lecture's figures). */
export function exactNormal(n, m, s, seed) {
  const r = S.rng(seed);
  const z = Array.from({ length: n }, () => S.randn(r));
  const zm = S.mean(z), zs = S.sd(z);
  return z.map((v) => m + (s * (v - zm)) / zs);
}
