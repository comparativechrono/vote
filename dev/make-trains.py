#!/usr/bin/env python3
"""Builds data/trains.csv and js/data/trains.js: 400 simulated weekday arrivals at Cambridge.

The journeys are made up: they are not records of any real train, route or operator. Their
overall punctuality is close to what the Office of Rail and Road reports for Great Britain
(about two in three arrivals within a minute of the timetable, and most of the rest within
three), and a few patterns are built in for students to look for.
Run: python3 dev/make-trains.py   (it is seeded, so it always makes the same data)
"""
import csv, json, math, os, random, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#                    share   stops     log-odds of any delay, typical size of a delay (min)
ROUTES = {
    'Kings Cross':      (0.34, (1, 6),   -1.95, 2.2),
    'Liverpool Street': (0.30, (5, 11),  -1.45, 2.8),
    'Norwich':          (0.20, (4, 8),   -1.30, 3.2),
    'Birmingham':       (0.16, (9, 13),  -0.55, 5.0),
}
DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
HOURS = list(range(6, 23))
HOUR_W = [2, 5, 7, 6, 4, 4, 4, 4, 4, 5, 7, 7, 5, 4, 3, 3, 2]
MINS = [4, 11, 17, 22, 28, 34, 41, 47, 52, 58]


def make(seed):
    random.seed(seed)
    rows = []
    for i in range(400):
        origin = random.choices(list(ROUTES), weights=[v[0] for v in ROUTES.values()])[0]
        share, (s0, s1), a, scale = ROUTES[origin]
        day = random.choice(DAYS)
        hour = random.choices(HOURS, weights=HOUR_W)[0]
        peak = 7 <= hour <= 9 or 16 <= hour <= 18
        rain = random.random() < 0.35
        stops = random.randint(s0, s1)      # the route decides the stops: no effect of its own
        lo = a + 1.0 * peak + 1.2 * rain + random.gauss(0, 0.3)
        if random.random() < 1 / (1 + math.exp(-lo)):
            if random.random() < 0.5:       # a minute or two
                delay = random.choice([1, 1, 2])
            else:
                d = 3 + random.gammavariate(0.9, scale * (1.6 if peak else 1.0) * (1.3 if rain else 1.0))
                if random.random() < 0.06:  # a signal failure, or worse
                    d += random.uniform(12, 45)
                delay = int(round(d))
        else:
            delay = 0
        rows.append({'origin': origin, 'day': day, 'time': f'{hour:02d}:{random.choice(MINS):02d}',
                     'peak': peak, 'rain': rain, 'stops': stops, 'delay': delay, 'late': delay >= 5})
    rows.sort(key=lambda r: (DAYS.index(r['day']), r['time']))
    for k, r in enumerate(rows):
        r['id'] = k + 1
    return rows


def check(rows):
    """The patterns the slides rely on, tested as R would test them."""
    import numpy as np, pandas as pd
    from scipy import stats
    import statsmodels.formula.api as smf
    d = pd.DataFrame(rows)
    out = {}
    out['ontime'] = (d.delay == 0).mean()
    out['within3'] = (d.delay <= 2).mean()
    out['late'] = d.late.mean()
    out['ge15'] = (d.delay >= 15).mean()
    out['p_peak_t'] = stats.ttest_ind(d.delay[d.peak], d.delay[~d.peak], equal_var=False).pvalue
    out['p_peak_w'] = stats.mannwhitneyu(d.delay[d.peak], d.delay[~d.peak], method='asymptotic').pvalue
    t = pd.crosstab(d.rain, d.late)
    chi = stats.chi2_contingency(t, correction=True)
    out['p_rain'] = chi[1]
    out['min_exp'] = chi[3].min()
    out['late_rain'] = d.late[d.rain].mean(); out['late_dry'] = d.late[~d.rain].mean()
    out['p_route_aov'] = stats.f_oneway(*[g.delay for _, g in d.groupby('origin')]).pvalue
    out['p_route_kw'] = stats.kruskal(*[g.delay for _, g in d.groupby('origin')]).pvalue
    c = smf.ols('delay ~ stops', d).fit(); a = smf.ols('delay ~ stops + origin', d).fit()
    out['b_stops'] = c.params['stops']; out['p_stops'] = c.pvalues['stops']
    out['b_stops_adj'] = a.params['stops']; out['p_stops_adj'] = a.pvalues['stops']
    out['p_day_kw'] = stats.kruskal(*[g.delay for _, g in d.groupby('day')]).pvalue
    out['p_day_aov'] = stats.f_oneway(*[g.delay for _, g in d.groupby('day')]).pvalue
    mon = d.day == 'Mon'
    out['p_mon_t'] = stats.ttest_ind(d.delay[mon], d.delay[~mon], equal_var=False).pvalue
    means = d.groupby('origin').delay.mean()
    out['worst'] = means.idxmax(); out['best'] = means.idxmin()
    ok = (0.62 <= out['ontime'] <= 0.70 and 0.82 <= out['within3'] <= 0.88 and 0.09 <= out['late'] <= 0.14
          and out['p_peak_t'] < 0.01 and out['p_peak_w'] < 0.01 and out['p_rain'] < 0.01 and out['min_exp'] >= 5
          and out['p_route_aov'] < 0.001 and out['p_route_kw'] < 0.001 and out['p_stops'] < 0.01 and out['b_stops'] > 0
          and out['p_stops_adj'] > 0.4 and abs(out['b_stops_adj']) < 0.6 * abs(out['b_stops'])
          and out['p_day_kw'] > 0.3 and out['p_mon_t'] > 0.3
          and out['worst'] == 'Birmingham' and out['best'] == 'Kings Cross')
    return ok, out


def write(rows):
    cols = ['id', 'day', 'time', 'origin', 'stops', 'peak', 'rain', 'delay', 'late']
    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    with open(os.path.join(ROOT, 'data', 'trains.csv'), 'w', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(cols)
        for r in rows:
            w.writerow([('TRUE' if r[c] else 'FALSE') if isinstance(r[c], bool) else r[c] for c in cols])
    js = ['// The trains data: 400 simulated weekday arrivals at Cambridge, as in data/trains.csv.',
          '// Made by dev/make-trains.py. The journeys are made up: they are not records of real trains.',
          '', 'export const TRAINS = {']
    for c in cols:
        js.append(f'  {c}: {json.dumps([r[c] for r in rows])},')
    js.append('};')
    with open(os.path.join(ROOT, 'js', 'data', 'trains.js'), 'w') as f:
        f.write('\n'.join(js) + '\n')


SEED = 255  # found with --search: the first seed whose data show every pattern clearly
if __name__ == '__main__':
    if '--search' in sys.argv:
        for seed in range(1, 400):
            ok, out = check(make(seed))
            if ok:
                print('seed', seed, {k: (round(v, 4) if isinstance(v, float) else v) for k, v in out.items()})
                break
        else:
            print('no seed found')
    else:
        rows = make(SEED)
        ok, out = check(rows)
        print('ok' if ok else 'NOT OK', {k: (round(v, 4) if isinstance(v, float) else v) for k, v in out.items()})
        write(rows)
