// Small statistics library for the interactive graphs: random numbers, distributions, tests.

/** A seeded random number generator (mulberry32): rng() gives a number in [0, 1). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard normal value (Box–Muller). */
export function randn(r = Math.random) {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => sum(xs) / xs.length;
export function variance(xs) {
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
}
export const sd = (xs) => Math.sqrt(variance(xs));

/** R's default quantile (type 7). */
export function quantile(xs, p) {
  const s = [...xs].sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h);
  return s[lo] + (h - lo) * ((s[Math.min(lo + 1, s.length - 1)]) - s[lo]);
}
export const median = (xs) => quantile(xs, 0.5);

// ---------------------------------------------------------------- the normal

export const normPdf = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

/** The standard normal CDF (the erfc approximation of Numerical Recipes, to about 1e-7). */
export function normCdf(x) {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806
    + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - r / 2 : r / 2;
}

/** The standard normal quantile (Acklam's algorithm, refined with one Newton step). */
export function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425;
  let q, r, x;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    q = p - 0.5;
    r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normCdf(x) - p;
  return x - e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
}

// ---------------------------------------------------------------- gamma and beta functions

export function lgamma(x) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(a, b, x) {
  const FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

/** The regularised incomplete beta function I_x(a, b). */
export function betaInc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}

/** The regularised lower incomplete gamma function P(a, x). */
export function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let ap = a, del = 1 / a, s = del;
    for (let n = 0; n < 500; n++) { ap++; del *= x / ap; s += del; if (Math.abs(del) < Math.abs(s) * 1e-14) break; }
    return s * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

// ---------------------------------------------------------------- t, F and chi-square

export function tPdf(t, df) {
  return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - (df + 1) / 2 * Math.log(1 + t * t / df));
}
export function tCdf(t, df) {
  const x = df / (df + t * t);
  const tail = 0.5 * betaInc(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}
/** The two-sided p-value of a t statistic. */
export const tP2 = (t, df) => 2 * (1 - tCdf(Math.abs(t), df));
/** P(F > f) on d1 and d2 degrees of freedom. */
export const fUpper = (f, d1, d2) => (f <= 0 ? 1 : betaInc(d2 / (d2 + d1 * f), d2 / 2, d1 / 2));
/** P(X² > x) on df degrees of freedom. */
export const chi2Upper = (x, df) => (x <= 0 ? 1 : 1 - gammaP(df / 2, x / 2));

/** The t quantile: qt(0.975, 68) is 1.995 (by bisection on the CDF). */
export function qt(p, df) {
  if (!(df > 0)) return NaN;
  if (df > 1e7) return normInv(p);
  let lo = -60, hi = 60;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (tCdf(mid, df) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Welch's two-sample t-test, as R's t.test(). */
export function welch(a, b) {
  const ma = mean(a), mb = mean(b), va = variance(a), vb = variance(b);
  const sa = va / a.length, sb = vb / b.length;
  const se = Math.sqrt(sa + sb);
  const t = (ma - mb) / se;
  const df = (sa + sb) ** 2 / (sa * sa / (a.length - 1) + sb * sb / (b.length - 1));
  return { t, df, p: tP2(t, df), diff: ma - mb, se };
}

// ---------------------------------------------------------------- counts

export function binomPmf(k, n, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
export const poisPmf = (k, lambda) => Math.exp(-lambda + k * Math.log(lambda) - lgamma(k + 1));

export const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);

// ---------------------------------------------------------------- tables of counts

/** Chi-square test of a table (rows of counts), as R's chisq.test(): Yates' correction for a 2 × 2 table. */
export function chisqTable(rows, correct = true) {
  const r = rows.map((row) => sum(row));
  const c = rows[0].map((_, j) => sum(rows.map((row) => row[j])));
  const n = sum(r);
  const E = rows.map((row, i) => row.map((_, j) => (r[i] * c[j]) / n));
  const cells = rows.flatMap((row, i) => row.map((o, j) => [o, E[i][j]]));
  const yates = correct && rows.length === 2 && rows[0].length === 2
    ? Math.min(0.5, ...cells.map(([o, e]) => Math.abs(o - e))) : 0;
  const x2 = sum(cells.map(([o, e]) => (Math.abs(o - e) - yates) ** 2 / e));
  const df = (rows.length - 1) * (rows[0].length - 1);
  return { x2, df, p: chi2Upper(x2, df), expected: E };
}

/** Fisher's exact test of the 2 × 2 table [[a, b], [c, d]], two-sided, as R's fisher.test(). */
export function fisher2x2(a, b, c, d) {
  const r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
  const lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1);
  const lp = (x) => lchoose(r1, x) + lchoose(r2, c1 - x) - lchoose(n, c1);
  const p0 = lp(a) + Math.log(1 + 1e-7);
  let p = 0;
  for (let x = lo; x <= hi; x++) { const q = lp(x); if (q <= p0) p += Math.exp(q); }
  return Math.min(1, p);
}

/** The Cochran–Armitage test for trend, as R's prop.trend.test(x, n, score). */
export function propTrend(x, n, score) {
  const p = sum(x) / sum(n);
  const w = n.map((ni) => ni / (p * (1 - p)));
  const f = x.map((xi, i) => xi / n[i]);
  const W = sum(w);
  const sbar = sum(w.map((wi, i) => wi * score[i])) / W;
  const fbar = sum(w.map((wi, i) => wi * f[i])) / W;
  const sxy = sum(w.map((wi, i) => wi * (score[i] - sbar) * (f[i] - fbar)));
  const sxx = sum(w.map((wi, i) => wi * (score[i] - sbar) ** 2));
  const x2 = (sxy * sxy) / sxx;
  const slope = sxy / sxx;
  return { x2, p: chi2Upper(x2, 1), slope, intercept: fbar - slope * sbar };
}

// ---------------------------------------------------------------- groups

/** One-way ANOVA of several groups (arrays of values). */
export function anova(groups) {
  const all = groups.flat();
  const N = all.length, k = groups.length, gm = mean(all);
  const ssb = sum(groups.map((g) => g.length * (mean(g) - gm) ** 2));
  const ssw = sum(groups.map((g) => { const m = mean(g); return sum(g.map((v) => (v - m) ** 2)); }));
  const dfb = k - 1, dfw = N - k;
  const msb = ssb / dfb, msw = ssw / dfw;
  const f = msb / msw;
  return { f, p: fUpper(f, dfb, dfw), msb, msw, dfb, dfw };
}

/** The Kruskal–Wallis test, as R's kruskal.test() (with the correction for ties). */
export function kruskal(groups) {
  const all = groups.flatMap((g, gi) => g.map((v) => ({ v, gi }))).sort((a, b) => a.v - b.v);
  const N = all.length;
  const ranks = new Array(N);
  let ties = 0;
  for (let i = 0; i < N;) {
    let j = i;
    while (j + 1 < N && all[j + 1].v === all[i].v) j++;
    const r = (i + j) / 2 + 1, t = j - i + 1;
    for (let m = i; m <= j; m++) ranks[m] = r;
    ties += t ** 3 - t;
    i = j + 1;
  }
  const R = groups.map(() => 0);
  all.forEach((o, i) => { R[o.gi] += ranks[i]; });
  let H = (12 / (N * (N + 1))) * sum(R.map((ri, gi) => (ri * ri) / groups[gi].length)) - 3 * (N + 1);
  H /= 1 - ties / (N ** 3 - N);
  return { h: H, df: groups.length - 1, p: chi2Upper(H, groups.length - 1) };
}

// ---------------------------------------------------------------- regression

/** Solves A x = b for a small square matrix A (Gaussian elimination with partial pivoting). */
export function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

export function invert(A) {
  const n = A.length;
  const cols = A.map((_, j) => solve(A, A.map((__, i) => (i === j ? 1 : 0))));
  return A.map((_, i) => cols.map((c) => c[i]));
}

const crossprod = (X, w) => X[0].map((_, a) => X[0].map((__, b) => {
  let s = 0;
  for (let i = 0; i < X.length; i++) s += (w ? w[i] : 1) * X[i][a] * X[i][b];
  return s;
}));

/** Least squares regression of y on the columns of X, as R's lm(): give X a column of 1s for the intercept. */
export function ols(X, y) {
  const n = y.length, p = X[0].length;
  const XtX = crossprod(X);
  const Xty = X[0].map((_, a) => { let s = 0; for (let i = 0; i < n; i++) s += X[i][a] * y[i]; return s; });
  const beta = solve(XtX, Xty);
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * beta[j], 0));
  const resid = y.map((v, i) => v - fitted[i]);
  const rss = sum(resid.map((r) => r * r));
  const df = n - p, s2 = rss / df;
  const inv = invert(XtX);
  const se = inv.map((row, j) => Math.sqrt(row[j] * s2));
  const t = beta.map((b, j) => b / se[j]);
  const ybar = mean(y);
  const tss = sum(y.map((v) => (v - ybar) ** 2));
  return { beta, se, t, p: t.map((v) => tP2(v, df)), fitted, resid, rss, tss, df, n, sigma: Math.sqrt(s2), r2: 1 - rss / tss, inv };
}

/** The F-test of two nested linear models, as R's anova(small, big). */
export function nestedF(small, big) {
  const d1 = small.df - big.df, d2 = big.df;
  const f = (small.rss - big.rss) / d1 / (big.rss / d2);
  return { f, d1, d2, p: fUpper(f, d1, d2) };
}

/**
 * Logistic regression, as R's glm(family = binomial), by Newton–Raphson (iteratively reweighted
 * least squares). y counts the events out of m trials (m = 1 for 0/1 data). Wald standard errors.
 */
export function logitFit(X, y, m) {
  const n = y.length, p = X[0].length;
  const trials = m || y.map(() => 1);
  let beta = new Array(p).fill(0), inv = null;
  for (let it = 0; it < 60; it++) {
    const mu = X.map((row) => 1 / (1 + Math.exp(-row.reduce((s, v, j) => s + v * beta[j], 0))));
    const w = mu.map((u, i) => trials[i] * u * (1 - u));
    inv = invert(crossprod(X, w));
    const score = X[0].map((_, a) => { let s = 0; for (let i = 0; i < n; i++) s += X[i][a] * (y[i] - trials[i] * mu[i]); return s; });
    const step = inv.map((row) => row.reduce((s, v, j) => s + v * score[j], 0));
    beta = beta.map((b, j) => b + step[j]);
    if (Math.max(...step.map(Math.abs)) < 1e-10) break;
  }
  const se = inv.map((row, j) => Math.sqrt(row[j]));
  const z = beta.map((b, j) => b / se[j]);
  return { beta, se, z, p: z.map((v) => 2 * (1 - normCdf(Math.abs(v)))) };
}

/** Shuffle an array in place (Fisher–Yates). */
export function shuffle(xs, r = Math.random) {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

// ---------------------------------------------------------------- added for the trains exercise

/** The Wilcoxon rank-sum test of a against b, as R's wilcox.test() with ties: the normal approximation with continuity correction. */
export function wilcox(a, b) {
  const all = [...a.map((v) => ({ v, g: 0 })), ...b.map((v) => ({ v, g: 1 }))].sort((p, q) => p.v - q.v);
  const N = all.length, nx = a.length, ny = b.length;
  let rx = 0, ties = 0;
  for (let i = 0; i < N;) {
    let j = i;
    while (j + 1 < N && all[j + 1].v === all[i].v) j++;
    const r = (i + j) / 2 + 1, t = j - i + 1;
    for (let m = i; m <= j; m++) if (all[m].g === 0) rx += r;
    ties += t ** 3 - t;
    i = j + 1;
  }
  const W = rx - (nx * (nx + 1)) / 2;
  const z0 = W - (nx * ny) / 2;
  const sigma = Math.sqrt((nx * ny / 12) * ((nx + ny + 1) - ties / ((nx + ny) * (nx + ny - 1))));
  const z = (z0 - Math.sign(z0) * 0.5) / sigma;
  return { W, z, p: Math.min(1, 2 * Math.min(normCdf(z), 1 - normCdf(z))) };
}

/** The odds ratio of [[a, b], [c, d]] as R's fisher.test() gives it: the conditional MLE, and its exact 95% CI. */
export function fisherOR(a, b, c, d) {
  const m = a + c, n = b + d, k = a + b, x = a;
  const lo = Math.max(0, k - n), hi = Math.min(k, m);
  const sup = [];
  for (let s = lo; s <= hi; s++) sup.push(s);
  const logdc = sup.map((s) => lchoose(m, s) + lchoose(n, k - s));
  const dens = (ncp) => {
    const w = logdc.map((l, i) => l + Math.log(ncp) * sup[i]);
    const top = Math.max(...w);
    const e = w.map((v) => Math.exp(v - top));
    const tot = sum(e);
    return e.map((v) => v / tot);
  };
  const meanAt = (ncp) => sum(dens(ncp).map((p, i) => p * sup[i]));
  const lower = (ncp) => sum(dens(ncp).filter((_, i) => sup[i] <= x));   // P(X <= x)
  const upper = (ncp) => sum(dens(ncp).filter((_, i) => sup[i] >= x));   // P(X >= x)
  // f(log ncp) - target changes sign once: bisection on the log scale
  const root = (f, target, increasing) => {
    let l = -30, h = 30;
    for (let i = 0; i < 200; i++) {
      const mid = (l + h) / 2;
      const v = f(Math.exp(mid)) - target;
      if ((v < 0) === increasing) l = mid; else h = mid;
    }
    return Math.exp((l + h) / 2);
  };
  const or = x === lo ? 0 : x === hi ? Infinity : root(meanAt, x, true);
  const ciLo = x === lo ? 0 : root(upper, 0.025, true);
  const ciHi = x === hi ? Infinity : root(lower, 0.025, false);
  return { or, lo: ciLo, hi: ciHi };
}
