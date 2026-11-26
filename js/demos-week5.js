// The interactive graphs of week 5: many tests, their corrections, and a mini-GWAS of FAMuSS.
// The FAMuSS and Virco numbers are derived from the lecture's data (js/data/famuss.js).

import { h, num, pct, pval, slider, choice, button, readout } from './ui.js';
import { el, clear, text, linear, axisX, axisY } from './svg.js';
import * as S from './stats.js';
import { W, frame, controls, note } from './demo-kit.js';
import { FAMUSS as F } from './data/famuss.js';

// ---------------------------------------------------------------- helpers

/** p.adjust(p, "BH") and "BY": the adjusted p-values, in the original order. */
function adjust(p, method = 'BH') {
  const m = p.length;
  const cm = method === 'BY' ? S.sum(Array.from({ length: m }, (_, i) => 1 / (i + 1))) : 1;
  const o = p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);     // largest first
  const out = new Array(m);
  let run = 1;
  o.forEach(([v, i], j) => { run = Math.min(run, (cm * m * v) / (m - j)); out[i] = Math.min(1, run); });
  return out;
}
const bonferroni = (p) => p.map((v) => Math.min(1, v * p.length));
/** The χ² statistic, on 1 degree of freedom, with upper-tail probability p. */
const chi2 = (p) => S.normInv(p / 2) ** 2;
/** The genomic inflation factor: the median χ² over its expected value, 0.455. */
const lambda = (p) => S.median(p.map(chi2)) / 0.45494;
const mlog = (p) => -Math.log10(p);
/** SVG text with a superscript or subscript: '6.4 × 10^−4' or 'p_A'. */
function rich(t, html) {
  t.innerHTML = html.replace(/\^([^ ]+)/g, '<tspan baseline-shift="super" font-size="70%">$1</tspan>')
    .replace(/_([A-Za-z0-9]+)/g, '<tspan baseline-shift="sub" font-size="70%">$1</tspan>');
  return t;
}
/** A small number as R would write it: 6.4 × 10⁻⁴. */
function sci(x, d = 1) {
  if (x >= 0.001) return num(x, x >= 0.1 ? 2 : 3);
  const e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  return `${num(m, d)} × 10<sup>−${-e}</sup>`;
}
/** A p-value as the lecture gives it: P = 0.026, P = 0.0056, P = 1.2 × 10⁻⁵. */
const pfmt = (p) => (p >= 0.01 ? `P = ${num(p, 3)}` : p >= 0.001 ? `P = ${num(p, 4)}` : `P = ${sci(p)}`);
/** Uniform p-values for tests of true nulls, and p-values of tests of real effects (z-tests). */
const nullP = (r) => r();
const effectP = (r, mu) => 2 * S.normCdf(-Math.abs(mu + S.randn(r)));

// ---------------------------------------------------------------- many tests

function manyTests(root) {
  let m = 20, mode = 'each', seed = 1;
  const m$ = slider({ label: 'Tests', min: 1, max: 100, value: m, oninput: (v) => { m = v; draw(); } });
  const t$ = choice({
    label: 'Each test at', value: mode,
    options: [{ value: 'each', text: '0.05' }, { value: 'bonf', text: '0.05/m, Bonferroni' }],
    onchange: (v) => { mode = v; draw(); },
  });
  controls(root, m$.el, t$.el, button('Run again', () => { seed++; draw(); }));
  const H = 268;
  const s = frame(root, H, 'The chance of at least one false positive against the number of tests, and one run of the tests');
  const ro = readout();
  root.append(ro.el);
  note(root, 'Every null is true here, so every red dot is a false positive.');
  const x = linear([0, 100], [52, W - 12]), y = linear([0, 1], [118, 10]);
  const chance = (k) => 1 - (1 - (mode === 'each' ? 0.05 : 0.05 / k)) ** k;
  function draw() {
    clear(s);
    axisY(s, y, 52, { values: [0, 0.5, 1], format: (v) => pct(v), grid: W - 12 });
    axisX(s, x, 118, { values: [0, 20, 40, 60, 80, 100], label: 'Number of tests, all nulls true' });
    const pts = Array.from({ length: 100 }, (_, k) => [x(k + 1), y(chance(k + 1))]);
    el('path', { d: `M${pts.map((p) => p.join(' ')).join(' L')}`, class: 's-plum', fill: 'none', 'stroke-width': 3 }, s);
    el('circle', { cx: x(m), cy: y(chance(m)), r: 6.5, class: 'f-plum' }, s);
    text(s, x(m) + (m > 80 ? -10 : 10), y(chance(m)) + (chance(m) > 0.8 ? 18 : -10), pct(chance(m)), { class: 'lbl-strong c-plum halo', 'text-anchor': m > 80 ? 'end' : 'start' });
    // one run: a dot per test
    const r = S.rng(seed * 7919 + m);
    const p = Array.from({ length: m }, () => nullP(r));
    const cut = mode === 'each' ? 0.05 : 0.05 / m;
    const fp = p.filter((v) => v < cut).length;
    const per = 25, gap = 19, x0 = 14, y0 = 206;
    p.forEach((v, k) => {
      el('circle', { cx: x0 + (k % per) * gap + 8, cy: y0 + Math.floor(k / per) * gap, r: 7, class: v < cut ? 'f-red' : 'f-hair' }, s);
    });
    text(s, 14, 186, `One run of ${m} test${m > 1 ? 's' : ''}: ${fp} false positive${fp === 1 ? '' : 's'}`, { class: 'lbl' });
    // 10,000 runs
    const rr = S.rng(seed * 104729 + 17);
    let any = 0;
    for (let k = 0; k < 10000; k++) { for (let j = 0; j < m; j++) if (rr() < cut) { any++; break; } }
    ro.set([
      ['At least one false positive', mode === 'each' ? `1 − 0.95<sup>${m}</sup> = ${pct(chance(m))}` : `1 − (1 − 0.05/${m})<sup>${m}</sup> = ${pct(chance(m), 1)}`],
      ['In 10,000 runs', `${pct(any / 10000, 1)} had at least one`],
    ]);
  }
  draw();
}

// ---------------------------------------------------------------- Benjamini–Hochberg

const TEN = [0.001, 0.012, 0.014, 0.122, 0.245, 0.320, 0.550, 0.776, 0.840, 0.995];

function bhProcedure(root) {
  let method = 'BH', q = 0.05;
  const m$ = choice({
    label: 'Correction', value: method,
    options: [{ value: 'BH', text: 'Benjamini–Hochberg' }, { value: 'bonf', text: 'Bonferroni' }, { value: 'BY', text: 'Benjamini–Yekutieli' }],
    onchange: (v) => { method = v; draw(); },
  });
  const q$ = slider({ label: 'q, or α', min: 0.01, max: 0.2, step: 0.01, value: q, format: (v) => num(v, 2), oninput: (v) => { q = v; draw(); } });
  controls(root, m$.el, q$.el);
  const H = 200;
  const s = frame(root, H, 'Ten sorted p-values against their rank, with the line of the chosen correction');
  const table = h('div', { class: 'table-box bh-table' });
  root.append(table);
  const ro = readout();
  root.append(ro.el);
  note(root, 'Leonardo’s ten p-values (lecture W5, Part A, slides 11–15). Filled: rejected.');
  const m = TEN.length, cm = S.sum(Array.from({ length: m }, (_, i) => 1 / (i + 1)));
  const x = linear([0.5, 10.5], [56, W - 14]), y = linear([0, 0.2], [160, 12]);
  const limit = (k) => (method === 'BH' ? (k / m) * q : method === 'BY' ? (k / (m * cm)) * q : q / m);
  function draw() {
    clear(s);
    axisY(s, y, 56, { values: [0, 0.05, 0.1, 0.15, 0.2], format: (v) => num(v, 2), grid: W - 14, label: 'p-value' });
    axisX(s, x, 160, { values: TEN.map((_, k) => k + 1), label: 'Rank of the p-value' });
    // the line of the correction
    // a rising line for BH and BY, a flat one for Bonferroni; cut where it leaves the graph
    const end = method === 'bonf' ? 10.5 : Math.min(10.5, 0.5 + (0.2 - limit(0.5)) / (limit(1.5) - limit(0.5)));
    el('line', { x1: x(0.5), x2: x(end), y1: y(limit(0.5)), y2: y(Math.min(0.2, limit(end))), class: 's-plum', 'stroke-width': 2.5, 'stroke-dasharray': method === 'bonf' ? '7 5' : null }, s);
    // the last crossing: reject every hypothesis up to it
    let k = 0;
    TEN.forEach((p, i) => { if (p <= limit(i + 1)) k = i + 1; });
    if (k) el('line', { x1: x(k + 0.5), x2: x(k + 0.5), y1: 12, y2: 160, class: 's-muted', 'stroke-dasharray': '3 4' }, s);
    TEN.forEach((p, i) => {
      const cx = x(i + 1), hit = i < k;
      if (p > 0.2) {
        el('path', { d: `M${cx - 5} 18 L${cx + 5} 18 L${cx} 9 Z`, class: 'f-muted' }, s);
        text(s, cx, 32, num(p, 2), { class: 'tick small', 'text-anchor': 'middle' });
      } else {
        el('circle', { cx, cy: y(p), r: 6, class: hit ? 'f-plum' : 'f-paper s-ink', 'stroke-width': hit ? 0 : 2 }, s);
      }
    });
    const adj = method === 'BH' ? adjust(TEN, 'BH') : method === 'BY' ? adjust(TEN, 'BY') : bonferroni(TEN);
    const row = (name, vals, cls) => h('tr', null, h('th', { scope: 'row' }, name), vals.map((v, i) => h('td', { class: i < k && cls ? cls : null }, v)));
    table.replaceChildren(h('table', { class: 'coded compact' },
      h('tbody', null,
        row('p', TEN.map((p) => num(p, 3).replace(/^0/, '')), 'hit'),
        row('Line', TEN.map((_, i) => num(limit(i + 1), 3).replace(/^0/, ''))),
        row('Adjusted', adj.map((v) => num(v, 3).replace(/^0/, '')), 'hit'))));
    const fn = method === 'BH' ? '"BH"' : method === 'BY' ? '"BY"' : '"bonferroni"';
    ro.set([['Rejected', k ? `${k}, of rank 1${k > 1 ? ` to ${k}` : ''}` : 'none'], ['In R', `<code>p.adjust(p, ${fn})</code>`]]);
  }
  draw();
}

// ---------------------------------------------------------------- the p-value histogram

function pHistogram(root) {
  let data = 'famuss', share = 0.2;
  const sim = () => {
    const r = S.rng(2026), m = 1000, k = Math.round(share * m);
    return Array.from({ length: m }, (_, i) => (i < k ? effectP(r, 2.8) : nullP(r)));
  };
  const SETS = {
    famuss: { text: 'FAMuSS: 78 SNPs', p: () => F.p },
    virco: { text: 'Virco: 47 positions', p: () => F.virco.p },
    sim: { text: 'Simulated: 1,000 tests', p: sim },
  };
  const d$ = choice({ label: 'Data', value: data, options: Object.entries(SETS).map(([k, v]) => ({ value: k, text: v.text })), onchange: (v) => { data = v; s$.el.hidden = v !== 'sim'; draw(); } });
  const s$ = slider({ label: 'True effects', min: 0, max: 0.6, step: 0.05, value: share, format: (v) => pct(v), oninput: (v) => { share = v; draw(); } });
  s$.el.hidden = true;
  controls(root, d$.el, s$.el);
  const H = 232;
  const s = frame(root, H, 'Histogram of the p-values, in bins of 0.05');
  const ro = readout();
  root.append(ro.el);
  note(root, 'The dashed line: the height of the flat part, from the p-values above 0.5.');
  function draw() {
    clear(s);
    const p = SETS[data].p(), m = p.length;
    const counts = Array(20).fill(0);
    p.forEach((v) => { counts[Math.min(19, Math.floor(v / 0.05))]++; });
    const top = Math.max(...counts);
    const nice = top <= 12 ? 12 : top <= 50 ? Math.ceil(top / 10) * 10 : Math.ceil(top / 50) * 50;
    const x = linear([0, 1], [50, W - 14]), y = linear([0, nice], [190, 12]);
    axisY(s, y, 50, { values: [0, nice / 2, nice], grid: W - 14, label: 'Count' });
    axisX(s, x, 190, { values: [0, 0.25, 0.5, 0.75, 1], format: (v) => num(v, 2), label: 'p-value' });
    counts.forEach((c, i) => {
      if (!c) return;
      el('rect', { x: x(i * 0.05) + 1, y: y(c), width: x(0.05) - x(0) - 2, height: y(0) - y(c), class: i === 0 ? 'f-plum' : 'f-blue', opacity: i === 0 ? 1 : 0.75 }, s);
    });
    // the flat part estimates the share of true nulls (as Storey's q-value does)
    const pi0 = Math.min(1, p.filter((v) => v > 0.5).length / (0.5 * m));
    const level = (pi0 * m) / 20;
    el('line', { x1: x(0), x2: x(1), y1: y(level), y2: y(level), class: 's-ink', 'stroke-dasharray': '6 5', 'stroke-width': 2 }, s);
    const below = p.filter((v) => v < 0.05).length;
    const bh = adjust(p).filter((v) => v < 0.05).length, bf = p.filter((v) => v < 0.05 / m).length;
    ro.set([
      ['Below 0.05', `${below} of ${num(m)}, where ${num(0.05 * m, 1)} are expected if every null is true`],
      ['Corrected', `Bonferroni ${bf}, Benjamini–Hochberg ${bh}`],
      ['Flat part', `about ${pct(pi0)} true nulls${m < 100 ? ', roughly, with so few tests' : ''}`],
    ]);
  }
  draw();
}

// ---------------------------------------------------------------- the FAMuSS scan

function famussScan(root) {
  let model = 'crude', pick = -1;
  const m$ = choice({
    label: 'Model', value: model,
    options: [{ value: 'crude', text: 'NDRM.CH ~ SNP' }, { value: 'adj', text: '+ PC1 + PC2 + PC3 + Gender + Age' }],
    onchange: (v) => { model = v; pick = -1; draw(); },
  });
  controls(root, m$.el);
  const H = 236;
  const s = frame(root, H, 'Manhattan-style plot of the FAMuSS scan: minus log10 of each SNP’s p-value, in file order');
  s.classList.add('scan-plot');
  s.setAttribute('role', 'group');   // it holds buttons, so it is not a single picture
  const ro = readout();
  root.append(ro.el);
  note(root, 'FAMuSS, 78 SNPs in file order: their positions are not in the file. Click a SNP.');
  const genes = F.snps.map((n) => n.split('_')[0]);
  const shade = [];
  genes.forEach((gname, i) => { shade.push(i && gname !== genes[i - 1] ? 1 - shade[i - 1] : (shade[i - 1] || 0)); });
  const x = linear([0, 79], [44, W - 76]), y = linear([0, 3.5], [198, 12]);
  function draw() {
    clear(s);
    const p = model === 'crude' ? F.p : F.pAdj, beta = model === 'crude' ? F.beta : F.betaAdj;
    const adj = adjust(p);
    if (pick < 0) pick = p.indexOf(Math.min(...p));
    axisY(s, y, 44, { values: [0, 1, 2, 3], grid: W - 76, label: '−log₁₀(p)' });
    axisX(s, x, 198, { values: [1, 20, 40, 60, 78], label: 'SNP, in file order' });
    el('line', { x1: x(0), x2: x(79) + 4, y1: y(mlog(0.05)), y2: y(mlog(0.05)), class: 's-muted', 'stroke-dasharray': '2 4', 'stroke-width': 2 }, s);
    el('line', { x1: x(0), x2: x(79) + 4, y1: y(mlog(0.05 / 78)), y2: y(mlog(0.05 / 78)), class: 's-red', 'stroke-dasharray': '8 5', 'stroke-width': 2 }, s);
    // the two lines, labelled in the margin on the right
    text(s, W - 70, y(mlog(0.05 / 78)) - 3, 'Bonferroni', { class: 'tick small c-red' });
    rich(text(s, W - 70, y(mlog(0.05 / 78)) + 12, '', { class: 'tick small c-red' }), '6.4 × 10^−4');
    text(s, W - 70, y(mlog(0.05)) + 4, 'P = 0.05', { class: 'tick small' });
    p.forEach((v, i) => {
      const c = el('circle', { cx: x(i + 1), cy: y(mlog(v)), r: i === pick ? 7 : 5, class: i === pick ? 'f-plum' : shade[i] ? 'f-orange' : 'f-blue', tabindex: '0', role: 'button', 'aria-label': `${F.snps[i]}: ${pfmt(v)}` }, s);
      const go = (e) => { e.preventDefault(); e.stopPropagation(); pick = i; draw(); };
      c.addEventListener('click', go);
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(e); });
    });
    const i = pick, right = x(i + 1) > W - 230;
    text(s, x(i + 1) + (right ? -11 : 11), y(mlog(p[i])) + 5, F.snps[i], { class: 'lbl-strong c-plum halo', 'text-anchor': right ? 'end' : 'start' });
    const lam = lambda(p);
    ro.set([
      [F.snps[i], `${beta[i] > 0 ? '+' : '−'}${num(Math.abs(beta[i]), 1)} points per minor allele, ${pfmt(p[i])}, BH-adjusted ${num(adj[i], 2)}`],
      ['All 78', `${p.filter((v) => v < 0.05).length} below 0.05, ${p.filter((v) => v < 0.05 / 78).length} below Bonferroni, λ = ${num(lam, 2)}`],
    ]);
  }
  draw();
}

// ---------------------------------------------------------------- linkage disequilibrium

function ldDemo(root) {
  let view = 'two', pA = 0.6, pB = 0.7, D = 0.08;
  const v$ = choice({
    label: 'Show', value: view,
    options: [{ value: 'two', text: 'Two SNPs' }, { value: 'akt1', text: 'AKT1: 13 SNPs' }],
    onchange: (v) => { view = v; sliders.hidden = v !== 'two'; draw(); },
  });
  const bounds = () => [Math.max(-pA * pB, -(1 - pA) * (1 - pB)), Math.min(pA * (1 - pB), (1 - pA) * pB)];
  const clamp = () => { const [lo, hi] = bounds(); D = Math.min(hi, Math.max(lo, D)); d$.input.min = lo.toFixed(3); d$.input.max = hi.toFixed(3); d$.set(D); };
  const a$ = slider({ label: 'p<sub>A</sub>', min: 0.1, max: 0.9, step: 0.05, value: pA, format: (v) => num(v, 2), oninput: (v) => { pA = v; clamp(); draw(); } });
  const b$ = slider({ label: 'p<sub>B</sub>', min: 0.1, max: 0.9, step: 0.05, value: pB, format: (v) => num(v, 2), oninput: (v) => { pB = v; clamp(); draw(); } });
  const d$ = slider({ label: 'D', min: -0.2, max: 0.2, step: 0.005, value: D, format: (v) => num(v, 3), oninput: (v) => { D = v; draw(); } });
  for (const c of [a$, b$]) { const l = c.el.querySelector('label'); l.innerHTML = l.textContent; }
  const sliders = h('div', { class: 'demo-controls' }, a$.el, b$.el, d$.el);
  controls(root, v$.el);
  root.append(sliders);
  clamp();
  const H = 262;
  const s = frame(root, H, 'Haplotype frequencies of two SNPs, or the r squared between the AKT1 SNPs of FAMuSS');
  s.setAttribute('role', 'group');
  const ro = readout();
  root.append(ro.el);
  note(root, 'FAMuSS, ACTN3: r² of 0.93, 0.86 and 0.87 between rs540874, rs1815739 and 1671064.');
  let cell = [3, 7];
  function two() {
    const pAB = pA * pB + D, pAb = pA * (1 - pB) - D, paB = (1 - pA) * pB - D, pab = (1 - pA) * (1 - pB) + D;
    // a mosaic: columns B and b; within each, the share of A
    const X0 = 70, Y0 = 26, S0 = 200;
    const wB = S0 * pB;
    const cells = [
      [X0, Y0, wB, S0 * (pAB / pB), 'AB', pAB, 'f-plum'], [X0, Y0 + S0 * (pAB / pB), wB, S0 * (paB / pB), 'aB', paB, 'f-blue'],
      [X0 + wB, Y0, S0 - wB, S0 * (pAb / (1 - pB)), 'Ab', pAb, 'f-orange'], [X0 + wB, Y0 + S0 * (pAb / (1 - pB)), S0 - wB, S0 * (pab / (1 - pB)), 'ab', pab, 'f-green'],
    ];
    for (const [cx, cy, w, hh, name, f, cls] of cells) {
      el('rect', { x: cx + 1, y: cy + 1, width: Math.max(0, w - 2), height: Math.max(0, hh - 2), class: cls, opacity: 0.85 }, s);
      if (w > 34 && hh > 30) {
        text(s, cx + w / 2, cy + hh / 2 - 2, name, { class: 'lbl-strong c-paper', 'text-anchor': 'middle' });
        text(s, cx + w / 2, cy + hh / 2 + 16, num(f, 3), { class: 'tick c-paper', 'text-anchor': 'middle' });
      }
    }
    text(s, X0 + wB / 2, 18, 'B', { class: 'lbl', 'text-anchor': 'middle' });
    text(s, X0 + wB + (S0 - wB) / 2, 18, 'b', { class: 'lbl', 'text-anchor': 'middle' });
    // if the alleles were independent, A would take the same share of each column
    el('line', { x1: X0, x2: X0 + S0, y1: Y0 + S0 * pA, y2: Y0 + S0 * pA, class: 's-ink', 'stroke-dasharray': '5 4', 'stroke-width': 2 }, s);
    rich(text(s, X0 - 8, Y0 + S0 * pA + 5, '', { class: 'tick', 'text-anchor': 'end' }), 'p_A');
    const r2 = D * D / (pA * (1 - pA) * pB * (1 - pB));
    const tx = 300;
    const lines = [
      ['Frequency of AB', num(pAB, 3)],
      ['If independent, p_A p_B', num(pA * pB, 3)],
      ['D, the difference', num(D, 3)],
      ['r²', num(r2, 2)],
    ];
    lines.forEach(([k, v], i) => {
      rich(text(s, tx, 48 + i * 46, '', { class: 'tick' }), k);
      text(s, tx, 70 + i * 46, v, { class: i >= 2 ? 'lbl-strong c-plum' : 'lbl-strong' });
    });
    ro.set([['D', `${num(pAB, 3)} − ${num(pA, 2)} × ${num(pB, 2)} = ${num(D, 3)}`], ['r²', `D² / (p<sub>A</sub>p<sub>a</sub>p<sub>B</sub>p<sub>b</sub>) = ${num(r2, 2)}`]]);
  }
  function akt1() {
    const n = F.akt1.snps.length, size = 17, X0 = 60, Y0 = 8;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = F.akt1.r2[i][j];
        const r = el('rect', { x: X0 + j * size, y: Y0 + (n - 1 - i) * size, width: size - 1, height: size - 1, class: 'f-plum', opacity: (0.06 + 0.94 * v).toFixed(3), tabindex: '0', role: 'button', 'aria-label': `${F.akt1.snps[i]} and ${F.akt1.snps[j]}: r squared ${num(v, 2)}` }, s);
        const go = (e) => { e.preventDefault(); e.stopPropagation(); cell = [i, j]; draw(); };
        r.addEventListener('click', go);
        r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(e); });
      }
      text(s, X0 - 6, Y0 + (n - 1 - i) * size + 13, String(i + 1), { class: 'tick small', 'text-anchor': 'end' });
      text(s, X0 + i * size + 8, Y0 + n * size + 14, String(i + 1), { class: 'tick small', 'text-anchor': 'middle' });
    }
    const [ci, cj] = cell;
    el('rect', { x: X0 + cj * size - 1, y: Y0 + (n - 1 - ci) * size - 1, width: size + 1, height: size + 1, class: 's-ink', fill: 'none', 'stroke-width': 2.5 }, s);
    text(s, X0 + (n * size) / 2, Y0 + n * size + 34, 'SNP of the AKT1 gene, in file order', { class: 'axis-label', 'text-anchor': 'middle' });
    // a legend for r²
    const lx = 330;
    text(s, lx, 24, 'r²', { class: 'lbl' });
    [0, 0.25, 0.5, 0.75, 1].forEach((v, k) => {
      el('rect', { x: lx, y: 34 + k * 24, width: 22, height: 20, class: 'f-plum', opacity: (0.06 + 0.94 * v).toFixed(3) }, s);
      text(s, lx + 30, 49 + k * 24, num(v, 2), { class: 'tick' });
    });
    text(s, lx, 182, 'Dark squares: SNPs that', { class: 'tick' });
    text(s, lx, 200, 'carry almost the same', { class: 'tick' });
    text(s, lx, 218, 'information', { class: 'tick' });
    ro.set([[`SNPs ${ci + 1} and ${cj + 1}`, `${F.akt1.snps[ci]} and ${F.akt1.snps[cj]}`], ['r²', num(F.akt1.r2[ci][cj], 2)]]);
  }
  function draw() { clear(s); if (view === 'two') two(); else akt1(); }
  draw();
}

// ---------------------------------------------------------------- Manhattan and QQ plots

const CHROM = [248, 242, 198, 190, 181, 171, 159, 145, 138, 134, 135, 133, 114, 107, 102, 90, 83, 80, 59, 64, 47, 51];

function gwasPlots(root) {
  let signals = 2, infl = 1, plot = 'manhattan';
  const p$ = choice({
    label: 'Plot', value: plot,
    options: [{ value: 'manhattan', text: 'Manhattan' }, { value: 'qq', text: 'QQ' }],
    onchange: (v) => { plot = v; draw(); },
  });
  const s$ = slider({ label: 'True signals', min: 0, max: 4, value: signals, oninput: (v) => { signals = v; draw(); } });
  const i$ = slider({ label: 'Inflation', min: 1, max: 1.5, step: 0.05, value: infl, format: (v) => num(v, 2), oninput: (v) => { infl = v; draw(); } });
  controls(root, p$.el, s$.el, i$.el);
  const H = 236;
  const s = frame(root, H, 'A simulated genome-wide scan, as a Manhattan plot or a QQ plot');
  const ro = readout();
  root.append(ro.el);
  note(root, 'Simulated: 3,000 SNPs on 22 chromosomes. Inflation multiplies every χ² statistic, as confounding by ancestry can.');
  // the SNPs: positions and null z-scores, fixed; true signals add peaks of SNPs in LD
  const total = S.sum(CHROM), N = 3000;
  const r = S.rng(55);
  const snps = [];
  let start = 0;
  CHROM.forEach((len, c) => {
    const n = Math.round((N * len) / total);
    for (let k = 0; k < n; k++) snps.push({ c, pos: start + ((k + r()) / n) * len, z: S.randn(r) });
    start += len;
  });
  const PEAKS = [[0.21, 7.5], [0.57, 9.6], [0.36, 6.8], [0.8, 11]];   // where along the genome, and how strong
  function zs() {
    return snps.map((d) => {
      let z = d.z;
      for (const [at, zz] of PEAKS.slice(0, signals)) {
        const dist = Math.abs(d.pos / start - at) * 3000;               // in SNPs
        if (dist < 14) z += zz * Math.exp(-dist / 3.2) * (0.75 + 0.25 * Math.cos(d.pos));
      }
      return z * Math.sqrt(infl);
    });
  }
  function draw() {
    clear(s);
    const p = zs().map((z) => 2 * S.normCdf(-Math.abs(z)));
    const lp = p.map(mlog);
    const top = Math.max(9, Math.ceil(Math.max(...lp)) + 1);
    const hits = p.filter((v) => v < 5e-8).length;
    if (plot === 'manhattan') {
      const x = linear([0, start], [44, W - 10]), y = linear([0, top], [196, 10]);
      axisY(s, y, 44, { values: [0, 2, 4, 6, 8, 10, 12].filter((v) => v <= top), grid: W - 10, label: '−log₁₀(p)' });
      el('line', { x1: x(0), x2: x(start), y1: 196, y2: 196, class: 's-muted' }, s);
      let at = 0;
      CHROM.forEach((len, c) => {
        if (c < 9 || c % 2 === 0) text(s, x(at + len / 2), 214, String(c + 1), { class: 'tick small', 'text-anchor': 'middle' });
        at += len;
      });
      text(s, (44 + W - 10) / 2, 232, 'Chromosome', { class: 'axis-label', 'text-anchor': 'middle' });
      snps.forEach((d, k) => {
        el('circle', { cx: x(d.pos), cy: y(lp[k]), r: p[k] < 5e-8 ? 3.4 : 2.4, class: p[k] < 5e-8 ? 'f-plum' : d.c % 2 ? 'f-blue' : 'f-muted', opacity: p[k] < 5e-8 ? 1 : 0.7 }, s);
      });
      el('line', { x1: x(0), x2: x(start), y1: y(mlog(5e-8)), y2: y(mlog(5e-8)), class: 's-red', 'stroke-dasharray': '8 5', 'stroke-width': 2 }, s);
      rich(text(s, W - 12, y(mlog(5e-8)) - 6, '', { class: 'tick c-red halo', 'text-anchor': 'end' }), '5 × 10^−8');
    } else {
      const sorted = [...lp].sort((a, b) => b - a);
      const ex = sorted.map((_, i) => mlog((i + 0.5) / sorted.length));
      const lim = Math.max(ex[0], 4);
      const x = linear([0, lim], [44, W - 10]), y = linear([0, top], [196, 10]);
      axisY(s, y, 44, { values: [0, 2, 4, 6, 8, 10, 12].filter((v) => v <= top), grid: W - 10, label: 'Observed −log₁₀(p)' });
      axisX(s, x, 196, { values: [0, 1, 2, 3, 4].filter((v) => v <= lim), label: 'Expected −log₁₀(p)' });
      el('line', { x1: x(0), x2: x(lim), y1: y(0), y2: y(Math.min(top, lim)), class: 's-ink', 'stroke-width': 2 }, s);
      sorted.forEach((v, i) => el('circle', { cx: x(ex[i]), cy: y(v), r: 2.6, class: v > mlog(5e-8) ? 'f-plum' : 'f-blue', opacity: 0.7 }, s));
    }
    ro.set([
      ['λ', `${num(lambda(p), 2)}: the median χ² over 0.455`],
      ['Below 5 × 10<sup>−8</sup>', `${hits} SNP${hits === 1 ? '' : 's'}`],
    ]);
  }
  draw();
}

// ---------------------------------------------------------------- ancestry: PCA and adjustment

const RACE_COLOUR = ['blue', 'orange', 'green', 'red', 'plum', 'ink'];

function pcaAncestry(root) {
  let view = 'pca';
  const v$ = choice({
    label: 'Show', value: view,
    options: [{ value: 'pca', text: 'PC1 against PC2' }, { value: 'qq', text: 'QQ plot, before and after adjusting' }],
    onchange: (v) => { view = v; draw(); },
  });
  controls(root, v$.el);
  const H = 250;
  const s = frame(root, H, 'FAMuSS: principal components of the genotypes by self-reported race, or the QQ plot of the scan before and after adjusting for them');
  const key = h('p', { class: 'demo-key' });
  root.append(key);
  const ro = readout();
  root.append(ro.el);
  note(root, 'FAMuSS: 78 SNPs, 1,397 volunteers; missing genotypes replaced by the SNP’s mean.');
  const n = F.races.map((_, k) => F.race.filter((r) => r === k).length);
  const meanPC1 = F.races.map((_, k) => S.mean(F.pc1.filter((_, i) => F.race[i] === k)));
  function draw() {
    clear(s);
    if (view === 'pca') {
      const x = linear([-5, 10], [50, W - 12]), y = linear([-5, 7], [206, 8]);
      axisY(s, y, 50, { values: [-4, -2, 0, 2, 4, 6], grid: W - 12, label: `PC2 (${pct(F.pcVar[1], 1)})` });
      axisX(s, x, 206, { values: [-4, 0, 4, 8], label: `PC1 (${pct(F.pcVar[0], 1)})` });
      // the volunteers with no race recorded first, then the largest group, then the others on top
      const order = [-1, 0, 3, 4, 1, 2, 5];
      for (const k of order) {
        F.pc1.forEach((v, i) => {
          if (F.race[i] !== k) return;
          el('circle', { cx: x(v), cy: y(F.pc2[i]), r: 3, class: k < 0 ? 'f-hair' : `f-${RACE_COLOUR[k]}`, opacity: k < 0 ? 0.8 : 0.65 }, s);
        });
      }
      key.replaceChildren(...F.races.map((name, k) => (n[k] > 1 ? h('span', null, h('i', { class: `k-${RACE_COLOUR[k]}` }), `${name} (${n[k]})`) : null)).filter(Boolean),
        h('span', null, h('i', { class: 'k-hair' }), `Not recorded (${F.race.filter((r) => r < 0).length})`));
      ro.set([['Mean PC1', [0, 1, 2].map((k) => `${F.races[k]} ${num(meanPC1[k], 1)}`).join(', ')]]);
    } else {
      const series = [[F.p, 'red', 'Unadjusted'], [F.pAdj, 'blue', 'Adjusted for 3 PCs, gender and age']];
      const x = linear([0, 2.2], [50, W - 12]), y = linear([0, 2.6], [206, 8]);
      axisY(s, y, 50, { values: [0, 0.5, 1, 1.5, 2, 2.5], format: (v) => num(v, 1), grid: W - 12, label: 'Observed −log₁₀(p)' });
      axisX(s, x, 206, { values: [0, 0.5, 1, 1.5, 2], format: (v) => num(v, 1), label: 'Expected −log₁₀(p)' });
      el('line', { x1: x(0), x2: x(2.2), y1: y(0), y2: y(2.2), class: 's-ink', 'stroke-width': 2 }, s);
      for (const [p, c] of series) {
        const sorted = p.map(mlog).sort((a, b) => b - a);
        sorted.forEach((v, i) => el('circle', { cx: x(mlog((i + 0.5) / sorted.length)), cy: y(v), r: 4, class: `f-${c}`, opacity: 0.8 }, s));
      }
      key.replaceChildren(...series.map(([p, c, name]) => h('span', null, h('i', { class: `k-${c}` }), `${name}: λ = ${num(lambda(p), 2)}`)));
      const best = F.pAdj.indexOf(Math.min(...F.pAdj));
      ro.set([['After adjusting', `smallest ${pfmt(F.pAdj[best])} (${F.snps[best]}); smallest BH-adjusted ${num(Math.min(...adjust(F.pAdj)), 2)}`]]);
    }
  }
  draw();
}

// ---------------------------------------------------------------- writing up a mini-GWAS

function gwasWriteup(root) {
  const PARTS = [
    ['qc', 'Quality control'], ['test', 'The test'], ['ancestry', 'Ancestry and λ'], ['multiplicity', 'The correction'],
    ['plots', 'The plots'], ['hits', 'The best hit'], ['power', 'Power'], ['all', 'All the tests'],
  ];
  const TEXT = [
    ['qc', '78 of 227 SNPs passed quality control (biallelic, call rate ≥ 80%, minor allele frequency ≥ 1%, Hardy–Weinberg). '],
    ['test', 'In 1,011 volunteers, the change in arm strength was regressed on each SNP’s number of minor alleles, '],
    ['ancestry', 'adjusting for 3 genotype PCs, gender and age (λ = 1.02; 1.49 unadjusted). '],
    ['multiplicity', 'No SNP passed Bonferroni for 78 tests (6.4 × 10<sup>−4</sup>), or BH at 0.05 (smallest adjusted p, 0.29). '],
    ['plots', 'The p-value histogram was close to flat, and the QQ plot near the diagonal. '],
    ['hits', 'The smallest p, 0.0056 for akt1_t10726c_t12868c (r² = 0.82 with akt1_a7699g), needs replication. '],
    ['power', 'With about 505 per group, the scan had 80% power only for 8.8 points or more. '],
    ['all', 'All 78 results are in a supplementary table.'],
  ];
  let lit = 'multiplicity';
  const sentence = h('p', { class: 'report' });
  const checks = h('div', { class: 'report-parts', role: 'group', 'aria-label': 'The checklist' });
  root.append(checks, sentence);
  function draw() {
    sentence.replaceChildren(...TEXT.map(([k, t]) => h('span', { class: `rp rp-${k} ${k === lit ? 'lit' : ''}`, html: t })));
    checks.replaceChildren(...PARTS.map(([k, label]) => h('button', {
      type: 'button', class: 'seg-btn', 'aria-pressed': String(k === lit),
      onclick: () => { lit = k; draw(); },
    }, label)));
  }
  draw();
  note(root, 'The FAMuSS mini-GWAS, written up with Leonardo’s checklist (slide 42). Click an item.');
}

export const WEEK5_DEMOS = { manyTests, bhProcedure, pHistogram, famussScan, ldDemo, gwasPlots, pcaAncestry, gwasWriteup };
