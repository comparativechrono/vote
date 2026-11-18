/** @OnlyCurrentDoc */
// (The line above limits the script to this spreadsheet: it can't open your other files.)

/**
 * GM2 live recap: the server for votes and comments (a Google Apps Script web app).
 *
 * The pages on GitHub Pages call this web app's address (see the README):
 *   GET  ?a=state                  where the lecture is (and the results, once they are shown)
 *   POST {a: 'join' | 'vote' | 'comment', voter, ...}            from students' phones
 *   POST {a: 'set' | 'live' | 'results' | 'hide' | 'reset' | 'export' | 'clear', key, ...}
 *                                  from the presenter's page; key must match PRESENTER_KEY
 * POST bodies are JSON sent as text/plain, so browsers send them without a CORS preflight.
 *
 * Storage. Each vote, comment and join is its own Script Property, so no two requests
 * ever write the same entry and no lock is needed: about 60 phones can answer at once.
 * The current slide is kept in the Script Cache as well, so that the phones' frequent
 * checks are fast. "Export" (on the presenter's page, or the Live recap menu of the
 * sheet) copies a session's votes and comments into this spreadsheet.
 *
 * Limits to know: Script Properties hold 500 KB in all (some 8,000 votes); a free Google
 * account allows 50,000 property reads and writes a day, and 30 requests at the same time.
 */

var VERSION = 1;
var DEFAULT_SESSION = 'recap';
var STATE_KEY = 'S';
var STATE_TTL = 21600;      // the longest the cache keeps anything: 6 hours
var RESULTS_TTL = 5;        // seconds: the phones' view of the results lags by at most this
var MAX_COMMENT = 500;      // characters
var COMMENT_GAP = 4;        // seconds between two comments from the same phone

// ------------------------------------------------------------------------------- entry points

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.a) return out_({ ok: true, service: 'GM2 live recap', version: VERSION });
  return out_(handle_(p));
}

function doPost(e) {
  var p;
  try {
    p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return out_({ ok: false, error: 'bad-request' });
  }
  return out_(handle_(p || {}));
}

function handle_(p) {
  try {
    switch (p.a) {
      case 'ping': return { ok: true, version: VERSION, time: Date.now() };
      case 'state': return publicState_();
      case 'join': return join_(p);
      case 'vote': return vote_(p);
      case 'comment': return comment_(p);
    }
    var all = props_().getProperties();            // one read serves the key check and the answer
    if (!all.PRESENTER_KEY) return { ok: false, error: 'no-presenter-key' };
    if (String(p.key || '') !== all.PRESENTER_KEY) return { ok: false, error: 'wrong-key' };
    switch (p.a) {
      case 'set': return setState_(p);
      case 'live': return live_(all);
      case 'results': return { ok: true, results: tally_(all, state_(), p.q, p.kind, p.n) };
      case 'hide': return hide_(p);
      case 'reset': return reset_(p);
      case 'export': return exportSession_(String(p.session || state_().session));
      case 'clear': return clearSession_(String(p.session || ''));
    }
    return { ok: false, error: 'unknown-action' };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function props_() { return PropertiesService.getScriptProperties(); }
function cache_() { return CacheService.getScriptCache(); }

// ------------------------------------------------------------------------------- state

/** The current slide: { session, slide, q, kind, n, min, max, open, reveal, answer, rounds, t }. */
function state_() {
  var s = cache_().get(STATE_KEY);
  if (!s) {
    s = props_().getProperty(STATE_KEY);
    if (s) cache_().put(STATE_KEY, s, STATE_TTL);
  }
  var st = s ? JSON.parse(s) : {};
  if (!st.session) st.session = DEFAULT_SESSION;
  if (!st.rounds) st.rounds = {};
  return st;
}

function saveState_(st) {
  st.t = Date.now();
  var s = JSON.stringify(st);
  props_().setProperty(STATE_KEY, s);
  cache_().put(STATE_KEY, s, STATE_TTL);
  return st;
}

function round_(st, q) { return (st.rounds && st.rounds[q]) || 0; }

/** What the phones see: the slide, whether voting is open and, once shown, the results and the answer. */
function publicState_() {
  var st = state_();
  var pub = {
    session: st.session, slide: st.slide || '', q: st.q || '', kind: st.kind || '', n: st.n || 0,
    open: !!st.open, reveal: !!st.reveal, answer: !!st.answer, round: round_(st, st.q), t: st.t || 0,
  };
  var res = { ok: true, state: pub };
  if (st.q && st.reveal && st.kind !== 'text') res.results = cachedResults_(st);
  return res;
}

function setState_(p) {
  var st = state_();
  if (p.session && p.session !== st.session) {
    if (!okId_(p.session)) return { ok: false, error: 'bad-session' };
    st.session = p.session;
    st.rounds = {};
  }
  if (p.slide !== undefined) {
    if (p.slide && !okId_(p.slide)) return { ok: false, error: 'bad-slide' };
    st.slide = p.slide || '';
  }
  if (p.q !== undefined) {
    if (p.q && !okId_(p.q)) return { ok: false, error: 'bad-question' };
    if ((p.q || '') !== (st.q || '')) { st.reveal = false; st.answer = false; }
    st.q = p.q || '';
    st.kind = /^(choice|scale|number|text)$/.test(p.kind) ? p.kind : '';
    st.n = Math.max(0, Math.min(12, parseInt(p.n, 10) || 0));
    st.min = isFinite(p.min) && p.min !== null && p.min !== '' ? Number(p.min) : null;
    st.max = isFinite(p.max) && p.max !== null && p.max !== '' ? Number(p.max) : null;
  }
  if (p.open !== undefined) st.open = !!p.open;
  if (p.reveal !== undefined) st.reveal = !!p.reveal;
  if (p.answer !== undefined) st.answer = !!p.answer;
  saveState_(st);
  return { ok: true, state: st };
}

function reset_(p) {
  var st = state_();
  if (!okId_(p.q)) return { ok: false, error: 'bad-question' };
  st.rounds[p.q] = round_(st, p.q) + 1;
  saveState_(st);
  return { ok: true, state: st };
}

// ------------------------------------------------------------------------------- phones

function join_(p) {
  if (!okVoter_(p.voter)) return { ok: false, error: 'bad-voter' };
  var st = state_();
  props_().setProperty('j|' + st.session + '|' + p.voter, Date.now().toString(36));
  return { ok: true, state: publicState_().state };
}

function vote_(p) {
  if (!okVoter_(p.voter)) return { ok: false, error: 'bad-voter' };
  var st = state_();
  if (p.session !== st.session || !st.q || p.q !== st.q) return { ok: false, error: 'not-live', state: publicState_().state };
  if (!st.open) return { ok: false, error: 'closed', state: publicState_().state };
  var v = value_(p.value, st);
  if (v === null) return { ok: false, error: 'bad-value' };
  props_().setProperty('v|' + st.session + '|' + st.q + '|' + round_(st, st.q) + '|' + p.voter, String(v));
  return { ok: true, round: round_(st, st.q) };
}

/** A vote's value, checked against the live question; null if it isn't valid. */
function value_(v, st) {
  var x = Number(v);
  if (v === null || v === '' || v === undefined || !isFinite(x)) return null;
  if (st.kind === 'choice' || st.kind === 'scale') {
    x = Math.round(x);
    return x >= 0 && x < (st.n || 0) ? x : null;
  }
  if (st.kind === 'number') {
    if (st.min !== null && st.min !== undefined && x < st.min) return null;
    if (st.max !== null && st.max !== undefined && x > st.max) return null;
    return Math.round(x * 1000) / 1000;
  }
  return null;
}

function comment_(p) {
  if (!okVoter_(p.voter)) return { ok: false, error: 'bad-voter' };
  var text = String(p.text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_COMMENT);
  if (!text) return { ok: false, error: 'empty' };
  var c = cache_();
  var gap = 'gap|' + p.voter;
  if (c.get(gap)) return { ok: false, error: 'too-fast' };
  c.put(gap, '1', COMMENT_GAP);
  var st = state_();
  var slide = okId_(p.slide) ? p.slide : (st.slide || '');
  var key = 'c|' + st.session + '|' + Date.now().toString(36) + '|' + p.voter;
  props_().setProperty(key, JSON.stringify({ s: slide, t: text }));
  return { ok: true };
}

// ------------------------------------------------------------------------------- presenter

/** Everything the presenter's page shows, from one read of the properties (it asks every 2 s). */
function live_(all) {
  var st = state_();
  var joined = 0, comments = [], bytes = 0, hidden = {};
  var jp = 'j|' + st.session + '|', cp = 'c|' + st.session + '|';
  for (var k in all) {
    bytes += k.length + String(all[k]).length;
    if (k.lastIndexOf('h|', 0) === 0) hidden[k.slice(2)] = true;
  }
  for (k in all) {
    if (k.lastIndexOf(jp, 0) === 0) joined++;
    else if (k.lastIndexOf(cp, 0) === 0) {
      var c = parseJson_(all[k]);
      if (c) comments.push({ id: k, slide: c.s, text: c.t, t: parseInt(k.split('|')[2], 36) || 0, hidden: !!hidden[k] });
    }
  }
  comments.sort(function (a, b) { return b.t - a.t; });
  var res = { ok: true, state: st, joined: joined, comments: comments.slice(0, 300), storage: bytes };
  if (st.q) {
    res.results = tally_(all, st, st.q, st.kind, st.n);
    cache_().put(resultsKey_(st), JSON.stringify(res.results), RESULTS_TTL);
  }
  return res;
}

function resultsKey_(st) { return 'r|' + st.session + '|' + st.q + '|' + round_(st, st.q); }

function cachedResults_(st) {
  var key = resultsKey_(st);
  var hit = cache_().get(key);
  if (hit) return JSON.parse(hit);
  var res = tally_(props_().getProperties(), st, st.q, st.kind, st.n);
  cache_().put(key, JSON.stringify(res), RESULTS_TTL);
  return res;
}

/** The answers to question q in the current session and round: counts, or the values of a number question. */
function tally_(all, st, q, kind, n) {
  var prefix = 'v|' + st.session + '|' + q + '|' + round_(st, q) + '|';
  kind = kind || st.kind;
  n = parseInt(n, 10) || st.n || 0;
  var counts = [], values = [], total = 0, i;
  for (i = 0; i < n; i++) counts.push(0);
  for (var k in all) {
    if (k.lastIndexOf(prefix, 0) !== 0) continue;
    var v = Number(all[k]);
    if (!isFinite(v)) continue;
    total++;
    if (kind === 'number') values.push(v);
    else if (v >= 0 && v < n) counts[v]++;
  }
  var res = { q: q, kind: kind, total: total };
  if (kind === 'number') res.values = values.slice(0, 1000);
  else res.counts = counts;
  return res;
}

function hide_(p) {
  var id = String(p.id || '');
  if (id.lastIndexOf('c|', 0) !== 0) return { ok: false, error: 'bad-comment' };
  if (p.hidden === false) props_().deleteProperty('h|' + id);
  else props_().setProperty('h|' + id, '1');
  return { ok: true };
}

// ------------------------------------------------------------------------------- the spreadsheet

/** Copies a session's votes, comments and joins into sheets of this spreadsheet. */
function exportSession_(session) {
  if (!okId_(session)) return { ok: false, error: 'bad-session' };
  var all = props_().getProperties();
  var votes = [['Question', 'Round', 'Phone', 'Answer (option number from 0, or the value)']];
  var comments = [['Time', 'Slide', 'Phone', 'Comment', 'Hidden']];
  var joins = 0;
  for (var k in all) {
    var parts = k.split('|');
    if (parts[1] !== session) continue;
    if (parts[0] === 'v') votes.push([parts[2], Number(parts[3]), parts[4], Number(all[k])]);
    else if (parts[0] === 'c') {
      var c = parseJson_(all[k]) || {};
      comments.push([new Date(parseInt(parts[2], 36)), c.s || '', parts[3], c.t || '', all['h|' + k] ? 'yes' : '']);
    } else if (parts[0] === 'j') joins++;
  }
  votes = [votes[0]].concat(votes.slice(1).sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]; }));
  comments = [comments[0]].concat(comments.slice(1).sort(function (a, b) { return a[0] - b[0]; }));
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { ok: false, error: 'no-sheet: use Live recap > Export in the spreadsheet' };
  writeSheet_(ss, 'Votes ' + session, votes);
  writeSheet_(ss, 'Comments ' + session, comments);
  return { ok: true, session: session, votes: votes.length - 1, comments: comments.length - 1, phones: joins, url: ss.getUrl() };
}

/** Deletes a session's votes, comments and joins (export them first). The live session is kept. */
function clearSession_(session) {
  if (!okId_(session)) return { ok: false, error: 'bad-session' };
  if (session === state_().session) return { ok: false, error: 'live-session' };
  var p = props_(), all = p.getProperties(), n = 0;
  for (var k in all) {
    var parts = k.split('|');
    if (parts[1] === session && /^[vcj]$/.test(parts[0])) {
      p.deleteProperty(k);
      if (all['h|' + k]) p.deleteProperty('h|' + k);
      n++;
    }
  }
  return { ok: true, deleted: n };
}

function writeSheet_(ss, name, rows) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
}

// ------------------------------------------------------------------------------- the sheet's menu

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Live recap')
    .addItem('Set the presenter key…', 'menuSetKey')
    .addItem('Export the current session', 'menuExport')
    .addItem('Clear an old session…', 'menuClear')
    .addToUi();
}

function menuSetKey() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Presenter key', 'Choose a passphrase. You type it once on the presenter’s page; students never see it.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var key = r.getResponseText().trim();
  if (key.length < 6) { ui.alert('Use at least 6 characters.'); return; }
  props_().setProperty('PRESENTER_KEY', key);
  ui.alert('Saved. Type the same key on the presenter’s page (Settings).');
}

function menuExport() {
  var r = exportSession_(state_().session);
  SpreadsheetApp.getUi().alert(r.ok
    ? 'Exported session "' + r.session + '": ' + r.votes + ' votes and ' + r.comments + ' comments, from ' + r.phones + ' phones.'
    : 'Not exported: ' + r.error);
}

function menuClear() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Clear an old session', 'The session’s name (export it first). The live session can’t be cleared.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var res = clearSession_(r.getResponseText().trim());
  ui.alert(res.ok ? 'Deleted ' + res.deleted + ' entries.' : 'Not cleared: ' + res.error);
}

// ------------------------------------------------------------------------------- checks

function okId_(s) { return typeof s === 'string' && /^[A-Za-z0-9_-]{1,48}$/.test(s); }
function okVoter_(s) { return typeof s === 'string' && /^[a-z0-9]{8,32}$/.test(s); }
function parseJson_(s) { try { return JSON.parse(s); } catch (e) { return null; } }
