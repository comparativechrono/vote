// "Leonardo's train is late": a half-hour exercise on probability and hypothesis tests, with the
// trains data (data/trains.csv, made by dev/make-trains.py). Open it with ?deck=trains.
//
// The slides are written as in js/content.js. A recap slide may also have `code`: lines of R
// that students run with the lecturer, shown under the points and copied on phones.
// The figures in the questions are R's output for the trains data (dev/trains-check.R).

const CSV = 'https://comparativechrono.github.io/vote/data/trains.csv';

export const TRAINS_DECK = {
  id: 'trains',
  title: 'Leonardo’s train is late',
  subtitle: 'What makes a train late? Hypotheses and tests, in R, with the trains data',
  course: 'GM2 Research and Statistical Skills',
  // votes on these slides are kept apart from the weekly recaps
  session: 'trains-2026-11-26',
  theme: 'trains',
  weeks: {},
  sections: [
    {
      id: 'tr-start', label: 'Start',
      slides: [
        { type: 'title', id: 'tr-join' },
        {
          type: 'question', id: 'tr-ontime', kind: 'number',
          text: 'From January to March 2026, at what percentage of station stops in Great Britain did trains arrive on time: early, or less than a minute late?',
          min: 0, max: 100, step: 1, unit: '%', answer: 68.8,
          explain: '68.8%. The Office of Rail and Road counts every stop at every station: 86.4% were within 3 minutes of the timetable, and 3.2% of trains were cancelled.',
          source: 'Office of Rail and Road, Passenger rail performance, January to March 2026',
        },
        {
          type: 'recap', id: 'tr-orr', title: 'How punctual are Britain’s trains?', demo: 'trPunctuality',
          points: [
            '“On time” means early, or less than a minute late, at each station stop. “Time to 3” allows up to 3 minutes.',
            'From January to March 2026: 68.8% of stops on time, 86.4% within 3 minutes, and 3.2% of trains cancelled.',
            'So whether a train is late is uncertain, and has a probability: about 1 in 3 for “not on time”.',
          ],
          source: 'Office of Rail and Road, Passenger rail performance, January to March 2026 (dataportal.orr.gov.uk)',
        },
        {
          type: 'question', id: 'tr-why', kind: 'text',
          text: 'What do you think makes a train late?',
        },
      ],
    },
    {
      id: 'tr-data', label: 'The trains data',
      slides: [
        {
          type: 'recap', id: 'tr-data-recap', title: 'Meet the data: trains', demo: 'trBoard',
          points: [
            '400 weekday trains arriving at Cambridge from Kings Cross, Liverpool Street, Norwich and Birmingham.',
            'For each train: <code>day</code>, <code>time</code>, <code>origin</code>, <code>stops</code>, <code>peak</code> (the rush hour), <code>rain</code>, <code>delay</code> (minutes late) and <code>late</code> (5 minutes or more).',
            'The journeys are simulated, not real records, but about as punctual as the national figures.',
          ],
          code: [
            `url <- "${CSV}"`,
            'trains <- read.csv(url, stringsAsFactors = TRUE)',
            'str(trains)',
            'summary(trains$delay)',
            'hist(trains$delay, breaks = 40)',
          ],
        },
        {
          type: 'question', id: 'tr-shape', kind: 'choice',
          text: 'Most trains are 0 minutes late, a few are 20 or more. Which describes the distribution of <code>delay</code>?',
          options: [
            'Symmetric, close to normal',
            'Skewed to the right: a long tail of large delays',
            'Skewed to the left: a long tail of early trains',
            'Uniform: every delay is as likely as any other',
          ],
          answer: 1,
          explain: 'The median is 0 minutes and the mean 1.9: a few long delays pull the mean up. For skewed data, the median and the IQR describe the middle and the spread better (week 2).',
          source: 'summary(trains$delay)',
        },
      ],
    },
    {
      id: 'tr-tree', label: 'Choosing a test',
      slides: [
        {
          type: 'recap', id: 'tr-tree-recap', title: 'Which test? Follow the line', demo: 'trTree',
          points: [
            'First junction: what is the outcome? A measurement, such as <code>delay</code> in minutes, or yes or no, such as <code>late</code>.',
            'Second: what do you compare it across? Two groups, three or more, or a number.',
            'Then check the assumptions: normal data or large samples for t-tests and ANOVA, expected counts of 5 or more for chi-square.',
            'Click a test to send the train there.',
          ],
          source: 'Leonardo’s table: Lecture W3, Part A, slide 46',
        },
      ],
    },
    {
      id: 'tr-h1', label: 'Hypothesis 1: the rush hour',
      slides: [
        {
          type: 'question', id: 'tr-h1-null', kind: 'choice',
          text: 'Hypothesis 1: trains arrive later in the rush hour. What is the null hypothesis, H<sub>0</sub>?',
          options: [
            'Rush-hour trains are later, on average',
            'The mean delay is the same in and out of the rush hour',
            'No train is ever late in the rush hour',
            'The p-value is below 0.05',
          ],
          answer: 1,
          explain: 'H<sub>0</sub> says there is no difference. H<sub>1</sub>, the alternative, says the means differ. A test asks how surprising the data would be if H<sub>0</sub> were true.',
          source: 'Lecture W3, Part A',
        },
        {
          type: 'question', id: 'tr-h1-test', kind: 'choice',
          text: 'The outcome is <code>delay</code>, in minutes, and <code>peak</code> is TRUE or FALSE. Which test?',
          options: [
            'Two-sample t-test, or Wilcoxon rank-sum',
            'Chi-square test',
            'ANOVA',
            'Linear regression on <code>stops</code>',
          ],
          answer: 0,
          explain: 'A measurement → two groups → <code>t.test()</code>, or <code>wilcox.test()</code> if the samples were small and skewed.',
          source: 'Lecture W3, Part A, slide 46',
        },
        {
          type: 'recap', id: 'tr-h1-run', title: 'Test it: delay in and out of the rush hour', demo: 'trPeak',
          points: [
            'H<sub>0</sub>: the mean delay is the same in and out of the rush hour. H<sub>1</sub>: the means differ.',
            'Run the t-test, then the Wilcoxon test: do they agree?',
          ],
          code: [
            'tapply(trains$delay, trains$peak, mean)',
            'boxplot(delay ~ peak, data = trains)',
            't.test(delay ~ peak, data = trains)',
            'wilcox.test(delay ~ peak, data = trains)',
          ],
        },
        {
          type: 'question', id: 'tr-h1-skew', kind: 'choice',
          text: 'The delays are very skewed. Can we trust the t-test here?',
          options: [
            'Yes: with about 200 trains in each group, the means are close to normal',
            'No: a t-test needs every delay to be normal',
            'Only if we first remove the trains that were on time',
            'Only if the two groups have the same median',
          ],
          answer: 0,
          explain: 'The central limit theorem (week 2): with large samples, sample means are close to normal whatever the shape of the data. The Wilcoxon test, which makes no such assumption, agrees: W = 15732, p < 0.0001.',
          source: 'Lecture W2, Part A; Lecture W3, Part A, slide 23',
        },
        {
          type: 'question', id: 'tr-h1-conclude', kind: 'choice',
          text: '<code>t.test()</code> gives t = −3.35, df = 273, p = 0.0009. What do you conclude?',
          options: [
            'Rush-hour trains arrive later: by 1.6 minutes on average (95% CI 0.7 to 2.6)',
            'The rush hour makes every train 1.6 minutes late',
            'There is a 0.09% chance that H<sub>0</sub> is true',
            'There is no evidence of a difference',
          ],
          answer: 0,
          explain: 'Reject H<sub>0</sub> at the 5% level: mean delays of 2.7 minutes in the rush hour and 1.1 minutes outside it. The p-value is the chance of a difference this large if H<sub>0</sub> were true, not the chance that H<sub>0</sub> is true.',
          source: 't.test(delay ~ peak, data = trains)',
        },
      ],
    },
    {
      id: 'tr-h2', label: 'Hypothesis 2: rain',
      slides: [
        {
          type: 'question', id: 'tr-h2-test', kind: 'choice',
          text: 'Hypothesis 2: rain makes trains late. The outcome is now <code>late</code>, TRUE or FALSE, and <code>rain</code> is TRUE or FALSE. Which test?',
          options: [
            'Two-sample t-test',
            'Chi-square test, or Fisher’s exact test',
            'Kruskal–Wallis test',
            'Linear regression',
          ],
          answer: 1,
          explain: 'Yes or no → two groups → a 2 × 2 table: <code>chisq.test()</code> when every expected count is 5 or more (here the smallest is 17.8), otherwise <code>fisher.test()</code>.',
          source: 'Lecture W3, Part A, slides 24–29 and 46',
        },
        {
          type: 'recap', id: 'tr-h2-run', title: 'Test it: late trains in the rain', demo: 'trRain',
          points: [
            'H<sub>0</sub>: a train is as likely to be late in the rain as in the dry.',
            '<code>prop.table(tab, 1)</code> gives the share of late trains in each row of the table.',
          ],
          code: [
            'tab <- table(trains$rain, trains$late)',
            'tab',
            'prop.table(tab, 1)',
            'chisq.test(tab)',
            'chisq.test(tab)$expected',
            'fisher.test(tab)',
          ],
        },
        {
          type: 'question', id: 'tr-h2-or', kind: 'choice',
          text: '<code>fisher.test()</code> gives an odds ratio of 3.2 (95% CI 1.7 to 6.4). What does it mean?',
          options: [
            'The odds of arriving late are about 3 times as high in the rain',
            'Rain makes 3.2% of trains late',
            'Trains are 3.2 minutes later in the rain',
            'The CI is wide, so rain makes no difference',
          ],
          answer: 0,
          explain: '20.7% of trains were late in the rain and 7.5% in the dry: odds of 30/115 = 0.26 against 19/236 = 0.08. The CI excludes 1, and p = 0.0002. Chi-square gives the same: X² = 13.9, df = 1, p = 0.0002.',
          source: 'fisher.test(tab)',
        },
      ],
    },
    {
      id: 'tr-h3', label: 'Hypothesis 3: the route',
      slides: [
        {
          type: 'question', id: 'tr-h3-test', kind: 'choice',
          text: 'Hypothesis 3: some routes are later than others. There are four origins, and the outcome is <code>delay</code>. Which test?',
          options: [
            'A t-test for each pair of origins',
            'ANOVA, or Kruskal–Wallis',
            'Chi-square test',
            'Fisher’s exact test',
          ],
          answer: 1,
          explain: 'A measurement → three or more groups → <code>aov()</code>, or <code>kruskal.test()</code> for small, skewed samples. One test of all four at once: six t-tests would raise the chance of a false positive.',
          source: 'Lecture W3, Part B',
        },
        {
          type: 'recap', id: 'tr-h3-run', title: 'Test it: delay by origin', demo: 'trRoutes',
          points: [
            'H<sub>0</sub>: the mean delay is the same from all four origins.',
            'If the ANOVA rejects H<sub>0</sub>, <code>TukeyHSD()</code> compares each pair, allowing for the number of comparisons.',
          ],
          code: [
            'fit <- aov(delay ~ origin, data = trains)',
            'summary(fit)',
            'TukeyHSD(fit)',
            'kruskal.test(delay ~ origin, data = trains)',
          ],
        },
        {
          type: 'question', id: 'tr-h3-which', kind: 'choice',
          text: 'The ANOVA gives F = 8.4 on 3 and 396 df, p = 0.00002. <code>TukeyHSD()</code> then compares each pair. Which origins differ?',
          options: [
            'Birmingham trains are later than each of the others, which don’t differ from one another',
            'All four origins differ from one another',
            'Only Kings Cross and Norwich differ',
            'None: TukeyHSD() and the ANOVA disagree',
          ],
          answer: 0,
          explain: 'Mean delays: Birmingham 4.3 minutes, Liverpool Street 2.0, Norwich 1.6, Kings Cross 0.7. Tukey’s adjusted p-values: 0.000006 to 0.01 for the pairs with Birmingham, 0.16 to 0.93 for the others.',
          source: 'TukeyHSD(fit)',
        },
      ],
    },
    {
      id: 'tr-h4', label: 'Hypothesis 4: stops',
      slides: [
        {
          type: 'question', id: 'tr-h4-test', kind: 'choice',
          text: 'Hypothesis 4: each extra stop makes a train later. <code>stops</code> is a number from 1 to 13. Which test?',
          options: [
            'Linear regression: <code>lm(delay ~ stops)</code>',
            'Two-sample t-test',
            'Chi-square test',
            'Kruskal–Wallis test',
          ],
          answer: 0,
          explain: 'A measurement → a number → <code>lm()</code> (week 4). The slope is the extra delay for each extra stop, and its t-test asks whether it is 0.',
          source: 'Lecture W4, Part A',
        },
        {
          type: 'recap', id: 'tr-h4-run', title: 'Test it: delay by stops, then within each route', demo: 'trStops',
          points: [
            'H<sub>0</sub>: the slope for <code>stops</code> is 0.',
            'Fit it alone, then with <code>origin</code>: does the slope change?',
          ],
          code: [
            'summary(lm(delay ~ stops, data = trains))',
            'summary(lm(delay ~ stops + origin, data = trains))',
            'tapply(trains$stops, trains$origin, mean)',
          ],
        },
        {
          type: 'question', id: 'tr-h4-confound', kind: 'choice',
          text: 'Alone, each stop adds 0.30 minutes (p = 0.0002). With <code>origin</code> in the model, −0.07 minutes (p = 0.65). Why?',
          options: [
            'The route confounds it: Birmingham trains make the most stops, and are the latest',
            'The second model is wrong, because it has more coefficients',
            'Stops make trains late only on some routes',
            'Adding origin left fewer trains in the model',
          ],
          answer: 0,
          explain: 'Birmingham trains make about 11 stops, Kings Cross trains about 4. Compared on the same route, more stops make no difference: the crude and the adjusted estimates differ, as in week 4.',
          source: 'Lecture W4, Part A: confounding',
        },
      ],
    },
    {
      id: 'tr-h5', label: 'Hypothesis 5: Mondays',
      slides: [
        {
          type: 'recap', id: 'tr-h5-run', title: 'Test it: are Mondays the worst?', demo: 'trMonday',
          points: [
            'H<sub>0</sub>: the mean delay is the same on Mondays as on other days.',
            '<code>day == "Mon"</code> makes a TRUE or FALSE for each train, so <code>t.test()</code> compares two groups.',
          ],
          code: [
            'tapply(trains$delay, trains$day, mean)',
            't.test(delay ~ day == "Mon", data = trains)',
            'kruskal.test(delay ~ day, data = trains)',
          ],
        },
        {
          type: 'question', id: 'tr-h5-conclude', kind: 'choice',
          text: 'Monday trains were 2.4 minutes late on average, the other days 1.8 (t-test: p = 0.39). What do you conclude?',
          options: [
            'No evidence that Mondays are worse: a difference this size often happens by chance',
            'Mondays are worse, because their mean is higher',
            'The p-value proves that Mondays are no worse',
            'Trains are 39% later on Mondays',
          ],
          answer: 0,
          explain: 'A non-significant result is not proof of no difference: absence of evidence is not evidence of absence. Across all five days, <code>kruskal.test()</code> gives p = 0.61.',
          source: 'Lecture W3, Part A: what a p-value is not',
        },
      ],
    },
    {
      id: 'tr-end', label: 'Wrap-up',
      slides: [
        {
          type: 'question', id: 'tr-next', kind: 'text',
          text: 'Which other hypothesis would you test with these data, and with which test?',
        },
        {
          type: 'end', id: 'tr-end', title: 'Leonardo’s train has arrived',
          text: 'Next: late or not, with the rush hour, rain and route in one model. That is logistic regression:<br><code>glm(late ~ peak + rain + origin, family = binomial)</code>',
        },
      ],
    },
  ],
};
