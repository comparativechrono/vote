// The students' page: follows the lecture, takes votes and comments, and lets students
// revise every slide on their own afterwards.

import { CONFIG, backendUrl } from './config.js';
import { connect, newVoterId } from './api.js';
import { DECK, DECK_ID, DECKS, SLIDES, byId, deckWith, deckHref } from './content.js';
import { codeBlock } from './code.js';
import { mountDemo } from './demos.js';
import { h, $, num } from './ui.js';
import { optionRows, numberPlot, sectionOf, weekLabel, rich, numberQuestions } from './render.js';

numberQuestions(CONFIG.lectureWeeks);

const URL_ = backendUrl();
const DEMO = !URL_;
// In demo mode each tab is its own phone; otherwise a phone keeps its id between visits.
const store = (() => { try { return DEMO ? window.sessionStorage : window.localStorage; } catch { return null; } })();
const get = (k, d) => { try { const v = store && store.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const put = (k, v) => { try { store && store.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

const ME = {
  voter: get('gm2:voter', '') || '',
  votes: get('gm2:votes', {}),     // 'session|q|round' → { v, sent, failed, rejected }
  joined: get('gm2:joined', {}),   // session → true
  texts: get('gm2:texts', {}),     // 'session|slide' → [sent answers]
};
if (!/^[a-z0-9]{8,32}$/.test(ME.voter)) { ME.voter = newVoterId(); put('gm2:voter', ME.voter); }
const saveMe = () => { put('gm2:votes', ME.votes); put('gm2:joined', ME.joined); put('gm2:texts', ME.texts); };

const L = {
  st: null,          // the lecture's state, from the server
  results: null,
  slideId: null,
  failures: 0,
  timer: 0,
  mode: window.location.hash === '#revise' ? 'revise' : 'live',
  reviseIndex: 0,
  sending: null,     // the vote being sent, and the one queued behind it
  queued: null,
  demo: null,
};

let backend = null;
let view = null;     // the dynamic parts of the slide on screen

const main = $('#main');
const net = $('#net');

// ---------------------------------------------------------------- the connection

function setNet(kind) {
  const words = { connecting: 'Connecting…', live: DEMO ? 'Demo mode' : 'Live', retry: 'Reconnecting…' };
  net.textContent = words[kind];
  net.dataset.state = kind;
  net.hidden = L.mode !== 'live';
}

const voteKey = (st) => `${st.session}|${st.q}|${st.round || 0}`;

async function tick() {
  clearTimeout(L.timer);
  if (L.mode === 'live' && !document.hidden) {
    try {
      const r = await backend.get({ a: 'state' });
      if (!r.ok) throw new Error(r.error);
      L.failures = 0;
      setNet('live');
      onState(r.state, r.results || null);
      join(r.state.session);
    } catch {
      L.failures++;
      setNet('retry');
    }
  }
  const slower = Math.min(4, 1 + 0.6 * L.failures);
  L.timer = setTimeout(tick, CONFIG.pollStudentMs * slower + Math.random() * CONFIG.pollJitterMs);
}

async function join(session) {
  if (!session || ME.joined[session]) return;
  try {
    const r = await backend.post({ a: 'join', voter: ME.voter });
    if (r.ok) { ME.joined[session] = true; saveMe(); }
  } catch { /* the next check tries again */ }
}

document.addEventListener('visibilitychange', () => { if (!document.hidden && L.mode === 'live') tick(); });

// ---------------------------------------------------------------- following the lecture

function onState(st, results) {
  const before = L.st;
  L.st = st;
  L.results = results;
  if (L.mode !== 'live') return;
  if (!before || st.slide !== L.slideId || st.session !== before.session) renderLive();
  else updateLive();
}

function renderLive() {
  if (L.demo) { L.demo.destroy(); L.demo = null; }
  view = null;
  const st = L.st;
  const s = st && byId[st.slide];
  L.slideId = st ? st.slide : null;
  document.body.dataset.mode = 'live';
  $('#mode-btn').textContent = 'Revise on your own';
  // the presenter has opened another deck (say, the trains exercise): follow it there
  const other = st && !s ? deckWith(st.slide) : null;
  if (other && other !== DECK_ID) { window.location.replace(deckHref(other)); return; }
  if (!s) {
    main.replaceChildren(panel(h('h1', null, 'Waiting for the lecture'), h('p', null, 'Keep this page open. Questions appear here when the lecture reaches them.')));
  } else if (s.type === 'title') {
    main.replaceChildren(panel(
      h('p', { class: 'kicker' }, DECK.course),
      h('h1', null, 'You’re in'),
      h('p', null, 'Questions appear here when the lecture reaches them. Keep this page open; you don’t need to reload it.'),
      h('p', { class: 'muted' }, 'Your answers are anonymous: this phone has a random number, and no names are kept.')));
  } else if (s.type === 'recap') {
    main.replaceChildren(recapPanel(s));
  } else if (s.type === 'question') {
    main.replaceChildren(questionPanel(s, { live: true }));
  } else {
    main.replaceChildren(panel(
      h('h1', null, s.title),
      rich('p', null, s.text),
      h('p', null, 'Every slide and question of the recap stays here, to revise when you like.'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: () => setMode('revise') }, 'Revise on your own')));
  }
  updateLive();
  composer.reset(s && s.kind === 'text');
}

function panel(...kids) { return h('article', { class: 'panel' }, kids); }

function sectionLine(s) {
  const sec = sectionOf(s);
  return h('p', { class: 'kicker' }, sec.label, sec.week ? h('span', null, ` Week ${sec.week}`) : null);
}

function recapPanel(s) {
  const slot = h('div', { class: 'demo-slot' });
  const details = h('details', { class: 'try' }, h('summary', null, 'Try the graph yourself'), slot);
  details.addEventListener('toggle', () => {
    if (details.open && !slot.childElementCount) L.demo = mountDemo(s.demo, slot);
  });
  return panel(sectionLine(s), h('h1', null, s.title),
    h('ul', { class: 'points' }, s.points.map((p) => rich('li', null, p))),
    s.code ? codeBlock(s.code, { copy: true }) : null,
    s.demo ? details : null,
    s.source ? h('p', { class: 'source' }, s.source) : null);
}

/** A question, live (votes go to the server) or for revision (checked here). */
function questionPanel(s, { live }) {
  const status = h('p', { class: 'q-status', role: 'status', 'aria-live': 'polite' });
  const area = h('div', { class: 'q-area' });
  const explain = s.explain ? rich('div', 'q-explain', s.explain) : null;
  if (explain) explain.hidden = true;
  const node = panel(sectionLine(s), h('p', { class: 'q-num' }, `Question ${s.number}`), rich('h1', 'q-text', s.text), area, status, explain);
  view = { s, live, status, area, explain, mine: null, checked: false };

  if (s.kind === 'choice' || s.kind === 'scale') {
    view.rows = optionRows(s, { buttons: true, onpick: (i) => (live ? vote(i) : check(i)) });
    area.append(view.rows.el);
  } else if (s.kind === 'number') {
    const input = h('input', { type: 'number', id: `n-${s.id}`, inputmode: 'decimal', min: s.min, max: s.max, step: s.step || 'any', required: true });
    const send = h('button', { type: 'submit', class: 'btn btn-primary' }, live ? 'Send' : 'Check');
    const form = h('form', { class: 'num-form', novalidate: true, onsubmit: (e) => {
      e.preventDefault();
      const v = Number(input.value);
      if (input.value === '' || !isFinite(v) || v < s.min || v > s.max) { status.textContent = `Type a number from ${num(s.min)} to ${num(s.max)}.`; return; }
      if (live) vote(v); else check(v);
    } }, h('label', { for: input.id }, 'Your answer'), h('div', { class: 'num-row' }, input, s.unit ? h('span', { class: 'unit' }, s.unit) : null, send));
    view.input = input;
    view.send = send;
    view.plot = h('div', { class: 'plot' });
    area.append(form, view.plot);
  } else if (s.kind === 'text') {
    const ta = h('textarea', { id: `t-${s.id}`, rows: 4, maxlength: 500, placeholder: 'Write as much or as little as you like' });
    const send = h('button', { type: 'submit', class: 'btn btn-primary' }, 'Send');
    const sent = h('ul', { class: 'sent' });
    area.append(h('form', { class: 'text-form', onsubmit: async (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text) return;
      send.disabled = true;
      const ok = await postComment(text, s.id, status);
      send.disabled = false;
      if (ok) {
        ta.value = '';
        const k = `${L.st.session}|${s.id}`;
        (ME.texts[k] = ME.texts[k] || []).push(text);
        saveMe();
        showSent();
      }
    } }, h('label', { for: ta.id, class: 'sr-only' }, 'Your answer'), ta, send), sent);
    const showSent = () => {
      const list = (L.st && ME.texts[`${L.st.session}|${s.id}`]) || [];
      sent.replaceChildren(...list.map((t) => h('li', { text: t })));
      if (list.length) status.textContent = 'Sent. Your lecturer sees the answers together. Add another if you like.';
    };
    view.showSent = showSent;
  }
  return node;
}

function updateLive() {
  const st = L.st;
  if (!view || !st || !view.live || st.slide !== view.s.id) return;
  const s = view.s;
  if (s.kind === 'text') { view.showSent(); return; }
  const mine = ME.votes[voteKey(st)];
  const res = st.reveal && L.results && L.results.q === s.id ? L.results : null;
  const val = mine ? mine.v : null;
  if (view.rows) {
    view.rows.update({ results: res, showResults: !!res, showAnswer: st.answer, mine: val, disabled: !st.open });
  } else if (s.kind === 'number') {
    view.input.disabled = !st.open;
    view.send.disabled = !st.open;
    if (val != null && document.activeElement !== view.input && view.input.value === '') view.input.value = val;
    view.plot.replaceChildren(...(res || st.answer ? [numberPlot(s, res, { showAnswer: st.answer, mine: val, width: 600, height: 280 })] : []));
  }
  if (view.explain) view.explain.hidden = !st.answer;
  let words;
  if (mine && mine.rejected) words = 'Voting had closed, so that answer wasn’t counted.';
  else if (mine && mine.failed) words = 'Not sent: the connection dropped. Tap your answer again.';
  else if (!st.open) words = mine ? 'Voting has closed. Your answer is in.' : 'Voting has closed.';
  else if (mine && mine.sent) words = s.kind === 'number' ? `Sent: ${num(mine.v, mine.v % 1 ? 2 : 0)}. You can change it until voting closes.` : 'Sent. You can change your answer until voting closes.';
  else if (mine) words = 'Sending…';
  else words = s.kind === 'number' ? 'Type your answer and send it.' : s.kind === 'scale' ? 'Tap the one closest to how you feel.' : 'Tap an answer.';
  if (st.answer && mine && s.kind === 'choice') words = mine.v === s.answer ? 'You got it right.' : `The answer is ${'ABCDEFGH'[s.answer]}.`;
  view.status.textContent = words;
}

// ---------------------------------------------------------------- votes

function vote(value) {
  const st = L.st;
  if (!st || !st.open || !view || st.q !== view.s.id) return;
  const key = voteKey(st);
  ME.votes[key] = { v: value, sent: false };
  saveMe();
  updateLive();
  const job = { key, value, session: st.session, q: st.q };
  if (L.sending) { L.queued = job; return; }
  sendVote(job);
}

async function sendVote(job) {
  L.sending = job;
  let done = false;
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    try {
      const r = await backend.post({ a: 'vote', voter: ME.voter, session: job.session, q: job.q, value: job.value });
      const mine = ME.votes[job.key];
      if (r.ok) { if (mine && mine.v === job.value) mine.sent = true; done = true; }
      else if (r.error === 'closed' || r.error === 'not-live') {
        if (mine && mine.v === job.value) mine.rejected = true;
        done = true;
        if (r.state) onState(r.state, L.results);
      } else done = true;
    } catch {
      await new Promise((ok) => setTimeout(ok, 1200 * (attempt + 1)));
    }
  }
  if (!done && ME.votes[job.key] && ME.votes[job.key].v === job.value) ME.votes[job.key].failed = true;
  saveMe();
  L.sending = null;
  updateLive();
  if (L.queued) { const next = L.queued; L.queued = null; sendVote(next); }
}

// ---------------------------------------------------------------- comments

async function postComment(text, slide, statusEl) {
  try {
    const r = await backend.post({ a: 'comment', voter: ME.voter, slide, text });
    if (r.ok) return true;
    statusEl.textContent = r.error === 'too-fast' ? 'Wait a few seconds before sending another.' : 'Not sent. Try again.';
  } catch {
    statusEl.textContent = 'Not sent: no connection. Try again.';
  }
  return false;
}

const composer = (() => {
  const box = $('#composer');
  const ta = h('textarea', { id: 'comment', rows: 3, maxlength: 500, placeholder: 'A question, or something that wasn’t clear' });
  const status = h('p', { class: 'c-status', role: 'status', 'aria-live': 'polite' });
  const send = h('button', { type: 'submit', class: 'btn btn-primary' }, 'Send');
  const open = h('button', { type: 'button', class: 'btn composer-open', 'aria-expanded': 'false' }, 'Ask a question or comment');
  const form = h('form', { class: 'composer-form', hidden: true, onsubmit: async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) { status.textContent = 'Write something first.'; return; }
    send.disabled = true;
    const ok = await postComment(text, L.slideId || '', status);
    send.disabled = false;
    if (ok) { ta.value = ''; status.textContent = 'Sent, anonymously. Your lecturer sees it on the presenter’s screen.'; }
  } },
  h('label', { for: 'comment' }, 'Your comment, anonymous'), ta,
  h('div', { class: 'composer-actions' }, send, h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => toggle(false) }, 'Close')),
  status);
  function toggle(on) {
    form.hidden = !on;
    open.hidden = on;
    open.setAttribute('aria-expanded', String(on));
    if (on) ta.focus();
  }
  open.addEventListener('click', () => toggle(true));
  box.append(open, form);
  return {
    /** A new slide: close the box (and hide it where the slide itself takes text). */
    reset(hide) { status.textContent = ''; toggle(false); box.hidden = L.mode !== 'live' || !!hide; },
  };
})();

// ---------------------------------------------------------------- revising on your own

const REVISE = SLIDES.filter((s) => s.type === 'recap' || (s.type === 'question' && (s.kind === 'choice' || s.kind === 'number')));
// Revising starts at the newest week of the lecture; the menu reaches the others.
{
  const weeks = (CONFIG.lectureWeeks || []).length ? CONFIG.lectureWeeks : SLIDES.map((s) => sectionOf(s).week || 0);
  const newest = Math.max(...weeks);
  L.reviseIndex = Math.max(0, REVISE.findIndex((s) => sectionOf(s).week === newest));
}

function check(value) {
  const s = view.s;
  view.mine = value;
  if (view.rows) view.rows.update({ showAnswer: true, mine: value });
  else view.plot.replaceChildren(h('p', { class: 'check-n' }, `The answer: ${num(s.answer)}${s.unit === '%' ? '%' : s.unit ? ` ${s.unit}` : ''}`));
  if (view.explain) view.explain.hidden = false;
  const right = s.kind === 'choice' ? value === s.answer : Math.abs(value - s.answer) <= 0.05 * (s.max - s.min);
  view.status.textContent = right ? 'Right.' : s.kind === 'choice' ? `Not quite: the answer is ${'ABCDEFGH'[s.answer]}.` : 'Not quite.';
  view.status.dataset.result = right ? 'right' : 'wrong';
}

function renderRevise() {
  if (L.demo) { L.demo.destroy(); L.demo = null; }
  net.hidden = true;
  document.body.dataset.mode = 'revise';
  $('#mode-btn').textContent = 'Back to the lecture';
  const i = Math.max(0, Math.min(REVISE.length - 1, L.reviseIndex));
  L.reviseIndex = i;
  const s = REVISE[i];
  const select = h('select', {
    id: 'jump', 'aria-label': 'Section',
    onchange: (e) => {
      const v = e.target.value;
      // the other decks on this site, such as the trains exercise
      if (v.startsWith('deck:')) { window.location.href = deckHref(v.slice(5)); return; }
      L.reviseIndex = REVISE.findIndex((x) => x.section === v); renderRevise(); window.scrollTo(0, 0);
    },
  },
  DECK.sections.filter((sec) => REVISE.some((x) => x.section === sec.id)).map((sec) => h('option', { value: sec.id, selected: sec.id === s.section ? true : null }, sec.week ? `Week ${sec.week}: ${sec.label}` : sec.label)),
  h('optgroup', { label: 'Also here' }, Object.keys(DECKS).filter((k) => k !== DECK_ID).map((k) => h('option', { value: `deck:${k}` }, DECKS[k].title))));
  let body;
  if (s.type === 'recap') {
    body = recapPanel(s);
    const d = body.querySelector('details');
    if (d) d.open = true;
  } else {
    body = questionPanel(s, { live: false });
    view.status.textContent = s.kind === 'number' ? 'Type your answer, then check it.' : 'Tap an answer to check it.';
  }
  const nav = h('nav', { class: 'pager', 'aria-label': 'Slides' },
    h('button', { type: 'button', class: 'btn', disabled: i === 0 ? true : null, onclick: () => { L.reviseIndex--; renderRevise(); window.scrollTo(0, 0); } }, 'Previous'),
    h('span', null, `${i + 1} of ${REVISE.length}`),
    h('button', { type: 'button', class: 'btn btn-primary', disabled: i === REVISE.length - 1 ? true : null, onclick: () => { L.reviseIndex++; renderRevise(); window.scrollTo(0, 0); } }, 'Next'));
  main.replaceChildren(h('div', { class: 'revise-top' }, h('label', { for: 'jump' }, 'Section'), select), body, nav);
  composer.reset();
}

function setMode(mode) {
  L.mode = mode;
  history.replaceState(null, '', mode === 'revise' ? '#revise' : window.location.pathname + window.location.search);
  net.hidden = mode !== 'live';
  if (mode === 'revise') renderRevise();
  else { L.slideId = null; renderLive(); tick(); }
  window.scrollTo(0, 0);
}

$('#mode-btn').addEventListener('click', () => setMode(L.mode === 'live' ? 'revise' : 'live'));

// ---------------------------------------------------------------- start

async function start() {
  setNet('connecting');
  backend = await connect(URL_);
  if (L.mode === 'revise') renderRevise(); else renderLive();
  tick();
}

start();
