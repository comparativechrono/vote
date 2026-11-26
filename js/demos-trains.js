// The interactive graphs of the trains exercise (js/deck-trains.js), drawn from the trains data.

import { h, num, pct, pval, choice, readout, animate, ease, reducedMotion } from './ui.js';
import { el, clear, text, linear, axisX, axisY } from './svg.js';
import * as S from './stats.js';
import { W, frame, controls, note } from './demo-kit.js';
import { TRAINS as T } from './data/trains.js';

const N = T.delay.length;
const idx = Array.from({ length: N }, (_, i) => i);
const ORIGINS = ['Kings Cross', 'Liverpool Street', 'Norwich', 'Birmingham'];
const COLOUR = { 'Kings Cross': 'blue', 'Liverpool Street': 'orange', Norwich: 'green', Birmingham: 'red' };
const SOURCE = 'The trains data: 400 simulated weekday arrivals at Cambridge.';
const delays = (f) => idx.filter(f).map((i) => T.delay[i]);
const mins = (v, d = 1) => `${num(v, d)} min`;
/** A test result as R prints it, shortened: "t = −3.35, df = 273, P < 0.001". */
const stat = (name, v, d = 2) => `${name} = ${num(v, d)}`;

// ---------------------------------------------------------------- a train

/**
 * A little train, facing right, with its nose at (0, 0) and its wheels on y = 0.
 * Returns the group; move it with place(train, x, y, angle).
 */
export function drawTrain(parent, scale = 1) {
  const outer = el('g', { class: 'train', 'aria-hidden': 'true' }, parent);
  const t = el('g', { transform: `scale(${scale})` }, outer);
  el('path', { d: 'M-62 -24 H-14 Q-2 -23 0 -10 V-4 H-62 Z', class: 'train-body' }, t);
  el('path', { d: 'M-12 -24 Q-2 -23 0 -10 V-4 H-6 V-24 Z', class: 'train-nose' }, t);
  for (let k = 0; k < 4; k++) el('rect', { x: -57 + k * 11, y: -20, width: 7, height: 7, rx: 1.5, class: 'train-win' }, t);
  for (const x of [-54, -44, -22, -12]) el('circle', { cx: x, cy: -3, r: 3, class: 'train-wheel' }, t);
  return outer;
}
const place = (train, x, y, a = 0) => train.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})`);

/**
 * A line of stations across the top of a graph: the route through the test map to this test.
 * A train runs along it when the slide opens. Returns a function that stops it.
 */
function routeStrip(root, stops) {
  const H = 50;
  const s = frame(root, H, `The route to the test: ${stops.join(', then ')}`);
  s.classList.add('route-strip');
  const x0 = 14, x1 = W - 14, y = 18;
  const xs = stops.map((_, k) => x0 + ((x1 - x0) * k) / (stops.length - 1));
  el('line', { x1: x0, x2: x1, y1: y, y2: y, class: 'track' }, s);
  const lit = el('line', { x1: x0, x2: x0, y1: y, y2: y, class: 'track on' }, s);
  stops.forEach((name, k) => {
    const last = k === stops.length - 1;
    el('circle', { cx: xs[k], cy: y, r: last ? 8 : 6, class: last ? 'station terminus' : 'station' }, s);
    text(s, xs[k], y + 28, name, {
      'text-anchor': k === 0 ? 'start' : last ? 'end' : 'middle',
      class: last ? 'lbl-strong mono c-plum' : 'tick',
      dx: k === 0 ? -6 : last ? 8 : 0,
    });
  });
  const train = drawTrain(s, 0.62);
  return animate(2600, (t) => {
    const x = x0 + (xs[xs.length - 1] - x0) * ease(t);
    place(train, x, y - 1);
    lit.setAttribute('x2', x);
  });
}

// ---------------------------------------------------------------- the national figures

function trPunctuality(root) {
  const H = 236;
  const s = frame(root, H, 'Punctuality: Great Britain from January to March 2026, and the trains data');
  const ours = { on: S.mean(T.delay.map((d) => +(d === 0))), three: S.mean(T.delay.map((d) => +(d <= 2))) };
  const rows = [
    ['On time: early, or less than a minute late', 0.688, ours.on],
    ['Within 3 minutes', 0.864, ours.three],
  ];
  const x = linear([0, 1], [16, W - 70]);
  rows.forEach(([label, gb, us], k) => {
    const y = 16 + k * 98;
    text(s, 16, y + 10, label, { class: 'lbl' });
    [[gb, 'blue', 'Great Britain'], [us, 'orange', 'The trains data']].forEach(([v, c, who], j) => {
      const yy = y + 24 + j * 30;
      el('rect', { x: x(0), y: yy, width: x(v) - x(0), height: 22, rx: 3, class: `f-${c}` }, s);
      text(s, x(v) + 8, yy + 17, pct(v, 1), { class: 'lbl-strong' });
      text(s, x(0) + 8, yy + 16, who, { class: 'tick c-paper' });
    });
  });
  axisX(s, x, 212, { values: [0, 0.25, 0.5, 0.75, 1], format: (v) => pct(v) });
  root.append(h('p', { class: 'demo-key' },
    h('span', null, h('i', { class: 'k-blue' }), 'Great Britain: every station stop, January to March 2026'),
    h('span', null, h('i', { class: 'k-orange' }), 'The trains data: arrivals at Cambridge')));
  note(root, 'Office of Rail and Road, Passenger rail performance, January to March 2026. 3.2% of trains were cancelled; the trains data have no cancellations.');
}

// ---------------------------------------------------------------- the departures board

function trBoard(root) {
  const H = 270;
  const s = frame(root, H, 'An arrivals board showing rows of the trains data, with a train passing');
  s.classList.add('board');
  const ROWS = 6;
  el('rect', { x: 0, y: 0, width: W, height: 214, rx: 10, class: 'board-bg' }, s);
  text(s, 18, 30, 'Cambridge  Arrivals', { class: 'board-head' });
  const clock = text(s, W - 18, 30, '', { class: 'board-head', 'text-anchor': 'end' });
  const cols = [[18, 'Due'], [84, 'From'], [266, 'Stops'], [330, 'Weather'], [430, 'Expected']];
  for (const [cx, name] of cols) text(s, cx, 56, name, { class: 'board-col' });
  const body = el('g', {}, s);
  // the track, and a train that runs along it
  el('line', { x1: 0, x2: W, y1: 252, y2: 252, class: 'track' }, s);
  for (let x = 6; x < W; x += 18) el('line', { x1: x, x2: x + 8, y1: 256, y2: 256, class: 'sleeper' }, s);
  const train = drawTrain(s, 0.9);
  place(train, -10, 250);
  let first = 0;
  const due = (i) => T.time[i];
  const expected = (i) => {
    if (T.delay[i] === 0) return 'On time';
    const [hh, mm] = T.time[i].split(':').map(Number);
    const t = hh * 60 + mm + T.delay[i];
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  };
  function draw(flip) {
    clear(body);
    for (let r = 0; r < ROWS; r++) {
      const i = (first + r) % N;
      const y = 84 + r * 24;
      const g = el('g', { class: flip && r === ROWS - 1 ? 'board-row flip' : 'board-row' }, body);
      text(g, 18, y, due(i), { class: 'board-txt' });
      text(g, 84, y, T.origin[i], { class: 'board-txt' });
      text(g, 266, y, String(T.stops[i]), { class: 'board-txt' });
      text(g, 330, y, T.rain[i] ? 'Rain' : 'Dry', { class: 'board-txt' });
      text(g, 430, y, expected(i), { class: T.late[i] ? 'board-txt late' : 'board-txt' });
    }
    clock.textContent = `${T.day[first]} ${T.time[first]}`;
  }
  draw(false);
  const r$ = readout();
  root.append(r$.el);
  const show = () => {
    const i = first;
    r$.set([['This train', `${T.origin[i]}, ${T.stops[i]} stops, ${T.peak[i] ? 'rush hour' : 'off-peak'}, ${T.rain[i] ? 'rain' : 'dry'}`], ['delay', T.delay[i] ? `${T.delay[i]} min${T.late[i] ? ', so late is TRUE' : ''}` : '0 min']]);
  };
  show();
  note(root, `${SOURCE} Each row of the board is a row of the data: the top one is described above.`);
  if (reducedMotion()) return { destroy() {} };
  let stop = false, t0 = performance.now(), last = t0;
  const loop = (now) => {
    if (stop) return;
    const t = ((now - t0) % 5200) / 5200;              // one crossing every 5.2 s
    place(train, -10 + (W + 90) * t, 250);
    if (now - last > 2600) { last = now; first = (first + 1) % N; draw(true); show(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return { destroy() { stop = true; } };
}

// ---------------------------------------------------------------- the test map

const TESTS = [
  { fn: 't.test()', why: 'normal, or large samples', path: [0, 0] },
  { fn: 'wilcox.test()', why: 'small and skewed', path: [0, 0] },
  { fn: 'aov()', why: 'normal, or large samples', path: [0, 1] },
  { fn: 'kruskal.test()', why: 'small and skewed', path: [0, 1] },
  { fn: 'lm()', why: 'regression, week 4', path: [0, 2] },
  { fn: 'chisq.test()', why: 'all expected counts ≥ 5', path: [1, 0] },
  { fn: 'fisher.test()', why: 'an expected count < 5', path: [1, 0] },
  { fn: 'glm()', why: 'logistic regression: next', path: [1, 1] },
];

function trTree(root) {
  const H = 292;
  const s = frame(root, H, 'A map of tests: from the outcome, through what it is compared across, to a test');
  s.classList.add('test-map');
  s.setAttribute('role', 'group');   // it holds buttons, so it is not a single picture
  const yT = TESTS.map((_, k) => 26 + k * 34);
  const X = { root: 50, l1: 138, l2: 258, end: 384 };
  // the junctions: [label, sub-label, x, y, children]
  const l2 = [
    { name: 'Two groups', tests: [0, 1] }, { name: 'Three or more', tests: [2, 3] }, { name: 'A number', tests: [4] },
    { name: 'Groups', tests: [5, 6] }, { name: 'A number', tests: [7] },
  ].map((n) => ({ ...n, x: X.l2, y: S.mean(n.tests.map((k) => yT[k])) }));
  const l1 = [
    { name: 'A measurement', sub: 'delay, in minutes', kids: [0, 1, 2] },
    { name: 'Yes or no', sub: 'late', kids: [3, 4] },
  ].map((n) => ({ ...n, x: X.l1, y: S.mean(n.kids.map((k) => l2[k].y)) }));
  const top = { x: X.root, y: (l1[0].y + l1[1].y) / 2 };
  // a railway line between two points: level, then 45 degrees just before the next station
  const seg = (a, b) => {
    const run = Math.min(Math.abs(b.y - a.y), b.x - a.x - 20);
    return `L${b.x - 16 - run} ${a.y} L${b.x - 16} ${b.y} L${b.x} ${b.y}`;
  };
  const routeTo = (k) => {
    const [i1, i2] = TESTS[k].path;
    const n1 = l1[i1], n2 = l2[n1.kids[i2]], end = { x: X.end, y: yT[k] };
    return { d: `M${top.x} ${top.y} ${seg(top, n1)} ${seg(n1, n2)} ${seg(n2, end)}`, n1, n2 };
  };
  const lines = el('g', {}, s);
  const paths = TESTS.map((_, k) => el('path', { d: routeTo(k).d, class: 'track' }, lines));
  const litPath = el('path', { d: '', class: 'track on' }, s);
  const stations = el('g', {}, s);
  const dot = (x, y, cls) => el('circle', { cx: x, cy: y, r: 6, class: cls }, stations);
  dot(top.x, top.y, 'station');
  text(stations, top.x - 10, top.y + 26, 'Outcome', { class: 'lbl-strong halo' });
  l1.forEach((n, j) => {
    dot(n.x, n.y, 'station');
    const y0 = j ? n.y + 22 : n.y - 26;     // beside the line that comes in
    text(stations, n.x - 10, y0, n.name, { 'text-anchor': 'end', class: 'lbl halo' });
    text(stations, n.x - 10, y0 + 15, n.sub, { 'text-anchor': 'end', class: 'tick mono halo' });
  });
  l2.forEach((n, j) => {
    dot(n.x, n.y, 'station');
    // a junction with one way on is labelled to its right, above the line; the others above the dot
    if (n.tests.length === 1) text(stations, n.x + 12, n.y - 9, n.name, { class: 'tick halo' });
    else text(stations, n.x, n.y - 12, n.name, { 'text-anchor': 'middle', class: 'tick halo' });
  });
  const ends = TESTS.map((t, k) => {
    const g = el('g', { class: 'terminus-btn', role: 'button', tabindex: '0', 'aria-label': `Send the train to ${t.fn}: ${t.why}` }, s);
    el('rect', { x: X.end - 10, y: yT[k] - 15, width: W - X.end + 10, height: 32, class: 'f-none hit' }, g);
    el('circle', { cx: X.end, cy: yT[k], r: 7, class: 'station terminus' }, g);
    text(g, X.end + 14, yT[k] + 1, t.fn, { class: 'lbl-strong mono' });
    text(g, X.end + 14, yT[k] + 15, t.why, { class: 'tick small' });
    const go = (e) => { e.preventDefault(); e.stopPropagation(); send(k); };
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(e); });
    return g;
  });
  const train = drawTrain(s, 0.62);
  place(train, top.x + 4, top.y - 1);
  const r$ = readout([['The train', 'is waiting at the outcome: click a test']]);
  root.append(r$.el);
  let cancel = () => {};
  function send(k) {
    cancel();
    const r = routeTo(k);
    litPath.setAttribute('d', r.d);
    paths.forEach((p, j) => p.classList.toggle('dim', j !== k));
    ends.forEach((g, j) => g.classList.toggle('on', j === k));
    const len = litPath.getTotalLength();
    litPath.style.strokeDasharray = `${len} ${len}`;
    const t = TESTS[k];
    r$.set([['Route', `${r.n1.name} → ${r.n2.name} → ${t.why}`], ['Test', `<code>${t.fn}</code>`]]);
    cancel = animate(2400, (u) => {
      const l = len * ease(u);
      const p = litPath.getPointAtLength(l), q = litPath.getPointAtLength(Math.min(len, l + 1));
      const a = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      place(train, p.x, p.y - 1, l < len ? a : 0);
      litPath.style.strokeDashoffset = String(len - l);
    });
  }
  return { destroy() { cancel(); } };
}

// ---------------------------------------------------------------- delays in groups

/** Each group's delays as a strip of dots, then each group's mean with its 95% CI. */
function groupsPlot(root, groups, label) {
  const k = groups.length;
  const rowH = k > 2 ? 30 : 44;
  const mRow = k > 2 ? 18 : 22;
  const top = 6, axisY0 = top + k * rowH + 4, meanTop = axisY0 + 50, H = meanTop + k * mRow + 30;
  const s = frame(root, H, label);
  const x = linear([0, 45], [132, W - 12]);
  groups.forEach((gr, j) => {
    const cy = top + j * rowH + rowH / 2;
    text(s, 0, cy + (k > 2 ? 5 : 0), gr.name, { class: `lbl ${gr.colour ? `c-${gr.colour}` : ''}` });
    if (k <= 2) text(s, 0, cy + 17, `${gr.values.length} trains`, { class: 'tick' });
    const r = S.rng(31 + j);
    for (const v of gr.values) el('circle', { cx: x(v) + (r() - 0.5) * 4, cy: cy + (r() - 0.5) * (rowH - 12), r: 2.6, class: `f-${gr.colour || 'blue'}`, opacity: 0.45 }, s);
    const m = S.mean(gr.values), md = S.median(gr.values);
    el('line', { x1: x(md), x2: x(md), y1: cy - rowH / 2 + 2, y2: cy + rowH / 2 - 2, class: 's-ink', 'stroke-dasharray': '3 3', 'stroke-width': 1.5 }, s);
    el('line', { x1: x(m), x2: x(m), y1: cy - rowH / 2 + 2, y2: cy + rowH / 2 - 2, class: 's-plum', 'stroke-width': 3 }, s);
  });
  axisX(s, x, axisY0, { values: [0, 10, 20, 30, 40], label: 'Delay (minutes): every train a dot' });
  // the means, on a scale that shows their difference
  const hiMean = Math.max(...groups.map((gr) => S.mean(gr.values) + 2.2 * S.sd(gr.values) / Math.sqrt(gr.values.length)));
  const xm = linear([0, Math.ceil(hiMean + 0.5)], [132, W - 12]);
  groups.forEach((gr, j) => {
    const cy = meanTop + j * mRow;
    const m = S.mean(gr.values), se = S.sd(gr.values) / Math.sqrt(gr.values.length), t = S.qt(0.975, gr.values.length - 1);
    text(s, 0, cy + 5, gr.name, { class: 'tick' });
    el('line', { x1: xm(m - t * se), x2: xm(m + t * se), y1: cy, y2: cy, class: `s-${gr.colour || 'blue'}`, 'stroke-width': 3 }, s);
    el('circle', { cx: xm(m), cy, r: 5.5, class: 'f-plum' }, s);
    text(s, xm(m + t * se) + 8, cy + 5, mins(m), { class: 'tick' });
  });
  axisX(s, xm, meanTop + k * mRow - 6, { values: Array.from({ length: Math.ceil(hiMean + 0.5) + 1 }, (_, v) => v), label: 'Mean delay (minutes), with its 95% CI' });
  root.append(h('p', { class: 'demo-key' },
    h('span', null, h('i', { class: 'k-plum bar' }), 'Mean'),
    h('span', null, h('i', { class: 'k-ink dash' }), 'Median')));
}

function trPeak(root) {
  const stop = routeStrip(root, ['Delay, in minutes', 'Two groups', 'Large samples', 't.test()']);
  const off = delays((i) => !T.peak[i]), on = delays((i) => T.peak[i]);
  groupsPlot(root, [{ name: 'Off-peak', values: off, colour: 'blue' }, { name: 'Rush hour', values: on, colour: 'orange' }],
    'Delays of off-peak and rush-hour trains, and their mean delays with 95% CIs');
  const t = S.welch(off, on), w = S.wilcox(off, on);
  const ro = readout([
    ['Mean delays', `${mins(S.mean(off))} and ${mins(S.mean(on))}`],
    ['<code>t.test()</code>', `${stat('t', t.t)}, df = ${num(t.df)}, ${pval(t.p)}`],
    ['<code>wilcox.test()</code>', `W = ${num(w.W)}, ${pval(w.p)}`],
  ]);
  root.append(ro.el);
  return { destroy: stop };
}

function trMonday(root) {
  const stop = routeStrip(root, ['Delay, in minutes', 'Two groups', 'Large samples', 't.test()']);
  const rest = delays((i) => T.day[i] !== 'Mon'), mon = delays((i) => T.day[i] === 'Mon');
  groupsPlot(root, [{ name: 'Other days', values: rest, colour: 'blue' }, { name: 'Mondays', values: mon, colour: 'orange' }],
    'Delays of Monday trains and of trains on other days, and their mean delays with 95% CIs');
  const t = S.welch(rest, mon);
  const kw = S.kruskal(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => delays((i) => T.day[i] === d)));
  root.append(readout([
    ['Mean delays', `${mins(S.mean(rest))} and ${mins(S.mean(mon))}`],
    ['<code>t.test()</code>', `${stat('t', t.t)}, df = ${num(t.df)}, ${pval(t.p)}`],
    ['<code>kruskal.test()</code>, five days', `χ² = ${num(kw.h, 2)}, df = ${kw.df}, ${pval(kw.p)}`],
  ]).el);
  return { destroy: stop };
}

function trRoutes(root) {
  const stop = routeStrip(root, ['Delay, in minutes', 'Four groups', 'Large samples', 'aov()']);
  const groups = ORIGINS.map((o) => ({ name: o, values: delays((i) => T.origin[i] === o), colour: COLOUR[o] }));
  groupsPlot(root, groups, 'Delays of trains from each origin, and their mean delays with 95% CIs');
  const a = S.anova(groups.map((g) => g.values)), kw = S.kruskal(groups.map((g) => g.values));
  root.append(readout([
    ['<code>aov()</code>', `F = ${num(a.f, 2)} on ${a.dfb} and ${a.dfw} df, ${pval(a.p)}`],
    ['<code>kruskal.test()</code>', `χ² = ${num(kw.h, 1)}, df = ${kw.df}, ${pval(kw.p)}`],
  ]).el);
  return { destroy: stop };
}

// ---------------------------------------------------------------- late trains in a table

function trRain(root) {
  const stop = routeStrip(root, ['Late: yes or no', 'Two groups', 'Expected ≥ 5', 'chisq.test()']);
  let by = 'rain';
  const BY = { rain: ['Dry', 'Rain'], peak: ['Off-peak', 'Rush hour'] };
  const b$ = choice({
    label: 'Compare late trains by', value: by,
    options: [{ value: 'rain', text: 'rain' }, { value: 'peak', text: 'peak' }],
    onchange: (v) => { by = v; draw(); },
  });
  controls(root, b$.el);
  const H = 132;
  const s = frame(root, H, 'The percentage of trains that arrived late, in each group, with 95% CIs');
  const tableBox = h('div', { class: 'table-box' });
  root.append(tableBox);
  const ro = readout();
  root.append(ro.el);
  function draw() {
    clear(s);
    const t = [[0, 0], [0, 0]];
    idx.forEach((i) => { t[+T[by][i]][+T.late[i]]++; });
    const x = linear([0, 0.35], [132, W - 70]);
    [0, 1].forEach((r) => {
      const n = t[r][0] + t[r][1], p = t[r][1] / n, se = Math.sqrt((p * (1 - p)) / n);
      const y = 16 + r * 44;
      text(s, 0, y + 15, BY[by][r], { class: 'lbl' });
      el('rect', { x: x(0), y, width: x(p) - x(0), height: 24, rx: 3, class: r ? 'f-orange' : 'f-blue' }, s);
      el('line', { x1: x(Math.max(0, p - 1.96 * se)), x2: x(p + 1.96 * se), y1: y + 12, y2: y + 12, class: 's-ink', 'stroke-width': 2 }, s);
      text(s, x(p + 1.96 * se) + 8, y + 17, `${pct(p, 1)}: ${t[r][1]} of ${n}`, { class: 'tick' });
    });
    axisX(s, x, 104, { values: [0, 0.1, 0.2, 0.3], format: (v) => pct(v) });
    const c = S.chisqTable(t), f = S.fisherOR(t[0][0], t[0][1], t[1][0], t[1][1]), fp = S.fisher2x2(t[0][0], t[0][1], t[1][0], t[1][1]);
    const cell = (r, k) => h('td', null, String(t[r][k]), h('span', { class: 'expected' }, ` (${num(c.expected[r][k], 1)})`));
    tableBox.replaceChildren(h('table', { class: 'coded' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, 'late FALSE'), h('th', { scope: 'col' }, 'late TRUE'))),
      h('tbody', null, [0, 1].map((r) => h('tr', null, h('th', { scope: 'row' }, `${by} ${r ? 'TRUE' : 'FALSE'}`), cell(r, 0), cell(r, 1))))),
    h('p', { class: 'demo-note' }, 'Counts, with the expected counts if H₀ were true in brackets.'));
    ro.set([
      ['<code>chisq.test()</code>', `X² = ${num(c.x2, 2)}, df = 1, ${pval(c.p)}`],
      ['<code>fisher.test()</code>', `odds ratio ${num(f.or, 2)} (95% CI ${num(f.lo, 2)} to ${num(f.hi, 2)}), ${pval(fp)}`],
    ]);
  }
  draw();
  return { destroy: stop };
}

// ---------------------------------------------------------------- stops: a regression, and confounding

function trStops(root) {
  const stop = routeStrip(root, ['Delay, in minutes', 'A number', 'lm()']);
  let view = 'crude';
  const v$ = choice({
    label: 'Model', value: view,
    options: [{ value: 'crude', text: 'delay ~ stops' }, { value: 'adjusted', text: 'delay ~ stops + origin' }],
    onchange: (v) => { view = v; draw(); },
  });
  controls(root, v$.el);
  const H = 204;
  const s = frame(root, H, 'Delay against the number of stops, coloured by origin, with the fitted lines');
  const meanStops = (o) => num(S.mean(idx.filter((i) => T.origin[i] === o).map((i) => T.stops[i])), 1);
  root.append(h('p', { class: 'demo-key' }, ORIGINS.map((o) => h('span', null, h('i', { class: `k-${COLOUR[o]}` }), `${o}: ${meanStops(o)} stops`))));
  const ro = readout();
  root.append(ro.el);
  const dummies = (i) => ORIGINS.slice(0, 3).map((o) => +(T.origin[i] === o));   // Birmingham is the baseline here
  const crude = S.ols(idx.map((i) => [1, T.stops[i]]), T.delay);
  const adj = S.ols(idx.map((i) => [1, T.stops[i], ...dummies(i)]), T.delay);
  const x = linear([0, 14], [44, W - 10]), y = linear([0, 20], [168, 8]);
  const r = S.rng(5);
  const jit = idx.map(() => (r() - 0.5) * 0.5);
  const ci = (fit) => { const q = S.qt(0.975, fit.df); return [fit.beta[1] - q * fit.se[1], fit.beta[1] + q * fit.se[1]]; };
  function draw() {
    clear(s);
    axisY(s, y, 44, { values: [0, 5, 10, 15, 20], grid: W - 10, label: 'Delay (min)' });
    axisX(s, x, 168, { values: [0, 2, 4, 6, 8, 10, 12, 14], label: 'Stops (delays over 20 minutes are drawn at the top)' });
    for (const i of idx) {
      const cx = x(T.stops[i] + jit[i]);
      if (T.delay[i] > 20) el('path', { d: `M${cx - 4} 12 L${cx + 4} 12 L${cx} 5 Z`, class: `f-${COLOUR[T.origin[i]]}` }, s);
      else el('circle', { cx, cy: y(T.delay[i]), r: 2.6, class: `f-${COLOUR[T.origin[i]]}`, opacity: 0.45 }, s);
    }
    if (view === 'crude') {
      el('line', { x1: x(1), x2: x(13), y1: y(crude.beta[0] + crude.beta[1]), y2: y(crude.beta[0] + 13 * crude.beta[1]), class: 's-ink', 'stroke-width': 3 }, s);
    } else {
      ORIGINS.forEach((o, k) => {
        const st = idx.filter((i) => T.origin[i] === o).map((i) => T.stops[i]);
        const a = adj.beta[0] + (k < 3 ? adj.beta[2 + k] : 0);
        const lo = Math.min(...st), hi = Math.max(...st);
        el('line', { x1: x(lo), x2: x(hi), y1: y(a + adj.beta[1] * lo), y2: y(a + adj.beta[1] * hi), class: `s-${COLOUR[o]}`, 'stroke-width': 4 }, s);
      });
    }
    const f = view === 'crude' ? crude : adj, [lo, hi] = ci(f);
    ro.set([
      ['Slope for stops', `${num(f.beta[1], 2)} min per stop (95% CI ${num(lo, 2)} to ${num(hi, 2)}), ${pval(f.p[1])}`],
      ['Lines', view === 'crude' ? 'one for all trains' : 'one for each route, with the same slope'],
    ]);
  }
  draw();
  return { destroy: stop };
}

export const TRAINS_DEMOS = { trPunctuality, trBoard, trTree, trPeak, trMonday, trRoutes, trRain, trStops };
