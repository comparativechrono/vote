// Drawing questions and their results, for the presenter's screen and for phones alike.

import { h, num, pct } from './ui.js';
import { el, svg, linear, ticks, axisX, text } from './svg.js';
import { DECK, SLIDES } from './content.js';

export const LETTERS = 'ABCDEFGHIJ';

export const sectionOf = (slide) => DECK.sections.find((s) => s.id === slide.section);
export const weekLabel = (sec) => (sec && sec.week ? `Week ${sec.week}` : '');

const NB = '\u00A0';
/** Keeps numbers with their units and both sides of '=' together, outside any HTML tags. */
export function typeset(html) {
  return String(html).split(/(<[^>]+>)/).map((seg, i) => (i % 2 ? seg : seg
    .replace(/(\d) (g|lb|SD|df)\b/g, `$1${NB}$2`)
    .replace(/ = /g, `${NB}=${NB}`)
    .replace(/ − /g, `${NB}−${NB}`))).join('');
}
/** Content text from content.js (our own, so it may hold simple HTML). */
export const rich = (tag, cls, html) => h(tag, { class: cls, html: typeset(html) });

/** How many choices a question has (for the server's check of each vote). */
export function choiceCount(slide) {
  if (slide.kind === 'choice') return slide.options.length;
  if (slide.kind === 'scale') return slide.labels.length;
  return 0;
}

/** The question's state as the server stores it. */
export function questionSpec(slide) {
  if (!slide || slide.type !== 'question') return { q: '', kind: '', n: 0, min: null, max: null };
  return {
    q: slide.id, kind: slide.kind, n: choiceCount(slide),
    min: slide.kind === 'number' ? slide.min : null,
    max: slide.kind === 'number' ? slide.max : null,
  };
}

// ---------------------------------------------------------------- choices and ratings

/**
 * The options of a choice or scale question, as rows with bars behind them.
 * opts: { buttons (phones: each row is a button), onpick(i) }
 * Returns { el, update({ results, showResults, showAnswer, mine, compare, disabled }) }.
 */
export function optionRows(slide, opts = {}) {
  const isScale = slide.kind === 'scale';
  const labels = isScale ? slide.labels.map((l, i) => `${i + 1}  ${l}`) : slide.options;
  const list = h('ol', { class: `opts ${isScale ? 'opts-scale' : ''}`, role: opts.buttons ? 'list' : null });
  const rows = labels.map((label, i) => {
    const bar = h('span', { class: 'opt-bar', 'aria-hidden': 'true' });
    const before = h('span', { class: 'opt-bar opt-before', 'aria-hidden': 'true' });
    const key = h('span', { class: 'opt-key', 'aria-hidden': 'true' }, isScale ? String(i + 1) : LETTERS[i]);
    const words = isScale
      ? h('span', { class: 'opt-text' }, slide.labels[i])
      : rich('span', 'opt-text', label);
    const count = h('span', { class: 'opt-n' });
    const inner = [bar, before, key, words, count];
    let row;
    if (opts.buttons) {
      const btn = h('button', { type: 'button', class: 'opt', 'aria-pressed': 'false', onclick: () => opts.onpick && opts.onpick(i) }, inner);
      row = h('li', null, btn);
      row.btn = btn;
    } else {
      row = h('li', { class: 'opt' }, inner);
      row.btn = row;
    }
    Object.assign(row, { bar, before, count });
    return row;
  });
  list.append(...rows);

  function update({ results, showResults, showAnswer, mine, compare, disabled } = {}) {
    const counts = (results && results.counts) || [];
    const total = (results && results.total) || 0;
    const prev = compare && compare.counts;
    const prevTotal = (compare && compare.total) || 0;
    list.classList.toggle('show-results', !!showResults);
    list.classList.toggle('show-answer', !!showAnswer && !isScale);
    list.classList.toggle('compare', !!(showResults && prev));
    rows.forEach((row, i) => {
      const share = total ? (counts[i] || 0) / total : 0;
      row.bar.style.setProperty('--share', showResults ? share.toFixed(4) : '0');
      const pshare = prevTotal ? (prev[i] || 0) / prevTotal : 0;
      row.before.style.setProperty('--share', showResults && prev ? pshare.toFixed(4) : '0');
      if (showResults && prev) row.count.replaceChildren(h('span', { class: 'was' }, pct(pshare)), h('span', { class: 'to' }, ' to '), h('b', null, pct(share)));
      else if (showResults) row.count.replaceChildren(h('b', null, pct(share)), h('span', { class: 'cnt' }, num(counts[i] || 0)));
      else row.count.replaceChildren();
      const correct = !isScale && i === slide.answer;
      row.btn.classList.toggle('correct', !!showAnswer && correct);
      row.btn.classList.toggle('mine', mine === i);
      if (opts.buttons) {
        row.btn.setAttribute('aria-pressed', String(mine === i));
        row.btn.disabled = !!disabled;
      }
    });
  }
  update();
  return { el: list, update };
}

// ---------------------------------------------------------------- numbers

/** A dot plot of the answers to a number question: one dot per answer, the right answer as a line. */
export function numberPlot(slide, results, { showAnswer, mine, width = 1000, height = 300 } = {}) {
  const values = (results && results.values) || [];
  const s = svg(width, height, `Dot plot of ${values.length} answers`);
  s.classList.add('numplot');
  const lo = slide.min, hi = slide.max;
  const x = linear([lo, hi], [40, width - 40]);
  const base = height - 64;
  const span = hi - lo;
  const r = width >= 900 ? 9 : 7;
  // bins about as wide as a dot, rounded to 1, 2, 2.5 or 5 times a power of ten
  const raw = span / ((width - 80) / (2 * r));
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw);
  const sorted = [...values].sort((a, b) => a - b);
  const med = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
  const ans = showAnswer && isFinite(slide.answer) ? slide.answer : null;
  // the lines first, so that the dots stay visible over them
  if (ans !== null) el('line', { x1: x(ans), x2: x(ans), y1: 44, y2: base, class: 's-green', 'stroke-width': 4 }, s);
  if (med !== null) el('line', { x1: x(med), x2: x(med), y1: 18, y2: base, class: 's-ink', 'stroke-dasharray': '6 5', 'stroke-width': 2 }, s);
  const stacks = new Map();
  const maxStack = Math.floor((base - 30) / (2 * r));
  const myBin = mine != null && isFinite(mine) ? Math.round((mine - lo) / step) : null;
  let mineDrawn = false;
  for (const v of sorted) {
    const k = Math.round((v - lo) / step);
    const n = stacks.get(k) || 0;
    stacks.set(k, n + 1);
    if (n >= maxStack) continue;
    const isMine = !mineDrawn && k === myBin;
    if (isMine) mineDrawn = true;
    el('circle', { cx: x(lo + k * step), cy: base - r - n * 2 * r * 0.96, r: r * 0.9, class: isMine ? 'f-plum' : 'f-blue', opacity: isMine ? 1 : 0.8 }, s);
  }
  // labels on opposite sides when the median and the answer are close
  const unit = slide.unit === '%' ? '%' : '';
  const medLeft = med !== null && (ans !== null ? med <= ans : med > (lo + hi) / 2);
  if (med !== null) text(s, x(med) + (medLeft ? -8 : 8), 22, `Median ${num(med, med % 1 ? 1 : 0)}${unit}`, { class: 'lbl', 'text-anchor': medLeft ? 'end' : 'start' });
  if (ans !== null) text(s, x(ans) + (medLeft ? 8 : -8), 62, `${num(ans)}${unit}`, { class: 'lbl-strong c-green', 'text-anchor': medLeft ? 'start' : 'end' });
  axisX(s, x, base, { values: ticks(lo, hi, width >= 900 ? 10 : 5), format: (v) => num(v), label: slide.unit && slide.unit !== '%' ? slide.unit : (slide.unit === '%' ? 'Percent' : '') });
  if (mineDrawn) {
    el('circle', { cx: width - 150, cy: height - 12, r: 6, class: 'f-plum' }, s);
    text(s, width - 138, height - 6, 'Your answer', { class: 'tick c-plum' });
  }
  return s;
}

// ---------------------------------------------------------------- free text

/** The free-text answers to a question, as a wall of notes. Text from phones is set as text, never HTML. */
export function textWall(comments, { onhide } = {}) {
  const wall = h('div', { class: 'wall' });
  for (const c of comments) {
    wall.append(h('figure', { class: 'note' },
      h('blockquote', { text: c.text }),
      onhide ? h('button', { type: 'button', class: 'note-hide', 'aria-label': 'Hide this answer', title: 'Hide', onclick: () => onhide(c) }, '×') : null));
  }
  if (!comments.length) wall.append(h('p', { class: 'wall-empty' }, 'No answers yet.'));
  return wall;
}

// ---------------------------------------------------------------- the deck

/**
 * Numbers the questions in the lecture's order: the start, the lecture's weeks and the wrap-up
 * first, then the other weeks. Both pages call it, so a question has the same number on each.
 */
export function numberQuestions(lectureWeeks) {
  const weeks = lectureWeeks && lectureWeeks.length ? lectureWeeks : null;
  const inLecture = (s) => !weeks || !sectionOf(s).week || weeks.includes(sectionOf(s).week);
  let n = 0;
  for (const s of SLIDES) if (s.type === 'question' && inLecture(s)) s.number = ++n;
  for (const s of SLIDES) if (s.type === 'question' && !inLecture(s)) s.number = ++n;
}

/** Where a slide is: its index, and the index of the first slide of its section. */
export function indexOf(id) { return SLIDES.findIndex((s) => s.id === id); }

export function sectionStarts() {
  const out = [];
  SLIDES.forEach((s, i) => { if (!i || SLIDES[i - 1].section !== s.section) out.push(i); });
  return out;
}

/** A short label for a slide, for menus. */
export function shortLabel(slide) {
  if (slide.type === 'question') return { tag: `Q${slide.number}`, text: slide.text.replace(/<[^>]+>/g, '') };
  if (slide.type === 'recap') return { tag: 'Recap', text: slide.title };
  if (slide.type === 'title') return { tag: 'Join', text: 'Title and QR code' };
  return { tag: 'End', text: slide.title || 'The end' };
}
