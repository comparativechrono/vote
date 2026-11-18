// The presenter's page: the recap as slides, the live votes, comments and the QR code.

import { CONFIG, backendUrl, joinUrl, shortUrl, loadPresenter, savePresenter } from './config.js';
import { connect, explain, newVoterId } from './api.js';
import { DECK, SLIDES } from './content.js';
import { mountDemo } from './demos.js';
import { h, $, num, toast } from './ui.js';
import {
  optionRows, numberPlot, textWall, questionSpec, sectionOf, weekLabel, rich, sectionStarts, shortLabel,
} from './render.js';
import qrcode from './vendor/qrcode.mjs';

// ---------------------------------------------------------------- settings and state

const saved = loadPresenter();
const P = {
  url: backendUrl(saved.url || undefined),
  key: saved.key || '',
  session: saved.session || CONFIG.session,
};

const S = {
  i: 0,
  stage: {},        // question id → 0 voting, 1 results shown, 2 answer shown
  closed: {},       // question id → voting closed by hand
  live: null,       // the last reply to 'live'
  compare: {},      // results of earlier questions, for compareWith
  online: null,
  error: '',
  overlay: null,
  seenT: 0,
  showHidden: false,
  digits: '',
  confirmReset: 0,
  renderedId: '',
  askedKey: false,
};

let backend = null;
let demo = null;     // the running demo on a recap slide
let view = null;     // the dynamic parts of the current slide
let pushTimer = 0, pollTimer = 0, sim = null;

const posKey = () => `gm2:present:${P.session}`;
function savePos() {
  try {
    localStorage.setItem(posKey(), JSON.stringify({ slide: SLIDES[S.i].id, stage: S.stage, closed: S.closed, seenT: S.seenT }));
  } catch { /* fine */ }
}
function loadPos() {
  try {
    const p = JSON.parse(localStorage.getItem(posKey()));
    if (!p) return;
    const i = SLIDES.findIndex((s) => s.id === p.slide);
    if (i >= 0) S.i = i;
    S.stage = p.stage || {};
    S.closed = p.closed || {};
    S.seenT = p.seenT || 0;
  } catch { /* fine */ }
}

const slide = () => SLIDES[S.i];
const isQ = (s = slide()) => s.type === 'question';
const maxStage = (s) => (s.kind === 'choice' || s.kind === 'number' ? 2 : 1);
const stageOf = (s = slide()) => (isQ(s) ? S.stage[s.id] || 0 : 0);
const votingOpen = (s = slide()) => isQ(s) && s.kind !== 'text' && !S.closed[s.id] && stageOf(s) < 2;
const resultsFor = (s = slide()) => {
  const r = S.live && S.live.results;
  return r && r.q === s.id ? r : null;
};

// ---------------------------------------------------------------- the stage and its scale

const stage = $('#stage');
function scaleStage() {
  const k = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.setProperty('--k', String(k));
}
window.addEventListener('resize', scaleStage);
scaleStage();

// ---------------------------------------------------------------- the rail of sections

const rail = $('#rail');
const cells = [];
function buildRail() {
  rail.replaceChildren();
  let week = null;
  for (const sec of DECK.sections) {
    if (sec.week && sec.week !== week) {
      week = sec.week;
      rail.append(h('span', { class: 'rail-week' }, `Week ${week}`));
    }
    const group = h('div', { class: 'rail-sec', 'data-sec': sec.id });
    for (const s of sec.slides) {
      const i = SLIDES.findIndex((x) => x.id === s.id);
      const lab = shortLabel(SLIDES[i]);
      const cell = h('button', {
        type: 'button', class: `rail-cell ${s.type === 'question' ? 'is-q' : ''}`, tabindex: '-1',
        title: `${sec.label}: ${lab.tag} ${lab.text}`, 'aria-label': `${sec.label}, ${lab.tag}`,
        onclick: () => go(i),
      });
      cells[i] = cell;
      group.append(cell);
    }
    rail.append(group);
  }
}
function updateRail() {
  cells.forEach((c, i) => {
    c.classList.toggle('now', i === S.i);
    c.classList.toggle('done', i < S.i);
  });
  const secId = slide().section;
  for (const g of rail.querySelectorAll('.rail-sec')) g.classList.toggle('now', g.dataset.sec === secId);
}

// ---------------------------------------------------------------- slides

const slideBox = $('#slide');

function renderSlide() {
  if (demo) { demo.destroy(); demo = null; }
  view = null;
  const s = slide();
  const sec = sectionOf(s);
  $('#sec').textContent = s.type === 'title' ? '' : sec.label;
  $('#week').textContent = weekLabel(sec);
  stage.dataset.type = s.type;
  stage.dataset.kind = s.kind || '';
  let body;
  if (s.type === 'title') body = titleSlide();
  else if (s.type === 'recap') body = recapSlide(s);
  else if (s.type === 'question') body = questionSlide(s);
  else body = endSlide(s);
  slideBox.replaceChildren(body);
  S.renderedId = s.id;
  updateRail();
  updateDynamic();
}

function qrSvg(text, cls) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = 2; // quiet zone, in modules
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  const box = h('div', { class: cls, role: 'img', 'aria-label': `QR code for ${text}` });
  box.innerHTML = `<svg viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#1B2333"/></svg>`;
  return box;
}

const joinHref = () => joinUrl(P.url);
/** The address to show: without any ?api=..., which only the QR code needs. */
const joinText = () => shortUrl(joinHref().split('?')[0]);

function titleSlide() {
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
  const count = h('p', { class: 'joined' });
  view = { kind: 'title', dots, count };
  return h('div', { class: 's-title' },
    h('div', { class: 't-left' },
      h('p', { class: 't-course' }, DECK.course),
      h('h1', null, DECK.title),
      h('p', { class: 't-sub' }, DECK.subtitle),
      h('div', { class: 't-joined' }, count, dots)),
    h('div', { class: 't-right' },
      qrSvg(joinHref(), 'qr'),
      h('p', { class: 't-url' }, joinText()),
      h('p', { class: 't-scan' }, 'Scan the code, or type the address, to vote from your phone')));
}

function recapSlide(s) {
  const slot = h('div', { class: 'demo-slot' });
  const node = h('div', { class: 's-recap' },
    h('h2', null, s.title),
    h('ul', { class: 'points' }, s.points.map((p) => rich('li', null, p))),
    slot,
    s.source ? h('p', { class: 'source' }, s.source) : null);
  if (s.demo) demo = mountDemo(s.demo, slot);
  return node;
}

function questionSlide(s) {
  const body = h('div', { class: 'q-body' });
  const explainBox = s.explain ? rich('div', 'q-explain', s.explain) : null;
  const inner = h('div', { class: 'fitbox' },
    h('p', { class: 'q-num' }, `Question ${s.number}`),
    rich('h2', 'q-text', s.text),
    body,
    explainBox);
  const frame = h('div', { class: 's-q fitframe' }, inner);
  view = { kind: s.kind, body, explainBox, frame, inner };
  if (s.kind === 'choice' || s.kind === 'scale') {
    view.rows = optionRows(s);
    body.append(view.rows.el);
  }
  return frame;
}

function endSlide(s) {
  return h('div', { class: 's-end' },
    h('h1', null, s.title),
    h('p', { class: 'end-text' }, s.text),
    h('p', { class: 'end-revise' }, 'Revise on your own, with every question and its answer, at ', h('b', null, joinText())));
}

/** Shrinks a question that would overflow the slide. */
function fit() {
  if (!view || !view.frame) return;
  const { frame, inner } = view;
  inner.style.zoom = '';
  const fr = frame.getBoundingClientRect().height;
  let z = 1;
  for (let k = 0; k < 4; k++) {
    const ih = inner.getBoundingClientRect().height;
    if (ih <= fr + 1) break;
    z = Math.max(0.66, (z * fr) / ih * 0.985);
    inner.style.zoom = String(z);
  }
}

// ---------------------------------------------------------------- what changes with the votes

function updateDynamic() {
  const s = slide();
  const live = S.live;
  if (view && view.kind === 'title') {
    const n = (live && live.joined) || 0;
    view.count.replaceChildren(h('b', null, num(n)), n === 1 ? ' phone connected' : ' phones connected');
    const have = view.dots.childElementCount;
    for (let k = have; k < Math.min(n, 240); k++) view.dots.append(h('i'));
    while (view.dots.childElementCount > Math.min(n, 240)) view.dots.lastChild.remove();
  }
  if (isQ(s) && view) {
    const st = stageOf(s);
    const res = resultsFor(s);
    const total = res ? res.total : 0;
    if (view.rows) {
      const cmp = s.compareWith ? S.compare[s.compareWith] : null;
      view.rows.update({ results: res, showResults: st >= 1, showAnswer: st >= 2, compare: st >= 1 ? cmp : null });
      if (s.compareWith && st >= 1) {
        view.body.querySelector('.compare-key')?.remove();
        if (cmp) view.body.append(h('p', { class: 'compare-key' }, h('i', { class: 'k-before' }), 'At the start', h('i', { class: 'k-now' }), 'Now'));
      }
    } else if (s.kind === 'number') {
      if (st >= 1) view.body.replaceChildren(numberPlot(s, res, { showAnswer: st >= 2, width: 1100, height: 310 }));
      else view.body.replaceChildren(waiting(total, `Type a number on your phone, from ${num(s.min)} to ${num(s.max)}${s.unit && s.unit !== '%' ? ` (${s.unit})` : ''}.`));
    } else if (s.kind === 'text') {
      const answers = answersTo(s.id);
      if (st >= 1) view.body.replaceChildren(textWall(answers, { onhide: hideComment }));
      else view.body.replaceChildren(waiting(answers.length, 'Write your answer on your phone. Answers are anonymous.'));
    }
    if (view.explainBox) view.explainBox.hidden = st < 2;
    fit();
  }
  updateFooter();
}

function waiting(n, words) {
  return h('div', { class: 'waiting' }, h('p', { class: 'waiting-n' }, h('b', null, num(n)), n === 1 ? ' answer' : ' answers'), h('p', null, words));
}

const TEXT_QS = new Set(SLIDES.filter((s) => s.kind === 'text').map((s) => s.id));
const allComments = () => (S.live && S.live.comments) || [];
/** Comments sent with the comment box (answers to text questions are shown on their own slide). */
const visibleComments = () => allComments().filter((c) => !c.hidden && !TEXT_QS.has(c.slide));
const answersTo = (id) => allComments().filter((c) => !c.hidden && c.slide === id);

// ---------------------------------------------------------------- the footer

const foot = { hint: $('#joinhint'), info: $('#qinfo'), tools: $('#tools') };
const tool = (label, key, onclick, extra) => h('button', { type: 'button', class: 'tool', title: `${label} (${key})`, 'data-key': key, onclick }, label, extra || null);
let tools = null;

function buildFooter() {
  foot.hint.replaceChildren(
    qrSvg(joinHref(), 'qr-mini'),
    h('p', null, h('span', null, 'Vote at'), h('b', null, joinText())));
  const badge = h('span', { class: 'badge', hidden: true });
  tools = {
    results: tool('Results', 'R', () => toggleResults()),
    answer: tool('Answer', 'A', () => toggleAnswer()),
    voting: tool('Voting', 'V', () => toggleVoting()),
    comments: tool('Comments', 'C', () => toggleOverlay('comments'), badge),
    menu: tool('Sections', 'M', () => toggleOverlay('menu')),
    count: h('span', { class: 'slide-n' }),
    badge,
  };
  foot.tools.replaceChildren(tools.results, tools.answer, tools.voting, tools.comments, tools.menu, tools.count);
}

function updateFooter() {
  const s = slide();
  const live = S.live;
  const q = isQ(s);
  tools.results.hidden = !q;
  tools.answer.hidden = !q || maxStage(s) < 2;
  tools.voting.hidden = !q || s.kind === 'text';
  const st = stageOf(s);
  tools.results.setAttribute('aria-pressed', String(st >= 1));
  tools.answer.setAttribute('aria-pressed', String(st >= 2));
  tools.voting.setAttribute('aria-pressed', String(votingOpen(s)));
  tools.voting.firstChild.textContent = votingOpen(s) ? 'Voting open' : 'Voting closed';
  // the next step for a clicker: highlight it
  for (const t of [tools.results, tools.answer]) t.classList.remove('next');
  if (q && st === 0) tools.results.classList.add('next');
  if (q && st === 1 && maxStage(s) === 2) tools.answer.classList.add('next');
  tools.count.textContent = `${S.i + 1} / ${SLIDES.length}`;
  // unseen comments
  const fresh = visibleComments().filter((c) => c.t > S.seenT).length;
  tools.badge.hidden = !fresh || S.overlay === 'comments';
  tools.badge.textContent = String(fresh);
  // the middle: answers or phones, and the connection
  const parts = [];
  if (S.online === false) {
    parts.push(h('span', { class: 'net bad', title: S.error }, 'Can’t reach the server'));
  } else if (backend && backend.mode === 'demo') {
    parts.push(h('span', { class: 'net demo', title: 'Votes stay in this browser. Set backendUrl in js/config.js for real phones.' }, 'Demo mode'));
  }
  if (q) {
    const res = resultsFor(s);
    const n = s.kind === 'text' ? answersTo(s.id).length : res ? res.total : 0;
    parts.push(h('span', { class: 'answers' }, h('b', null, num(n)), n === 1 ? ' answer' : ' answers'));
  } else if (live) {
    parts.push(h('span', { class: 'answers' }, h('b', null, num(live.joined || 0)), ' phones'));
  }
  if (S.confirmReset > Date.now()) parts.push(h('span', { class: 'confirm' }, 'Press X again to clear this question’s votes'));
  if (S.digits) parts.push(h('span', { class: 'confirm' }, `Go to question ${S.digits}`));
  foot.info.replaceChildren(...parts);
  if (live && live.storage > 400000) {
    foot.info.append(h('span', { class: 'net bad', title: 'Export this session in the sheet, then clear old sessions.' }, `Storage ${Math.round(live.storage / 5000)}% full`));
  }
}

// ---------------------------------------------------------------- moving around

function go(i, { keepOverlay } = {}) {
  const j = Math.max(0, Math.min(SLIDES.length - 1, i));
  if (j === S.i && S.renderedId === SLIDES[j].id) { if (!keepOverlay) closeOverlay(); return; }
  S.i = j;
  if (!keepOverlay) closeOverlay();
  renderSlide();
  fetchCompare();
  push();
  savePos();
}

function setStage(st) {
  const s = slide();
  if (!isQ(s)) return;
  S.stage[s.id] = Math.max(0, Math.min(maxStage(s), st));
  if (S.stage[s.id] < 2) delete S.closed[s.id];
  updateDynamic();
  fetchCompare();
  push();
  savePos();
}

function next() {
  const s = slide();
  if (isQ(s) && stageOf(s) < maxStage(s)) setStage(stageOf(s) + 1);
  else go(S.i + 1);
}
function prev() {
  const s = slide();
  if (isQ(s) && stageOf(s) > 0) setStage(stageOf(s) - 1);
  else go(S.i - 1);
}
function jumpSection(dir) {
  const starts = sectionStarts();
  const cur = starts.filter((x) => x <= S.i).pop();
  if (dir < 0) go(S.i > cur ? cur : starts[Math.max(0, starts.indexOf(cur) - 1)]);
  else go(starts[Math.min(starts.length - 1, starts.indexOf(cur) + 1)]);
}
function toggleResults() { if (isQ()) setStage(stageOf() >= 1 ? 0 : 1); }
function toggleAnswer() { if (isQ() && maxStage(slide()) === 2) setStage(stageOf() >= 2 ? 1 : 2); }
function toggleVoting() {
  const s = slide();
  if (!isQ(s) || s.kind === 'text') return;
  if (votingOpen(s)) S.closed[s.id] = true;
  else { delete S.closed[s.id]; if (stageOf(s) >= 2) S.stage[s.id] = 1; }
  updateDynamic();
  push();
  savePos();
}

// ---------------------------------------------------------------- the server

function push() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(sendState, 200);
}

async function sendState() {
  if (!backend) return;
  const s = slide();
  const spec = questionSpec(s);
  const st = stageOf(s);
  const body = {
    a: 'set', key: P.key, session: P.session, slide: s.id, ...spec,
    open: votingOpen(s), reveal: isQ(s) && st >= 1, answer: isQ(s) && st >= 2,
  };
  try {
    const r = await backend.post(body);
    if (!r.ok) throw Object.assign(new Error(r.error), { code: r.error });
    setOnline(true);
  } catch (e) {
    setOnline(false, e);
    clearTimeout(pushTimer);
    pushTimer = setTimeout(sendState, 4000);
  }
}

async function poll() {
  clearTimeout(pollTimer);
  if (backend) {
    try {
      const r = await backend.post({ a: 'live', key: P.key });
      if (!r.ok) throw Object.assign(new Error(r.error), { code: r.error });
      S.live = r;
      setOnline(true);
      if (r.state && (r.state.slide !== slide().id || r.state.session !== P.session)) push();
      updateDynamic();
      if (S.overlay === 'comments') renderComments();
      if (S.overlay === 'qr') renderQrBig();
    } catch (e) {
      setOnline(false, e);
    }
  }
  pollTimer = setTimeout(poll, document.hidden ? 8000 : CONFIG.pollPresenterMs);
}

function setOnline(ok, err) {
  const was = S.online;
  S.online = ok;
  S.error = ok ? '' : explain(err);
  if (was !== ok) updateFooter();
  if (!ok && err && (err.code === 'wrong-key' || err.code === 'no-presenter-key') && !S.askedKey && !$('#settings').open) {
    S.askedKey = true;
    openSettings(S.error);
  }
}

async function fetchCompare() {
  const s = slide();
  if (!s.compareWith || stageOf(s) < 1 || !backend) return;
  const other = SLIDES.find((x) => x.id === s.compareWith);
  try {
    const r = await backend.post({ a: 'results', key: P.key, q: other.id, kind: other.kind, n: questionSpec(other).n });
    if (r.ok) { S.compare[other.id] = r.results; updateDynamic(); }
  } catch { /* shown without the comparison */ }
}

async function hideComment(c, hidden = true) {
  c.hidden = hidden;
  updateDynamic();
  if (S.overlay === 'comments') renderComments();
  try { await backend.post({ a: 'hide', key: P.key, id: c.id, hidden }); } catch { toast('Not hidden: the server can’t be reached.'); }
}

async function resetVotes() {
  const s = slide();
  if (!isQ(s)) return;
  try {
    const r = await backend.post({ a: 'reset', key: P.key, q: s.id });
    if (!r.ok) throw new Error(r.error);
    S.stage[s.id] = 0;
    delete S.closed[s.id];
    if (S.live && S.live.results && S.live.results.q === s.id) S.live.results = { ...S.live.results, total: 0, counts: (S.live.results.counts || []).map(() => 0), values: [] };
    toast(`Votes for question ${s.number} cleared`);
    updateDynamic();
    push();
    savePos();
  } catch (e) {
    toast(`Not cleared: ${explain(e)}`);
  }
}

// ---------------------------------------------------------------- overlays

function closeOverlay() {
  for (const id of ['menu', 'drawer', 'qrbig', 'help']) $(`#${id}`).hidden = true;
  S.overlay = null;
  updateFooter();
}

function toggleOverlay(name) {
  const was = S.overlay;
  closeOverlay();
  if (was === name) return;
  S.overlay = name;
  if (name === 'menu') renderMenu();
  if (name === 'comments') { renderComments(); S.seenT = Math.max(S.seenT, ...visibleComments().map((c) => c.t), 0); savePos(); }
  if (name === 'qr') renderQrBig();
  if (name === 'help') $('#help').hidden = false;
  updateFooter();
}

function renderMenu() {
  const box = $('#menu');
  box.hidden = false;
  box.replaceChildren(
    h('div', { class: 'menu-head' }, h('h2', null, 'Sections'), h('p', null, 'Click a slide, or type a question’s number and press Enter. Esc closes this.')),
    h('div', { class: 'menu-grid' }, DECK.sections.map((sec) => h('section', { class: 'menu-sec' },
      h('h3', null, sec.label, sec.week ? h('span', null, ` Week ${sec.week}`) : null),
      h('ol', null, sec.slides.map((x) => {
        const i = SLIDES.findIndex((y) => y.id === x.id);
        const lab = shortLabel(SLIDES[i]);
        return h('li', null, h('button', {
          type: 'button', class: `menu-item ${i === S.i ? 'now' : ''} ${x.type === 'question' ? 'is-q' : ''}`,
          onclick: () => go(i),
        }, h('span', { class: 'menu-tag' }, lab.tag), h('span', { class: 'menu-text' }, lab.text)));
      }))))));
  box.querySelector('.menu-item.now')?.focus();
}

function labelFor(id) {
  const s = SLIDES.find((x) => x.id === id);
  if (!s) return 'General';
  const l = shortLabel(s);
  return l.tag === 'Recap' ? s.title : l.tag;
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m === 1 ? '1 min ago' : `${m} min ago`;
}

function renderComments() {
  const box = $('#drawer');
  box.hidden = false;
  const all = allComments().filter((c) => !TEXT_QS.has(c.slide));
  const hidden = all.filter((c) => c.hidden).length;
  const list = all.filter((c) => S.showHidden || !c.hidden);
  box.replaceChildren(
    h('div', { class: 'drawer-head' },
      h('h2', null, 'Comments'),
      h('button', { type: 'button', class: 'btn-quiet btn btn-small', onclick: () => toggleOverlay('comments') }, 'Close')),
    list.length
      ? h('ol', { class: 'comments' }, list.map((c) => h('li', { class: c.hidden ? 'is-hidden' : null },
        h('p', { class: 'c-text', text: c.text }),
        h('p', { class: 'c-meta' }, h('span', null, `${labelFor(c.slide)}, ${ago(c.t)}`),
          h('button', { type: 'button', class: 'btn btn-quiet btn-small', onclick: () => hideComment(c, !c.hidden) }, c.hidden ? 'Show' : 'Hide')))))
      : h('p', { class: 'drawer-empty' }, 'No comments yet. Students can send one from their phones at any time.'),
    hidden ? h('button', { type: 'button', class: 'btn btn-quiet btn-small drawer-hidden', onclick: () => { S.showHidden = !S.showHidden; renderComments(); } },
      S.showHidden ? 'Leave out hidden comments' : `Show ${hidden} hidden`) : null);
}

function renderQrBig() {
  const box = $('#qrbig');
  box.hidden = false;
  const n = (S.live && S.live.joined) || 0;
  box.replaceChildren(qrSvg(joinHref(), 'qr-big'), h('div', null,
    h('p', { class: 'qr-url' }, joinText()),
    h('p', { class: 'qr-n' }, h('b', null, num(n)), n === 1 ? ' phone connected' : ' phones connected'),
    h('p', { class: 'qr-close' }, 'Press J or Esc to go back')));
}

// ---------------------------------------------------------------- settings

const dlg = $('#settings');

function openSettings(message) {
  const isDemo = !P.url;
  const urlIn = h('input', { type: 'url', id: 'set-url', value: P.url, placeholder: 'https://script.google.com/macros/s/…/exec', spellcheck: 'false' });
  const keyIn = h('input', { type: 'password', id: 'set-key', value: P.key, autocomplete: 'off' });
  const sesIn = h('input', { type: 'text', id: 'set-ses', value: P.session, pattern: '[A-Za-z0-9_-]{1,48}', spellcheck: 'false' });
  const out = h('p', { class: 'set-out', role: 'status' }, message || '');
  const read = () => ({ url: urlIn.value.trim(), key: keyIn.value.trim(), session: sesIn.value.trim() || CONFIG.session });
  const say = (t, bad) => { out.textContent = t; out.classList.toggle('bad', !!bad); };

  async function apply() {
    const v = read();
    if (!/^[A-Za-z0-9_-]{1,48}$/.test(v.session)) { say('A session name uses letters, digits, - and _ only.', true); return false; }
    const changedSession = v.session !== P.session;
    P.url = backendUrl(v.url || undefined);
    P.key = P.url ? v.key : 'demo';
    P.session = v.session;
    S.askedKey = false;
    savePresenter({ url: v.url, key: v.key, session: v.session });
    if (changedSession) { S.stage = {}; S.closed = {}; loadPos(); }
    backend = await connect(P.url);
    buildFooter();
    renderSlide();
    push();
    poll();
    return true;
  }
  async function test() {
    say('Checking…');
    if (!(await apply())) return;
    try {
      const r = await backend.post({ a: 'live', key: P.key });
      if (!r.ok) throw Object.assign(new Error(r.error), { code: r.error });
      say(`Connected${backend.mode === 'demo' ? ' (demo mode)' : ''}. ${r.joined} phones in session “${r.state.session}”.`);
    } catch (e) { say(explain(e), true); }
  }
  async function exportNow() {
    say('Copying to the sheet…');
    try {
      const r = await backend.post({ a: 'export', key: P.key, session: P.session });
      if (!r.ok) throw Object.assign(new Error(r.error), { code: r.error });
      out.replaceChildren(`Copied ${r.votes} votes and ${r.comments} comments from ${r.phones} phones. `,
        backend.mode === 'apps-script' ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, 'Open the sheet') : '(demo mode: no real sheet)');
      out.classList.remove('bad');
    } catch (e) { say(explain(e), true); }
  }

  const simBtn = h('button', { type: 'button', class: 'btn', onclick: () => { toggleSimulation(); dlg.close(); } }, sim ? 'Stop the simulated phones' : 'Add 30 simulated phones');
  dlg.replaceChildren(h('form', { method: 'dialog', class: 'settings' },
    h('h2', null, 'Settings'),
    h('p', { class: 'set-intro' }, isDemo
      ? 'Demo mode: votes stay in this browser. Open the student page in other tabs to try it, or add simulated phones.'
      : 'Connected to the web app in the Google Sheet. The key is the one set with Live recap ▸ Set the presenter key.'),
    h('label', { for: 'set-url' }, 'Web app address'), urlIn,
    h('p', { class: 'hint' }, 'Leave it empty to use the address in js/config.js, or demo mode if that is empty too.'),
    h('label', { for: 'set-key' }, 'Presenter key'), keyIn,
    h('label', { for: 'set-ses' }, 'Session'), sesIn,
    h('p', { class: 'hint' }, 'Votes are kept per session: start a new one for each lecture.'),
    out,
    h('div', { class: 'set-actions' },
      h('button', { type: 'button', class: 'btn btn-primary', onclick: async () => { if (await apply()) dlg.close(); } }, 'Save'),
      h('button', { type: 'button', class: 'btn', onclick: test }, 'Test the connection'),
      h('button', { type: 'button', class: 'btn', onclick: exportNow }, 'Copy votes to the sheet'),
      backend && backend.mode !== 'apps-script' ? simBtn : null,
      backend && backend.mode === 'demo' ? h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => { stopSimulation(); backend.reset(); S.live = null; S.stage = {}; S.closed = {}; savePos(); renderSlide(); push(); say('Demo votes and comments cleared.'); } }, 'Clear the demo votes') : null,
      h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => dlg.close() }, 'Close')),
    h('p', { class: 'hint' }, h('a', { href: joinHref(), target: '_blank', rel: 'noopener' }, 'Open the student page'), ' in a new tab.')));
  dlg.showModal();
}

// ---------------------------------------------------------------- simulated phones (demo mode)

const CANNED = [
  'Could you go over the bootstrap again?',
  'When should I use Fisher instead of chi-square?',
  'Why is it N = 2n for allele frequencies?',
  'Is the SE the same as the SD of the sample?',
  'What does it mean for the CI to “contain” the mean?',
  'How do I decide between a dominant and an additive model?',
];

function pickVote(s, rnd) {
  if (s.kind === 'choice') return rnd() < 0.55 ? s.answer : Math.floor(rnd() * s.options.length);
  if (s.kind === 'scale') {
    const w = s.compareWith ? [0.03, 0.12, 0.3, 0.38, 0.17] : [0.12, 0.3, 0.32, 0.2, 0.06];
    let u = rnd();
    for (let k = 0; k < w.length; k++) { u -= w[k]; if (u <= 0) return k; }
    return 2;
  }
  if (s.kind === 'number') {
    const v = rnd() < 0.2 ? s.min + rnd() * (s.max - s.min) : s.answer + (rnd() + rnd() + rnd() - 1.5) * 0.12 * (s.max - s.min);
    return Math.round(Math.max(s.min, Math.min(s.max, v)));
  }
  return null;
}

function toggleSimulation() { if (sim) stopSimulation(); else startSimulation(30); }
function stopSimulation() { if (sim) { clearInterval(sim.timer); sim = null; toast('Simulated phones stopped'); } }
async function startSimulation(n) {
  const phones = Array.from({ length: n }, () => ({ id: newVoterId(), voted: {}, commented: false }));
  sim = { phones, timer: 0 };
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const p of phones) backend.post({ a: 'join', voter: p.id });
  toast(`${n} simulated phones joined`);
  sim.timer = setInterval(async () => {
    const s = slide();
    for (const p of phones) {
      if (rnd() > 0.3) continue;
      if (isQ(s) && s.kind !== 'text' && votingOpen(s)) {
        const tag = `${s.id}|${(S.live && S.live.state && S.live.state.rounds && S.live.state.rounds[s.id]) || 0}`;
        if (p.voted[tag]) continue;
        p.voted[tag] = true;
        backend.post({ a: 'vote', voter: p.id, session: P.session, q: s.id, value: pickVote(s, rnd) });
      } else if (isQ(s) && s.kind === 'text' && !p.commented && rnd() < 0.3) {
        p.commented = true;
        backend.post({ a: 'comment', voter: p.id, slide: s.id, text: CANNED[Math.floor(rnd() * CANNED.length)] });
      } else if (s.type === 'recap' && rnd() < 0.01) {
        backend.post({ a: 'comment', voter: p.id, slide: s.id, text: CANNED[Math.floor(rnd() * CANNED.length)] });
      }
    }
  }, 1200);
}

// ---------------------------------------------------------------- keys

function onKey(e) {
  if (dlg.open) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') && t.type !== 'range') return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key;
  if (/^[0-9]$/.test(k)) {
    S.digits = (S.digits + k).slice(-3);
    clearTimeout(onKey.digitTimer);
    onKey.digitTimer = setTimeout(() => { S.digits = ''; updateFooter(); }, 2500);
    updateFooter();
    return;
  }
  if (k === 'Enter' && S.digits) {
    const n = Number(S.digits);
    S.digits = '';
    const i = SLIDES.findIndex((s) => s.number === n);
    if (i >= 0) go(i); else { toast(`There is no question ${n}`); updateFooter(); }
    e.preventDefault();
    return;
  }
  // the arrows move a focused slider in a graph, not the slides
  if (t && t.type === 'range' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(k)) return;
  const map = {
    ArrowRight: next, PageDown: next, ' ': next,
    ArrowLeft: prev, PageUp: prev, Backspace: prev,
    ArrowDown: () => jumpSection(1), ArrowUp: () => jumpSection(-1),
    Home: () => go(0), End: () => go(SLIDES.length - 1),
    r: toggleResults, a: toggleAnswer, v: toggleVoting,
    c: () => toggleOverlay('comments'), m: () => toggleOverlay('menu'), j: () => toggleOverlay('qr'), '?': () => toggleOverlay('help'),
    f: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})),
    s: () => openSettings(),
    x: () => {
      if (!isQ()) return;
      if (S.confirmReset > Date.now()) { S.confirmReset = 0; resetVotes(); } else {
        S.confirmReset = Date.now() + 3000;
        setTimeout(updateFooter, 3100);
      }
      updateFooter();
    },
    Escape: () => { S.digits = ''; closeOverlay(); },
  };
  const f = map[k.length === 1 ? k.toLowerCase() : k];
  if (!f) return;
  if (k === ' ' && t && t.tagName === 'BUTTON') return;
  e.preventDefault();
  f();
}
document.addEventListener('keydown', onKey);
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

// ---------------------------------------------------------------- start

function buildHelp() {
  const keys = [
    ['→  Space  Page Down', 'Next step: show the results, then the answer, then the next slide'],
    ['←  Page Up', 'Back a step'],
    ['↓  ↑', 'Next or previous section'],
    ['M', 'All sections and slides'],
    ['14 then Enter', 'Go to question 14'],
    ['R  A  V', 'Results, answer, voting open or closed'],
    ['C', 'Comments from phones'],
    ['J', 'The QR code, large'],
    ['X twice', 'Clear the votes of this question'],
    ['F', 'Full screen'],
    ['S', 'Settings: the server, the key, the session'],
  ];
  $('#help').replaceChildren(h('h2', null, 'Keys'), h('dl', null, keys.map(([a, b]) => [h('dt', null, a), h('dd', null, b)])),
    h('p', { class: 'hint' }, 'A presentation clicker works too: it sends Page Down and Page Up. Press ? or Esc to close this.'));
}

async function start() {
  loadPos();
  buildRail();
  buildHelp();
  backend = await connect(P.url);
  if (!P.url) P.key = 'demo';
  buildFooter();
  renderSlide();
  push();
  poll();
  if (P.url && !P.key) openSettings('Type the presenter key you set in the Google Sheet.');
  $('#help-btn')?.addEventListener('click', () => toggleOverlay('help'));
  $('#settings-btn')?.addEventListener('click', () => openSettings());
}

start();
