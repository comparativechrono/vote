// Talking to the server: the Apps Script web app, or in demo mode the same code running in
// this browser (votes then stay in this browser, shared between its tabs).

import { loadAppsScript, storageProps, storageCache } from './gas-shim.js';

export class BackendError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

/** What an error means, in words for the presenter. */
export function explain(err) {
  const code = (err && (err.code || err.message)) || String(err);
  const words = {
    'no-presenter-key': 'The server has no presenter key yet. In the Google Sheet, choose Set the presenter key from the Live recap menu.',
    'wrong-key': 'The presenter key doesn’t match the one set in the Google Sheet.',
    'not-json': 'The address answered, but not as the web app. Check it ends in /exec and that the deployment gives access to Anyone.',
    timeout: 'The server took too long to answer.',
    network: 'The server can’t be reached. Check the address and the internet connection.',
  };
  return words[code] || `The server said: ${code}`;
}

const TIMEOUT = 15000;

async function request(url, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  let res;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store', redirect: 'follow', credentials: 'omit' });
  } catch (e) {
    throw new BackendError(e.name === 'AbortError' ? 'timeout' : 'network', String(e));
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new BackendError(`http-${res.status}`);
  const body = await res.text();
  try { return JSON.parse(body); } catch { throw new BackendError('not-json', body.slice(0, 200)); }
}

/** The Apps Script web app (or dev/server.mjs, which answers the same way). */
class AppsScriptBackend {
  constructor(url) {
    this.url = url;
    this.mode = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url) ? 'local-server' : 'apps-script';
  }

  get(params) {
    const u = new URL(this.url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    u.searchParams.set('_', Date.now().toString(36));
    return request(u.href, { method: 'GET' });
  }

  // text/plain keeps this a "simple" request: no CORS preflight, which Apps Script can't answer.
  post(body) {
    return request(this.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  }
}

/** Demo mode: Code.gs runs here, keeping its data in localStorage. */
class LocalBackend {
  constructor() { this.mode = 'demo'; }

  async init() {
    const src = await (await fetch(new URL('../apps-script/Code.gs', import.meta.url))).text();
    const props = storageProps(window.localStorage, 'gm2demo:p:');
    if (!props.getProperty('PRESENTER_KEY')) props.setProperty('PRESENTER_KEY', 'demo');
    this.gs = loadAppsScript(src, { props, cache: storageCache(window.localStorage, 'gm2demo:c:') });
    return this;
  }

  async get(params) { await pause(60 + Math.random() * 80); return this.gs.call(params, false); }
  async post(body) { await pause(80 + Math.random() * 120); return this.gs.call(body, true); }

  /** Wipes the demo's votes and comments. */
  reset() {
    const ls = window.localStorage;
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (k && k.startsWith('gm2demo:')) ls.removeItem(k);
    }
  }
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** The backend for this page: the web app at url, or demo mode if url is empty. */
export async function connect(url) {
  if (url) return new AppsScriptBackend(url);
  return new LocalBackend().init();
}

/** A random id for this phone (letters and digits, as the server expects). */
export function newVoterId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => (b % 36).toString(36)).join('');
}
