#!/usr/bin/env node
// Simulates a lecture: a presenter moving through questions and many phones following it,
// polling and voting as the pages do. Use it against dev/server.mjs, or against the real
// web app before a lecture (it votes in a session of its own, then deletes it).
//
//   node dev/load-test.mjs --url http://localhost:8080/exec --key rehearsal --phones 60 --minutes 3
//
// Options: --poll 5000 (ms between a phone's checks, plus up to 1.5 s at random)
//          --every 20 (seconds between questions)

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const URL_ = arg('url', 'http://localhost:8080/exec');
const KEY = arg('key', 'rehearsal');
const PHONES = Number(arg('phones', 60));
const MINUTES = Number(arg('minutes', 3));
const POLL = Number(arg('poll', 5000));
const EVERY = Number(arg('every', 20)) * 1000;
const SESSION = `loadtest-${Date.now().toString(36)}`;

const lat = {};
let errors = 0, inFlight = 0, maxInFlight = 0;
const errorKinds = {};

async function call(action, init, url = URL_) {
  const t0 = performance.now();
  inFlight++;
  maxInFlight = Math.max(maxInFlight, inFlight);
  try {
    const res = await fetch(url, { ...init, redirect: 'follow' });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { ok: false, error: `not-json (HTTP ${res.status})` }; }
    if (!body.ok && !['closed', 'not-live', 'too-fast'].includes(body.error)) {
      errors++;
      errorKinds[body.error] = (errorKinds[body.error] || 0) + 1;
    }
    return body;
  } catch (e) {
    errors++;
    errorKinds[e.name] = (errorKinds[e.name] || 0) + 1;
    return { ok: false, error: String(e) };
  } finally {
    inFlight--;
    (lat[action] = lat[action] || []).push(performance.now() - t0);
  }
}
const get = (params) => {
  const u = new URL(URL_);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set('_', Math.random().toString(36).slice(2));
  return call(params.a, { method: 'GET' }, u.href);
};
const post = (body) => call(body.a, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const id = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

const end = Date.now() + MINUTES * 60000;

async function presenter() {
  let qn = 0;
  const pollLive = (async () => { while (Date.now() < end) { await post({ a: 'live', key: KEY }); await sleep(2000); } })();
  while (Date.now() < end) {
    qn++;
    await post({ a: 'set', key: KEY, session: SESSION, slide: `q${qn}`, q: `q${qn}`, kind: 'choice', n: 4, open: true, reveal: false, answer: false });
    await sleep(EVERY * 0.6);
    await post({ a: 'set', key: KEY, reveal: true });
    await sleep(EVERY * 0.4);
  }
  await pollLive;
  return qn;
}

async function phone() {
  const voter = id();
  await sleep(Math.random() * 4000);
  await post({ a: 'join', voter });
  const voted = new Set();
  while (Date.now() < end) {
    const r = await get({ a: 'state' });
    const st = r.state;
    if (st && st.open && st.q && !voted.has(st.q) && Math.random() < 0.9) {
      voted.add(st.q);
      (async () => { await sleep(2000 + Math.random() * 12000); await post({ a: 'vote', voter, session: st.session, q: st.q, value: Math.floor(Math.random() * 4) }); })();
    }
    await sleep(POLL + Math.random() * 1500);
  }
}

function pct(xs, p) { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

const before = await get({ a: 'state' });
if (!before.ok) { console.error('The web app did not answer:', before.error); process.exit(1); }
console.log(`${PHONES} phones for ${MINUTES} min against ${URL_} (session ${SESSION})…`);
const t0 = Date.now();
const [questions] = await Promise.all([presenter(), ...Array.from({ length: PHONES }, phone)]);
await sleep(15000);
const secs = (Date.now() - t0) / 1000;
const total = Object.values(lat).reduce((n, xs) => n + xs.length, 0);

console.log(`\n${total} requests in ${secs.toFixed(0)} s: ${(total / secs).toFixed(1)} a second; at most ${maxInFlight} waiting at once.`);
for (const [a, xs] of Object.entries(lat)) {
  console.log(`  ${a.padEnd(8)} ${String(xs.length).padStart(6)}  median ${pct(xs, 0.5).toFixed(0)} ms, 95% within ${pct(xs, 0.95).toFixed(0)} ms, slowest ${Math.max(...xs).toFixed(0)} ms`);
}
console.log(`Errors: ${errors}${errors ? ` ${JSON.stringify(errorKinds)}` : ''}`);

const live = await post({ a: 'live', key: KEY });
if (live.ok) console.log(`Server: ${live.joined} phones joined; storage ${live.storage} bytes.`);
// put the lecture back where it was, and delete the test's votes
await post({ a: 'set', key: KEY, session: before.state.session, slide: before.state.slide, q: before.state.q, kind: before.state.kind, n: before.state.n, open: before.state.open, reveal: before.state.reveal, answer: before.state.answer });
const cleared = await post({ a: 'clear', key: KEY, session: SESSION });
console.log(cleared.ok ? `Deleted the test session's ${cleared.deleted} entries; ${questions} questions were asked.` : `Could not delete the test session: ${cleared.error}`);
if (/^http:\/\/(localhost|127\.0\.0\.1)/.test(URL_)) {
  try {
    const s = await (await fetch(new URL('/stats', URL_))).json();
    console.log(`dev server: at most ${s.maxActive} requests at once; ${s.refused} refused.`);
  } catch { /* not the dev server */ }
}
