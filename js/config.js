// Settings for both pages. After deploying the Apps Script web app (see the README),
// paste its address into backendUrl and push: phones then reach it with no setup.

export const CONFIG = {
  // The web app's address, ending in /exec. Leave it empty for demo mode, where votes stay
  // in one browser: open the presenter page and a few student tabs side by side to try it.
  backendUrl: '',

  // The address the QR code shows. Empty: the student page next to the presenter page.
  joinUrl: '',

  // Votes are kept per session. Use a new name for each lecture (letters, digits, - and _).
  session: '2026-w4',

  // How often phones and the presenter's page ask the server what is happening, in ms.
  // Phones wait pollStudentMs plus up to pollJitterMs at random, so that they don't all ask
  // at once. With 60 phones that is about 9 requests a second, well within Google's limits
  // (see dev/load-test.mjs). Shorter waits make phones follow the slides faster.
  pollStudentMs: 6000,
  pollJitterMs: 2000,
  pollPresenterMs: 2000,
};

const query = new URLSearchParams(window.location.search);

/** The backend address: ?api=... on the page's address wins, then config.js. ?demo forces demo mode. */
export function backendUrl(override) {
  if (query.has('demo')) return '';
  const fromQuery = query.get('api');
  if (fromQuery) return fromQuery;
  if (override !== undefined && override !== null) return override;
  return CONFIG.backendUrl;
}

/** The student page's address, for the QR code. */
export function joinUrl(api) {
  const base = CONFIG.joinUrl || new URL('./', window.location.href).href.replace(/\/$/, '/');
  const u = new URL(base);
  // Point phones at the same backend when the presenter uses one that config.js doesn't name.
  if (api && api !== CONFIG.backendUrl) u.searchParams.set('api', api);
  return u.href;
}

/** The address without https:// and a trailing slash, for people to read and type. */
export const shortUrl = (href) => href.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** Presenter settings remembered in this browser: { url, key, session }. */
const KEY = 'gm2:presenter';
export function loadPresenter() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function savePresenter(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private window: settings last this visit */ }
}
