#!/usr/bin/env node
// A local stand-in for the Apps Script web app, for rehearsals and tests. It serves the site
// and answers /exec as the web app does, by running apps-script/Code.gs.
//
//   node dev/server.mjs [--port 8080] [--key rehearsal] [--latency 300-1200] [--limit 30]
//
// Then open http://localhost:8080/present.html?api=http://localhost:8080/exec
// --latency adds a random delay to each answer, like Google's; --limit refuses requests beyond
// that many at once, as Google does beyond 30 at a time. /stats reports what happened.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppsScript, memoryProps, memoryCache, memorySpreadsheet } from '../js/gas-shim.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const port = Number(arg('port', 8080));
const key = arg('key', 'rehearsal');
const [latLo, latHi] = String(arg('latency', '0-0')).split('-').map(Number);
const limit = Number(arg('limit', 30));

const props = memoryProps();
props.setProperty('PRESENTER_KEY', key);
const sheet = memorySpreadsheet();
const gs = loadAppsScript(fs.readFileSync(path.join(root, 'apps-script/Code.gs'), 'utf8'), {
  props, cache: memoryCache(), spreadsheet: sheet.app,
});

const stats = { requests: 0, refused: 0, active: 0, maxActive: 0, byAction: {}, started: Date.now() };

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.gs': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exec(req, res, url) {
  stats.requests++;
  if (stats.active >= limit) {
    stats.refused++;
    res.writeHead(503, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
    res.end('<html><body>Too many simultaneous invocations</body></html>');
    return;
  }
  stats.active++;
  stats.maxActive = Math.max(stats.maxActive, stats.active);
  try {
    let body = '';
    if (req.method === 'POST') for await (const chunk of req) body += chunk;
    if (latHi > 0) await sleep(latLo + Math.random() * (latHi - latLo));
    let out, action;
    if (req.method === 'POST') {
      try { action = JSON.parse(body).a; } catch { action = 'bad'; }
      out = gs.doPost({ postData: { contents: body, type: 'text/plain' }, parameter: {} });
    } else {
      const parameter = Object.fromEntries(url.searchParams);
      action = parameter.a || 'root';
      out = gs.doGet({ parameter });
    }
    stats.byAction[action] = (stats.byAction[action] || 0) + 1;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    res.end(out.getContent());
  } finally {
    stats.active--;
  }
}

function serveFile(res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root) || file.includes(`${path.sep}.git`)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/exec') {
    exec(req, res, url).catch((e) => { res.writeHead(500); res.end(String(e)); });
  } else if (url.pathname === '/stats') {
    const secs = (Date.now() - stats.started) / 1000;
    const bytes = Object.entries(props.getProperties()).reduce((n, [k, v]) => n + k.length + v.length, 0);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ...stats, perSecond: +(stats.requests / secs).toFixed(2), storageBytes: bytes, sheets: [...sheet.sheets.keys()] }, null, 1));
  } else if (url.pathname === '/stats/reset') {
    Object.assign(stats, { requests: 0, refused: 0, maxActive: stats.active, byAction: {}, started: Date.now() });
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
  } else {
    serveFile(res, url);
  }
}).listen(port, () => {
  console.log(`Site:      http://localhost:${port}/`);
  console.log(`Presenter: http://localhost:${port}/present.html?api=http://localhost:${port}/exec  (key: ${key})`);
  console.log(`Phones:    http://localhost:${port}/?api=http://localhost:${port}/exec`);
  if (latHi) console.log(`Answers take ${latLo}–${latHi} ms; more than ${limit} at once are refused.`);
});
