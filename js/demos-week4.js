// The interactive graphs of week 4: linear and logistic regression. They fit the models in the
// browser to the real birthwt data (js/data/birthwt.js), so every number matches Leonardo's R output.

import { h, num, pct, pval, pnum, slider, choice, button, readout, animate, ease } from './ui.js';
import { el, clear, text, linear, line, axisX, axisY } from './svg.js';
import * as S from './stats.js';
import { frame, controls, note, code } from './demo-kit.js';
import { BIRTHWT as B } from './data/birthwt.js';

const N = B.bwt.length;
const RACES = ['White', 'Black', 'Other'];
const RACE_COLOUR = ['blue', 'orange', 'green'];
const SOURCE = 'The birthwt data: 189 births, Baystate Medical Center, 1986.';
const isBlack = (i) => +(B.race[i] === 1);
const isOther = (i) => +(B.race[i] === 2);
const idx = Array.from({ length: N }, (_, i) => i);
const g$ = (v) => `${num(v)} g`;

/** The 95% confidence interval of coefficient j of a linear fit. */
function ci(fit, j) {
  const t = S.qt(0.975, fit.df);
  return [fit.beta[j] - t * fit.se[j], fit.beta[j] + t * fit.se[j]];
}
/** "−366 g (95% CI −683 to −49), P = 0.02" */
function effect(fit, j, unit = ' g', d = 0) {
  const [lo, hi] = ci(fit, j);
  return `${num(fit.beta[j], d)}${unit} (95% CI ${num(lo, d)} to ${num(hi, d)}), ${pval(fit.p[j])}`;
}

// Fits used by several graphs
const fitAge = S.ols(idx.map((i) => [1, B.age[i]]), B.bwt);
const fitRaceAge = S.ols(idx.map((i) => [1, isBlack(i), isOther(i), B.age[i]]), B.bwt);
const fitInteraction = S.ols(idx.map((i) => [1, isBlack(i), isOther(i), B.age[i], isBlack(i) * B.age[i], isOther(i) * B.age[i]]), B.bwt);
const fitCrude = S.ols(idx.map((i) => [1, B.smoke[i]]), B.bwt);
const fitAdjusted = S.ols(idx.map((i) => [1, B.smoke[i], isBlack(i), isOther(i), B.age[i]]), B.bwt);

/** A key of coloured dots for the three races. */
function raceKey() {
  return h('p', { class: 'demo-key' }, RACES.map((r, k) => h('span', null,
    h('i', { class: `k-${RACE_COLOUR[k]}` }), `${r} (${B.race.filter((c) => c === k).length})`)));
}

// ================================================================ simple linear regression

function leastSquares(root) {
  const H = 262;
  const s = frame(root, H, 'Birth weight against mother’s age, with a straight line and its residuals');
  // 25 births, as in the lecture's picture of least squares
  const pick = S.shuffle(idx.slice(), S.rng(112)).slice(0, 25);
  const pts = pick.map((i) => [B.age[i], B.bwt[i]]);
  const fit25 = S.ols(pts.map(([a]) => [1, a]), pts.map(([, b]) => b));
  const best = { slope: fit25.beta[1], mid: fit25.beta[0] + 25 * fit25.beta[1] };
  let view = 'fit', slope = 70, mid = 3500, stop = () => {};

  const v$ = choice({
    label: 'Show', value: view,
    options: [{ value: 'fit', text: 'Fit a line to 25 births' }, { value: 'all', text: 'All 189 births' }],
    onchange: (v) => { view = v; show(); draw(); },
  });
  const sl$ = slider({ label: 'Slope', min: -100, max: 120, step: 1, value: slope, format: (v) => `${num(v)} g per year`, oninput: (v) => { stop(); slope = v; draw(); } });
  const md$ = slider({ label: 'Height at age 25', min: 2000, max: 4000, step: 10, value: mid, format: g$, oninput: (v) => { stop(); mid = v; draw(); } });
  const lsq = button('Least squares', () => {
    stop();
    const from = { slope, mid };
    stop = animate(700, (t) => {
      const e = ease(t);
      slope = from.slope + (best.slope - from.slope) * e;
      mid = from.mid + (best.mid - from.mid) * e;
      sl$.set(Math.round(slope));
      md$.set(Math.round(mid / 10) * 10);
      draw();
    });
  });
  const fitControls = h('div', { class: 'ctl actions' }, sl$.el, md$.el, lsq);
  controls(root, v$.el, fitControls);
  const ro = readout();
  root.append(ro.el);
  const show = () => { fitControls.hidden = view !== 'fit'; };

  function draw() {
    clear(s);
    if (view === 'fit') {
      const x = linear([12, 46], [64, 524]);
      const y = linear([500, 5000], [212, 12]);
      const clip = (v) => Math.max(500, Math.min(5000, v));
      axisY(s, y, 64, { values: [1000, 2000, 3000, 4000, 5000], format: num, grid: 524, label: 'Birth weight (g)' });
      const at = (a) => mid + slope * (a - 25);
      let ssr = 0;
      for (const [a, b] of pts) {
        const f = at(a);
        ssr += (b - f) ** 2;
        el('line', { x1: x(a), x2: x(a), y1: y(clip(b)), y2: y(clip(f)), class: 's-orange', 'stroke-width': 2 }, s);
      }
      el('path', { d: line([[x(12), y(clip(at(12)))], [x(46), y(clip(at(46)))]]), class: 's-ink f-none', 'stroke-width': 2.5 }, s);
      for (const [a, b] of pts) el('circle', { cx: x(a), cy: y(clip(b)), r: 4.5, class: 'f-blue' }, s);
      axisX(s, x, 214, { values: [15, 20, 25, 30, 35, 40, 45], label: 'Mother’s age (years)' });
      const extra = ssr / fit25.rss - 1;
      ro.set([
        ['Sum of squared residuals', `${num(ssr / 1e6, 1)} million g²`],
        ['Least squares', `${num(fit25.rss / 1e6, 1)} million g²`],
        ['This line', extra < 0.0005 ? 'the smallest possible' : `${pct(extra)} more`, extra < 0.0005 ? 'hl-green' : 'hl-red'],
      ]);
    } else {
      const x = linear([0, 46], [64, 524]);
      const y = linear([500, 5000], [212, 12]);
      el('rect', { x: x(0), y: 12, width: x(14) - x(0), height: 200, class: 'f-surround' }, s);
      text(s, x(7), 32, 'No data', { 'text-anchor': 'middle', class: 'tick' });
      axisY(s, y, 64, { values: [1000, 2000, 3000, 4000, 5000], format: num, grid: 524, label: 'Birth weight (g)' });
      for (let i = 0; i < N; i++) el('circle', { cx: x(B.age[i]), cy: y(B.bwt[i]), r: 3, class: 'f-blue', opacity: 0.55 }, s);
      // the least squares line, with its 95% confidence band
      const [b0, b1] = fitAge.beta;
      const xbar = S.mean(B.age), sxx = S.sum(B.age.map((a) => (a - xbar) ** 2));
      const t = S.qt(0.975, fitAge.df);
      const band = (a) => t * fitAge.sigma * Math.sqrt(1 / N + (a - xbar) ** 2 / sxx);
      const ages = Array.from({ length: 47 }, (_, k) => k);
      const upper = ages.map((a) => [x(a), y(b0 + b1 * a + band(a))]);
      const lower = ages.map((a) => [x(a), y(b0 + b1 * a - band(a))]).reverse();
      el('path', { d: `${line(upper)}L${lower.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`, class: 'f-orange', opacity: 0.25 }, s);
      el('path', { d: line([[x(0), y(b0)], [x(14), y(b0 + 14 * b1)]]), class: 's-orange f-none', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, s);
      el('path', { d: line([[x(14), y(b0 + 14 * b1)], [x(45), y(b0 + 45 * b1)]]), class: 's-orange f-none', 'stroke-width': 3 }, s);
      el('circle', { cx: x(0), cy: y(b0), r: 5, class: 'f-orange' }, s);
      text(s, x(0) + 10, y(b0) - 12, `${g$(b0)} at age 0`, { class: 'lbl c-orange halo' });
      axisX(s, x, 214, { values: [0, 10, 20, 30, 40], label: 'Mother’s age (years)' });
      const [lo, hi] = ci(fitAge, 1);
      ro.set([
        ['Slope', `${num(b1, 1)} g per year (95% CI ${num(lo, 1)} to ${num(hi, 1)}), ${pval(fitAge.p[1])}`],
        ['R²', pct(fitAge.r2, 1)],
        ['Residual standard error', g$(fitAge.sigma)],
      ]);
    }
  }
  show();
  draw();
  return { destroy: () => stop() };
}

function diagnostics(root) {
  const H = 270;
  const s = frame(root, H, 'Residuals against fitted values, and a QQ-plot of the residuals');
  const CASES = {
    real: { text: 'birthwt: weight on age' },
    curve: { text: 'A curve' },
    funnel: { text: 'A funnel' },
    skew: { text: 'Skewed errors' },
  };
  // simulated examples of each problem, fitted with a straight line
  const sim = (kind) => {
    const r = S.rng({ curve: 3, funnel: 4, skew: 5 }[kind]);
    const n = 160;
    const x = Array.from({ length: n }, () => 10 * r());
    const y = x.map((v) => {
      const e = S.randn(r);
      if (kind === 'curve') return 2 + 0.5 * v + 0.14 * (v - 5) ** 2 + 0.6 * e;
      if (kind === 'funnel') return 2 + 0.5 * v + (0.1 + 0.16 * v) * e;
      return 2 + 0.5 * v + Math.exp(0.9 * e) - Math.exp(0.405);
    });
    return S.ols(x.map((v) => [1, v]), y);
  };
  const fits = { real: fitAge, curve: sim('curve'), funnel: sim('funnel'), skew: sim('skew') };
  let which = 'real';
  const c$ = choice({ label: 'Data', value: which, options: Object.entries(CASES).map(([k, v]) => ({ value: k, text: v.text })), onchange: (v) => { which = v; draw(); } });
  controls(root, c$.el);
  const ro = readout();
  root.append(ro.el);
  note(root, 'The first is the birthwt fit of the lecture; the others are simulated to show each problem.');

  function draw() {
    clear(s);
    const f = fits[which];
    const lo = Math.min(...f.resid), hi = Math.max(...f.resid), pad = (hi - lo) * 0.08;
    const yr = [lo - pad, hi + pad];
    // A: residuals against fitted values, with a running mean
    const fx = linear([Math.min(...f.fitted), Math.max(...f.fitted)], [56, 252]);
    const fy = linear(yr, [212, 22]);
    text(s, 56, 14, 'Residuals against fitted', { class: 'lbl-strong' });
    el('line', { x1: 56, x2: 252, y1: fy(0), y2: fy(0), class: 's-muted', 'stroke-dasharray': '5 4' }, s);
    f.fitted.forEach((v, i) => el('circle', { cx: fx(v), cy: fy(f.resid[i]), r: 2.6, class: 'f-blue', opacity: 0.55 }, s));
    const order = f.fitted.map((v, i) => i).sort((a, b) => f.fitted[a] - f.fitted[b]);
    const k = Math.max(12, Math.round(order.length * 0.15));
    const smooth = [];
    for (let j = 0; j < order.length; j += 3) {
      const w = order.slice(Math.max(0, j - k), Math.min(order.length, j + k));
      smooth.push([fx(f.fitted[order[j]]), fy(S.mean(w.map((i) => f.resid[i])))]);
    }
    el('path', { d: line(smooth), class: 's-green f-none', 'stroke-width': 3 }, s);
    text(s, 154, 240, 'Fitted values', { 'text-anchor': 'middle', class: 'axis-label' });
    // B: QQ-plot of the residuals
    const sorted = [...f.resid].sort((a, b) => a - b);
    const n = sorted.length;
    const qx = linear([-3, 3], [322, 524]);
    const qy = fy;
    text(s, 322, 14, 'QQ-plot of the residuals', { class: 'lbl-strong' });
    const q1 = S.quantile(sorted, 0.25), q3 = S.quantile(sorted, 0.75), z1 = S.normInv(0.25), z3 = -z1;
    const sl = (q3 - q1) / (z3 - z1), ic = q1 - sl * z1;
    el('path', { d: line([[qx(-3), qy(Math.max(yr[0], Math.min(yr[1], ic - 3 * sl)))], [qx(3), qy(Math.max(yr[0], Math.min(yr[1], ic + 3 * sl)))]]), class: 's-ink f-none', 'stroke-width': 2 }, s);
    sorted.forEach((v, i) => el('circle', { cx: qx(S.normInv((i + 0.5) / n)), cy: qy(v), r: 2.6, class: 'f-blue', opacity: 0.6 }, s));
    text(s, 423, 240, 'Normal quantiles', { 'text-anchor': 'middle', class: 'axis-label' });
    const verdicts = {
      real: ['looks fine', 'looks fine', 'looks fine'],
      curve: ['in doubt: the residuals curve', 'looks fine', 'looks fine'],
      funnel: ['looks fine', 'in doubt: a funnel', 'heavy tails, from the funnel'],
      skew: ['looks fine', 'looks fine', 'in doubt: the QQ-plot bends'],
    }[which];
    ro.set([
      ['Linearity', verdicts[0], verdicts[0].startsWith('in doubt') ? 'hl-red' : null],
      ['Constant variance', verdicts[1], verdicts[1].startsWith('in doubt') ? 'hl-red' : null],
      ['Normal errors', verdicts[2], verdicts[2].startsWith('in doubt') ? 'hl-red' : null],
    ]);
  }
  draw();
}

// ================================================================ factors, confounding, interaction

function raceLines(root, start) {
  const H = 290;
  const s = frame(root, H, 'Birth weight against mother’s age, with a line for each race');
  const fRace = S.nestedF(fitAge, fitRaceAge), fInt = S.nestedF(fitRaceAge, fitInteraction);
  let mode = start;
  const m$ = choice({
    label: 'Model', value: mode,
    options: [{ value: 'parallel', text: 'race + age: one slope' }, { value: 'interaction', text: 'race * age: a slope for each race' }],
    onchange: (v) => { mode = v; draw(); },
  });
  controls(root, m$.el);
  root.append(raceKey());
  const ro = readout();
  root.append(ro.el);
  note(root, SOURCE);

  function draw() {
    clear(s);
    const x = linear([13, 46], [64, 524]);
    const y = linear([500, 5000], [244, 14]);
    axisY(s, y, 64, { values: [1000, 2000, 3000, 4000, 5000], format: num, grid: 524, label: 'Birth weight (g)' });
    for (let i = 0; i < N; i++) el('circle', { cx: x(B.age[i]), cy: y(B.bwt[i]), r: 3.2, class: `f-${RACE_COLOUR[B.race[i]]}`, opacity: 0.5 }, s);
    const b = mode === 'parallel' ? fitRaceAge.beta : fitInteraction.beta;
    RACES.forEach((_, k) => {
      const ages = B.age.filter((a, i) => B.race[i] === k);
      const a0 = Math.min(...ages), a1 = Math.max(...ages);
      const icpt = b[0] + (k === 1 ? b[1] : k === 2 ? b[2] : 0);
      const slope = b[3] + (mode === 'parallel' ? 0 : k === 1 ? b[4] : k === 2 ? b[5] : 0);
      el('path', { d: line([[x(a0), y(icpt + slope * a0)], [x(a1), y(icpt + slope * a1)]]), class: `s-${RACE_COLOUR[k]} f-none`, 'stroke-width': 4 }, s);
    });
    axisX(s, x, 246, { values: [15, 20, 25, 30, 35, 40, 45], label: 'Mother’s age (years)' });
    if (mode === 'parallel') {
      ro.set([
        ['Black v white, same age', effect(fitRaceAge, 1)],
        ['Other v white, same age', effect(fitRaceAge, 2)],
        ['Is race needed? F-test', `F = ${num(fRace.f, 2)}, ${pval(fRace.p)}`],
      ]);
    } else {
      const [b3, b4, b5] = [b[3], b[4], b[5]];
      ro.set([
        ['Slope for age, g per year', `White ${num(b3, 1)}, Black ${num(b3 + b4, 1)}, Other ${num(b3 + b5, 1)}`],
        ['Different slopes? F-test', `F = ${num(fInt.f, 2)}, ${pval(fInt.p)}`],
      ]);
    }
  }
  draw();
}
const factorLines = (root) => raceLines(root, 'parallel');
const interaction = (root) => raceLines(root, 'interaction');

function confounding(root) {
  const H = 282;
  const s = frame(root, H, 'Birth weight of smokers’ and non-smokers’ babies, overall and within each race');
  let view = 'crude';
  const v$ = choice({
    label: 'Compare', value: view,
    options: [{ value: 'crude', text: 'All smokers with all non-smokers' }, { value: 'within', text: 'Within each race' }],
    onchange: (v) => { view = v; draw(); },
  });
  controls(root, v$.el);
  root.append(raceKey());
  const ro = readout();
  root.append(ro.el);
  const jit = idx.map((i) => (S.rng(i + 7)() - 0.5));
  const groupMean = (f) => S.mean(idx.filter(f).map((i) => B.bwt[i]));

  function column(cx, sel, half) {
    const y = linear([500, 5000], [190, 12]);
    for (const i of idx.filter(sel)) el('circle', { cx: cx + jit[i] * half, cy: y(B.bwt[i]), r: 2.8, class: `f-${RACE_COLOUR[B.race[i]]}`, opacity: 0.55 }, s);
    const m = groupMean(sel);
    el('line', { x1: cx - half / 2 - 6, x2: cx + half / 2 + 6, y1: y(m), y2: y(m), class: 's-ink', 'stroke-width': 3.5 }, s);
    return [cx, y(m), m];
  }

  function draw() {
    clear(s);
    const y = linear([500, 5000], [190, 12]);
    axisY(s, y, 60, { values: [1000, 3000, 5000], format: num, grid: 524 });
    if (view === 'crude') {
      const a = column(200, (i) => !B.smoke[i], 120);
      const b = column(400, (i) => B.smoke[i], 120);
      text(s, 200, 210, 'Non-smokers', { 'text-anchor': 'middle', class: 'lbl' });
      text(s, 400, 210, 'Smokers', { 'text-anchor': 'middle', class: 'lbl' });
      el('line', { x1: a[0] + 70, x2: b[0] - 70, y1: a[1], y2: b[1], class: 's-ink', 'stroke-dasharray': '4 3' }, s);
    } else {
      RACES.forEach((r, k) => {
        const cx = 150 + k * 140;
        const a = column(cx - 30, (i) => B.race[i] === k && !B.smoke[i], 34);
        const b = column(cx + 30, (i) => B.race[i] === k && B.smoke[i], 34);
        el('line', { x1: a[0], x2: b[0], y1: a[1], y2: b[1], class: 's-ink', 'stroke-width': 1.5 }, s);
        text(s, cx, 210, r, { 'text-anchor': 'middle', class: `lbl c-${RACE_COLOUR[k]}` });
        text(s, cx - 30, 226, 'No', { 'text-anchor': 'middle', class: 'tick' });
        text(s, cx + 30, 226, 'Smokes', { 'text-anchor': 'middle', class: 'tick' });
      });
    }
    // the two estimates of the smoking effect, with their 95% CIs
    const x = linear([-800, 100], [150, 524]);
    el('line', { x1: x(0), x2: x(0), y1: 236, y2: 280, class: 's-muted', 'stroke-dasharray': '4 3' }, s);
    [['Crude', fitCrude, 'crude'], ['Adjusted', fitAdjusted, 'within']].forEach(([lab, f, v], k) => {
      const yy = 246 + k * 24;
      const on = v === view;
      const [lo, hi] = ci(f, 1);
      text(s, 140, yy + 5, lab, { 'text-anchor': 'end', class: on ? 'lbl-strong' : 'tick' });
      el('line', { x1: x(lo), x2: x(hi), y1: yy, y2: yy, class: on ? 's-plum' : 's-muted', 'stroke-width': on ? 4 : 2 }, s);
      el('circle', { cx: x(f.beta[1]), cy: yy, r: on ? 6 : 4, class: on ? 'f-plum' : 'f-muted' }, s);
      text(s, x(hi) + 8, yy + 5, g$(f.beta[1]), { class: on ? 'lbl' : 'tick' });
    });
    const share = (k) => pct(S.mean(idx.filter((i) => B.race[i] === k).map((i) => B.smoke[i])));
    ro.set(view === 'crude'
      ? [['Smokers, crude', effect(fitCrude, 1)], ['Smokers among mothers', `white ${share(0)}, black ${share(1)}, other ${share(2)}`]]
      : [['Smokers, adjusted for race and age', effect(fitAdjusted, 1)], ['Mean birth weight', `white ${g$(groupMean((i) => B.race[i] === 0))}, black ${g$(groupMean((i) => B.race[i] === 1))}, other ${g$(groupMean((i) => B.race[i] === 2))}`]]);
  }
  draw();
}

// ================================================================ tests as regressions

function testAsRegression(root) {
  const H = 262;
  const s = frame(root, H, 'A t-test and an ANOVA drawn as regressions');
  let view = 'smoking';
  const v$ = choice({
    label: 'Test', value: view,
    options: [{ value: 'smoking', text: 'Two groups: the t-test' }, { value: 'race', text: 'Three groups: ANOVA' }],
    onchange: (v) => { view = v; draw(); },
  });
  controls(root, v$.el);
  const ro = readout();
  root.append(ro.el);
  const jit = idx.map((i) => (S.rng(i + 99)() - 0.5));
  const fitRace = S.ols(idx.map((i) => [1, isBlack(i), isOther(i)]), B.bwt);
  const fitNull = S.ols(idx.map(() => [1]), B.bwt);
  const fRace = S.nestedF(fitNull, fitRace);
  // the equal-variance t-test, worked out directly
  const a = idx.filter((i) => !B.smoke[i]).map((i) => B.bwt[i]), b = idx.filter((i) => B.smoke[i]).map((i) => B.bwt[i]);
  const sp = Math.sqrt(((a.length - 1) * S.variance(a) + (b.length - 1) * S.variance(b)) / (a.length + b.length - 2));
  const tt = (S.mean(a) - S.mean(b)) / (sp * Math.sqrt(1 / a.length + 1 / b.length));

  function draw() {
    clear(s);
    const y = linear([500, 5000], [210, 12]);
    axisY(s, y, 64, { values: [1000, 2000, 3000, 4000, 5000], format: num, grid: 524, label: 'Birth weight (g)' });
    if (view === 'smoking') {
      const x = linear([-0.4, 1.4], [64, 524]);
      for (const i of idx) el('circle', { cx: x(B.smoke[i]) + jit[i] * 90, cy: y(B.bwt[i]), r: 2.8, class: B.smoke[i] ? 'f-orange' : 'f-blue', opacity: 0.5 }, s);
      const [b0, b1] = fitCrude.beta;
      el('path', { d: line([[x(-0.15), y(b0 - 0.15 * b1)], [x(1.15), y(b0 + 1.15 * b1)]]), class: 's-plum f-none', 'stroke-width': 4 }, s);
      for (const v of [0, 1]) el('circle', { cx: x(v), cy: y(b0 + v * b1), r: 7, class: 'f-plum' }, s);
      text(s, x(0) + 14, y(b0) - 22, `Intercept ${num(b0, 1)}`, { class: 'lbl-strong c-plum halo' });
      text(s, x(0.5), y(b0 + 0.5 * b1) + 30, `Slope ${num(b1, 1)}`, { 'text-anchor': 'middle', class: 'lbl-strong c-plum halo' });
      axisX(s, x, 212, { values: [0, 1], format: (v) => (v ? '1, smokers' : '0, non-smokers'), label: 'x = mother.smokes, coded 0 or 1' });
      ro.set([
        ['Intercept', `${num(b0, 1)} g, the non-smokers’ mean`],
        ['Slope', `${num(b1, 1)} g, the difference in means`],
        [`${code('lm()')} and ${code('t.test(var.equal = TRUE)')}`, `t = ${num(Math.abs(tt), 2)}, ${pval(S.tP2(tt, a.length + b.length - 2))} for both`],
      ]);
    } else {
      const x = linear([-0.5, 2.5], [64, 524]);
      for (const i of idx) el('circle', { cx: x(B.race[i]) + jit[i] * 80, cy: y(B.bwt[i]), r: 2.8, class: `f-${RACE_COLOUR[B.race[i]]}`, opacity: 0.5 }, s);
      const [b0, b1, b2] = fitRace.beta;
      el('line', { x1: x(-0.4), x2: x(2.4), y1: y(b0), y2: y(b0), class: 's-ink', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }, s);
      [[0, b0], [1, b0 + b1], [2, b0 + b2]].forEach(([k, m]) => {
        el('line', { x1: x(k) - 40, x2: x(k) + 40, y1: y(m), y2: y(m), class: 's-plum', 'stroke-width': 4 }, s);
        if (k) {
          el('line', { x1: x(k) + 48, x2: x(k) + 48, y1: y(b0), y2: y(m), class: 's-plum', 'stroke-width': 2 }, s);
          text(s, x(k) + 54, (y(b0) + y(m)) / 2 + 5, num(m - b0, 0), { class: 'lbl-strong c-plum halo' });
        }
      });
      text(s, x(0), y(b0) - 14, `Intercept ${num(b0, 0)}`, { 'text-anchor': 'middle', class: 'lbl-strong c-plum halo' });
      axisX(s, x, 212, { values: [0, 1, 2], format: (v) => RACES[v], label: 'race: White is the baseline' });
      ro.set([
        ['Intercept', `${num(b0, 1)} g, the white mothers’ mean`],
        ['raceBlack, raceOther', `${num(b1, 1)} g and ${num(b2, 1)} g, differences from white`],
        ['F-test of the regression', `F = ${num(fRace.f, 2)}, ${pval(fRace.p)}, as in ANOVA`],
      ]);
    }
  }
  draw();
}

// ================================================================ logistic regression

function logistic(root) {
  const H = 270;
  const s = frame(root, H, 'Low birth weight against mother’s weight: a logistic curve and a straight line');
  const fit = S.logitFit(B.lwt.map((w) => [1, w]), B.low);
  const lin = S.ols(B.lwt.map((w) => [1, w]), B.low);
  const [b0, b1] = fit.beta;
  const prob = (w) => 1 / (1 + Math.exp(-(b0 + b1 * w)));
  let view = 'p', at = 120;
  const v$ = choice({ label: 'Scale', value: view, options: [{ value: 'p', text: 'Probability' }, { value: 'logit', text: 'Log odds' }], onchange: (v) => { view = v; draw(); } });
  const w$ = slider({ label: 'Mother’s weight', min: 80, max: 250, step: 1, value: at, format: (v) => `${num(v)} lb`, oninput: (v) => { at = v; draw(); } });
  controls(root, v$.el, w$.el);
  const ro = readout();
  root.append(ro.el);
  note(root, 'The birthwt data. The straight line is a linear regression of the 0/1 outcome.');
  const jit = idx.map((i) => (S.rng(i + 3)() - 0.5) * 0.06);

  function draw() {
    clear(s);
    const x = linear([60, 400], [64, 524]);
    const ws = Array.from({ length: 69 }, (_, k) => 60 + k * 5);
    if (view === 'p') {
      const y = linear([-0.3, 1.1], [216, 12]);
      el('rect', { x: 64, y: y(0), width: 460, height: y(-0.3) - y(0), class: 'f-surround' }, s);
      text(s, 72, y(-0.2) + 5, 'Impossible: below 0', { class: 'tick' });
      axisY(s, y, 64, { values: [0, 0.5, 1], format: (v) => num(v, 1), grid: 524, label: 'Low birth weight' });
      for (let i = 0; i < N; i++) el('circle', { cx: x(B.lwt[i]), cy: y(B.low[i] + jit[i]), r: 3, class: 'f-blue', opacity: 0.45 }, s);
      el('path', { d: line(ws.map((w) => [x(w), y(Math.max(-0.3, lin.beta[0] + lin.beta[1] * w))])), class: 's-orange f-none', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, s);
      text(s, x(250), y(lin.beta[0] + lin.beta[1] * 250) + 22, 'Straight line', { class: 'lbl c-orange halo' });
      el('path', { d: line(ws.map((w) => [x(w), y(prob(w))])), class: 's-plum f-none', 'stroke-width': 3.5 }, s);
      text(s, x(330), y(prob(330)) - 10, 'Logistic', { class: 'lbl c-plum halo' });
      el('line', { x1: x(at), x2: x(at), y1: y(0), y2: y(prob(at)), class: 's-ink', 'stroke-dasharray': '3 3' }, s);
      el('circle', { cx: x(at), cy: y(prob(at)), r: 6, class: 'f-plum' }, s);
    } else {
      const y = linear([-4.5, 1.5], [216, 12]);
      axisY(s, y, 64, { values: [-4, -3, -2, -1, 0, 1], format: num, grid: 524, label: 'Log odds of low birth weight' });
      // the observed log odds in six groups of mothers' weight
      const order = idx.slice().sort((a, b) => B.lwt[a] - B.lwt[b]);
      for (let k = 0; k < 6; k++) {
        const grp = order.slice(Math.round((k * N) / 6), Math.round(((k + 1) * N) / 6));
        const p = S.mean(grp.map((i) => B.low[i]));
        el('circle', { cx: x(S.mean(grp.map((i) => B.lwt[i]))), cy: y(Math.log(p / (1 - p))), r: 6, class: 'f-blue', opacity: 0.8 }, s);
      }
      el('path', { d: line([[x(60), y(b0 + b1 * 60)], [x(400), y(b0 + b1 * 400)]]), class: 's-plum f-none', 'stroke-width': 3.5 }, s);
      text(s, x(395), y(0.9), `log odds = ${num(b0, 2)} ${b1 < 0 ? '−' : '+'} ${num(Math.abs(b1), 4)} × weight`, { 'text-anchor': 'end', class: 'lbl c-plum' });
      el('circle', { cx: x(at), cy: y(b0 + b1 * at), r: 6, class: 'f-plum' }, s);
    }
    axisX(s, x, 218, { values: [100, 150, 200, 250, 300, 350, 400], label: 'Mother’s weight (pounds)' });
    const p = prob(at);
    ro.set([
      [`At ${num(at)} lb`, `probability ${num(p, 2)}, odds ${num(p / (1 - p), 2)}, log odds ${num(Math.log(p / (1 - p)), 2)}`],
      ['Odds ratio per 10 lb', `exp(10 × ${num(b1, 4)}) = ${num(Math.exp(10 * b1), 2)}, ${pval(fit.p[1])}`],
    ]);
  }
  draw();
}

function oddsScale(root) {
  const H = 250;
  const s = frame(root, H, 'An estimate and its 95% CI on the log odds scale and as an odds ratio');
  const PRESETS = [
    { k: 'crude', text: 'Smoking, crude', or: 2.022, lo: 1.082, hi: 3.801 },
    { k: 'adjusted', text: 'Smoking, adjusted', or: 3.006, lo: 1.472, hi: 6.379 },
    { k: 'black', text: 'Black v white', or: 2.749, lo: 1.040, hi: 7.308 },
    { k: 'age', text: 'Age, per year', or: 0.966, lo: 0.903, hi: 1.030 },
    { k: 'age10', text: 'Age, per 10 years', or: 0.966 ** 10, lo: 0.903 ** 10, hi: 1.030 ** 10 },
    { k: 'allele', text: 'A allele', or: 1.266, lo: 1.016, hi: 1.576 },
  ];
  let cur = PRESETS[1];
  const p$ = choice({ label: 'Estimate', value: cur.k, options: PRESETS.map((p) => ({ value: p.k, text: p.text })), onchange: (v) => { cur = PRESETS.find((p) => p.k === v); draw(); } });
  controls(root, p$.el);
  const ro = readout();
  root.append(ro.el);
  note(root, 'Odds ratios of low birth weight and, for the A allele, of a BMI above 25, from the lecture.');

  function draw() {
    clear(s);
    const top = linear([-1.25, 2.25], [40, 524]);
    const bot = linear([0, 8], [40, 524]);
    const yt = 62, yb = 186;
    text(s, 40, 22, 'Log odds ratio, the coefficient β: no effect is 0', { class: 'lbl-strong' });
    text(s, 40, 146, 'Odds ratio, exp(β): no effect is 1', { class: 'lbl-strong' });
    el('line', { x1: top(0), x2: top(0), y1: yt - 22, y2: yt + 4, class: 's-muted', 'stroke-dasharray': '4 3' }, s);
    el('line', { x1: bot(1), x2: bot(1), y1: yb - 22, y2: yb + 4, class: 's-muted', 'stroke-dasharray': '4 3' }, s);
    const L = [Math.log(cur.lo), Math.log(cur.or), Math.log(cur.hi)];
    const O = [cur.lo, cur.or, cur.hi];
    L.forEach((v, k) => el('line', { x1: top(v), x2: bot(O[k]), y1: yt + 6, y2: yb - 14, class: 's-hair', 'stroke-width': 1.5 }, s));
    el('line', { x1: top(L[0]), x2: top(L[2]), y1: yt - 8, y2: yt - 8, class: 's-plum', 'stroke-width': 4 }, s);
    el('circle', { cx: top(L[1]), cy: yt - 8, r: 7, class: 'f-plum' }, s);
    el('line', { x1: bot(O[0]), x2: bot(O[2]), y1: yb - 8, y2: yb - 8, class: 's-plum', 'stroke-width': 4 }, s);
    el('circle', { cx: bot(O[1]), cy: yb - 8, r: 7, class: 'f-plum' }, s);
    axisX(s, top, yt, { values: [-1, 0, 1, 2], format: num, tickLen: 4 });
    axisX(s, bot, yb, { values: [0, 1, 2, 3, 4, 5, 6, 7, 8], format: num, tickLen: 4 });
    ro.set([
      ['Coefficient β', `${num(L[1], 2)}, 95% CI ${num(L[0], 2)} to ${num(L[2], 2)}`],
      ['Odds ratio exp(β)', `${num(cur.or, 2)}, 95% CI ${num(cur.lo, 2)} to ${num(cur.hi, 2)}`],
      cur.k === 'age10' ? ['Ten years', '0.966¹⁰: the coefficient times 10'] : ['The interval', L[0] > 0 || L[2] < 0 ? 'excludes 0 and 1: evidence of an association' : 'includes 0 and 1: no evidence of an association'],
    ]);
  }
  draw();
}

// ================================================================ a genotype as a predictor

function genotypeCoding(root) {
  const H = 236;
  const s = frame(root, H, 'BMI above 25 by genotype, with what each coding of the genotype fits');
  const GT = [{ name: 'GG', y: 184, n: 564 }, { name: 'GA', y: 130, n: 376 }, { name: 'AA', y: 30, n: 60 }];
  const CODINGS = {
    additive: { text: 'Additive', cols: [[0], [1], [2]], names: ['Number of A alleles'] },
    dominant: { text: 'Dominant', cols: [[0], [1], [1]], names: ['AA or GA'] },
    recessive: { text: 'Recessive', cols: [[0], [0], [1]], names: ['AA'] },
    factor: { text: 'Factor', cols: [[0, 0], [1, 0], [0, 1]], names: ['GA', 'AA'] },
  };
  let coding = 'additive';
  const c$ = choice({ label: 'Coding', value: coding, options: Object.entries(CODINGS).map(([k, v]) => ({ value: k, text: v.text })), onchange: (v) => { coding = v; draw(); } });
  controls(root, c$.el);
  const table = h('table', { class: 'coded' });
  root.append(table);
  const ro = readout();
  root.append(ro.el);
  note(root, 'FAMuSS, esr1_rs1042717: BMI above 25 by genotype, not adjusted (counts from the week 3 lecture).');

  function draw() {
    clear(s);
    const cd = CODINGS[coding];
    const X = cd.cols.map((c) => [1, ...c]);
    const fit = S.logitFit(X, GT.map((t) => t.y), GT.map((t) => t.n));
    const fitted = X.map((row) => 1 / (1 + Math.exp(-row.reduce((a, v, j) => a + v * fit.beta[j], 0))));
    const x = linear([-0.5, 2.5], [70, 520]);
    const y = linear([0, 0.7], [192, 12]);
    axisY(s, y, 70, { values: [0, 0.2, 0.4, 0.6], format: (v) => pct(v), grid: 520, label: 'BMI above 25' });
    GT.forEach((t, k) => {
      const p = t.y / t.n, se = Math.sqrt((p * (1 - p)) / t.n);
      el('rect', { x: x(k) - 46, width: 92, y: y(p), height: y(0) - y(p), class: 'f-blue', opacity: 0.45 }, s);
      el('line', { x1: x(k), x2: x(k), y1: y(p - 1.96 * se), y2: y(p + 1.96 * se), class: 's-ink', 'stroke-width': 1.5 }, s);
      text(s, x(k), 212, t.name, { 'text-anchor': 'middle', class: 'lbl-strong' });
      text(s, x(k), 230, `${t.y} of ${t.n}`, { 'text-anchor': 'middle', class: 'tick' });
    });
    el('path', { d: line(fitted.map((p, k) => [x(k), y(p)])), class: 's-orange f-none', 'stroke-width': 3 }, s);
    fitted.forEach((p, k) => el('circle', { cx: x(k), cy: y(p), r: 7, class: 'f-orange' }, s));
    table.replaceChildren(
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Coded as'), GT.map((t) => h('th', { scope: 'col' }, t.name)))),
      h('tbody', null, cd.names.map((nm, j) => h('tr', null, h('th', { scope: 'row' }, nm), cd.cols.map((c) => h('td', null, String(c[j])))))));
    const orText = (j) => {
      const b = fit.beta[j], e = 1.96 * fit.se[j];
      return `${num(Math.exp(b), 2)} (95% CI ${num(Math.exp(b - e), 2)} to ${num(Math.exp(b + e), 2)}), ${pval(fit.p[j])}`;
    };
    const rows = {
      additive: [['Odds ratio per A allele', orText(1)], ['AA against GG', `${num(Math.exp(2 * fit.beta[1]), 2)}, the per-allele ratio squared`]],
      dominant: [['AA or GA against GG', orText(1)]],
      recessive: [['AA against GA or GG', orText(1)]],
      factor: [['GA against GG', orText(1)], ['AA against GG', orText(2)]],
    }[coding];
    ro.set(rows);
  }
  draw();
}

// ================================================================ reporting

function reportBuilder(root) {
  const PARTS = [
    ['outcome', 'The outcome, in plain words'],
    ['who', 'Who is compared with whom'],
    ['estimate', 'The estimate and its 95% CI'],
    ['adjust', 'What was adjusted for'],
    ['n', 'The sample size'],
    ['matters', 'Whether it matters'],
  ];
  const EXAMPLES = {
    linear: {
      text: 'Smoking and birth weight',
      r: 'lm(birthwt.grams ~ mother.smokes + race + mother.age)\n                 Estimate    2.5 %   97.5 %\nmother.smokesYes  -426.09  -643.09  -209.09',
      parts: [
        ['adjust', 'Among mothers of the same race and age, '], ['who', 'smokers’ babies'], ['outcome', ' weighed'],
        ['estimate', ' on average 426 g less (95% CI 209 g to 643 g, P < 0.001)'], ['who', ' than non-smokers’ babies'],
        ['n', ', in 189 births with no missing values.'], ['matters', ' That is more than half the SD of birth weight: a difference that matters for a newborn.'],
      ],
    },
    logistic: {
      text: 'Smoking and low birth weight',
      r: 'glm(birthwt.below.2500 ~ mother.smokes + race + mother.age,\n    family = binomial)\n                    OR  2.5 % 97.5 %\nmother.smokesYes 3.006  1.472  6.379',
      parts: [
        ['adjust', 'Among mothers of the same race and age, '], ['who', 'smokers had'],
        ['estimate', ' 3.0 times the odds (95% CI 1.47 to 6.38, P = 0.003)'], ['outcome', ' of a baby below 2,500 g'],
        ['who', ', compared with non-smokers'], ['n', ', in 189 births, 59 of them of low weight.'],
        ['matters', ' The interval is wide: the study can’t pin down how large the effect is.'],
      ],
    },
    genotype: {
      text: 'A SNP and BMI above 25',
      r: 'glm(over25 ~ nA + Age + Gender, family = binomial)\n      OR  2.5 % 97.5 %\nnA 1.266  1.016  1.576',
      parts: [
        ['adjust', 'Among individuals of the same age and gender, '], ['who', 'each extra A allele at esr1_rs1042717'],
        ['estimate', ' raises the odds by about 27% (95% CI 2% to 58%, P = 0.03)'], ['outcome', ' of a BMI above 25'],
        ['n', ', in 999 volunteers with a genotype, BMI and gender.'],
        ['matters', ' The effect is modest, and one SNP at P = 0.03 is weak evidence until it is replicated.'],
      ],
    },
  };
  let ex = 'linear', lit = 'estimate';
  const e$ = choice({ label: 'Example', value: ex, options: Object.entries(EXAMPLES).map(([k, v]) => ({ value: k, text: v.text })), onchange: (v) => { ex = v; draw(); } });
  controls(root, e$.el);
  const pre = h('pre', { class: 'r-out' });
  const sentence = h('p', { class: 'report' });
  const checks = h('div', { class: 'report-parts', role: 'group', 'aria-label': 'Parts of the report' });
  root.append(pre, sentence, checks);

  function draw() {
    const e = EXAMPLES[ex];
    pre.textContent = e.r;
    sentence.replaceChildren(...e.parts.map(([k, t]) => h('span', { class: `rp rp-${k} ${k === lit ? 'lit' : ''}` }, t)));
    checks.replaceChildren(...PARTS.map(([k, label]) => h('button', {
      type: 'button', class: 'seg-btn', 'aria-pressed': String(k === lit),
      onclick: () => { lit = k; draw(); },
    }, label)));
  }
  draw();
  note(root, 'Click a part to see where it is in the sentence. Leonardo’s checklist, lecture W4, Part A, slide 49.');
}

export const WEEK4_DEMOS = {
  leastSquares, diagnostics, factorLines, interaction, confounding, testAsRegression,
  logistic, oddsScale, genotypeCoding, reportBuilder,
};
