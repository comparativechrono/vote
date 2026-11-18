// The interactive graphs on the recap slides. mountDemo(name, element) draws one; each is
// self-contained and uses the same simulated or published numbers as Leonardo's lectures.

import { h, num, pct, pval, pnum, slider, choice, button, readout, animate, ease } from './ui.js';
import { el, svg, clear, text, linear, ticks, line, area, axisX, axisY, bins } from './svg.js';
import * as S from './stats.js';

const W = 540;

const pT2 = (t, df) => (df > 1000 ? 2 * (1 - S.normCdf(Math.abs(t))) : S.tP2(t, df));
const code = (s) => `<code>${s}</code>`;

function frame(root, H, label) {
  const s = svg(W, H, label);
  root.append(s);
  return s;
}
function controls(root, ...items) {
  const c = h('div', { class: 'demo-controls' }, items);
  root.append(c);
  return c;
}
function note(root, words) { root.append(h('p', { class: 'demo-note' }, words)); }
const g = (parent, cls) => el('g', { class: cls || null }, parent);

/** Normal values with exactly the given mean and SD (so the graphs match the lecture's figures). */
function exactNormal(n, m, s, seed) {
  const r = S.rng(seed);
  const z = Array.from({ length: n }, () => S.randn(r));
  const zm = S.mean(z), zs = S.sd(z);
  return z.map((v) => m + (s * (v - zm)) / zs);
}

// ================================================================ describing data

function meanMedian(root) {
  const H = 300;
  const s = frame(root, H, 'Histogram and box plot of mothers’ weights, with the mean and the median');
  // Like lwt in birthwt: 189 mothers, median 121 lb, mean about 130 lb, a long upper tail.
  const r = S.rng(11);
  const n = 189;
  const base = Array.from({ length: n }, (_, i) => {
    const v = 80 + 41 * Math.exp(0.6 * S.normInv((i + 0.5) / n)) + (r() - 0.5) * 6;
    return Math.round(Math.min(250, Math.max(80, v)));
  }).sort((a, b) => a - b);
  const p90 = S.quantile(base, 0.9);
  let stretch = 1, view = 'hist';

  const data = () => base.map((v) => (v > p90 ? v + (stretch - 1) * (v - p90) : v));
  const view$ = choice({
    label: 'Show', value: view,
    options: [{ value: 'hist', text: 'Histogram and box plot' }, { value: 'qq', text: 'QQ-plot' }, { value: 'qqlog', text: 'QQ-plot of log weight' }],
    onchange: (v) => { view = v; draw(); },
  });
  const tail = slider({
    label: 'Stretch the upper tail', min: 1, max: 2.5, step: 0.05, value: 1,
    format: (v) => `×${num(v, 1)}`, oninput: (v) => { stretch = v; draw(); },
  });
  controls(root, view$.el, tail.el);
  const ro = readout();
  root.append(ro.el);
  note(root, 'Simulated to look like the mothers’ weights in birthwt.');

  function draw() {
    clear(s);
    const xs = data();
    const mean = S.mean(xs), med = S.median(xs), q1 = S.quantile(xs, 0.25), q3 = S.quantile(xs, 0.75);
    ro.set([['Mean', `${num(mean)} lb`], ['Median', `${num(med)} lb`], ['SD', `${num(S.sd(xs))} lb`], ['IQR', `${num(q1)} to ${num(q3)} lb`]]);
    if (view === 'hist') hist(xs, mean, med, q1, q3);
    else qq(xs, view === 'qqlog');
  }

  function hist(xs, mean, med, q1, q3) {
    const x = linear([70, 330], [44, 524]);
    const counts = bins(xs, 70, 330, 10);
    const y = linear([0, 40], [196, 26]);
    axisY(s, y, 44, { values: [0, 20, 40], grid: 524 });
    const gb = g(s);
    for (const b of counts) {
      if (!b.n) continue;
      el('rect', { x: x(b.x0) + 1, width: x(b.x1) - x(b.x0) - 2, y: y(b.n), height: y(0) - y(b.n), class: 'f-blue', opacity: 0.55 }, gb);
    }
    // the mean and the median
    el('line', { x1: x(med), x2: x(med), y1: 20, y2: 196, class: 's-blue', 'stroke-width': 3 }, s);
    text(s, x(med) - 6, 20, `Median ${num(med)}`, { 'text-anchor': 'end', class: 'lbl c-blue' });
    el('line', { x1: x(mean), x2: x(mean), y1: 34, y2: 196, class: 's-orange', 'stroke-width': 3 }, s);
    text(s, x(mean) + 6, 34, `Mean ${num(mean)}`, { class: 'lbl c-orange' });
    // the box plot: whiskers to the furthest values within 1.5 IQR of the box
    const iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    const wlo = Math.min(...xs.filter((v) => v >= lo)), whi = Math.max(...xs.filter((v) => v <= hi));
    const by = 220, bh = 24;
    el('line', { x1: x(wlo), x2: x(q1), y1: by + bh / 2, y2: by + bh / 2, class: 's-ink' }, s);
    el('line', { x1: x(q3), x2: x(whi), y1: by + bh / 2, y2: by + bh / 2, class: 's-ink' }, s);
    for (const v of [wlo, whi]) el('line', { x1: x(v), x2: x(v), y1: by + 5, y2: by + bh - 5, class: 's-ink' }, s);
    el('rect', { x: x(q1), y: by, width: x(q3) - x(q1), height: bh, class: 'f-paper s-ink' }, s);
    el('line', { x1: x(med), x2: x(med), y1: by, y2: by + bh, class: 's-ink', 'stroke-width': 3 }, s);
    for (const v of xs.filter((v) => v < lo || v > hi)) el('circle', { cx: x(v), cy: by + bh / 2, r: 3.5, class: 'f-none s-ink' }, s);
    axisX(s, x, 256, { values: [100, 150, 200, 250, 300], label: 'Mother’s weight (lb)' });
  }

  function qq(xs, log) {
    const v = [...xs].sort((a, b) => a - b).map((d) => (log ? Math.log(d) : d));
    const n = v.length;
    const z = v.map((_, i) => S.normInv((i + 0.5) / n));
    const lo = log ? Math.log(70) : 70, hi = log ? Math.log(330) : 330;
    const x = linear([-3, 3], [64, 524]);
    const y = linear([lo, hi], [244, 16]);
    const q1 = S.quantile(v, 0.25), q3 = S.quantile(v, 0.75), z1 = S.normInv(0.25), z3 = S.normInv(0.75);
    const slope = (q3 - q1) / (z3 - z1), icpt = q1 - slope * z1;
    const yticks = log ? [80, 100, 150, 200, 300] : [100, 150, 200, 250, 300];
    axisY(s, y, 64, { values: yticks.map((t) => (log ? Math.log(t) : t)), format: (t) => num(log ? Math.exp(t) : t), grid: 524, label: log ? 'Weight (lb, log scale)' : 'Weight (lb)' });
    el('path', { d: line([[x(-3), y(icpt - 3 * slope)], [x(3), y(icpt + 3 * slope)]]), class: 's-orange', 'stroke-width': 2.5 }, s);
    const gp = g(s);
    v.forEach((d, i) => el('circle', { cx: x(z[i]), cy: y(Math.min(hi, d)), r: 3.2, class: 'f-blue', opacity: 0.75 }, gp));
    axisX(s, x, 252, { values: [-3, -2, -1, 0, 1, 2, 3], format: (t) => num(t), label: 'Quantiles of the normal' });
  }

  draw();
}

// ================================================================ distributions

function normal(root) {
  const H = 270;
  const s = frame(root, H, 'The standard normal curve, with the area within z standard deviations of the mean shaded');
  let z = 1.96, mode = 'middle';
  const x = linear([-4, 4], [24, 516]);
  const y = linear([0, 0.42], [214, 18]);
  const zs = slider({ label: 'z', min: 0, max: 3.5, step: 0.01, value: z, format: (v) => num(v, 2), oninput: (v) => { z = v; draw(); } });
  const mode$ = choice({
    label: 'Shade', value: mode,
    options: [{ value: 'middle', text: 'Within ±z' }, { value: 'below', text: 'Below z' }],
    onchange: (v) => { mode = v; draw(); },
  });
  const presets = h('div', { class: 'ctl presets' }, h('span', { class: 'ctl-label' }, 'Go to'),
    ...[1, 1.96, 2, 3].map((v) => button(num(v, v === 1.96 ? 2 : 0), () => { z = v; zs.set(v); draw(); }, 'btn-small')));
  controls(root, zs.el, mode$.el, presets);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    const pts = (a, b) => {
      const out = [];
      for (let i = 0; i <= 120; i++) { const v = a + ((b - a) * i) / 120; out.push([x(v), y(S.normPdf(v))]); }
      return out;
    };
    if (mode === 'middle') {
      el('path', { d: area(pts(-4, -z), y(0)), class: 'f-orange', opacity: 0.45 }, s);
      el('path', { d: area(pts(z, 4), y(0)), class: 'f-orange', opacity: 0.45 }, s);
      el('path', { d: area(pts(-z, z), y(0)), class: 'f-plum', opacity: 0.3 }, s);
    } else {
      el('path', { d: area(pts(-4, z), y(0)), class: 'f-plum', opacity: 0.3 }, s);
    }
    el('path', { d: line(pts(-4, 4)), class: 's-ink f-none', 'stroke-width': 2.5 }, s);
    const marks = mode === 'middle' ? [-z, z] : [z];
    for (const m of marks) {
      el('line', { x1: x(m), x2: x(m), y1: y(0), y2: y(S.normPdf(m)) - 2, class: 's-plum', 'stroke-width': 2.5 }, s);
    }
    const inside = S.normCdf(z) - S.normCdf(-z);
    if (mode === 'middle') {
      text(s, x(0), y(0.12), pct(inside, 1), { 'text-anchor': 'middle', class: 'big c-plum' });
      if (z > 0.6) {
        text(s, x(-z) - 8, y(0.03) - 8, pct((1 - inside) / 2, 1), { 'text-anchor': 'end', class: 'lbl c-orange' });
        text(s, x(z) + 8, y(0.03) - 8, pct((1 - inside) / 2, 1), { class: 'lbl c-orange' });
      }
    } else {
      text(s, x(Math.max(-3.2, z - 1.6)), y(0.12), pct(S.normCdf(z), 1), { 'text-anchor': 'middle', class: 'big c-plum' });
    }
    axisX(s, x, 216, { values: [-3, -2, -1, 0, 1, 2, 3], format: (v) => num(v), label: 'Standard deviations from the mean' });
    const p = S.normCdf(z);
    ro.set(mode === 'middle'
      ? [[`Within ±${num(z, 2)} SD`, pct(inside, 1)], ['Each tail', pct((1 - inside) / 2, 1)], [code(`pnorm(${num(z, 2)})`), num(p, 3)], [code(`qnorm(${num(p, 3)})`), num(z, 2)]]
      : [[code(`pnorm(${num(z, 2)})`), `${num(p, 3)}, the shaded area`], [code(`qnorm(${num(p, 3)})`), `${num(z, 2)}, back again`], [code(`dnorm(${num(z, 2)})`), `${num(S.normPdf(z), 3)}, the height`]]);
  }
  draw();
}

function counts(root) {
  const H = 270;
  const s = frame(root, H, 'Binomial probabilities, with the probability of k or fewer shaded');
  let n = 20, p = 0.43, k = 8, pois = false;
  const ns = slider({ label: 'Trials n', min: 2, max: 60, value: n, oninput: (v) => { n = v; if (k > n) { k = n; ks.set(k); } ks.input.max = n; draw(); } });
  const ps = slider({ label: 'Probability p', min: 0.02, max: 0.98, step: 0.01, value: p, format: (v) => num(v, 2), oninput: (v) => { p = v; draw(); } });
  const ks = slider({ label: 'k', min: 0, max: n, value: k, oninput: (v) => { k = v; draw(); } });
  const po = choice({
    label: 'Compare', value: false,
    options: [{ value: false, text: 'Binomial only' }, { value: true, text: 'With a Poisson of the same mean' }],
    onchange: (v) => { pois = v; draw(); },
  });
  controls(root, ns.el, ps.el, ks.el, po.el);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    const probs = Array.from({ length: n + 1 }, (_, i) => S.binomPmf(i, n, p));
    const lam = n * p;
    const pp = Array.from({ length: n + 1 }, (_, i) => S.poisPmf(i, lam));
    const top = Math.max(...probs, ...(pois ? pp : [0])) * 1.12;
    const x = linear([-0.5, n + 0.5], [52, 524]);
    const y = linear([0, top], [214, 16]);
    axisY(s, y, 52, { values: ticks(0, top, 4), format: (v) => num(v, 2), grid: 524 });
    const bw = Math.max(2, x(1) - x(0) - 2);
    probs.forEach((pr, i) => {
      el('rect', { x: x(i) - bw / 2, width: bw, y: y(pr), height: y(0) - y(pr), class: i <= k ? 'f-plum' : 'f-hair', opacity: i <= k ? 0.75 : 1 }, s);
    });
    el('rect', { x: x(k) - bw / 2, width: bw, y: y(probs[k]), height: y(0) - y(probs[k]), class: 'f-none s-ink', 'stroke-width': 2 }, s);
    if (pois) {
      el('path', { d: line(pp.map((v, i) => [x(i), y(v)])), class: 's-orange f-none', 'stroke-width': 2 }, s);
      pp.forEach((v, i) => el('circle', { cx: x(i), cy: y(v), r: 4, class: 'f-orange' }, s));
    }
    const step = n <= 20 ? 2 : n <= 40 ? 5 : 10;
    axisX(s, x, 216, { values: Array.from({ length: Math.floor(n / step) + 1 }, (_, i) => i * step), label: 'Number of successes' });
    let cum = 0;
    for (let i = 0; i <= k; i++) cum += probs[i];
    const args = `${k}, ${n}, ${num(p, 2)}`;
    ro.set([
      [code(`dbinom(${args})`), num(probs[k], 3)],
      [code(`pbinom(${args})`), `${num(cum, 3)}, shaded`],
      ['Mean np', num(lam, 1)],
      ['Variance np(1 − p)', num(lam * (1 - p), 2)],
      pois ? ['Poisson variance', `${num(lam, 1)}, the same as its mean`] : null,
    ]);
  }
  draw();
}

// ================================================================ standard errors and confidence intervals

const BW_MEAN = 2945, BW_SD = 729;

function sampling(root) {
  const H = 300;
  const s = frame(root, H, 'Sample means of birth weight pile up around the true mean, more tightly for larger samples');
  let n = 30, means = [], last = null, stop = () => {};
  const r = S.rng(5);
  const x = linear([500, 5400], [44, 524]);
  const draw1 = () => {
    const v = Array.from({ length: n }, () => BW_MEAN + BW_SD * S.randn(r));
    last = v;
    means.push(S.mean(v));
  };
  const n$ = choice({
    label: 'Sample size', value: n,
    options: [5, 30, 200].map((v) => ({ value: v, text: String(v) })),
    onchange: (v) => { stop(); n = v; means = []; last = null; draw(); },
  });
  const one = button('Take 1 sample', () => { stop(); draw1(); draw(); });
  const many = button('Take 100 samples', () => {
    stop();
    let done = 0;
    stop = animate(1200, (t) => {
      const target = Math.round(100 * ease(t));
      while (done < target) { draw1(); done++; }
      draw();
    });
  });
  const again = button('Start again', () => { stop(); means = []; last = null; draw(); }, 'btn-quiet');
  controls(root, n$.el, h('div', { class: 'ctl actions' }, one, many, again));
  const ro = readout();
  root.append(ro.el);
  note(root, 'Samples from a normal population with the mean and SD of the 189 birth weights.');

  function draw() {
    clear(s);
    // one sample, as dots
    text(s, 44, 22, last ? `The last sample of ${n}` : 'Take a sample', { class: 'lbl' });
    if (last) {
      const rr = S.rng(3);
      for (const v of last.slice(0, 200)) el('circle', { cx: x(v), cy: 52 + (rr() - 0.5) * 22, r: n > 50 ? 2.5 : 4, class: 'f-blue', opacity: 0.6 }, s);
      const m = S.mean(last);
      el('line', { x1: x(m), x2: x(m), y1: 34, y2: 70, class: 's-orange', 'stroke-width': 3 }, s);
    }
    // the sample means
    const w = n === 200 ? 20 : 50;
    const b = bins(means, 500, 5400, w);
    const top = Math.max(8, ...b.map((d) => d.n)) * 1.15;
    const y = linear([0, top], [236, 104]);
    text(s, 44, 100, means.length ? `Means of ${num(means.length)} samples` : 'The means of the samples collect here', { class: 'lbl' });
    for (const d of b) {
      if (!d.n) continue;
      el('rect', { x: x(d.x0) + 0.5, width: Math.max(1, x(d.x1) - x(d.x0) - 1), y: y(d.n), height: y(0) - y(d.n), class: 'f-orange', opacity: 0.8 }, s);
    }
    if (means.length >= 20) {
      const se = BW_SD / Math.sqrt(n), pts = [];
      for (let i = 0; i <= 160; i++) {
        const v = BW_MEAN - 4 * se + (8 * se * i) / 160;
        pts.push([x(v), y(means.length * w * S.normPdf(v, BW_MEAN, se))]);
      }
      el('path', { d: line(pts.filter((p) => p[1] >= 96)), class: 's-ink f-none', 'stroke-width': 1.5 }, s);
    }
    axisX(s, x, 238, { values: [1000, 2000, 3000, 4000, 5000], format: (v) => num(v), label: 'Birth weight (g)' });
    ro.set([
      ['Samples', num(means.length)],
      ['SD of the sample means', means.length > 1 ? `${num(S.sd(means))} g` : '–'],
      [`SE = 729 / √${n}`, `${num(BW_SD / Math.sqrt(n))} g`],
    ]);
  }
  draw();
  return { destroy: () => stop() };
}

function coverage(root) {
  const H = 300;
  const s = frame(root, H, 'Confidence intervals from repeated samples; most contain the true mean');
  let n = 30, level = 0.95, shown = [], hits = 0, total = 0, stop = () => {};
  const r = S.rng(21);
  const x = linear([1700, 4200], [20, 520]);
  const SHOW = 40;
  const one = () => {
    const v = Array.from({ length: n }, () => BW_MEAN + BW_SD * S.randn(r));
    const m = S.mean(v), se = S.sd(v) / Math.sqrt(n), t = S.qt(1 - (1 - level) / 2, n - 1);
    const ci = [m - t * se, m + t * se];
    const hit = ci[0] <= BW_MEAN && BW_MEAN <= ci[1];
    shown.push({ m, ci, hit });
    if (shown.length > SHOW) shown.shift();
    total++;
    if (hit) hits++;
  };
  const restart = () => { stop(); shown = []; hits = 0; total = 0; draw(); };
  const n$ = choice({ label: 'Sample size', value: n, options: [5, 30, 200].map((v) => ({ value: v, text: String(v) })), onchange: (v) => { n = v; restart(); } });
  const l$ = choice({ label: 'Confidence', value: level, options: [0.9, 0.95, 0.99].map((v) => ({ value: v, text: pct(v) })), onchange: (v) => { level = v; restart(); } });
  const b1 = button('Draw 1', () => { stop(); one(); draw(); });
  const b40 = button('Draw 40', () => {
    stop();
    let done = 0;
    stop = animate(1500, (t) => { const target = Math.round(SHOW * t); while (done < target) { one(); done++; } draw(); });
  });
  const b1000 = button('Draw 1,000', () => { stop(); for (let i = 0; i < 1000; i++) one(); draw(); }, 'btn-quiet');
  controls(root, n$.el, l$.el, h('div', { class: 'ctl actions' }, b1, b40, b1000));
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    const top = 14, step = 5.6;
    el('line', { x1: x(BW_MEAN), x2: x(BW_MEAN), y1: top - 6, y2: top + SHOW * step + 4, class: 's-ink', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }, s);
    shown.forEach((d, i) => {
      const yy = top + (SHOW - shown.length + i) * step + 3;
      const a = Math.max(1700, d.ci[0]), b = Math.min(4200, d.ci[1]);
      el('line', { x1: x(a), x2: x(b), y1: yy, y2: yy, class: d.hit ? 's-blue' : 's-red', 'stroke-width': d.hit ? 2.5 : 3.5 }, s);
      el('circle', { cx: x(d.m), cy: yy, r: 2.2, class: d.hit ? 'f-blue' : 'f-red' }, s);
    });
    text(s, x(BW_MEAN) + 6, top + SHOW * step + 16, 'True mean 2,945 g', { class: 'lbl' });
    axisX(s, x, 262, { values: [2000, 2500, 3000, 3500, 4000], format: (v) => num(v), label: 'Birth weight (g)' });
    const inShown = shown.filter((d) => d.hit).length;
    ro.set([
      ['Shown', shown.length ? `${inShown} of ${shown.length} contain the true mean` : 'Draw some intervals'],
      ['All so far', total ? `${num(hits)} of ${num(total)} (${pct(hits / total, 1)})` : '–'],
    ]);
  }
  draw();
  return { destroy: () => stop() };
}

function alleles(root) {
  const H = 290;
  const s = frame(root, H, 'Counting alleles: each person carries two copies');
  const SNPS = {
    actn3: { name: 'actn3_rs540874', g: [226, 595, 395] },
    esr1: { name: 'esr1_rs1042717', g: [71, 468, 681] },
  };
  let snp = 'actn3', people = null;
  const realN = () => S.sum(SNPS[snp].g);
  const toN = (v) => Math.round(50 * 200 ** (v / 100));
  const fromN = (n) => (100 * Math.log(n / 50)) / Math.log(200);
  const snp$ = choice({
    label: 'SNP', value: snp, options: Object.entries(SNPS).map(([k, v]) => ({ value: k, text: v.name })),
    onchange: (v) => { snp = v; people = null; size.set(fromN(realN())); draw(); },
  });
  const size = slider({
    label: 'People genotyped', min: 0, max: 100, step: 0.5, value: fromN(realN()),
    format: (v) => num(toN(v)), oninput: (v) => { people = toN(v); draw(); },
  });
  controls(root, snp$.el, size.el);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    const real = SNPS[snp].g, nReal = S.sum(real);
    const n = people == null ? nReal : people;
    const gc = real.map((c) => Math.round((c * n) / nReal));
    const N = 2 * S.sum(gc);
    const A = 2 * gc[0] + gc[1];
    const phat = A / N, se = Math.sqrt((phat * (1 - phat)) / N);
    const x = linear([0, Math.max(...gc.map((c) => 2 * c))], [120, 520]);
    // genotypes, as their alleles
    ['AA', 'GA', 'GG'].forEach((lab, i) => {
      const yy = 22 + i * 34;
      text(s, 20, yy + 17, `${lab}  ${num(gc[i])}`, { class: 'lbl' });
      const nA = [2, 1, 0][i] * gc[i], nG = 2 * gc[i] - nA;
      if (nA) el('rect', { x: x(0), y: yy, width: x(nA) - x(0), height: 24, class: 'f-plum', opacity: 0.85 }, s);
      if (nG) el('rect', { x: x(nA), y: yy, width: x(nA + nG) - x(nA), height: 24, class: 'f-hair' }, s);
    });
    // all the alleles in one bar
    const xa = linear([0, N], [120, 520]);
    text(s, 20, 155, 'Alleles', { class: 'lbl' });
    el('rect', { x: xa(0), y: 138, width: xa(A) - xa(0), height: 26, class: 'f-plum', opacity: 0.85 }, s);
    el('rect', { x: xa(A), y: 138, width: xa(N) - xa(A), height: 26, class: 'f-hair' }, s);
    text(s, xa(0) + 8, 156, `A ${num(A)}`, { class: 'lbl c-paper' });
    text(s, xa(N) - 8, 156, `G ${num(N - A)}`, { 'text-anchor': 'end', class: 'lbl' });
    // the estimate and its 95% CI
    const xf = linear([0.1, 0.6], [120, 520]);
    const lo = phat - 1.96 * se, hi = phat + 1.96 * se;
    text(s, 20, 214, 'p̂, 95% CI', { class: 'lbl' });
    el('line', { x1: xf(Math.max(0.1, lo)), x2: xf(Math.min(0.6, hi)), y1: 208, y2: 208, class: 's-ink', 'stroke-width': 3 }, s);
    for (const v of [lo, hi]) if (v > 0.1 && v < 0.6) el('line', { x1: xf(v), x2: xf(v), y1: 200, y2: 216, class: 's-ink', 'stroke-width': 2 }, s);
    el('circle', { cx: xf(phat), cy: 208, r: 6, class: 'f-plum' }, s);
    axisX(s, xf, 230, { values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6], format: (v) => num(v, 1), label: 'Frequency of allele A' });
    ro.set([
      ['p̂', `(2 × ${num(gc[0])} + ${num(gc[1])}) / ${num(N)} = ${num(phat, 2)}`],
      ['SE', `√[ p̂(1 − p̂) / ${num(N)} ] = ${num(se, 4)}`],
      ['95% CI', `${num(lo, 3)} to ${num(hi, 3)}`],
    ]);
  }
  draw();
}

// ================================================================ tests

const SMOKE_SE = Math.sqrt(70 ** 2 + 77 ** 2); // 104 g, from the lecture

function pArea(root) {
  const H = 300;
  const s = frame(root, H, 'The p-value is the area beyond the observed t, if H0 is true');
  let diff = 284, sides = 2;
  const df = 170;
  const ds = slider({ label: 'Difference in means', min: 0, max: 500, value: diff, format: (v) => `${num(v)} g`, oninput: (v) => { diff = v; draw(); } });
  const sd$ = choice({ label: 'Test', value: sides, options: [{ value: 2, text: 'Two-sided' }, { value: 1, text: 'One-sided' }], onchange: (v) => { sides = v; draw(); } });
  controls(root, ds.el, sd$.el);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    const t = diff / SMOKE_SE;
    const x = linear([-5, 5], [24, 516]);
    const y = linear([0, 0.42], [170, 14]);
    const pts = (a, b) => {
      const out = [];
      for (let i = 0; i <= 100; i++) { const v = a + ((b - a) * i) / 100; out.push([x(v), y(S.tPdf(v, df))]); }
      return out;
    };
    const tc = Math.min(t, 5);
    el('path', { d: area(pts(tc, 5), y(0)), class: 'f-red', opacity: 0.55 }, s);
    if (sides === 2) el('path', { d: area(pts(-5, -tc), y(0)), class: 'f-red', opacity: 0.55 }, s);
    el('path', { d: line(pts(-5, 5)), class: 's-ink f-none', 'stroke-width': 2.5 }, s);
    el('line', { x1: x(tc), x2: x(tc), y1: y(0), y2: 30, class: 's-orange', 'stroke-width': 3 }, s);
    text(s, x(tc) + (tc > 3.5 ? -6 : 6), 28, `t = ${num(t, 2)}`, { class: 'lbl c-orange', 'text-anchor': tc > 3.5 ? 'end' : 'start' });
    text(s, x(-4.6), 40, 'If H₀ is true', { class: 'lbl c-muted' });
    axisX(s, x, 172, { values: [-4, -2, 0, 2, 4], format: (v) => num(v), tickLen: 4 });
    // the confidence interval for the difference
    const c = S.qt(0.975, df);
    const lo = diff - c * SMOKE_SE, hi = diff + c * SMOKE_SE;
    const xd = linear([-300, 800], [24, 516]);
    text(s, 24, 222, '95% CI for the difference', { class: 'lbl' });
    el('line', { x1: xd(0), x2: xd(0), y1: 228, y2: 260, class: 's-muted', 'stroke-dasharray': '4 3' }, s);
    el('line', { x1: xd(lo), x2: xd(hi), y1: 244, y2: 244, class: lo > 0 ? 's-green' : 's-red', 'stroke-width': 4 }, s);
    el('circle', { cx: xd(diff), cy: 244, r: 6, class: lo > 0 ? 'f-green' : 'f-red' }, s);
    axisX(s, xd, 262, { values: [-200, 0, 200, 400, 600, 800], format: (v) => num(v), tickLen: 4 });
    const p = sides === 2 ? S.tP2(t, df) : 1 - S.tCdf(t, df);
    ro.set([
      ['t', `${num(diff)} / ${num(SMOKE_SE)} = ${num(t, 2)}`],
      ['P', `${pnum(p)}, the red area`],
      ['95% CI', `${num(lo)} to ${num(hi)} g${lo > 0 ? ', excludes 0' : ', includes 0'}`],
    ]);
  }
  draw();
}

function pvalueSize(root) {
  const H = 250;
  const s = frame(root, H, 'Two studies with small p-values: a tiny effect in a huge sample and a large effect in a small one');
  const SD = 750;
  let diff = 100, people = 1000;
  const toN = (v) => Math.round(20 * 50000 ** (v / 100));
  const fromN = (n) => (100 * Math.log(n / 20)) / Math.log(50000);
  const d$ = slider({ label: 'Your difference', min: 0, max: 400, step: 5, value: diff, format: (v) => `${num(v)} g`, oninput: (v) => { diff = v; draw(); } });
  const n$ = slider({ label: 'Your babies', min: 0, max: 100, step: 0.5, value: fromN(people), format: (v) => num(toN(v)), oninput: (v) => { people = toN(v); draw(); } });
  controls(root, d$.el, n$.el);
  note(root, 'Two equal groups, birth weight SD 750 g, t-test.');

  function study(N, d) {
    const se = SD * Math.sqrt(4 / N), df = N - 2;
    const c = df > 1000 ? 1.96 : S.qt(0.975, df);
    return { lo: d - c * se, hi: d + c * se, d, p: pT2(d / se, df) };
  }
  function draw() {
    clear(s);
    const x = linear([-100, 600], [150, 524]);
    el('line', { x1: x(0), x2: x(0), y1: 10, y2: 214, class: 's-muted', 'stroke-dasharray': '4 3' }, s);
    const rows = [
      ['Study A', '1,000,000 babies', study(1e6, 5)],
      ['Study B', '120 babies', study(120, 300)],
      ['Your study', `${num(people)} babies`, study(people, diff)],
    ];
    rows.forEach(([name, size, st], i) => {
      const yy = 40 + i * 64;
      text(s, 10, yy - 6, name, { class: 'lbl-strong' });
      text(s, 10, yy + 14, size, { class: 'tick' });
      text(s, 10, yy + 32, pval(st.p), { class: 'lbl c-plum' });
      const a = Math.max(-100, st.lo), b = Math.min(600, st.hi);
      el('line', { x1: x(a), x2: x(b), y1: yy + 4, y2: yy + 4, class: i === 2 ? 's-orange' : 's-blue', 'stroke-width': 4 }, s);
      el('circle', { cx: x(st.d), cy: yy + 4, r: 6, class: i === 2 ? 'f-orange' : 'f-blue' }, s);
      text(s, x(st.d), yy - 8, `${num(st.d)} g`, { class: 'tick', 'text-anchor': 'middle' });
    });
    axisX(s, x, 216, { values: [-100, 0, 100, 200, 300, 400, 500, 600], format: (v) => num(v), label: 'Difference in birth weight (g), with 95% CI', tickLen: 4 });
  }
  draw();
}

function power(root) {
  const H = 270;
  const s = frame(root, H, 'Power: the area of the H1 curve beyond the critical value');
  let d = 0.5, n1 = 30, n2 = 40, alpha = 0.05;
  const sizeText = () => (n1 === n2 ? `${n1} each` : `${n1} and ${n2}`);
  const d$ = slider({ label: 'True difference', min: 0, max: 1.5, step: 0.05, value: d, format: (v) => `${num(v, 2)} SD`, oninput: (v) => { d = v; draw(); } });
  const n$ = slider({ label: 'Group sizes', min: 5, max: 200, value: 35, format: () => sizeText(), oninput: (v) => { n1 = n2 = v; n$.set(v); draw(); } });
  const a$ = choice({ label: 'α', value: alpha, options: [0.01, 0.05, 0.1].map((v) => ({ value: v, text: num(v, 2) })), onchange: (v) => { alpha = v; draw(); } });
  const presets = h('div', { class: 'ctl presets' }, h('span', { class: 'ctl-label' }, 'Groups of'),
    button('30 and 40', () => { n1 = 30; n2 = 40; n$.set(35); draw(); }, 'btn-small'),
    button('85 each', () => { n1 = n2 = 85; n$.set(85); draw(); }, 'btn-small'));
  controls(root, d$.el, n$.el, presets, a$.el);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    const se = Math.sqrt(1 / n1 + 1 / n2), delta = d / se, df = n1 + n2 - 2;
    const c = S.qt(1 - alpha / 2, df);
    const pw = 1 - S.normCdf(c - delta) + S.normCdf(-c - delta);
    const x = linear([-4, 9], [16, 524]);
    const y = linear([0, 0.42], [200, 30]);
    const pts = (a, b, m) => {
      const out = [];
      for (let i = 0; i <= 100; i++) { const v = a + ((b - a) * i) / 100; out.push([x(v), y(S.normPdf(v, m, 1))]); }
      return out;
    };
    el('path', { d: area(pts(-4, c, delta), y(0)), class: 'f-muted', opacity: 0.25 }, s);
    el('path', { d: area(pts(c, 9, delta), y(0)), class: 'f-green', opacity: 0.45 }, s);
    el('path', { d: area(pts(c, 9, 0), y(0)), class: 'f-red', opacity: 0.7 }, s);
    el('path', { d: area(pts(-4, -c, 0), y(0)), class: 'f-red', opacity: 0.7 }, s);
    el('path', { d: line(pts(-4, 9, 0)), class: 's-ink f-none', 'stroke-width': 2 }, s);
    el('path', { d: line(pts(-4, 9, delta)), class: 's-plum f-none', 'stroke-width': 2.5 }, s);
    text(s, x(0), y(0.4) - 8, 'H₀', { 'text-anchor': 'middle', class: 'lbl-strong' });
    text(s, x(delta), y(0.4) - 8, 'H₁', { 'text-anchor': 'middle', class: 'lbl-strong c-plum' });
    for (const v of [-c, c]) el('line', { x1: x(v), x2: x(v), y1: y(0), y2: 36, class: 's-ink', 'stroke-dasharray': '4 3' }, s);
    text(s, x(c) + 4, 24, `Reject H₀ beyond ±${num(c, 2)}`, { class: 'tick' });
    axisX(s, x, 202, { values: [-2, 0, 2, 4, 6, 8], format: (v) => num(v), label: 'Test statistic', tickLen: 4 });
    ro.set([
      ['Power', pct(pw), 'hl-green'],
      ['β, Type II error', pct(1 - pw)],
      ['α, Type I error', pct(alpha), 'hl-red'],
      ['Groups', sizeText()],
    ]);
  }
  draw();
}

function pSimulation(root) {
  const H = 270;
  const s = frame(root, H, 'Histogram of p-values from simulated studies');
  let truth = 0, ps = [], stop = () => {};
  const r = S.rng(31);
  const study = () => {
    const a = Array.from({ length: 30 }, () => S.randn(r) + truth);
    const b = Array.from({ length: 40 }, () => S.randn(r));
    ps.push(S.welch(a, b).p);
  };
  const t$ = choice({
    label: 'Truth', value: truth, options: [{ value: 0, text: 'No difference' }, { value: 0.5, text: 'A difference of 0.5 SD' }],
    onchange: (v) => { stop(); truth = v; ps = []; draw(); },
  });
  const run = (k) => () => {
    stop();
    let done = 0;
    stop = animate(k > 100 ? 1400 : 700, (t) => { const target = Math.round(k * t); while (done < target) { study(); done++; } draw(); });
  };
  controls(root, t$.el, h('div', { class: 'ctl actions' }, button('Run 100 studies', run(100)), button('Run 1,000 studies', run(1000)),
    button('Start again', () => { stop(); ps = []; draw(); }, 'btn-quiet')));
  const ro = readout();
  root.append(ro.el);
  note(root, 'Each study compares groups of 30 and 40 with a t-test.');

  function draw() {
    clear(s);
    const b = bins(ps, 0, 1, 0.05);
    const top = Math.max(10, ...b.map((d) => d.n)) * 1.12;
    const x = linear([0, 1], [52, 524]);
    const y = linear([0, top], [210, 16]);
    axisY(s, y, 52, { values: ticks(0, top, 4).filter((v) => Number.isInteger(v)), format: (v) => num(v), grid: 524 });
    b.forEach((d, i) => {
      if (!d.n) return;
      el('rect', { x: x(d.x0) + 1, width: x(d.x1) - x(d.x0) - 2, y: y(d.n), height: y(0) - y(d.n), class: i === 0 ? (truth ? 'f-green' : 'f-red') : 'f-blue', opacity: i === 0 ? 0.85 : 0.5 }, s);
    });
    if (ps.length && !truth) {
      const e = ps.length / 20;
      el('line', { x1: x(0), x2: x(1), y1: y(e), y2: y(e), class: 's-ink', 'stroke-dasharray': '5 4' }, s);
    }
    axisX(s, x, 212, { values: [0, 0.05, 0.2, 0.4, 0.6, 0.8, 1], format: (v) => (v === 0 || v === 1 ? String(v) : num(v, 2)), label: 'p-value', tickLen: 4 });
    const k = ps.filter((p) => p < 0.05).length;
    ro.set([
      ['Studies', num(ps.length)],
      ['P below 0.05', ps.length ? `${num(k)} (${pct(k / ps.length, 1)})` : '–', truth ? 'hl-green' : 'hl-red'],
      [truth ? 'That is the power' : 'False positives', truth ? 'about 53% expected' : 'about 5% expected'],
    ]);
  }
  draw();
  return { destroy: () => stop() };
}

function permutation(root) {
  const H = 300;
  const s = frame(root, H, 'Shuffling the smoker and non-smoker labels builds the distribution of the difference if H0 is true');
  const non = exactNormal(115, 3056, 752, 8).map(Math.round);
  const smk = exactNormal(74, 2772, 660, 9).map(Math.round);
  const values = [...non, ...smk];
  const truth = values.map((_, i) => (i < 115 ? 0 : 1));
  let labels = [...truth], diffs = [], stop = () => {};
  const r = S.rng(41), rj = S.rng(4);
  const jit = values.map(() => (rj() - 0.5) * 22);
  const obs = S.mean(non) - S.mean(smk);
  const diffOf = (lab) => {
    let s0 = 0, s1 = 0, n0 = 0;
    for (let i = 0; i < values.length; i++) if (lab[i]) s1 += values[i]; else { s0 += values[i]; n0++; }
    return s0 / n0 - s1 / (values.length - n0);
  };
  const rowY = (lab) => (lab ? 104 : 46);
  let ys = labels.map((l, i) => rowY(l) + jit[i]);

  const once = button('Shuffle once', () => {
    stop();
    const from = ys.slice();
    labels = S.shuffle(labels.slice(), r);
    const to = labels.map((l, i) => rowY(l) + jit[i]);
    diffs.push(diffOf(labels));
    stop = animate(600, (t) => { const e = ease(t); ys = from.map((f, i) => f + (to[i] - f) * e); draw(); });
  });
  const many = button('Shuffle 10,000 times', () => {
    stop();
    const lab = labels.slice();
    for (let k = 0; k < 10000; k++) { S.shuffle(lab, r); diffs.push(diffOf(lab)); }
    labels = lab;
    ys = labels.map((l, i) => rowY(l) + jit[i]);
    draw();
  });
  const back = button('Back to the data', () => { stop(); labels = [...truth]; ys = labels.map((l, i) => rowY(l) + jit[i]); diffs = []; draw(); }, 'btn-quiet');
  controls(root, h('div', { class: 'ctl actions' }, once, many, back));
  const ro = readout();
  root.append(ro.el);
  note(root, 'Simulated with the means and SDs of the birthwt groups.');

  function draw() {
    clear(s);
    const x = linear([700, 5000], [130, 524]);
    text(s, 10, 51, 'Non-smokers', { class: 'lbl c-blue' });
    text(s, 10, 109, 'Smokers', { class: 'lbl c-orange' });
    values.forEach((v, i) => el('circle', { cx: x(v), cy: ys[i], r: 3.4, class: labels[i] ? 'f-orange' : 'f-blue', opacity: 0.7 }, s));
    const m0 = S.mean(values.filter((_, i) => !labels[i])), m1 = S.mean(values.filter((_, i) => labels[i]));
    el('line', { x1: x(m0), x2: x(m0), y1: 26, y2: 66, class: 's-ink', 'stroke-width': 3 }, s);
    el('line', { x1: x(m1), x2: x(m1), y1: 84, y2: 124, class: 's-ink', 'stroke-width': 3 }, s);
    // the shuffled differences
    const xd = linear([-450, 450], [130, 524]);
    const b = bins(diffs, -450, 450, 25);
    const top = Math.max(5, ...b.map((d) => d.n)) * 1.1;
    const y = linear([0, top], [236, 150]);
    text(s, 10, 192, diffs.length ? 'Shuffled' : 'Shuffle to', { class: 'lbl' });
    text(s, 10, 210, diffs.length ? 'differences' : 'fill this in', { class: 'lbl' });
    for (const d of b) if (d.n) el('rect', { x: xd(d.x0) + 0.5, width: xd(d.x1) - xd(d.x0) - 1, y: y(d.n), height: y(0) - y(d.n), class: Math.abs(d.x0 + 12.5) >= obs ? 'f-red' : 'f-muted', opacity: 0.55 }, s);
    for (const v of [-obs, obs]) el('line', { x1: xd(v), x2: xd(v), y1: 146, y2: 236, class: 's-red', 'stroke-width': 2 }, s);
    text(s, xd(obs) + 5, 158, `${num(obs)} g`, { class: 'tick c-red' });
    axisX(s, xd, 238, { values: [-400, -200, 0, 200, 400], format: (v) => num(v), label: 'Difference in means, non-smokers − smokers (g)', tickLen: 4 });
    const k = diffs.filter((d) => Math.abs(d) >= obs - 1e-9).length;
    ro.set([
      ['Observed difference', `${num(obs)} g`],
      ['Shuffles', num(diffs.length)],
      ['At least as extreme', diffs.length ? `${num(k)}, so P ≈ ${num(k / diffs.length, 3)}` : '–'],
    ]);
  }
  draw();
  return { destroy: () => stop() };
}

function table2x2(root) {
  const H = 230;
  root.classList.add('demo-wide');
  const wrap = h('div', { class: 'demo-pair' });
  root.append(wrap);
  const tbl = h('table', { class: 'counts' });
  wrap.append(tbl);
  const s = svg(270, H, 'Proportion of low birth weight among smokers and non-smokers');
  wrap.append(s);
  let a = 30, showE = false;
  const a$ = slider({ label: 'Smokers’ low-weight babies', min: 0, max: 59, value: a, oninput: (v) => { a = v; draw(); } });
  const e$ = choice({ label: 'Expected counts', value: showE, options: [{ value: false, text: 'Hide' }, { value: true, text: 'Show' }], onchange: (v) => { showE = v; draw(); } });
  controls(root, a$.el, e$.el);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    const b = 74 - a, c = 59 - a, d = 56 + a;
    const chi = S.chisqTable([[a, b], [c, d]]);
    const E = chi.expected;
    const cell = (o, e) => h('td', null, h('span', { class: 'obs' }, num(o)), showE ? h('span', { class: 'exp' }, num(e, 1)) : null);
    tbl.replaceChildren(
      h('thead', null, h('tr', null, h('th'), h('th', { scope: 'col' }, 'Low weight'), h('th', { scope: 'col' }, 'Normal'), h('th', { scope: 'col' }, 'Total'))),
      h('tbody', null,
        h('tr', null, h('th', { scope: 'row' }, 'Smoker'), cell(a, E[0][0]), cell(b, E[0][1]), h('td', { class: 'tot' }, '74')),
        h('tr', null, h('th', { scope: 'row' }, 'Non-smoker'), cell(c, E[1][0]), cell(d, E[1][1]), h('td', { class: 'tot' }, '115')),
        h('tr', { class: 'tot' }, h('th', { scope: 'row' }, 'Total'), h('td', null, '59'), h('td', null, '130'), h('td', null, '189'))));
    clear(s);
    const y = linear([0, 1], [196, 16]);
    const x0 = 34, wTot = 226;
    const w1 = (wTot * 74) / 189, w2 = (wTot * 115) / 189;
    const col = (xx, w, low, tot, lab) => {
      el('rect', { x: xx, y: y(1), width: w - 4, height: y(0) - y(1), class: 'f-hair' }, s);
      el('rect', { x: xx, y: y(low / tot), width: w - 4, height: y(0) - y(low / tot), class: 'f-plum', opacity: 0.8 }, s);
      text(s, xx + (w - 4) / 2, y(low / tot) - 6, pct(low / tot), { 'text-anchor': 'middle', class: 'lbl-strong' });
      text(s, xx + (w - 4) / 2, 216, lab, { 'text-anchor': 'middle', class: 'tick' });
    };
    col(x0, w1, a, 74, 'Smokers');
    col(x0 + w1, w2, c, 115, 'Non-smokers');
    el('line', { x1: x0 - 4, x2: x0 + wTot, y1: y(59 / 189), y2: y(59 / 189), class: 's-ink', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }, s);
    axisY(s, y, x0 - 2, { values: [0, 0.5, 1], format: (v) => pct(v) });
    const or = b * c === 0 ? Infinity : (a * d) / (b * c);
    ro.set([
      ['Odds ratio', `(${a} × ${d}) / (${b} × ${c}) = ${isFinite(or) ? num(or, 2) : '∞'}`],
      ['Chi-square', `${num(chi.x2, 2)}, ${pval(chi.p)}`],
      ['Fisher', pval(S.fisher2x2(a, b, c, d))],
    ]);
  }
  draw();
  note(root, 'Dashed line: 59 of 189, the proportion if smoking and low weight were independent. Chi-square with Yates’ correction, as R’s default.');
}

function anova(root) {
  const H = 290;
  const s = frame(root, H, 'Expression in three leukaemia subtypes: variation between and within groups');
  const groups = [
    { name: 'ALL1/AF4', n: 10, m: 8.7212 },
    { name: 'BCR/ABL', n: 37, m: 9.7812 },
    { name: 'NEG', n: 42, m: 8.6812 },
  ];
  const SDW = Math.sqrt(0.293);
  groups.forEach((gr, i) => {
    const z = exactNormal(gr.n, 0, 1, 50 + i);
    gr.res = z.map((v) => v * SDW);
    const rj = S.rng(60 + i);
    gr.jit = gr.res.map(() => (rj() - 0.5) * 70);
  });
  const N = S.sum(groups.map((gr) => gr.n));
  const grand = S.sum(groups.map((gr) => gr.n * gr.m)) / N;
  let within = 1, between = 1, view = 'between';
  const v$ = choice({ label: 'Show', value: view, options: [{ value: 'between', text: 'Between groups' }, { value: 'within', text: 'Within groups' }], onchange: (v) => { view = v; draw(); } });
  const w$ = slider({ label: 'Spread within groups', min: 0.25, max: 2.5, step: 0.05, value: 1, format: (v) => `×${num(v, 2)}`, oninput: (v) => { within = v; draw(); } });
  const b$ = slider({ label: 'Distance between means', min: 0, max: 2, step: 0.05, value: 1, format: (v) => `×${num(v, 2)}`, oninput: (v) => { between = v; draw(); } });
  controls(root, v$.el, w$.el, b$.el);
  const ro = readout();
  root.append(ro.el);
  note(root, 'Simulated with the group sizes, means and spread of probe 1636_g_at.');

  function draw() {
    clear(s);
    const x = linear([0, 3], [60, 524]);
    const y = linear([6.5, 12], [256, 12]);
    axisY(s, y, 60, { values: [7, 8, 9, 10, 11, 12], grid: 524, label: 'Expression (log2)' });
    const data = groups.map((gr) => {
      const m = grand + between * (gr.m - grand);
      return { ...gr, mm: m, v: gr.res.map((r) => m + within * r) };
    });
    el('line', { x1: x(0), x2: x(3), y1: y(grand), y2: y(grand), class: 's-ink', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }, s);
    data.forEach((gr, i) => {
      const cx = x(i + 0.5);
      if (view === 'within') gr.v.forEach((v, j) => el('line', { x1: cx + gr.jit[j], x2: cx + gr.jit[j], y1: y(v), y2: y(gr.mm), class: 's-blue', opacity: 0.45 }, s));
      gr.v.forEach((v, j) => el('circle', { cx: cx + gr.jit[j], cy: y(Math.max(6.5, Math.min(12, v))), r: 3.4, class: 'f-blue', opacity: 0.65 }, s));
      if (view === 'between') el('line', { x1: cx, x2: cx, y1: y(grand), y2: y(gr.mm), class: 's-plum', 'stroke-width': 5 }, s);
      el('line', { x1: cx - 52, x2: cx + 52, y1: y(gr.mm), y2: y(gr.mm), class: 's-orange', 'stroke-width': 4 }, s);
      text(s, cx, 278, `${gr.name} (${gr.n})`, { 'text-anchor': 'middle', class: 'tick' });
    });
    const res = S.anova(data.map((gr) => gr.v));
    const kw = S.kruskal(data.map((gr) => gr.v));
    ro.set([
      ['F = between / within', `${num(res.msb, 2)} / ${num(res.msw, 3)} = ${num(res.f, 1)}`],
      ['ANOVA', pval(res.p)],
      ['Kruskal–Wallis', pval(kw.p)],
    ]);
  }
  draw();
}

function models(root) {
  const H = 270;
  const s = frame(root, H, 'Proportion with BMI above 25 by genotype, with the comparison each genetic model makes');
  const G = [
    { name: 'GG', x: 184, n: 564 },
    { name: 'GA', x: 130, n: 376 },
    { name: 'AA', x: 30, n: 60 },
  ];
  let model = 'any';
  const m$ = choice({
    label: 'Model', value: model,
    options: [{ value: 'any', text: 'Any (2 df)' }, { value: 'add', text: 'Additive' }, { value: 'dom', text: 'Dominant' }, { value: 'rec', text: 'Recessive' }],
    onchange: (v) => { model = v; draw(); },
  });
  controls(root, m$.el);
  const ro = readout();
  root.append(ro.el);
  const xs = G.map((g) => g.x), ns = G.map((g) => g.n);

  function draw() {
    clear(s);
    const x = linear([0, 3], [70, 520]);
    const y = linear([0, 0.7], [220, 14]);
    axisY(s, y, 70, { values: [0, 0.2, 0.4, 0.6], format: (v) => pct(v), grid: 520 });
    G.forEach((gr, i) => {
      const p = gr.x / gr.n, se = Math.sqrt((p * (1 - p)) / gr.n), cx = x(i + 0.5);
      el('rect', { x: cx - 44, width: 88, y: y(p), height: y(0) - y(p), class: 'f-blue', opacity: 0.5 }, s);
      el('line', { x1: cx, x2: cx, y1: y(p - 1.96 * se), y2: y(p + 1.96 * se), class: 's-ink', 'stroke-width': 1.5 }, s);
      text(s, cx, 242, gr.name, { 'text-anchor': 'middle', class: 'lbl-strong' });
      text(s, cx, 262, `${gr.x} of ${gr.n}`, { 'text-anchor': 'middle', class: 'tick' });
      text(s, cx + 48, y(p) + 18, pct(p), { class: 'tick' });
    });
    const groupLine = (from, to, p) => {
      el('line', { x1: x(from + 0.5) - 54, x2: x(to + 0.5) + 54, y1: y(p), y2: y(p), class: 's-orange', 'stroke-width': 4 }, s);
    };
    let rows;
    if (model === 'any') {
      const c = S.chisqTable([G.map((g) => g.x), G.map((g) => g.n - g.x)], false);
      rows = [['Chi-square', `${num(c.x2, 2)}, ${c.df} df`], ['P', pnum(c.p)], ['Genetic model', 'none assumed']];
    } else if (model === 'add') {
      const t = S.propTrend(xs, ns, [0, 1, 2]);
      el('path', { d: line([0, 1, 2].map((k) => [x(k + 0.5), y(t.intercept + t.slope * k)])), class: 's-orange', 'stroke-width': 4 }, s);
      rows = [['Trend test, scores', '0, 1, 2 for GG, GA, AA'], ['X²', `${num(t.x2, 2)}, 1 df`], ['P', pnum(t.p)]];
    } else if (model === 'dom') {
      const t = S.propTrend(xs, ns, [0, 1, 1]);
      groupLine(0, 0, G[0].x / G[0].n);
      groupLine(1, 2, (G[1].x + G[2].x) / (G[1].n + G[2].n));
      rows = [['Compares', 'AA or GA with GG'], ['X²', `${num(t.x2, 2)}, 1 df`], ['P', pnum(t.p)]];
    } else {
      const t = S.propTrend(xs, ns, [0, 0, 1]);
      groupLine(0, 1, (G[0].x + G[1].x) / (G[0].n + G[1].n));
      groupLine(2, 2, G[2].x / G[2].n);
      const a = 30, b = 30, c = 314, d = 626;
      const or = (a * d) / (b * c), se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
      rows = [['Compares', 'AA with GA or GG'], ['P', pnum(t.p)], ['Odds ratio', `${num(or, 2)} (${num(or * Math.exp(-1.96 * se), 2)} to ${num(or * Math.exp(1.96 * se), 2)})`]];
    }
    ro.set(rows);
  }
  draw();
  note(root, 'FAMuSS, esr1_rs1042717: BMI above 25 by genotype, with 95% CIs.');
}

function hwe(root) {
  const H = 270;
  const s = frame(root, H, 'Genotype frequencies under Hardy–Weinberg equilibrium, and FAMuSS counts against them');
  const OBS = [71, 468, 681];
  let p = 0.25, miss = 0;
  const p$ = slider({ label: 'Frequency of A', min: 0, max: 1, step: 0.01, value: p, format: (v) => num(v, 2), oninput: (v) => { p = v; draw(); } });
  const m$ = slider({ label: 'Heterozygotes miscalled', min: 0, max: 0.3, step: 0.01, value: 0, format: (v) => pct(v), oninput: (v) => { miss = v; draw(); } });
  controls(root, p$.el, m$.el);
  const ro = readout();
  root.append(ro.el);

  function draw() {
    clear(s);
    // left: frequencies against p
    const x = linear([0, 1], [46, 246]);
    const y = linear([0, 1], [216, 24]);
    axisY(s, y, 46, { values: [0, 0.5, 1], format: (v) => num(v, 1), grid: 246 });
    const curves = [['AA', (q) => q * q, 's-plum'], ['GA', (q) => 2 * q * (1 - q), 's-orange'], ['GG', (q) => (1 - q) ** 2, 's-blue']];
    for (const [name, f, cls] of curves) {
      el('path', { d: line(Array.from({ length: 51 }, (_, i) => [x(i / 50), y(f(i / 50))])), class: `${cls} f-none`, 'stroke-width': 2.5 }, s);
      el('circle', { cx: x(p), cy: y(f(p)), r: 5, class: cls.replace('s-', 'f-') }, s);
    }
    text(s, x(0.9), y(0.81) - 6, 'AA', { class: 'lbl c-plum', 'text-anchor': 'middle' });
    text(s, x(0.5), y(0.5) - 8, 'GA', { class: 'lbl c-orange', 'text-anchor': 'middle' });
    text(s, x(0.1), y(0.81) - 6, 'GG', { class: 'lbl c-blue', 'text-anchor': 'middle' });
    el('line', { x1: x(p), x2: x(p), y1: y(0), y2: y(1), class: 's-ink', 'stroke-dasharray': '4 3' }, s);
    axisX(s, x, 218, { values: [0, 0.25, 0.5, 0.75, 1], format: (v) => num(v, 2), label: 'Frequency of allele A (p)', tickLen: 4 });
    // right: FAMuSS, observed against expected
    const moved = Math.round(OBS[1] * miss);
    const O = [OBS[0] + Math.floor(moved / 2), OBS[1] - moved, OBS[2] + Math.ceil(moved / 2)];
    const n = S.sum(O), ph = (2 * O[0] + O[1]) / (2 * n);
    const E = [n * ph * ph, n * 2 * ph * (1 - ph), n * (1 - ph) ** 2];
    const x2 = S.sum(O.map((o, i) => (o - E[i]) ** 2 / E[i]));
    const pv = S.chi2Upper(x2, 1);
    const yb = linear([0, 800], [216, 24]);
    const xb = (i) => 300 + i * 78;
    axisY(s, yb, 296, { values: [0, 400, 800], format: (v) => num(v) });
    ['AA', 'GA', 'GG'].forEach((gn, i) => {
      el('rect', { x: xb(i) + 4, width: 30, y: yb(O[i]), height: yb(0) - yb(O[i]), class: 'f-blue', opacity: 0.75 }, s);
      el('rect', { x: xb(i) + 36, width: 30, y: yb(E[i]), height: yb(0) - yb(E[i]), class: 'f-hair s-muted' }, s);
      text(s, xb(i) + 35, 236, gn, { 'text-anchor': 'middle', class: 'lbl-strong' });
    });
    el('rect', { x: 300, y: 4, width: 12, height: 12, class: 'f-blue', opacity: 0.75 }, s);
    text(s, 318, 15, 'Observed', { class: 'tick' });
    el('rect', { x: 400, y: 4, width: 12, height: 12, class: 'f-hair s-muted' }, s);
    text(s, 418, 15, 'Expected', { class: 'tick' });
    ro.set([
      ['FAMuSS', `AA ${O[0]}, GA ${O[1]}, GG ${O[2]}; p̂ = ${num(ph, 2)}`],
      ['χ², 1 df', `${num(x2, 2)}, ${pval(pv)}`],
      ['Quality check', pv < 0.05 ? 'fails: look for genotyping errors' : 'passes', pv < 0.05 ? 'hl-red' : 'hl-green'],
    ]);
  }
  draw();
}

function chooser(root) {
  const ROWS = [
    ['Continuous', 'Two groups', 't-test, Wilcoxon, permutation'],
    ['Continuous', 'Three or more groups', 'ANOVA, Kruskal–Wallis'],
    ['Categorical', 'Categorical', 'Chi-square, Fisher'],
    ['Continuous', 'Continuous', 'Regression (week 4)'],
    ['Binary', 'Any', 'Logistic regression (week 4)'],
  ];
  const NOTES = {
    'Continuous|Two groups': [0, 't-test if the data are close to normal or the sample is large; Wilcoxon or a permutation test for small samples that are clearly not normal.'],
    'Continuous|Three or more groups': [1, 'Kruskal–Wallis for small samples that are clearly not normal. Then TukeyHSD() shows which groups differ.'],
    'Continuous|A continuous measure': [3, 'Regression, next week: it unifies the tests of this week.'],
    'Categorical|Two groups': [2, 'Two categorical variables make a table: chi-square if every expected count is at least 5, otherwise Fisher.'],
    'Categorical|Three or more groups': [2, 'A 2 × 3 table, such as genotype by trait: chi-square on 2 df, or a trend test for a genetic model.'],
    'Categorical|A continuous measure': [4, 'Turn it round: for a binary outcome, logistic regression (week 4).'],
    'Binary|Two groups': [2, 'A 2 × 2 table: chi-square or Fisher, with the odds ratio. Logistic regression (week 4) gives the same and more.'],
    'Binary|Three or more groups': [2, 'A 2 × 3 table: chi-square, or a trend test. Logistic regression (week 4) also works.'],
    'Binary|A continuous measure': [4, 'Logistic regression, in week 4.'],
  };
  let outcome = 'Continuous', across = 'Two groups';
  const o$ = choice({ label: 'The outcome is', value: outcome, options: ['Continuous', 'Categorical', 'Binary'].map((v) => ({ value: v, text: v })), onchange: (v) => { outcome = v; draw(); } });
  const a$ = choice({ label: 'Compared across', value: across, options: ['Two groups', 'Three or more groups', 'A continuous measure'].map((v) => ({ value: v, text: v })), onchange: (v) => { across = v; draw(); } });
  root.append(h('div', { class: 'demo-controls chooser-q' }, o$.el, a$.el));
  const tbl = h('table', { class: 'chooser' });
  const advice = h('p', { class: 'chooser-advice', 'aria-live': 'polite' });
  root.append(tbl, advice);
  function draw() {
    const [row, words] = NOTES[`${outcome}|${across}`];
    tbl.replaceChildren(
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Outcome'), h('th', { scope: 'col' }, 'Groups or predictor'), h('th', { scope: 'col' }, 'Test'))),
      h('tbody', null, ROWS.map((r, i) => h('tr', { class: i === row ? 'on' : null }, r.map((c) => h('td', null, c))))));
    advice.textContent = words;
  }
  draw();
  root.append(h('p', { class: 'demo-note' }, 'The table is Leonardo’s, from Lecture W3, Part A.'));
}

// ================================================================ registry

export const DEMOS = {
  meanMedian, normal, counts, sampling, coverage, alleles,
  pArea, pvalueSize, power, pSimulation, permutation, table2x2, anova, models, hwe, chooser,
};

/** Draws demo `name` into element `root`. Returns { destroy() } to stop any animation. */
export function mountDemo(name, root) {
  const f = DEMOS[name];
  root.replaceChildren();
  root.classList.add('demo', `demo-${name}`);
  if (!f) return { destroy() {} };
  const r = f(root);
  return { destroy: (r && r.destroy) || (() => {}) };
}

