// Runs apps-script/Code.gs outside Google: in the browser (demo mode, one browser, its tabs
// sharing localStorage) and in Node (dev/server.mjs, for testing). The same code as the real
// server answers, with Google's services replaced by small stand-ins.

/** Script Properties kept in a Map, or in localStorage under a prefix. */
export function memoryProps(map = new Map()) {
  return {
    getProperty: (k) => (map.has(k) ? map.get(k) : null),
    setProperty(k, v) { map.set(k, String(v)); return this; },
    deleteProperty(k) { map.delete(k); return this; },
    getProperties: () => Object.fromEntries(map),
  };
}

export function storageProps(storage, prefix = 'gas:p:') {
  return {
    getProperty: (k) => storage.getItem(prefix + k),
    setProperty(k, v) { storage.setItem(prefix + k, String(v)); return this; },
    deleteProperty(k) { storage.removeItem(prefix + k); return this; },
    getProperties() {
      const out = {};
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(prefix)) out[k.slice(prefix.length)] = storage.getItem(k);
      }
      return out;
    },
  };
}

/** The Script Cache: values that expire. */
export function memoryCache(map = new Map(), now = () => Date.now()) {
  return {
    get(k) {
      const e = map.get(k);
      if (!e) return null;
      if (e.exp < now()) { map.delete(k); return null; }
      return e.v;
    },
    put(k, v, ttl = 600) { map.set(k, { v: String(v), exp: now() + ttl * 1000 }); },
    remove(k) { map.delete(k); },
  };
}

export function storageCache(storage, prefix = 'gas:c:') {
  return {
    get(k) {
      const raw = storage.getItem(prefix + k);
      if (!raw) return null;
      try {
        const e = JSON.parse(raw);
        if (e.exp < Date.now()) { storage.removeItem(prefix + k); return null; }
        return e.v;
      } catch { return null; }
    },
    put(k, v, ttl = 600) { storage.setItem(prefix + k, JSON.stringify({ v: String(v), exp: Date.now() + ttl * 1000 })); },
    remove(k) { storage.removeItem(prefix + k); },
  };
}

/** A spreadsheet in memory, so that "export" can be tested (sheets: name → rows). */
export function memorySpreadsheet(sheets = new Map()) {
  const sheet = (name) => ({
    clearContents() { sheets.set(name, []); },
    getRange: () => ({
      setValues(rows) { sheets.set(name, rows.map((x) => [...x])); },
      setFontWeight() {},
    }),
    setFrozenRows() {},
  });
  const ss = {
    getSheetByName: (n) => (sheets.has(n) ? sheet(n) : null),
    insertSheet: (n) => { sheets.set(n, []); return sheet(n); },
    getUrl: () => 'about:blank#demo-spreadsheet',
    getId: () => 'demo',
  };
  return { sheets, app: { getActiveSpreadsheet: () => ss, openById: () => ss, create: () => ss, getUi: () => { throw new Error('No spreadsheet menu here'); } } };
}

/** Loads Code.gs and returns { doGet, doPost, call }. call(params, post) gives the parsed JSON reply. */
export function loadAppsScript(source, { props, cache, spreadsheet }) {
  const ContentService = {
    MimeType: { JSON: 'application/json' },
    createTextOutput(s) {
      return { content: s, setMimeType() { return this; }, getContent() { return this.content; } };
    },
  };
  const services = {
    ContentService,
    PropertiesService: { getScriptProperties: () => props },
    CacheService: { getScriptCache: () => cache },
    SpreadsheetApp: spreadsheet || memorySpreadsheet().app,
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
  };
  const names = Object.keys(services);
  // eslint-disable-next-line no-new-func
  const make = new Function(...names, `${source}\nreturn { doGet: doGet, doPost: doPost };`);
  const gs = make(...names.map((n) => services[n]));
  gs.call = (params, post) => {
    const out = post
      ? gs.doPost({ postData: { contents: JSON.stringify(params), type: 'text/plain' }, parameter: {} })
      : gs.doGet({ parameter: params });
    return JSON.parse(out.getContent());
  };
  return gs;
}
