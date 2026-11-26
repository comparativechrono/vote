// The recap: Leonardo's lectures of weeks 2 and 3, as sections of recap slides and questions.
//
// Edit freely. Each slide needs an id that never changes once people have voted on it
// (votes are stored under the id). Text may contain simple HTML: <b>, <em>, <code>, <sup>, <sub>.
//
// Slide types
//   recap     title, points (a list), demo (an interactive graph from js/demos.js, optional)
//   question  kind 'choice' (options, answer = index of the right option, explain)
//             kind 'number' (min, max, step, unit, answer, explain): each answer is a dot on a dot plot
//             kind 'scale'  (labels): a rating from 1 to 5, with no right answer
//             kind 'text'   free text: the answers appear as comments
//   title, end
//
// source: where the slide's material is in Leonardo's lectures.
//
// Other decks, chosen with ?deck=<id> on both pages, live in their own files: js/deck-trains.js.

import { TRAINS_DECK } from './deck-trains.js';

const confidence = {
  kind: 'scale',
  labels: ['Not at all', 'A little', 'Somewhat', 'Fairly', 'Very'],
};

const GM2_DECK = {
  id: 'gm2',
  title: 'GM2 recapped',
  course: 'GM2 Research and Statistical Skills',
  // The topic of each week, from Leonardo's lectures. The title slide names the weeks of the
  // lecture (lectureWeeks in js/config.js).
  weeks: {
    2: 'Describing data, distributions and uncertainty',
    3: 'Hypothesis testing and comparing groups',
    4: 'Linear and logistic regression',
    5: 'Genome-scale inference and a mini-GWAS',
  },
  sections: [
    {
      id: 'start', label: 'Start', week: 0,
      slides: [
        { type: 'title', id: 'join' },
        {
          type: 'question', id: 'conf-start', ...confidence,
          text: 'How confident do you feel about correcting for many tests and reading a GWAS?',
        },
      ],
    },

    // ---------------------------------------------------------------- week 2
    {
      id: 'describe', label: 'Describing data', week: 2,
      slides: [
        {
          type: 'recap', id: 'describe-recap', title: 'Describe the data before you test it', demo: 'meanMedian',
          points: [
            'The <b>type of variable</b> decides how you summarise and plot it: nominal, ordinal, count or continuous.',
            'Centre: the <b>mean</b> or the <b>median</b>. Spread: the <b>SD</b>, or the <b>IQR</b> (Q3 − Q1), which covers the middle half.',
            'A long tail pulls the mean but not the median. Mothers’ weight: mean 130 lb, median 121 lb. For skewed data, report the median and IQR.',
            'Box plot: the box runs from Q1 to Q3, with the median across it. A QQ-plot checks whether data are close to normal.',
          ],
          source: 'Lecture W2, Part A, slides 7–19 and 27–28',
        },
        {
          type: 'question', id: 'describe-type', kind: 'choice',
          text: 'Birth weight group, recorded as below 1,500 g, 1,500–2,499 g or 2,500 g and above, is which type of variable?',
          options: ['Nominal', 'Ordinal', 'Count', 'Continuous'],
          answer: 1,
          explain: 'The groups have a natural order, but they are categories, not measurements. Summarise them with counts and proportions, and plot them with a bar chart.',
          source: 'Lecture W2, Part A, slides 7–8',
        },
        {
          type: 'question', id: 'describe-skew', kind: 'choice',
          text: 'Mothers’ weight has a mean of 130 lb and a median of 121 lb. What does that suggest?',
          options: [
            'It is skewed to the right: a few heavier mothers give it a long tail',
            'It is skewed to the left',
            'It is symmetric',
            'There must be an error in the data',
          ],
          answer: 0,
          explain: 'A long tail pulls the mean towards it, while the median stays with the middle value. Birth weight, which is roughly symmetric, has a mean of 2,945 g and a median of 2,977 g. For skewed data, report the median and IQR.',
          source: 'Lecture W2, Part A, slides 9–10',
        },
        {
          type: 'question', id: 'describe-whiskers', kind: 'choice',
          text: 'In a box plot, what do the whiskers show?',
          options: [
            'The smallest and the largest values',
            'The mean ± 2 SD',
            'The furthest values within 1.5 IQR of the box',
            'A 95% confidence interval for the median',
          ],
          answer: 2,
          explain: 'The box runs from Q1 to Q3, with the median across it. Points beyond the whiskers are possible outliers.',
          source: 'Lecture W2, Part A, slides 15–19',
        },
        {
          type: 'question', id: 'describe-qq', kind: 'choice',
          text: 'On a QQ-plot, the points follow the line, except at the top, where they rise well above it. What does that suggest?',
          options: [
            'The data are close to normal',
            'The data are skewed to the right: a long upper tail',
            'The data are skewed to the left: a long lower tail',
            'The sample is too small to say anything',
          ],
          answer: 1,
          explain: 'The largest values are larger than a normal distribution would give, as for mother’s weight. Points that leave the line at both ends mean heavier tails than the normal, or outliers. Skewed data are often closer to normal on a log scale.',
          source: 'Lecture W2, Part A, slides 27–28',
        },
      ],
    },
    {
      id: 'distributions', label: 'Distributions', week: 2,
      slides: [
        {
          type: 'recap', id: 'dist-recap', title: 'Each distribution has four functions in R', demo: 'normal',
          points: [
            '<code>d</code> gives the probability of one value (the density, for continuous data), <code>p</code> the probability of that value or less, <code>q</code> the quantile (the inverse of p) and <code>r</code> random values.',
            'The normal: about 68% of values lie within 1 SD of the mean, and 95% within 1.96 SD. <code>qnorm(0.975)</code> is 1.96.',
            'That 1.96 is the one in a 95% confidence interval.',
          ],
          source: 'Lecture W2, Part A, slides 21–25',
        },
        {
          type: 'recap', id: 'counts-recap', title: 'Counts: the binomial and the Poisson', demo: 'counts',
          points: [
            '<b>Binomial</b>: the number of successes in n independent trials, each with probability p. Mean np, variance np(1 − p).',
            'Sample 20 alleles when 43% are A: you expect 8.6, but the number varies. <code>dbinom(8, 20, 0.43)</code> = 0.173 and <code>pbinom(8, 20, 0.43)</code> = 0.486.',
            '<b>Poisson</b>: counts with no fixed number of trials. λ is both the mean and the variance.',
            'Real read counts usually vary more than a Poisson (over-dispersion), so RNA-seq tools use the negative binomial.',
          ],
          source: 'Lecture W2, Part A, slides 42–46',
        },
        {
          type: 'question', id: 'dist-pbinom', kind: 'choice',
          text: 'If 43% of alleles are A, which R call gives the probability of 8 or fewer A alleles among 20?',
          options: [
            '<code>dbinom(8, size = 20, prob = 0.43)</code>',
            '<code>pbinom(8, size = 20, prob = 0.43)</code>',
            '<code>qbinom(8, size = 20, prob = 0.43)</code>',
            '<code>rbinom(8, size = 20, prob = 0.43)</code>',
          ],
          answer: 1,
          explain: '<code>p</code> gives the probability of that value or less: 0.486. <code>d</code> gives the probability of exactly 8: 0.173. <code>q</code> is the inverse of p, and <code>r</code> draws random values.',
          source: 'Lecture W2, Part A, slides 21 and 44',
        },
        {
          type: 'question', id: 'dist-qnorm', kind: 'choice',
          text: '<code>qnorm(0.975)</code> returns 1.96. What is 1.96?',
          options: [
            'The probability of a value below 0.975',
            'The value with 97.5% of the standard normal below it',
            'The height of the normal curve at 0.975',
            'A random value from the standard normal',
          ],
          answer: 1,
          explain: '<code>q</code> is the quantile, the inverse of <code>p</code>: <code>pnorm(1.96)</code> is 0.975. With 2.5% in each tail, 95% of values lie within ±1.96 SD of the mean.',
          source: 'Lecture W2, Part A, slides 21–24',
        },
        {
          type: 'question', id: 'dist-95', kind: 'number',
          text: 'About what percentage of the values of a normal distribution lie within 2 SD of the mean?',
          min: 0, max: 100, step: 1, unit: '%', answer: 95,
          explain: 'About 68% lie within 1 SD of the mean and about 95% within 2 SD. More precisely, 95% lie within 1.96 SD.',
          source: 'Lecture W2, Part A, slides 22–24',
        },
        {
          type: 'question', id: 'dist-copies', kind: 'choice',
          text: 'Under Hardy–Weinberg, which distribution describes the number of copies of allele A (0, 1 or 2) that a person carries?',
          options: [
            'Binomial, with n = 2 and probability p',
            'Poisson, with mean 2p',
            'Normal, with mean 2p',
            'Equally likely: 0, 1 or 2',
          ],
          answer: 0,
          explain: 'Each of the two copies is A with probability p, independently, so the count is binomial: (1 − p)², 2p(1 − p) and p². Not Poisson: a Poisson count has no upper limit, but nobody carries more than two copies.',
          source: 'Lecture W2, Part A, slides 42–46',
        },
        {
          type: 'question', id: 'dist-overdispersion', kind: 'choice',
          text: 'Across replicate samples, the read counts of a gene have a mean of 200 and a variance of 2,500. Which distribution fits them better?',
          options: [
            'Poisson, because they are counts',
            'Negative binomial, because the variance is far larger than the mean',
            'Binomial, with n = 200',
            'Normal, with variance 200',
          ],
          answer: 1,
          explain: 'For a Poisson count the variance equals the mean, here 200. A variance 12.5 times larger is over-dispersion, which is why RNA-seq tools use the negative binomial.',
          source: 'Lecture W2, Part A, slides 45–46',
        },
      ],
    },
    {
      id: 'se', label: 'Standard errors', week: 2,
      slides: [
        {
          type: 'recap', id: 'se-recap', title: 'An estimate changes from one sample to the next', demo: 'sampling',
          points: [
            'The <b>standard error</b> is the SD of an estimate across repeated samples. For a mean, SE = s / √n.',
            '1,000 samples of birth weights: the SD of the sample means was 330 g for samples of 5, 137 g for 30 and 52 g for 200.',
            'The <b>SD</b> describes how individuals vary. The <b>SE</b> describes how precisely you know the estimate.',
            'By the <b>central limit theorem</b>, the mean of a large sample is close to normal, even if the data aren’t.',
          ],
          source: 'Lecture W2, Part A, slides 29–32',
        },
        {
          type: 'question', id: 'se-halve', kind: 'choice',
          text: 'To halve the standard error of a mean, how much larger must the sample be?',
          options: ['2 times', '4 times', '√2 times', '8 times'],
          answer: 1,
          explain: 'SE = s / √n, so 4 times the sample divides the SE by √4 = 2.',
          source: 'Lecture W2, Part A, slides 29–32',
        },
        {
          type: 'question', id: 'se-sd', kind: 'choice',
          text: 'For 189 births, the mean birth weight is 2,945 g, with SD 729 g and SE 53 g. What does the SD of 729 g describe?',
          options: [
            'How much birth weight varies from baby to baby',
            'How precisely the mean birth weight is known',
            'The margin of error of the mean',
            'The range that contains the true mean with 95% probability',
          ],
          answer: 0,
          explain: 'The SD describes individuals. The SE, 729 / √189 = 53 g, describes how precisely the mean is known, and it shrinks as the sample grows. The SD doesn’t.',
          source: 'Lecture W2, Part A, slides 11–14 and 29–33',
        },
        {
          type: 'question', id: 'se-clt', kind: 'choice',
          text: 'Mothers’ weight is skewed to the right. Take many samples of 200 mothers: what shape is the distribution of their sample means?',
          options: ['Skewed to the right, like the data', 'Close to normal', 'Flat', 'Skewed to the left'],
          answer: 1,
          explain: 'By the central limit theorem, the mean of a large sample is close to normal, even if the data aren’t. That is why the t-test is fine for large samples.',
          source: 'Lecture W2, Part A, slides 29–32',
        },
      ],
    },
    {
      id: 'ci', label: 'Confidence intervals', week: 2,
      slides: [
        {
          type: 'recap', id: 'ci-recap', title: 'A 95% confidence interval', demo: 'coverage',
          points: [
            'For a mean: x̄ ± t × SE, with t from the t distribution on n − 1 degrees of freedom, close to 2. All 189 births: 2,945 ± 1.97 × 53 g, so <b>2,840 to 3,049 g</b>.',
            'The bootstrap resamples the data with replacement, and takes the 2.5% and 97.5% quantiles of the means: 2,843 to 3,049 g.',
            'The 95% describes the method: about 95% of intervals made this way contain the true mean. Any one interval either does or doesn’t.',
            'The interval is about the mean, not individuals. Smaller samples give wider intervals.',
          ],
          source: 'Lecture W2, Part A, slides 33–36',
        },
        {
          type: 'question', id: 'ci-labs', kind: 'number',
          text: '100 research groups each work out a 95% CI for the same population mean, each from their own sample. About how many of the 100 intervals contain the true mean?',
          min: 0, max: 100, step: 1, unit: 'of 100', answer: 95,
          explain: 'About 95, but not exactly: the number varies by chance. In Leonardo’s simulation, 94.8% of 1,000 intervals contained the mean.',
          source: 'Lecture W2, Part A, slides 34–35',
        },
        {
          type: 'question', id: 'ci-meaning', kind: 'choice',
          text: 'The 95% CI for mean birth weight is 2,840 to 3,049 g. Which statement is right?',
          options: [
            'There is a 95% probability that the true mean lies between 2,840 and 3,049 g',
            '95% of babies weigh between 2,840 and 3,049 g',
            'Intervals worked out this way contain the true mean in about 95% of samples',
            'If the study were repeated, 95% of the sample means would lie between 2,840 and 3,049 g',
          ],
          answer: 2,
          explain: 'The true mean is fixed, so this interval either contains it or it doesn’t: the 95% belongs to the method. And the interval is about the mean, not babies, whose weights vary far more (SD 729 g).',
          source: 'Lecture W2, Part A, slides 34–35',
        },
        {
          type: 'question', id: 'ci-width', kind: 'choice',
          text: 'You collect a sample 4 times larger. What happens to the width of the 95% CI for the mean?',
          options: [
            'It roughly halves',
            'It falls to about a quarter',
            'It doubles',
            'Nothing: it is still a 95% interval',
          ],
          answer: 0,
          explain: 'The width is proportional to the SE, s / √n, so 4 times the data halves it.',
          source: 'Lecture W2, Part A, slides 33–35',
        },
        {
          type: 'question', id: 'ci-bootstrap', kind: 'choice',
          text: 'How does the bootstrap give a 95% CI for a mean?',
          options: [
            'It resamples the data with replacement many times, and takes the 2.5% and 97.5% quantiles of the means',
            'It collects new samples from the population',
            'It removes outliers until the data look normal',
            'It multiplies the SE by 1.96',
          ],
          answer: 0,
          explain: 'Each resample is the same size as the data, drawn with replacement. For birth weight it gives 2,843 to 3,049 g, almost the same as x̄ ± t × SE.',
          source: 'Lecture W2, Part A, slide 36',
        },
      ],
    },
    {
      id: 'alleles', label: 'Allele frequencies', week: 2,
      slides: [
        {
          type: 'recap', id: 'alleles-recap', title: 'Allele frequencies: count the alleles', demo: 'alleles',
          points: [
            'Everyone has two copies, so p̂ = (2 × AA + GA) / (2n), with n people genotyped.',
            'FAMuSS, actn3_rs540874: AA 226, GA 595, GG 395, so p̂ = 1,047 / 2,432 = 0.43, the minor allele frequency.',
            'Its SE is √[ p̂(1 − p̂) / N ], with N = 2n alleles: 0.0100. The 95% CI is 0.411 to 0.450.',
            'Treating the two copies as independent assumes Hardy–Weinberg equilibrium.',
          ],
          source: 'Lecture W2, Part A, slides 37–48',
        },
        {
          type: 'question', id: 'alleles-freq', kind: 'choice',
          text: 'esr1_rs1042717 in FAMuSS: AA 71, GA 468 and GG 681, among 1,220 people genotyped. What is the frequency of allele A?',
          options: [
            '71 / 1,220 = 0.06',
            '(71 + 468) / 1,220 = 0.44',
            '(2 × 71 + 468) / 2,440 = 0.25',
            '468 / 2,440 = 0.19',
          ],
          answer: 2,
          explain: 'Count alleles, not people. Each AA person carries two copies of A and each GA person one, out of 2 × 1,220 = 2,440 copies. 0.44 is the proportion of people with at least one A.',
          source: 'Lecture W2, Part A, slides 37–41',
        },
        {
          type: 'question', id: 'alleles-n', kind: 'choice',
          text: 'In the SE of an allele frequency, √[ p̂(1 − p̂) / N ], why is N = 2n?',
          options: [
            'Each person carries two copies, so n people give 2n alleles',
            'It makes the SE more conservative',
            'Because there are two alleles, A and G',
            'It corrects for dividing by n − 1',
          ],
          answer: 0,
          explain: 'The number of A alleles among N = 2n copies is binomial, with variance Np(1 − p); dividing the count by N leaves p(1 − p) / N. That assumes the two copies are independent (Hardy–Weinberg).',
          source: 'Lecture W2, Part A, slides 47–48',
        },
      ],
    },

    // ---------------------------------------------------------------- week 3
    {
      id: 'test', label: 'The logic of a test', week: 3,
      slides: [
        {
          type: 'recap', id: 'test-recap', title: 'Is a difference real, or could it be chance?', demo: 'pArea',
          points: [
            'H₀: no difference, μ₁ = μ₂. H₁: there is one. The test statistic measures how far the data are from H₀.',
            'The <b>p-value</b> is the probability, if H₀ is true, of a test statistic at least as extreme as the one observed.',
            'Smoking and birth weight: 3,056 g v 2,772 g, a difference of 284 g. t = 284 / √(70² + 77²) = 2.73, P = 0.007.',
            'Report the estimate, its confidence interval and the p-value: 284 g (95% CI 79 to 489 g), P = 0.007.',
          ],
          source: 'Lecture W3, Part A, slides 6–11',
        },
        {
          type: 'question', id: 'test-p', kind: 'choice',
          text: 'Which of these is the definition of a p-value?',
          options: [
            'The probability that H₀ is true',
            'The probability, if H₀ is true, of a result at least as extreme as the one observed',
            'The probability that the result arose by chance alone',
            'The probability of a Type II error',
          ],
          answer: 1,
          explain: 'It is calculated assuming H₀ is true, so it can’t be the probability that H₀ is true. Nor is it the probability that chance alone explains the result: chance alone is the assumption, not the result.',
          source: 'Lecture W3, Part A, slides 7 and 12',
        },
        {
          type: 'question', id: 'test-report', kind: 'choice',
          text: 'Smokers’ babies weighed 2,772 g on average and non-smokers’ 3,056 g. The t-test gives t = 2.73, P = 0.007, 95% CI 79 to 489 g. Which summary is best?',
          options: [
            'Smoking reduces birth weight by exactly 284 g',
            'Smokers’ babies weighed on average 284 g less (95% CI 79 to 489 g), P = 0.007',
            'There is a 0.7% chance that smoking has no effect on birth weight',
            'The effect is large, because the p-value is small',
          ],
          answer: 1,
          explain: 'Report the estimate, its CI and the p-value. The CI shows the size of the effect and its uncertainty. The p-value is not the probability that H₀ is true, and it doesn’t measure the size of an effect.',
          source: 'Lecture W3, Part A, slides 10–11',
        },
        {
          type: 'question', id: 'test-ci', kind: 'choice',
          text: 'The 95% CI for a difference in means runs from 79 g to 489 g. What does that tell you about the two-sided test at the 5% level?',
          options: [
            'P < 0.05, because the interval excludes 0',
            'P > 0.05',
            'Nothing: intervals and tests answer different questions',
            'P < 0.001',
          ],
          answer: 0,
          explain: 'A 95% CI that excludes 0 agrees with P < 0.05. It also tells you more than the test: the size of the effect, and its uncertainty.',
          source: 'Lecture W3, Part A, slide 11',
        },
      ],
    },
    {
      id: 'pnot', label: 'What a p-value is not', week: 3,
      slides: [
        {
          type: 'recap', id: 'pnot-recap', title: 'What a p-value is not', demo: 'pvalueSize',
          points: [
            'Not the probability that H₀ is true: it is calculated assuming H₀ is true.',
            'Not the probability that the result arose by chance alone: that is the assumption, not the result.',
            'Not the size or the importance of an effect: a small effect in a large sample and a large effect in a small sample can give the same p-value.',
            'P above 0.05 doesn’t show there is no effect: the study may be too small. And 0.05 is a convention: P = 0.049 and P = 0.051 carry almost the same evidence.',
          ],
          source: 'Lecture W3, Part A, slides 12–13',
        },
        {
          type: 'question', id: 'pnot-030', kind: 'choice',
          text: 'A study of 20 babies finds P = 0.30 for smoking and birth weight. Which conclusion is right?',
          options: [
            'Smoking has no effect on birth weight',
            'There is a 30% chance that smoking has no effect',
            'The data are compatible with no effect, but the study may be too small to detect one',
            'Any effect must be small',
          ],
          answer: 2,
          explain: 'A p-value above 0.05 doesn’t show that there is no effect. With 20 babies the study has little power to detect a difference of a few hundred grams.',
          source: 'Lecture W3, Part A, slide 13',
        },
        {
          type: 'question', id: 'pnot-size', kind: 'choice',
          text: 'Study A: a million babies, a difference of 5 g, P < 0.001. Study B: 120 babies, a difference of 300 g, P = 0.03. Which is right?',
          options: [
            'Study A found the bigger effect, because its p-value is smaller',
            'The p-value doesn’t measure the size of an effect: A’s 5 g is unlikely to matter clinically',
            'Study B’s result should be ignored, because P > 0.01',
            'Both found effects of the same size',
          ],
          answer: 1,
          explain: 'A tiny p-value can come from a tiny, irrelevant effect in a very large sample. Judge the size of an effect from the estimate and its CI.',
          source: 'Lecture W3, Part A, slides 12–13',
        },
        {
          type: 'question', id: 'pnot-049', kind: 'choice',
          text: 'Two studies give P = 0.049 and P = 0.051. How different is their evidence?',
          options: [
            'Completely different: one is significant and the other isn’t',
            'Almost the same: 0.05 is a convention, not a law of nature',
            'The first is about twice as strong',
            'P-values can’t be compared',
          ],
          answer: 1,
          explain: 'P = 0.049 and P = 0.051 carry almost the same evidence. Report the estimate, its CI and the p-value itself. More on this in week 6.',
          source: 'Lecture W3, Part A, slide 13',
        },
      ],
    },
    {
      id: 'power', label: 'Errors and power', week: 3,
      slides: [
        {
          type: 'recap', id: 'power-recap', title: 'Two kinds of error, and power', demo: 'power',
          points: [
            '<b>Type I error</b>: rejecting H₀ when it is true, a false positive. Its probability is α, chosen before the study.',
            '<b>Type II error</b>: not rejecting H₀ when it is false, a false negative, with probability β. <b>Power</b> is 1 − β.',
            'Power increases with a larger sample, a larger true difference, a smaller variability and a larger α.',
            'Groups of 30 and 40 and a difference of 0.5 SD give 53% power. For 90%, <code>power.t.test()</code> needs about 85 per group.',
          ],
          source: 'Lecture W3, Part A, slides 14–18',
        },
        {
          type: 'recap', id: 'psim-recap', title: 'Where a p-value comes from', demo: 'pSimulation',
          points: [
            'Simulate many studies, each comparing two groups of 30 and 40, and keep each study’s p-value.',
            'No true difference: the p-values are spread evenly between 0 and 1, and about 5% are below 0.05. These are the false positives.',
            'A true difference of 0.5 SD: the p-values pile up near 0, and about half are below 0.05. That is the power.',
          ],
          source: 'Lecture W3, Part A, slides 17–18',
        },
        {
          type: 'question', id: 'power-type1', kind: 'choice',
          text: 'What is a Type I error?',
          options: [
            'Rejecting H₀ when it is true: a false positive',
            'Not rejecting H₀ when it is false: a false negative',
            'Using a test whose assumptions don’t hold',
            'Reporting the wrong p-value',
          ],
          answer: 0,
          explain: 'Its probability is the significance level α, chosen before the study. A Type II error is a false negative, with probability β, and power is 1 − β.',
          source: 'Lecture W3, Part A, slides 14–15',
        },
        {
          type: 'question', id: 'power-not', kind: 'choice',
          text: 'Which of these does <em>not</em> increase the power of a t-test?',
          options: [
            'A larger sample',
            'A larger true difference',
            'Less variability in the outcome',
            'A smaller α, such as 0.01 instead of 0.05',
          ],
          answer: 3,
          explain: 'A smaller α makes H₀ harder to reject, so power falls. Power increases with a larger sample, a larger true difference, a smaller variability and a larger α.',
          source: 'Lecture W3, Part A, slides 14 and 16',
        },
        {
          type: 'question', id: 'power-h0', kind: 'number',
          text: 'H₀ is true. You run 10,000 studies, each tested at α = 0.05. What percentage of the p-values will be below 0.05?',
          min: 0, max: 100, step: 1, unit: '%', answer: 5,
          explain: 'When H₀ is true, p-values are spread evenly between 0 and 1, so about 5% fall below 0.05: these are Type I errors. Leonardo’s simulation gave 5.2%.',
          source: 'Lecture W3, Part A, slide 17',
        },
        {
          type: 'question', id: 'power-53', kind: 'choice',
          text: 'With groups of 30 and 40 and a true difference of 0.5 SD, the power is 53%. What does that mean?',
          options: [
            'About 53% of such studies would give P < 0.05',
            'There is a 53% probability that H₁ is true',
            'The difference is 53% of the SD',
            'There is a 47% probability of a Type I error',
          ],
          answer: 0,
          explain: 'Power is the probability of rejecting H₀ when it is false. Here almost half of such studies would miss a real difference. About 85 per group would give 90% power.',
          source: 'Lecture W3, Part A, slides 17–18',
        },
      ],
    },
    {
      id: 'two', label: 'Two groups', week: 3,
      slides: [
        {
          type: 'recap', id: 'two-recap', title: 't-test, Wilcoxon or permutation?', demo: 'permutation',
          points: [
            '<b>t-test</b>: the difference in means divided by its SE. It assumes approximate normality, or a large sample.',
            '<b>Wilcoxon rank-sum</b>: compares ranks. For small samples that are clearly not normal, and less sensitive to outliers.',
            '<b>Permutation</b>: if H₀ is true, the labels could be swapped, so shuffle them to build the null distribution. Any statistic, no assumption on the shape, more computing.',
            'All three need independent observations. For birth weight they agree: P = 0.007.',
          ],
          source: 'Lecture W3, Part A, slides 9–10 and 19–23',
        },
        {
          type: 'question', id: 'two-shuffle', kind: 'choice',
          text: 'In a permutation test, why can we shuffle the smoker and non-smoker labels?',
          options: [
            'If H₀ is true, smoking has no effect, so the labels are arbitrary',
            'To make the two groups the same size',
            'To remove the effect of outliers',
            'Because birth weight is normally distributed',
          ],
          answer: 0,
          explain: 'Each shuffle gives a statistic you could have seen if H₀ were true. The p-value is the proportion of shuffled statistics at least as extreme as the observed one: 0.007 after 10,000 shuffles.',
          source: 'Lecture W3, Part A, slides 20–22',
        },
        {
          type: 'question', id: 'two-outlier', kind: 'choice',
          text: 'You compare a gene’s expression between two groups of 8 patients. The values are clearly not normal, and one is an extreme outlier. Which test suits best?',
          options: ['Two-sample t-test', 'Wilcoxon rank-sum test', 'Chi-square test', 'ANOVA'],
          answer: 1,
          explain: 'Wilcoxon compares ranks, so it doesn’t need normality, and the outlier counts only as the largest rank. With small, clearly non-normal samples, the t-test’s assumption doesn’t hold.',
          source: 'Lecture W3, Part A, slides 19 and 23',
        },
        {
          type: 'question', id: 'two-independence', kind: 'choice',
          text: 'Which assumption do the t-test, the Wilcoxon test and the permutation test share?',
          options: [
            'The data are normally distributed',
            'The two groups have equal variances',
            'The observations are independent',
            'The two groups are the same size',
          ],
          answer: 2,
          explain: 'In all cases the observations must be independent. R’s <code>t.test()</code> uses Welch’s version, which doesn’t assume equal variances.',
          source: 'Lecture W3, Part A, slides 10 and 23',
        },
      ],
    },
    {
      id: 'tables', label: 'Tables of counts', week: 3,
      slides: [
        {
          type: 'recap', id: 'tables-recap', title: 'Two categorical variables', demo: 'table2x2',
          points: [
            'Odds = p / (1 − p). The <b>odds ratio</b> divides the odds in one group by the odds in the other: 1 means no association.',
            '<b>Expected count</b> if the variables were independent: row total × column total / grand total.',
            '<b>Chi-square</b>: Σ(O − E)² / E, on (rows − 1) × (columns − 1) degrees of freedom. An approximation: every expected count should be at least 5.',
            '<b>Fisher’s exact test</b> works for any table. For smoking and low birth weight, both give P = 0.04.',
          ],
          source: 'Lecture W3, Part A, slides 24–29',
        },
        {
          type: 'question', id: 'tables-or', kind: 'choice',
          text: 'Low birth weight: 30 of 74 smokers’ babies (44 normal) and 29 of 115 non-smokers’ (86 normal). What is the odds ratio, smokers v non-smokers?',
          options: [
            '(30 / 74) / (29 / 115) = 1.61',
            '(30 × 86) / (44 × 29) = 2.02',
            '30 / 29 = 1.03',
            '(44 × 29) / (30 × 86) = 0.49',
          ],
          answer: 1,
          explain: 'The odds of low weight are 30 / 44 for smokers and 29 / 86 for non-smokers, and their ratio is 2.02. 1.61 is the ratio of the proportions, not of the odds.',
          source: 'Lecture W3, Part A, slides 24–25',
        },
        {
          type: 'question', id: 'tables-expected', kind: 'choice',
          text: '59 of the 189 babies had low birth weight, and 74 of the mothers smoked. If the two were independent, how many low-weight babies of smokers would you expect?',
          options: ['30', '59 × 74 / 189 = 23.1', '59 / 2 = 29.5', '59 × 74 / 115 = 38.0'],
          answer: 1,
          explain: 'Expected = row total × column total / grand total. We observed 30, more than the 23.1 expected. Chi-square adds up (O − E)² / E over the four cells.',
          source: 'Lecture W3, Part A, slide 26',
        },
        {
          type: 'question', id: 'tables-fisher', kind: 'choice',
          text: 'Hypertension by low birth weight: the smallest expected count is 3.7. Which test should you use?',
          options: ['Chi-square test', 'Fisher’s exact test', 'Two-sample t-test', 'Either: they always agree'],
          answer: 1,
          explain: 'The chi-square test is an approximation that needs every expected count to be at least 5. Fisher’s test is exact for any table.',
          source: 'Lecture W3, Part A, slides 27–29',
        },
        {
          type: 'question', id: 'tables-df', kind: 'choice',
          text: 'A chi-square test of a 2 × 3 table, BMI above 25 or not by genotype AA, GA or GG, has how many degrees of freedom?',
          options: ['1', '2', '5', '6'],
          answer: 1,
          explain: '(rows − 1) × (columns − 1) = 1 × 2 = 2. With 2 degrees of freedom it detects any association, with no assumption on the genetic model.',
          source: 'Lecture W3, Part A, slides 27 and 40',
        },
      ],
    },
    {
      id: 'groups', label: 'Three or more groups', week: 3,
      slides: [
        {
          type: 'recap', id: 'groups-recap', title: 'Three or more groups: ANOVA', demo: 'anova',
          points: [
            'ALL data: expression of one probe, on the log2 scale, in three subtypes: ALL1/AF4 (10 patients), BCR/ABL (37) and NEG (42).',
            'On the log2 scale a difference of 1 is a 2-fold change. BCR/ABL is 1.10 higher than NEG: a 2.1-fold change.',
            'Why not several t-tests? Each has a 5% false positive rate, and the errors add up.',
            '<b>ANOVA</b>: F = variation between groups / variation within groups. F = 44, P < 0.001. Kruskal–Wallis is the rank-based version. Neither says which groups differ: <code>TukeyHSD()</code> compares the pairs.',
          ],
          source: 'Lecture W3, Part A, slides 30–36',
        },
        {
          type: 'question', id: 'groups-fold', kind: 'choice',
          text: 'On the log2 scale, mean expression in BCR/ABL is 1.1 higher than in NEG. What fold change is that?',
          options: ['1.1-fold', 'About 2.1-fold (2<sup>1.1</sup>)', 'About 3.0-fold (e<sup>1.1</sup>)', 'About 12.6-fold (10<sup>1.1</sup>)'],
          answer: 1,
          explain: 'On the log2 scale a difference of 1 is a 2-fold change and a difference of 2 a 4-fold change, so 1.1 is a 2<sup>1.1</sup> = 2.1-fold change (95% CI 1.8 to 2.5).',
          source: 'Lecture W3, Part A, slides 31–32',
        },
        {
          type: 'question', id: 'groups-why', kind: 'choice',
          text: 'Why use ANOVA, rather than a t-test for each pair of the three subtypes?',
          options: [
            'Each t-test has a 5% false positive rate, and the errors add up',
            'A t-test can’t compare groups of different sizes',
            'ANOVA tells you which groups differ',
            'ANOVA makes no assumptions',
          ],
          answer: 0,
          explain: 'Three tests, each at 5%, give a larger chance of at least one false positive. Week 5 returns to this problem.',
          source: 'Lecture W3, Part A, slide 33',
        },
        {
          type: 'question', id: 'groups-conclude', kind: 'choice',
          text: 'ANOVA of the three subtypes gives F = 44, P < 0.001. What can you conclude?',
          options: [
            'All three subtype means differ',
            'At least one subtype mean differs, and pairwise comparisons show which',
            'BCR/ABL has the highest mean',
            'The spread differs between subtypes',
          ],
          answer: 1,
          explain: 'H₁ is that at least one mean differs. <code>TukeyHSD()</code> showed BCR/ABL higher than both ALL1/AF4 and NEG, while ALL1/AF4 and NEG did not differ (adjusted P = 0.97).',
          source: 'Lecture W3, Part A, slides 33–36',
        },
        {
          type: 'question', id: 'groups-f', kind: 'choice',
          text: 'What makes the F statistic of an ANOVA large?',
          options: [
            'Group means far apart, compared with the spread within the groups',
            'A large spread within the groups',
            'Groups of very different sizes',
            'Data that aren’t normally distributed',
          ],
          answer: 0,
          explain: 'F = variation between groups / variation within groups. A large F gives a small p-value.',
          source: 'Lecture W3, Part A, slide 34',
        },
      ],
    },
    {
      id: 'genetics', label: 'Genotype and trait', week: 3,
      slides: [
        {
          type: 'recap', id: 'genetics-recap', title: 'Genotype by trait', demo: 'models',
          points: [
            'FAMuSS, esr1_rs1042717 and BMI above 25, in 1,000 people: 50% of AA, 35% of GA and 33% of GG are above 25.',
            'Chi-square on the 2 × 3 table: 2 degrees of freedom, P = 0.026, with no assumption on the genetic model.',
            '<b>Dominant</b>: one copy of A is enough. <b>Recessive</b>: two copies are needed. <b>Additive</b>: each copy adds the same amount.',
            'The <b>Cochran–Armitage trend test</b> has 1 degree of freedom. Additive P = 0.03, dominant P = 0.18, recessive P = 0.009. In GWAS, additive is the default.',
          ],
          source: 'Lecture W3, Part A, slides 37–42',
        },
        {
          type: 'question', id: 'genetics-recessive', kind: 'choice',
          text: 'Under a recessive model for allele A, which genotypes do you compare?',
          options: [
            'AA with GA and GG together',
            'AA and GA together with GG',
            'AA with GG, leaving out GA',
            'GA with AA and GG together',
          ],
          answer: 0,
          explain: 'Recessive: two copies are needed, so AA against the rest. Dominant: one copy is enough, so AA and GA against GG. Additive: each copy adds the same amount (scores 2, 1, 0).',
          source: 'Lecture W3, Part A, slide 41',
        },
        {
          type: 'question', id: 'genetics-or', kind: 'choice',
          text: '30 of 60 AA people have BMI above 25, against 314 of 940 GA or GG. The odds ratio is 1.99 (95% CI 1.18 to 3.37). Which genetic model does this comparison test?',
          options: ['Recessive', 'Dominant', 'Additive', 'None: it tests Hardy–Weinberg equilibrium'],
          answer: 0,
          explain: 'AA against GA and GG together is the recessive comparison. The recessive trend test also gave the smallest p-value, P = 0.009.',
          source: 'Lecture W3, Part A, slides 38 and 42',
        },
        {
          type: 'question', id: 'genetics-trend', kind: 'choice',
          text: 'How many degrees of freedom does the Cochran–Armitage trend test have, for a SNP with three genotypes?',
          options: ['1', '2', '3', 'One fewer than the number of people'],
          answer: 0,
          explain: 'It tests a trend in the proportions over the genotypes, one number: 1 degree of freedom. The chi-square test of the 2 × 3 table has 2, and detects any association.',
          source: 'Lecture W3, Part A, slides 40 and 42',
        },
      ],
    },
    {
      id: 'hwe', label: 'Hardy–Weinberg', week: 3,
      slides: [
        {
          type: 'recap', id: 'hwe-recap', title: 'Hardy–Weinberg equilibrium', demo: 'hwe',
          points: [
            'With allele frequencies p (A) and 1 − p (G), random mating gives genotype frequencies p² (AA), 2p(1 − p) (GA) and (1 − p)² (GG).',
            'FAMuSS, esr1_rs1042717: p = 0.25. Observed AA 71, GA 468, GG 681; expected 76.2, 457.5 and 686.2. χ² = 0.64, 1 degree of freedom, P = 0.42.',
            'Departures can signal genotyping errors, population structure, or selection or non-random mating.',
            'HWE is tested for every SNP, as a quality-control step.',
          ],
          source: 'Lecture W3, Part A, slides 43–45',
        },
        {
          type: 'question', id: 'hwe-ga', kind: 'choice',
          text: 'The frequency of allele A is 0.25. Under Hardy–Weinberg equilibrium, what proportion of people are GA?',
          options: ['0.25', '0.0625, which is 0.25²', '0.375, which is 2 × 0.25 × 0.75', '0.5625, which is 0.75²'],
          answer: 2,
          explain: 'A heterozygote gets A from the mother and G from the father, or the other way round: 2p(1 − p). For 1,220 people that is 457.5 expected, and FAMuSS has 468.',
          source: 'Lecture W3, Part A, slides 43–44',
        },
        {
          type: 'question', id: 'hwe-why', kind: 'choice',
          text: 'Why is Hardy–Weinberg equilibrium tested for each SNP?',
          options: [
            'As a quality-control check: departures can signal genotyping errors or population structure',
            'To find the SNPs associated with the trait',
            'To estimate the effect of each SNP',
            'To check that the trait is normally distributed',
          ],
          answer: 0,
          explain: 'esr1_rs1042717 passes the check: χ² = 0.64, P = 0.42, so there is no evidence against HWE.',
          source: 'Lecture W3, Part A, slides 43–44',
        },
      ],
    },
    {
      id: 'choose', label: 'Choosing a test', week: 3,
      slides: [
        {
          type: 'recap', id: 'choose-recap', title: 'Choosing the right test', demo: 'chooser',
          points: [
            'Start from the outcome, and from what you compare it across.',
            'Then check the assumptions: normality or a large sample for the t-test and ANOVA, expected counts of at least 5 for chi-square, and independent observations for all of them.',
            'Report the effect, its 95% CI and the p-value.',
          ],
          source: 'Lecture W3, Part A, slide 46, and Part B',
        },
        {
          type: 'question', id: 'choose-bmi', kind: 'choice',
          text: 'Is mean BMI different between the three genotypes of a SNP?',
          options: ['Two-sample t-test', 'ANOVA, or Kruskal–Wallis', 'Chi-square or Fisher’s test', 'Cochran–Armitage trend test'],
          answer: 1,
          explain: 'A continuous outcome and three groups. If the groups are small and clearly not normal, use Kruskal–Wallis.',
          source: 'Lecture W3, Part A, slide 46',
        },
        {
          type: 'question', id: 'choose-hypertension', kind: 'choice',
          text: 'Are smokers more likely than non-smokers to have hypertension?',
          options: ['Two-sample t-test', 'ANOVA', 'Chi-square, or Fisher’s test if an expected count is below 5', 'Wilcoxon rank-sum test'],
          answer: 2,
          explain: 'Two categorical variables make a 2 × 2 table. Report the odds ratio with its CI.',
          source: 'Lecture W3, Part A, slides 24–29 and 46',
        },
        {
          type: 'question', id: 'choose-small', kind: 'choice',
          text: 'Is a probe’s expression different between two leukaemia subtypes, with 5 patients in each and clearly non-normal values?',
          options: ['Two-sample t-test', 'Wilcoxon rank-sum, or a permutation test', 'Chi-square test', 'ANOVA'],
          answer: 1,
          explain: 'Small, clearly non-normal samples: compare ranks, or use a permutation test, which makes no assumption on the shape of the data.',
          source: 'Lecture W3, Part A, slides 23 and 46',
        },
        {
          type: 'question', id: 'choose-age', kind: 'choice',
          text: 'Does birth weight change with the mother’s age, in years?',
          options: ['Two-sample t-test', 'ANOVA', 'Chi-square test', 'Regression'],
          answer: 3,
          explain: 'A continuous outcome and a continuous predictor: regression, the topic of week 4, which also covers the tests of this week.',
          source: 'Lecture W3, Part A, slide 46',
        },
      ],
    },
    // ---------------------------------------------------------------- week 4
    {
      id: 'lm', label: 'Simple regression', week: 4,
      slides: [
        {
          type: 'recap', id: 'lm-recap', title: 'A straight line through the data', demo: 'leastSquares',
          points: [
            'y = β₀ + β₁x + ε. The <b>slope</b> β₁ is the change in mean outcome for a one-unit increase in x; the <b>intercept</b> β₀ is the mean outcome when x = 0.',
            '<b>Least squares</b> chooses the line with the smallest sum of squared residuals: the vertical distances from the points to the line.',
            'Birth weight on mother’s age: 12.4 g more per year (95% CI −7.3 to 32.2 g, P = 0.22). The intercept, 2,656 g at age 0, is far outside the data: ages 14 to 45.',
            'Residual standard error 728 g. <b>R²</b> = 1 − RSS / TSS = 0.8%: age explains almost none of the variation in birth weight.',
          ],
          source: 'Lecture W4, Part A, slides 7–15',
        },
        {
          type: 'recap', id: 'lm-check', title: 'Check the assumptions', demo: 'diagnostics',
          points: [
            '<b>Linearity</b>: plot the residuals against the fitted values. A smooth curve through them should be flat.',
            '<b>Constant variance</b>: the same plot, with no funnel.',
            '<b>Normal errors</b>: a QQ-plot of the residuals, close to the line. Needed for p-values and intervals in small samples.',
            '<b>Independence</b>: not visible in these plots. It comes from the study design: repeated measures on the same individual break it.',
          ],
          source: 'Lecture W4, Part A, slides 9 and 16–17',
        },
        {
          type: 'question', id: 'lm-slope', kind: 'choice',
          text: '<code>lm(birthwt.grams ~ mother.age)</code> gives a slope of 12.4. What does it mean?',
          options: [
            'Each extra year of mother’s age goes with 12.4 g more birth weight, on average',
            'Mother’s age explains 12.4% of the variation in birth weight',
            'A mother aged 0 would have a baby of 12.4 g',
            'Birth weight and mother’s age have a correlation of 0.124',
          ],
          answer: 0,
          explain: 'The slope is the change in mean outcome for a one-unit increase in x. Its 95% CI, −7.3 to 32.2 g, includes 0 (P = 0.22). The share of variation explained is R², here 0.8%.',
          source: 'Lecture W4, Part A, slides 7 and 12–15',
        },
        {
          type: 'question', id: 'lm-intercept', kind: 'choice',
          text: 'The intercept of the same model is 2,656 g. Why is it not a real birth weight?',
          options: [
            'It is the fitted weight for a mother aged 0, far outside the observed ages of 14 to 45',
            'Because its p-value is below 0.05',
            'Because it is the mean birth weight of all 189 babies',
            'Because R leaves the intercept out unless you ask for it',
          ],
          answer: 0,
          explain: 'Predicting outside the data is extrapolation: the band widens and the line may not stay straight. Removing the intercept with <code>- 1</code> forces the line through the origin, which is rarely sensible: the slope jumps from 12 g to 121 g.',
          source: 'Lecture W4, Part A, slides 11–13',
        },
        {
          type: 'question', id: 'lm-ci', kind: 'choice',
          text: 'The 95% CI of the slope for mother’s age is −7.3 to 32.2 g per year. What does it tell you?',
          options: [
            'The data are compatible with no association: the interval includes 0, in agreement with P = 0.22',
            'Older mothers have heavier babies',
            'Mother’s age explains between 7% and 32% of birth weight',
            '95% of mothers have a slope between −7.3 and 32.2 g',
          ],
          answer: 0,
          explain: 'A 95% CI that includes 0 agrees with P > 0.05. It also shows the plausible size of the effect: from a small decrease to about 32 g more per year.',
          source: 'Lecture W4, Part A, slide 14',
        },
        {
          type: 'question', id: 'lm-68', kind: 'number',
          text: 'The residual standard error is 728 g, and the errors are normal. About what percentage of birth weights lie within 728 g of the line?',
          min: 0, max: 100, step: 1, unit: '%', answer: 68,
          explain: 'The residual standard error is the SD of the residuals, and a normal distribution has about 68% of its values within 1 SD of the mean, as in week 2.',
          source: 'Lecture W4, Part A, slide 13',
        },
        {
          type: 'question', id: 'lm-funnel', kind: 'choice',
          text: 'Plotted against the fitted values, the residuals spread out more and more as the fitted values grow, like a funnel. Which assumption is in doubt?',
          options: ['Linearity', 'Constant variance', 'Normal errors', 'Independence'],
          answer: 1,
          explain: 'The spread of the errors should not depend on x. A curve in the same plot questions linearity, and the QQ-plot of the residuals checks normal errors.',
          source: 'Lecture W4, Part A, slides 16–17',
        },
        {
          type: 'question', id: 'lm-independence', kind: 'choice',
          text: 'Suppose some mothers had two babies during a study, and both births are in the data. Which assumption does that break?',
          options: ['Independence', 'Linearity', 'Normal errors', 'Constant variance'],
          answer: 0,
          explain: 'Births to the same mother are related, so one informs on the other. Independence can’t be seen in the residual plots: it comes from the study design, as with repeated measures on the same individual.',
          source: 'Lecture W4, Part A, slide 16',
        },
      ],
    },
    {
      id: 'factors', label: 'Factors and confounding', week: 4,
      slides: [
        {
          type: 'recap', id: 'factor-recap', title: 'A factor in a regression', demo: 'factorLines',
          points: [
            'R makes one <b>indicator</b> variable for each category except the <b>baseline</b>, the first level: raceBlack and raceOther, against White.',
            'Each coefficient is a difference from the baseline, at the same values of the other variables: babies of black mothers were 366 g lighter than those of white mothers of the same age (95% CI 49 to 683 g, P = 0.02).',
            'With race and age, the lines are parallel: one slope for age, and a different intercept for each race.',
            'Is race needed? An <b>F-test</b> of the nested models: F = 4.30 for the 2 extra parameters, P = 0.015.',
          ],
          source: 'Lecture W4, Part A, slides 18–21',
        },
        {
          type: 'recap', id: 'confound-recap', title: 'Confounding: crude and adjusted', demo: 'confounding',
          points: [
            'A <b>confounder</b> is related to both the exposure and the outcome, and is not on the causal path between them.',
            'Race and smoking: white mothers smoked most (54%, against 38% of black and 18% of other mothers) and had the heaviest babies (3,103 g, against 2,720 g and 2,805 g).',
            '<b>Crude</b>: smokers’ babies were 284 g lighter (95% CI 73 to 495 g). <b>Adjusted</b> for race and age: 426 g lighter (209 to 643 g, P < 0.001). The crude estimate understated it.',
            'A covariate that isn’t a confounder can still help, by explaining variation. Adjustment only removes confounding by variables that are measured and included.',
          ],
          source: 'Lecture W4, Part A, slides 22–28',
        },
        {
          type: 'question', id: 'factor-coefs', kind: 'choice',
          text: 'Race has three categories: White, Black and Other. How many coefficients does it add to a regression?',
          options: ['1', '2', '3', 'It depends on the number of mothers'],
          answer: 1,
          explain: 'R makes one indicator variable for each category except the baseline, here White: raceBlack and raceOther. All three with an intercept would be perfectly collinear.',
          source: 'Lecture W4, Part A, slide 18',
        },
        {
          type: 'question', id: 'factor-baseline', kind: 'choice',
          text: 'In <code>lm(birthwt.grams ~ race + mother.age)</code>, the coefficient raceBlack is −366 g. What is it compared with?',
          options: [
            'Babies of white mothers of the same age',
            'The mean of all babies',
            'Babies of mothers of other races',
            'Babies of black mothers aged 0',
          ],
          answer: 0,
          explain: 'Each coefficient of a factor is a difference from the baseline, White, at the same values of the other variables: 366 g lighter (95% CI 49 to 683 g, P = 0.02).',
          source: 'Lecture W4, Part A, slides 18–20',
        },
        {
          type: 'question', id: 'factor-ftest', kind: 'choice',
          text: 'Adding race to a model with mother’s age gives F = 4.30, P = 0.015. What does this F-test compare?',
          options: [
            'The models with and without race: does race improve the fit?',
            'Black mothers with mothers of other races',
            'The slope for age in each race',
            'The residuals with a normal distribution',
          ],
          answer: 0,
          explain: 'The models are nested: one is a special case of the other. The F-test compares how much the residual sum of squares falls with the 2 extra parameters with the variation that remains.',
          source: 'Lecture W4, Part A, slide 21',
        },
        {
          type: 'question', id: 'confound-define', kind: 'choice',
          text: 'What makes race a confounder of the effect of smoking on birth weight?',
          options: [
            'It is related to both smoking and birth weight, and is not on the causal path between them',
            'It is related to birth weight',
            'It has a small p-value in the regression',
            'It is a factor with more than two categories',
          ],
          answer: 0,
          explain: 'White mothers smoked more and had heavier babies. And smoking doesn’t change a mother’s race, so race is not on the causal path from smoking to birth weight.',
          source: 'Lecture W4, Part A, slides 22–24',
        },
        {
          type: 'question', id: 'confound-direction', kind: 'choice',
          text: 'Crude: smokers’ babies were 284 g lighter. Adjusted for race and age: 426 g lighter. Why did the estimate change?',
          options: [
            'White mothers smoked more and had heavier babies, so the crude comparison mixed smoking with race',
            'Adjusting always makes an effect larger',
            'The adjusted model left some babies out',
            'Mother’s age is a strong confounder',
          ],
          answer: 0,
          explain: 'Comparing smokers and non-smokers of the same race and age removes the mixing: the crude estimate understated the association. Race does the work: adjusting for race alone gives 429 g lighter, and adding age changes little (426 g, 95% CI 209 to 643 g).',
          source: 'Lecture W4, Part A, slides 26–28',
        },
        {
          type: 'question', id: 'confound-unmeasured', kind: 'choice',
          text: 'Can adjusting in a regression remove confounding by a variable that was not measured?',
          options: [
            'No: adjustment only removes confounding by variables that are measured and included',
            'Yes, if the sample is large enough',
            'Yes: the residuals take it up',
            'Only if the variable is a factor',
          ],
          answer: 0,
          explain: 'A regression adjusts for the covariates it contains. Confounding by anything left out remains, which is why the choice of covariates matters.',
          source: 'Lecture W4, Part A, slides 22 and 28',
        },
      ],
    },
    {
      id: 'multi', label: 'Interaction', week: 4,
      slides: [
        {
          type: 'recap', id: 'multi-recap', title: 'Several predictors, and interactions', demo: 'interaction',
          points: [
            'y = β<sub>0</sub> + β<sub>1</sub>x<sub>1</sub> + … + β<sub>p</sub>x<sub>p</sub> + ε. Each coefficient is the change in mean outcome for its predictor, with all the others held fixed. Leave out near-duplicate predictors: they make the coefficients unstable.',
            'R² never falls when a predictor is added: compare models with the adjusted R² or an F-test.',
            'An <b>interaction</b>: the effect of one predictor depends on another. With <code>race * mother.age</code>, the slope for age is 21.4 g per year for white mothers, about −41 g for black and −5 g for other mothers.',
            'F-test of the two interaction terms: P = 0.10, not enough evidence of different slopes. There were only 26 black mothers.',
          ],
          source: 'Lecture W4, Part A, slides 29–31',
        },
        {
          type: 'question', id: 'multi-held', kind: 'choice',
          text: 'In <code>lm(birthwt.grams ~ mother.smokes + race + mother.age)</code>, what does the coefficient of mother’s age mean?',
          options: [
            'The change in mean birth weight per year of age, for mothers of the same smoking status and race',
            'The change in mean birth weight per year of age, ignoring smoking and race',
            'The correlation between mother’s age and birth weight',
            'The age at which birth weight is highest',
          ],
          answer: 0,
          explain: 'In a multiple regression each coefficient is the change in mean outcome for a one-unit increase in its predictor, with all the other predictors held fixed.',
          source: 'Lecture W4, Part A, slide 29',
        },
        {
          type: 'question', id: 'multi-r2', kind: 'choice',
          text: 'You add a predictor of pure noise to a regression. What happens to R²?',
          options: [
            'It stays the same or rises: R² never falls when a predictor is added',
            'It falls',
            'It stays exactly the same',
            'It becomes negative',
          ],
          answer: 0,
          explain: 'So R² alone can’t tell you whether a predictor helps: compare the models with the adjusted R² or an F-test.',
          source: 'Lecture W4, Part A, slide 29',
        },
        {
          type: 'question', id: 'interact-slope', kind: 'choice',
          text: 'With <code>race * mother.age</code>, the slope for age is 21.4 g per year for white mothers, and the interaction term for black mothers is −62.5. What is the slope for black mothers?',
          options: [
            '−62.5 g per year',
            '21.4 − 62.5, about −41 g per year',
            '21.4 + 62.5, about 84 g per year',
            '21.4 g per year, the same as for white mothers',
          ],
          answer: 1,
          explain: 'Each interaction term is a difference from the slope of the baseline. For other mothers: 21.4 − 26.0, about −4.7 g per year.',
          source: 'Lecture W4, Part A, slide 30',
        },
        {
          type: 'question', id: 'interact-p', kind: 'choice',
          text: 'The F-test of the two race-by-age interaction terms gives P = 0.10. What do you conclude?',
          options: [
            'There is not enough evidence that the slope for age differs between races',
            'The slopes are the same in every race',
            'There is a 10% probability that the slopes differ',
            'Race has no effect on birth weight',
          ],
          answer: 0,
          explain: 'A large p-value is not evidence of equal slopes, and there were only 26 black mothers. Race itself was associated with birth weight (P = 0.015).',
          source: 'Lecture W4, Part A, slide 31',
        },
      ],
    },
    {
      id: 'testslm', label: 'Tests as regressions', week: 4,
      slides: [
        {
          type: 'recap', id: 'testlm-recap', title: 'Common tests are linear models', demo: 'testAsRegression',
          points: [
            'A two-sample t-test is a regression on one binary predictor: the slope is the difference in means, −283.8 g, and the intercept the mean of the baseline group, 3,055.7 g.',
            'The same t (2.65) and P (0.009) as <code>t.test(…, var.equal = TRUE)</code>.',
            'ANOVA is a regression on a factor: the regression’s F-test is the ANOVA F-test (race: F = 4.91, P = 0.008). With a covariate added, it is ANCOVA.',
            'A chi-square test of a 2 × 2 table matches a logistic regression. One framework, with the same estimates, and covariates are easy to add.',
          ],
          source: 'Lecture W4, Part A, slides 32–34',
        },
        {
          type: 'question', id: 'testlm-intercept', kind: 'choice',
          text: '<code>lm(birthwt.grams ~ mother.smokes)</code> gives an intercept of 3,055.7 g and a coefficient of −283.8 g for smokers. What is the intercept?',
          options: [
            'The mean birth weight of non-smokers’ babies',
            'The mean birth weight of all 189 babies',
            'The birth weight for a mother aged 0',
            'The mean birth weight of smokers’ babies',
          ],
          answer: 0,
          explain: 'Non-smokers are the baseline, and the coefficient is the difference in means: 2,771.9 − 3,055.7 = −283.8 g. Smokers’ mean is the intercept plus the coefficient.',
          source: 'Lecture W4, Part A, slide 33',
        },
        {
          type: 'question', id: 'testlm-ttest', kind: 'choice',
          text: 'Which test gives exactly the same t and p-value as <code>lm(birthwt.grams ~ mother.smokes)</code>?',
          options: [
            '<code>t.test(birthwt.grams ~ mother.smokes, var.equal = TRUE)</code>',
            '<code>t.test(birthwt.grams ~ mother.smokes)</code>, R’s default',
            '<code>wilcox.test(birthwt.grams ~ mother.smokes)</code>',
            '<code>chisq.test(table(birthwt$mother.smokes))</code>',
          ],
          answer: 0,
          explain: 'Regression assumes the same error variance in both groups, as the equal-variance t-test does: t = 2.65, P = 0.009 for both. R’s default t-test is Welch’s, which doesn’t assume it.',
          source: 'Lecture W4, Part A, slides 32–33',
        },
        {
          type: 'question', id: 'testlm-race', kind: 'choice',
          text: '<code>lm(birthwt.grams ~ race)</code>: the intercept is 3,103 g and raceBlack is −383 g. What is −383 g?',
          options: [
            'How much lighter, on average, black mothers’ babies were than white mothers’ babies',
            'The mean birth weight of black mothers’ babies',
            'How much lighter black mothers’ babies were than the average of all babies',
            'The ANOVA F statistic',
          ],
          answer: 0,
          explain: 'White is the baseline, so the intercept is its mean and each coefficient a difference from it: black mothers’ babies averaged 3,103 − 383 = 2,720 g. The regression’s F-test is the ANOVA F-test: F = 4.91, P = 0.008.',
          source: 'Lecture W4, Part A, slide 34',
        },
      ],
    },
    {
      id: 'logit', label: 'Logistic regression', week: 4,
      slides: [
        {
          type: 'recap', id: 'logit-recap', title: 'A binary outcome: logistic regression', demo: 'logistic',
          points: [
            'Model the log odds: log{p / (1 − p)} = β₀ + β₁x₁ + …. It turns a probability between 0 and 1 into any number, while a straight line for p would leave 0 to 1.',
            'exp(β) is the <b>odds ratio</b> for a one-unit increase in x, the other predictors fixed. In R: <code>glm(…, family = binomial)</code>.',
            'Low birth weight and smoking: crude odds ratio 2.02 (95% CI 1.08 to 3.80, P = 0.03), the odds ratio of the 2 × 2 table of week 3.',
            'Adjusted for race and age: 3.01 (1.47 to 6.38, P = 0.003). As in the linear model, the crude estimate understated it.',
          ],
          source: 'Lecture W4, Part A, slides 35–38',
        },
        {
          type: 'recap', id: 'odds-recap', title: 'Reading the coefficients', demo: 'oddsScale',
          points: [
            'Linear regression: a coefficient is a difference in means, and no effect is 0.',
            'Logistic regression: a coefficient is a log odds ratio. Report exp(estimate), with exp(lower) to exp(upper). No effect is 1.',
            'Odds ratios multiply: a mother aged 30 against one aged 20 has 0.966<sup>10</sup> = 0.71 times the odds of low birth weight.',
            'Always add: compared with which group, at which values of the other variables. The model predicts the odds of the outcome coded 1.',
          ],
          source: 'Lecture W4, Part A, slides 39–40',
        },
        {
          type: 'question', id: 'logit-why', kind: 'choice',
          text: 'For a binary outcome, why model the log odds rather than the probability as a straight line?',
          options: [
            'A straight line for the probability would go below 0 or above 1, while the log odds can take any value',
            'The log odds are normally distributed',
            'It makes the p-values smaller',
            'R can’t estimate probabilities',
          ],
          answer: 0,
          explain: 'The logit, log{p / (1 − p)}, turns a probability between 0 and 1 into any real number. On that scale the model is a straight line: log{p / (1 − p)} = β₀ + β₁x.',
          source: 'Lecture W4, Part A, slides 35–36',
        },
        {
          type: 'question', id: 'logit-exp', kind: 'choice',
          text: 'In a logistic regression, the coefficient of smoking is 1.10. What is the odds ratio?',
          options: ['1.10', 'exp(1.10), about 3.0', 'log(1.10), about 0.10', '1.10 / (1 + 1.10), about 0.52'],
          answer: 1,
          explain: 'Coefficients are on the log odds scale, and exp() turns them into odds ratios; the interval’s ends too. Smoking, adjusted for race and age: odds ratio 3.01 (95% CI 1.47 to 6.38).',
          source: 'Lecture W4, Part A, slides 35 and 38–40',
        },
        {
          type: 'question', id: 'logit-odds', kind: 'choice',
          text: 'Smokers against non-smokers of the same race and age: odds ratio of low birth weight 3.0 (95% CI 1.47 to 6.38). Which statement is right?',
          options: [
            'Smokers had 3.0 times the odds of a low-birth-weight baby',
            'Smokers were exactly 3.0 times as likely to have a low-birth-weight baby',
            '3% of smokers’ babies had low birth weight',
            'Smoking explains 3% of low birth weight',
          ],
          answer: 0,
          explain: 'An odds ratio compares odds, p / (1 − p), not probabilities. The two are close only when the outcome is rare, and low birth weight was not rare here: 59 of 189 babies.',
          source: 'Lecture W4, Part A, slides 35 and 39',
        },
        {
          type: 'question', id: 'logit-age10', kind: 'choice',
          text: 'Each extra year of mother’s age multiplies the odds of low birth weight by 0.966. What is the odds ratio for a mother aged 30 against one aged 20?',
          options: ['0.966 × 10, about 9.7', '0.966<sup>10</sup>, about 0.71', '0.966 − 0.1, about 0.87', '0.966, whatever the gap'],
          answer: 1,
          explain: 'Odds ratios multiply: ten extra years multiply the odds by 0.966 ten times. On the log odds scale, the coefficient is multiplied by 10.',
          source: 'Lecture W4, Part A, slide 39',
        },
        {
          type: 'question', id: 'logit-null', kind: 'choice',
          text: 'The odds ratio for mother’s age is 0.97 per year (95% CI 0.90 to 1.03). What do you conclude?',
          options: [
            'No evidence of an association: the interval includes 1',
            'Older mothers have fewer low-weight babies: the odds ratio is below 1',
            'No evidence of an association: the interval includes 0',
            'An association: the interval excludes 0',
          ],
          answer: 0,
          explain: 'For an odds ratio, no effect is 1, not 0 (here P = 0.30). On the log odds scale the coefficient’s interval includes 0, which says the same.',
          source: 'Lecture W4, Part A, slides 39–40',
        },
      ],
    },
    {
      id: 'genereg', label: 'Genotypes in a regression', week: 4,
      slides: [
        {
          type: 'recap', id: 'genereg-recap', title: 'A genotype as a predictor', demo: 'genotypeCoding',
          points: [
            '<b>Additive</b> coding: the number of A alleles, 0, 1 or 2, with one slope. The default in GWAS.',
            '<b>Dominant</b>: AA or GA against GG. <b>Recessive</b>: AA against the rest. As a <b>factor</b>: two coefficients, and no assumed pattern.',
            'FAMuSS, esr1_rs1042717, adjusted for age and gender: BMI 0.23 higher per A allele (95% CI −0.23 to 0.68, P = 0.33).',
            'BMI above 25: odds 1.27 times higher per A allele (95% CI 1.02 to 1.58, P = 0.03), and 1.26 before adjusting, so age and gender aren’t confounders here.',
          ],
          source: 'Lecture W4, Part A, slides 41–48',
        },
        {
          type: 'question', id: 'gene-additive', kind: 'choice',
          text: 'Additive coding for allele A of esr1_rs1042717: what number does a GA individual get?',
          options: ['0', '1', '2', '0.5'],
          answer: 1,
          explain: 'The number of copies of A: GG 0, GA 1, AA 2. One slope then gives the same change with each A allele, the default in GWAS.',
          source: 'Lecture W4, Part A, slides 42–43',
        },
        {
          type: 'question', id: 'gene-dominant', kind: 'choice',
          text: 'Dominant coding for allele A: which genotypes are coded 1?',
          options: ['AA and GA', 'AA only', 'GA only', 'GG only'],
          answer: 0,
          explain: 'Dominant: at least one A allele, so AA or GA against GG. Recessive codes AA as 1, and GA and GG as 0. As a factor, the genotype gets two coefficients and no assumed pattern.',
          source: 'Lecture W4, Part A, slides 42–43',
        },
        {
          type: 'question', id: 'gene-squared', kind: 'choice',
          text: 'Each extra A allele multiplies the odds of a BMI above 25 by 1.27. Under the additive model, what is the odds ratio for AA against GG?',
          options: ['1.27', '1.27², about 1.61', '2 × 1.27, about 2.54', '1.27 + 0.27, about 1.54'],
          answer: 1,
          explain: 'AA has two more A alleles than GG, so the odds are multiplied by 1.27 twice. On the log odds scale, the coefficient is doubled.',
          source: 'Lecture W4, Part A, slides 42 and 46–47',
        },
        {
          type: 'question', id: 'gene-twomodels', kind: 'choice',
          text: 'For the same SNP, the linear model of BMI gives P = 0.33, and the logistic model of a BMI above 25 gives P = 0.03. Why can they differ?',
          options: [
            'They ask different questions: about mean BMI, and about the odds of a BMI above 25',
            'One of the two models must be wrong',
            'The logistic model includes more people',
            'Only the linear model is adjusted for age and gender',
          ],
          answer: 0,
          explain: 'Both were adjusted for age and gender. Either way the effect is modest, and a single SNP at P = 0.03 is weak evidence: week 5 looks at what changes when 227 SNPs are tested.',
          source: 'Lecture W4, Part A, slides 45–48',
        },
        {
          type: 'question', id: 'gene-confounder', kind: 'choice',
          text: 'Adjusting for age and gender changed the odds ratio per A allele only from 1.26 to 1.27. What does that suggest?',
          options: [
            'Age and gender are not confounders of this SNP’s association',
            'Age and gender are not associated with BMI',
            'The SNP is confounded by age',
            'The adjustment didn’t work',
          ],
          answer: 0,
          explain: 'Age (odds ratio 1.07 per year) and gender (1.70 for men) are associated with a BMI above 25, yet adjusting for them barely moved the genotype’s odds ratio: here they are covariates, not confounders.',
          source: 'Lecture W4, Part A, slides 25 and 46–48',
        },
      ],
    },
    {
      id: 'report', label: 'Reporting', week: 4,
      slides: [
        {
          type: 'recap', id: 'report-recap', title: 'Reporting a regression for a clinician', demo: 'reportBuilder',
          points: [
            'State the question and the outcome in plain words, and who is compared with whom.',
            'Give the estimate with its 95% CI, not only the p-value, and say what was adjusted for, and why.',
            'Give the sample size and the number of missing values, and say whether the effect matters clinically.',
            'Beyond this course: Poisson and negative binomial regression for counts such as sequencing reads (DESeq2, limma), and mixed-effects models for repeated measures.',
          ],
          source: 'Lecture W4, Part A, slides 49–50',
        },
        {
          type: 'question', id: 'report-best', kind: 'choice',
          text: 'Which sentence reports the adjusted smoking result best for a clinician?',
          options: [
            '“Smoking was significant (P < 0.001).”',
            '“Among mothers of the same race and age, smokers’ babies weighed on average 426 g less (95% CI 209 to 643 g), in 189 births.”',
            '“The coefficient of mother.smokesYes was −426.09.”',
            '“Smoking causes low birth weight.”',
          ],
          answer: 1,
          explain: 'It says who is compared with whom, gives the estimate with its 95% CI, what was adjusted for and the sample size. A p-value alone says nothing about the size of an effect.',
          source: 'Lecture W4, Part A, slide 49',
        },
        {
          type: 'question', id: 'report-percent', kind: 'choice',
          text: 'An odds ratio of 1.27 per A allele (95% CI 1.02 to 1.58). In words, each extra A allele…',
          options: [
            '…raises the odds of a BMI above 25 by about 27% (95% CI 2% to 58%)',
            '…raises the probability of a BMI above 25 by 27 percentage points',
            '…raises BMI by 27%',
            '…gives a 1.27% chance of a BMI above 25',
          ],
          answer: 0,
          explain: 'Leonardo’s example: “Among individuals of the same age and gender, each extra A allele at esr1_rs1042717 raises the odds of a BMI above 25 by about 27% (95% CI 2% to 58%).”',
          source: 'Lecture W4, Part A, slide 49',
        },
        {
          type: 'question', id: 'report-counts', kind: 'choice',
          text: 'You want to compare RNA-seq read counts of a gene between two groups, adjusting for a covariate. Which model suits them?',
          options: [
            'Negative binomial regression, as in DESeq2',
            'Logistic regression',
            'Linear regression of the raw counts',
            'A chi-square test',
          ],
          answer: 0,
          explain: 'Read counts vary more than a Poisson count would (over-dispersion, week 2), so tools such as DESeq2 use the negative binomial. Repeated measures on the same individuals need mixed-effects models. Both are beyond this course: see the extension pack.',
          source: 'Lecture W4, Part A, slide 50',
        },
      ],
    },
    // ---------------------------------------------------------------- week 5
    {
      id: 'many', label: 'Many tests', week: 5,
      slides: [
        {
          type: 'recap', id: 'many-recap', title: 'Testing many hypotheses', demo: 'manyTests',
          points: [
            'A test of a true null has a 5% chance of a false positive. With <i>m</i> independent tests, all nulls true: P(at least one) = 1 − 0.95<sup><i>m</i></sup>, 40% for 10 tests and 92% for 50.',
            'At P < 0.05, 1,000,000 tests with no true effect give about 50,000 false positives.',
            '<b>FWER</b>, the family-wise error rate: P(V ≥ 1), the chance of any false positive. <b>FDR</b>, the false discovery rate: E(V/R), the expected share of false positives among the discoveries.',
            'Control the FWER when any false positive is costly; the FDR in exploratory screens of many tests.',
          ],
          source: 'Lecture W5, Part A, slides 5–8',
        },
        {
          type: 'question', id: 'many-million', kind: 'choice',
          text: 'A GWAS tests 1,000,000 SNPs, none truly associated, each at P < 0.05. About how many false positives will it find?',
          options: ['None, if every test is done correctly', 'About 50,000', 'About 5', 'About 500'],
          answer: 1,
          explain: '5% of 1,000,000: each test of a true null has a 5% chance of P < 0.05, however well it is done. That is why the usual threshold fails at genome scale.',
          source: 'Lecture W5, Part A, slide 5',
        },
        {
          type: 'question', id: 'many-twenty', kind: 'number',
          text: 'Twenty independent tests, every null true, each at 0.05. What is the chance of at least one false positive, in %?',
          min: 0, max: 100, step: 1, unit: '%', answer: 64,
          explain: 'No false positive has chance 0.95<sup>20</sup> = 0.36, so at least one has 1 − 0.36 = 0.64. With 50 tests, 92%.',
          source: 'Lecture W5, Part A, slide 6',
        },
        {
          type: 'question', id: 'many-v', kind: 'choice',
          text: 'In Leonardo’s table of the errors, what does V count?',
          options: [
            'The false positives: true nulls that were rejected',
            'The true discoveries',
            'The false negatives: false nulls that were not rejected',
            'All the rejected hypotheses',
          ],
          answer: 0,
          explain: 'V: false positives. T: false negatives. S: true discoveries. R = V + S: all the discoveries. The FWER is P(V ≥ 1), and the FDR is the expected V/R.',
          source: 'Lecture W5, Part A, slide 7',
        },
        {
          type: 'question', id: 'many-fdr', kind: 'choice',
          text: 'Controlling the FDR at 5% means that…',
          options: [
            '…5% of all the tests are false positives',
            '…each discovery has a 5% chance of being real',
            '…on average, 5% of the discoveries are false positives',
            '…there is a 5% chance of at least one false positive',
          ],
          answer: 2,
          explain: 'The FDR is the expected share of false positives among the discoveries. The FWER is the chance of at least one false positive. If all the nulls are true, the two coincide.',
          source: 'Lecture W5, Part A, slides 7–8',
        },
        {
          type: 'question', id: 'many-which', kind: 'choice',
          text: 'You screen 20,000 genes for differential expression, to pick candidates for follow-up in the lab. Which error rate would you control?',
          options: [
            'Both, by testing each gene at 0.05/20,000',
            'The FDR: a few false leads are acceptable',
            'The FWER: any false positive is too costly',
            'Neither: test each gene at 0.05',
          ],
          answer: 1,
          explain: 'An exploratory screen with thousands of tests: control the FDR, accepting a few false leads in exchange for more discoveries. Control the FWER when any false positive is costly, as in a confirmatory study of a few candidate variants.',
          source: 'Lecture W5, Part A, slide 8',
        },
      ],
    },
    {
      id: 'corrections', label: 'Bonferroni and BH', week: 5,
      slides: [
        {
          type: 'recap', id: 'corr-recap', title: 'Bonferroni and Benjamini–Hochberg', demo: 'bhProcedure',
          points: [
            '<b>Bonferroni</b>: test each at α/<i>m</i>, or compare min(<i>m</i> × <i>p</i>, 1) with α. It controls the FWER under any dependence, but is conservative for correlated tests.',
            '<b>Benjamini–Hochberg</b>: sort the p-values, find the largest <i>k</i> with <i>p</i><sub>(<i>k</i>)</sub> ≤ (<i>k</i>/<i>m</i>) <i>q</i>, and reject the <i>k</i> smallest. It controls the FDR at <i>q</i>, for independent or positively correlated tests.',
            '<b>Benjamini–Yekutieli</b> controls the FDR under any dependence, at the price of fewer discoveries.',
            'In R: <code>p.adjust(p, method = "BH")</code>. Always state the correction and the number of tests.',
          ],
          source: 'Lecture W5, Part A, slides 9–15',
        },
        {
          type: 'question', id: 'corr-bonf', kind: 'choice',
          text: 'Bonferroni for the 78 SNPs of FAMuSS, at α = 0.05: what is the threshold for each test?',
          options: ['0.05 × 78 = 3.9', '0.05, as for one test', '0.05/√78 = 0.0057', '0.05/78 = 6.4 × 10<sup>−4</sup>'],
          answer: 3,
          explain: 'Test each SNP at α/<i>m</i>. Equivalently, multiply each p-value by 78, at most 1, and compare it with 0.05.',
          source: 'Lecture W5, Part A, slide 9',
        },
        {
          type: 'question', id: 'corr-bh-count', kind: 'number',
          text: 'Leonardo’s ten sorted p-values: 0.001, 0.012, 0.014, 0.122, 0.245, 0.320, 0.550, 0.776, 0.840, 0.995. With <i>q</i> = 0.05, how many does Benjamini–Hochberg reject?',
          min: 0, max: 10, step: 1, answer: 3,
          explain: 'The thresholds (<i>i</i>/10) × 0.05 are 0.005, 0.010, 0.015, 0.020, …: the largest <i>i</i> with its p-value below its threshold is 3 (0.014 ≤ 0.015), so reject the first three. Bonferroni, at 0.005, rejects only the first.',
          source: 'Lecture W5, Part A, slides 11–12',
        },
        {
          type: 'question', id: 'corr-second', kind: 'choice',
          text: 'The second p-value, 0.012, is above its own threshold, 0.010. Does Benjamini–Hochberg reject it?',
          options: [
            'Only if Bonferroni rejects it too',
            'Only with Benjamini–Yekutieli',
            'Yes, because the third p-value is below its threshold',
            'No: each p-value must be below its own threshold',
          ],
          answer: 2,
          explain: 'Find the largest <i>k</i> with <i>p</i><sub>(<i>k</i>)</sub> ≤ (<i>k</i>/<i>m</i>) <i>q</i>, then reject the <i>k</i> smallest, whatever their own thresholds. Its BH-adjusted p-value is 0.047, below 0.05.',
          source: 'Lecture W5, Part A, slides 11–13',
        },
        {
          type: 'question', id: 'corr-adjusted', kind: 'choice',
          text: '<code>p.adjust(p, method = "BH")</code> gives 0.010, 0.047, 0.047, 0.305, … for the ten p-values. Why are the second and third the same?',
          options: [
            'Adjusted p-values are made to increase with the rank',
            'The second and third p-values were equal',
            'BH gives the same adjusted p-value to every rejected hypothesis',
            'It is a rounding error',
          ],
          answer: 0,
          explain: 'The adjusted p-value of the <i>k</i>-th smallest is (<i>m</i>/<i>k</i>) <i>p</i><sub>(<i>k</i>)</sub>, made to increase with the rank and at most 1. The second, (10/2) × 0.012 = 0.060, would be above the third’s, (10/3) × 0.014 = 0.047, so it takes 0.047. Reject below <i>q</i>: the same three as before.',
          source: 'Lecture W5, Part A, slide 13',
        },
        {
          type: 'question', id: 'corr-by', kind: 'choice',
          text: 'For the same ten p-values, Benjamini–Hochberg rejects 3, but Benjamini–Yekutieli rejects 1. Why fewer?',
          options: [
            'It works only for independent tests',
            'It allows any dependence between the tests, at a cost in power',
            'It controls the FWER instead of the FDR',
            'It uses a larger <i>q</i>',
          ],
          answer: 1,
          explain: 'BY divides the BH threshold by <i>c</i><sub><i>m</i></sub> = 1 + 1/2 + … + 1/<i>m</i>, about 2.9 for <i>m</i> = 10: valid whatever the dependence, but stricter.',
          source: 'Lecture W5, Part A, slide 15',
        },
      ],
    },
    {
      id: 'phist', label: 'The p-value histogram', week: 5,
      slides: [
        {
          type: 'recap', id: 'phist-recap', title: 'The p-value histogram', demo: 'pHistogram',
          points: [
            'Plot the p-values of all the tests. All nulls true: flat, uniform between 0 and 1. Some true effects: a peak near 0 on a flat background.',
            'The height of the flat part estimates the share of true nulls: the idea behind Storey’s q-value.',
            'A strange shape signals a problem: the wrong test, confounding or a batch effect.',
            'Virco, 47 positions of the HIV protease: 39 with P < 0.05, 35 below the Bonferroni threshold and 38 after BH. Many true effects, so the corrections remove few hits.',
          ],
          source: 'Lecture W5, Part A, slides 16–18',
        },
        {
          type: 'question', id: 'phist-null', kind: 'choice',
          text: 'All the nulls are true. What does the histogram of the p-values look like?',
          options: ['A peak near 0', 'A peak near 1', 'Bell-shaped, around 0.5', 'Flat: uniform between 0 and 1'],
          answer: 3,
          explain: 'Under the null, every p-value between 0 and 1 is equally likely: 5% fall below 0.05, 10% below 0.1, and so on.',
          source: 'Lecture W5, Part A, slide 17',
        },
        {
          type: 'question', id: 'phist-pi0', kind: 'choice',
          text: '1,000 tests. 400 of the p-values are between 0.5 and 1, in the flat part of the histogram. About how many of the nulls are true?',
          options: ['About 1,000', 'About 200', 'About 800', 'About 400'],
          answer: 2,
          explain: 'True nulls spread evenly from 0 to 1, so the 400 between 0.5 and 1 are about half of them: about 800 true nulls, and about 200 true effects. Storey’s q-value uses this estimate.',
          source: 'Lecture W5, Part A, slide 17',
        },
        {
          type: 'question', id: 'phist-virco', kind: 'choice',
          text: 'Virco: 47 tests, 39 with P < 0.05, and 38 still below 0.05 after Benjamini–Hochberg. Why did the correction remove so few?',
          options: [
            'Most of the nulls are false: many mutations really change resistance',
            'Benjamini–Hochberg doesn’t work with 47 tests',
            'The tests weren’t independent',
            'The p-values were adjusted twice',
          ],
          answer: 0,
          explain: 'With many true effects, most small p-values are real, and the histogram has a high peak near 0. In FAMuSS, with a flat histogram, the corrections leave nothing.',
          source: 'Lecture W5, Part A, slides 16 and 18',
        },
        {
          type: 'question', id: 'phist-shape', kind: 'choice',
          text: 'A histogram of p-values has a peak near 1 as well as near 0. What does that suggest?',
          options: [
            'Many true effects, near 0 and near 1',
            'All the nulls are true, as expected',
            'Too few tests to give a flat histogram',
            'A problem: the wrong test, confounding or a batch effect',
          ],
          answer: 3,
          explain: 'With all nulls true the histogram is flat, and true effects add a peak near 0. Any other shape is a warning: check the test, the model and the design.',
          source: 'Lecture W5, Part A, slide 17',
        },
      ],
    },
    {
      id: 'scan', label: 'Scanning FAMuSS', week: 5,
      slides: [
        {
          type: 'recap', id: 'scan-recap', title: 'A scan of every SNP in FAMuSS', demo: 'famussScan',
          points: [
            'Trait: NDRM.CH, the percentage change in the strength of the non-dominant arm after training, in 1,011 volunteers. Quality control kept 78 of the 227 SNP columns.',
            'For each SNP, a regression of NDRM.CH on the number of minor alleles: 3 p-values below 0.05, where 78 × 0.05 = 3.9 are expected by chance.',
            'The smallest, vdr_rs731236: 3.4 percentage points per minor allele, P = 0.026. Below Bonferroni’s 6.4 × 10<sup>−4</sup>: none. The smallest BH-adjusted p-value: 0.66.',
            'Power at α = 0.05/78, about 505 per group: 8.8 points (0.27 SD) with 80% power. No large effect exists; a small one could have been missed.',
          ],
          source: 'Lecture W5, Part A, slides 19–27',
        },
        {
          type: 'question', id: 'scan-qc', kind: 'choice',
          text: 'Quality control kept 78 of the 227 SNP columns. Which step removed the most?',
          options: [
            'More than two alleles',
            'A call rate below 80%',
            'A minor allele frequency below 1%',
            'A departure from Hardy–Weinberg equilibrium',
          ],
          answer: 1,
          explain: '212 columns were biallelic, and 133 of those had a call rate below 80%, most between 50% and 60%: they were genotyped in only about half of the volunteers. Drop SNPs and individuals before the scan, and report how many.',
          source: 'Lecture W5, Part A, slide 20',
        },
        {
          type: 'question', id: 'scan-expected', kind: 'number',
          text: '78 SNPs, none truly associated, each tested at 0.05. How many p-values below 0.05 do you expect?',
          min: 0, max: 20, step: 0.1, answer: 3.9,
          explain: '78 × 0.05 = 3.9. The scan found 3: no more than chance would give.',
          source: 'Lecture W5, Part A, slide 21',
        },
        {
          type: 'question', id: 'scan-best', kind: 'choice',
          text: 'vdr_rs731236 has the smallest p-value of the 78: P = 0.026. After correcting for 78 tests, is it a discovery?',
          options: [
            'Yes after Benjamini–Hochberg, but not after Bonferroni',
            'No, and it proves the SNP has no effect',
            'No: with 78 tests, a p-value this small is expected by chance',
            'Yes, because 0.026 is below 0.05',
          ],
          answer: 2,
          explain: 'Bonferroni needs 6.4 × 10<sup>−4</sup>, and its BH-adjusted p-value is 0.66. The honest conclusion: no SNP in this panel is associated with the change in strength at this sample size.',
          source: 'Lecture W5, Part A, slide 23',
        },
        {
          type: 'question', id: 'scan-power', kind: 'choice',
          text: 'At α = 0.05/78, the scan could detect a difference of 8.8 percentage points with 80% power. The best SNP’s effect was 3.4 points per allele. So the null result means that…',
          options: [
            '…no large effect exists, but a small one could have been missed',
            '…no SNP in the panel has any effect',
            '…the scan was done wrongly',
            '…the SNPs should have been tested at 0.05',
          ],
          answer: 0,
          explain: 'Absence of evidence is not evidence of absence. Even at α = 0.05, the detectable difference was 5.8 points: still above 3.4.',
          source: 'Lecture W5, Part A, slides 24–25',
        },
        {
          type: 'question', id: 'scan-n', kind: 'number',
          text: 'A difference of 0.5 SD with 80% power needs about 64 per group at α = 0.05. About how many per group at α = 0.05/78?',
          min: 0, max: 400, step: 1, answer: 148,
          explain: '<code>power.t.test(delta = 0.5, sd = 1, power = 0.8, sig.level = 0.05 / 78)</code> gives about 148. GWAS effects are usually far smaller than 0.5 SD: hence samples of tens or hundreds of thousands.',
          source: 'Lecture W5, Part A, slide 27',
        },
        {
          type: 'question', id: 'scan-qrp', kind: 'choice',
          text: 'A paper reports “vdr_rs731236 is associated with strength gain (P = 0.026)”, and doesn’t say that 78 SNPs were tested. What is wrong?',
          options: [
            'Nothing: 0.026 is below 0.05',
            'The test should have been one-sided',
            'It should have given the BY-adjusted p-value instead',
            'It hides how many tests this was the best of',
          ],
          answer: 3,
          explain: 'Reporting only the best of many tests is a questionable research practice. Shuffle the trait so that no SNP can be associated, and test 50 SNPs: at least one has P < 0.05 in 89% of the shuffles. Report all the tests, the correction and their number (week 6).',
          source: 'Lecture W5, Part A, slide 26',
        },
      ],
    },
    {
      id: 'ld', label: 'Linkage disequilibrium', week: 5,
      slides: [
        {
          type: 'recap', id: 'ld-recap', title: 'Linkage disequilibrium', demo: 'ldDemo',
          points: [
            'Alleles at nearby SNPs are inherited together. D = <i>p</i><sub>AB</sub> − <i>p</i><sub>A</sub><i>p</i><sub>B</sub>: the frequency of a haplotype minus its frequency if the alleles were independent.',
            '<i>r</i>²: the squared correlation between the allele counts, 0 for independent SNPs and 1 for perfect LD.',
            'FAMuSS: <i>r</i>² of 0.86 to 0.93 between three ACTN3 SNPs, and blocks of correlated SNPs in AKT1. Tests of SNPs in LD aren’t independent, and a hit may only tag the causal SNP nearby.',
            'About a million independent regions of common variation: 0.05/10<sup>6</sup> = 5 × 10<sup>−8</sup>, the genome-wide threshold. A hit still needs replication.',
          ],
          source: 'Lecture W5, Part A, slides 28–32',
        },
        {
          type: 'question', id: 'ld-d', kind: 'choice',
          text: 'Two SNPs, with <i>p</i><sub>A</sub> = 0.6 and <i>p</i><sub>B</sub> = 0.7. The haplotype AB has frequency 0.5. What is D?',
          options: ['−0.1', '0.08', '0.42', '0.5'],
          answer: 1,
          explain: 'D = <i>p</i><sub>AB</sub> − <i>p</i><sub>A</sub><i>p</i><sub>B</sub> = 0.5 − 0.6 × 0.7 = 0.5 − 0.42 = 0.08: AB is more common than if the alleles were independent.',
          source: 'Lecture W5, Part A, slide 28',
        },
        {
          type: 'question', id: 'ld-actn3', kind: 'choice',
          text: 'actn3_rs540874 and actn3_rs1815739 have <i>r</i>² = 0.93. What does that mean for their two tests?',
          options: [
            'One of them should have failed quality control',
            'Their effects must have opposite signs',
            'They carry almost the same information',
            'They are independent tests',
          ],
          answer: 2,
          explain: 'With <i>r</i>² near 1, one SNP’s allele counts almost give the other’s, so their p-values tend to be small together: three ACTN3 tests count as barely more than one. So Bonferroni over 78 SNPs is conservative.',
          source: 'Lecture W5, Part A, slides 29–30',
        },
        {
          type: 'question', id: 'ld-tag', kind: 'choice',
          text: 'A SNP is associated with a trait, and it is in strong LD with several SNPs nearby. Is it the causal variant?',
          options: [
            'Yes: the associated SNP is always the causal one',
            'No: a SNP in LD can’t be causal',
            'Yes, if its p-value is below 5 × 10<sup>−8</sup>',
            'Not necessarily: it may only tag the causal variant nearby',
          ],
          answer: 3,
          explain: 'An association shows that the region matters, not which variant in it. Finding the causal one is fine mapping, beyond this course.',
          source: 'Lecture W5, Part A, slides 29 and 43',
        },
        {
          type: 'question', id: 'ld-gws', kind: 'choice',
          text: 'Where does the genome-wide threshold, 5 × 10<sup>−8</sup>, come from?',
          options: [
            'Bonferroni for about a million independent tests: 0.05/10<sup>6</sup>',
            'Bonferroni for every SNP on a genotyping chip',
            'An FDR of 5%',
            'The p-value of the strongest known association',
          ],
          answer: 0,
          explain: 'Millions of SNPs, but, because of LD, about a million independent regions of common variation: 0.05/10<sup>6</sup> = 5 × 10<sup>−8</sup>. A hit still needs replication in an independent sample.',
          source: 'Lecture W5, Part A, slide 32',
        },
      ],
    },
    {
      id: 'gwasplots', label: 'Manhattan and QQ plots', week: 5,
      slides: [
        {
          type: 'recap', id: 'plots-recap', title: 'Reading Manhattan and QQ plots', demo: 'gwasPlots',
          points: [
            '<b>Manhattan plot</b>: each point a SNP, along the genome, at a height of −log<sub>10</sub>(<i>p</i>). The line at 5 × 10<sup>−8</sup> is a height of 7.3. Peaks rise together because of LD.',
            '<b>QQ plot</b>: the observed −log<sub>10</sub>(<i>p</i>) against the values expected if no SNP is associated. On the diagonal: chance. Leaving it at the end: true associations. Above it from the start: inflation.',
            '<b>Genomic inflation factor</b> λ: the median observed χ² divided by 0.455, the median expected. λ ≈ 1: no inflation. Above 1.05 to 1.1: investigate.',
          ],
          source: 'Lecture W5, Part A, slides 33–36',
        },
        {
          type: 'question', id: 'plots-height', kind: 'choice',
          text: 'A SNP is at a height of 8 in a Manhattan plot. What is its p-value?',
          options: ['1/8', '10<sup>−8</sup>', '0.08', '8 × 10<sup>−8</sup>'],
          answer: 1,
          explain: 'The height is −log<sub>10</sub>(<i>p</i>), so 8 means <i>p</i> = 10<sup>−8</sup>: below 5 × 10<sup>−8</sup>, a height of 7.3, so genome-wide significant.',
          source: 'Lecture W5, Part A, slide 33',
        },
        {
          type: 'question', id: 'plots-qq', kind: 'choice',
          text: 'Which QQ plot suggests confounding, for example by ancestry?',
          options: [
            'Points on the diagonal that rise above it only at the end',
            'Points below the diagonal at the end',
            'Points above the diagonal from the start',
            'Points on the diagonal',
          ],
          answer: 2,
          explain: 'Inflation from the start: most tests are pushed up, as when ancestry relates to both the genotypes and the trait. A few points rising only at the end suggest true associations.',
          source: 'Lecture W5, Part A, slides 35–36',
        },
        {
          type: 'question', id: 'plots-lambda', kind: 'number',
          text: 'The median of the observed χ² statistics is 0.68. What is λ?',
          min: 0.5, max: 2.5, step: 0.01, answer: 1.49,
          explain: '0.68/0.455 = 1.49, as in the unadjusted FAMuSS scan: investigate. With only 78 SNPs, λ is a noisy estimate.',
          source: 'Lecture W5, Part A, slides 35 and 40',
        },
      ],
    },
    {
      id: 'ancestry', label: 'Population structure', week: 5,
      slides: [
        {
          type: 'recap', id: 'anc-recap', title: 'Ancestry, principal components and adjustment', demo: 'pcaAncestry',
          points: [
            'Ancestries differ in allele frequencies at many SNPs. If ancestry also relates to the trait, SNPs show spurious associations: confounding by ancestry.',
            'PCA sums up the genotypes in a few axes: PC1 the direction of largest variation, PC2 the next, uncorrelated with PC1. FAMuSS: mean PC1 −0.7 in Caucasian, 1.6 in African American and 4.1 in Asian volunteers.',
            'Adjust each SNP’s regression for the first PCs: NDRM.CH ~ SNP + PC1 + PC2 + PC3 + Gender + Age. λ fell from 1.49 to 1.02.',
            'After adjustment, the smallest p-value is 0.0056 (akt1_t10726c_t12868c) and the smallest BH-adjusted 0.29: still no evidence of an association.',
          ],
          source: 'Lecture W5, Part A, slides 37–41',
        },
        {
          type: 'question', id: 'anc-confound', kind: 'choice',
          text: 'How can ancestry produce a false association between a SNP and a trait?',
          options: [
            'Allele frequencies and the trait both differ between ancestries',
            'Ancestry lowers the call rate of some SNPs',
            'SNPs are in LD within each ancestry',
            'Some volunteers report their race wrongly',
          ],
          answer: 0,
          explain: 'Ancestry is then a confounder, related to both the SNP and the trait, as in week 4. The PCs of the genotypes carry finer information on ancestry than self-reported race.',
          source: 'Lecture W5, Part A, slide 37',
        },
        {
          type: 'question', id: 'anc-model', kind: 'choice',
          text: 'How do you adjust each SNP’s test for ancestry?',
          options: [
            'Test each ancestry group separately, and keep the smallest p-value',
            'Remove the SNPs whose allele frequencies differ between ancestries',
            'Multiply each p-value by λ',
            'Add the first principal components as covariates',
          ],
          answer: 3,
          explain: 'Trait ~ SNP + PC1 + PC2 + PC3 + Gender + Age: the SNP’s coefficient then compares individuals of similar ancestry, as in EIGENSTRAT. Genomic control divides the test statistics by λ; mixed models use a genetic relatedness matrix.',
          source: 'Lecture W5, Part A, slide 39',
        },
        {
          type: 'question', id: 'anc-genome', kind: 'choice',
          text: 'Why run the PCA on SNPs from across the genome, rather than on one gene?',
          options: [
            'A PCA must use exactly one SNP from each chromosome',
            'Ancestry shows across the genome; one gene’s SNPs separate ancestries only partly',
            'One gene has too few SNPs for a PCA to run',
            'The SNPs of one gene are independent of each other',
          ],
          answer: 1,
          explain: 'In the practical, 4 SNPs of one gene (HGDP) separate the populations only partly. The more of the genome the PCA covers, the better its axes reflect ancestry rather than one region.',
          source: 'Lecture W5, Part A, slide 39; Part B, slide 5',
        },
        {
          type: 'question', id: 'anc-result', kind: 'choice',
          text: 'After adjusting: smallest P = 0.0056, Bonferroni threshold 6.4 × 10<sup>−4</sup>, smallest BH-adjusted p-value 0.29. What do you report?',
          options: [
            'The adjustment created a new association',
            'Nothing: a null result isn’t worth reporting',
            'No evidence of an association, with the correction and λ',
            'akt1_t10726c_t12868c is associated with strength gain',
          ],
          answer: 2,
          explain: 'The conclusion is the same as before adjusting. A good analysis can end with a null result, reported honestly: with its power, it says how large an effect could still exist.',
          source: 'Lecture W5, Part A, slide 41',
        },
      ],
    },
    {
      id: 'minigwas', label: 'A mini-GWAS', week: 5,
      slides: [
        {
          type: 'recap', id: 'gwas-recap', title: 'A checklist for a mini-GWAS', demo: 'gwasWriteup',
          points: [
            'Quality control: call rate, minor allele frequency and Hardy–Weinberg, and report the SNPs kept. Ancestry: PCA, adjust for the first components, and report λ.',
            'Test: one regression per SNP, with the right trait model and covariates. Multiplicity: state the correction and the number of tests.',
            'Plots: the p-value histogram, the QQ plot and the Manhattan plot. Hits: check the LD around them and look for replication. Report all the tests, not only the best one.',
            'Beyond this course: cohort and case-control designs, mixed models and fine mapping (Uffelmann and others, 2021; Marees and others, 2018).',
          ],
          source: 'Lecture W5, Part A, slides 42–43; Part B',
        },
        {
          type: 'question', id: 'gwas-first', kind: 'choice',
          text: 'What comes first in a mini-GWAS?',
          options: [
            'The Manhattan plot',
            'The Benjamini–Hochberg correction',
            'Checking the LD around the hits',
            'Quality control of the SNPs and the individuals',
          ],
          answer: 3,
          explain: 'Drop SNPs and individuals before the scan, and report how many. Then ancestry, the tests, the correction, the plots and the hits.',
          source: 'Lecture W5, Part A, slides 20 and 42',
        },
        {
          type: 'question', id: 'gwas-honest', kind: 'choice',
          text: 'Which sentence reports the FAMuSS scan best?',
          options: [
            '“Of 78 SNPs that passed quality control, none was associated with strength gain after adjusting for 3 PCs, gender and age (λ = 1.02; Bonferroni threshold 6.4 × 10<sup>−4</sup>; smallest P = 0.0056).”',
            '“akt1_t10726c_t12868c was associated with strength gain (P = 0.0056).”',
            '“No SNP affects strength gain.”',
            '“Three of 78 SNPs were associated with strength gain: vdr_rs731236 (P = 0.026), fbox32_rs3739287 (P = 0.041) and gnb3_rs5443 (P = 0.047).”',
          ],
          answer: 0,
          explain: 'It gives the number of tests, the adjustment, λ and the correction, and doesn’t overclaim. Three of 78 below 0.05 is what chance gives, and “No SNP affects strength gain” ignores power: this scan could detect only large effects.',
          source: 'Lecture W5, Part A, slides 41–42',
        },
        {
          type: 'question', id: 'gwas-design', kind: 'choice',
          text: 'A cohort study follows people forward from an exposure. Which design compares cases and controls, looking back?',
          options: ['A randomised trial', 'A case-control study', 'A cohort study', 'A GWAS of a quantitative trait'],
          answer: 1,
          explain: 'The design decides which measure applies, risk or odds ratio, and which biases. Study designs are beyond this course: see the extension pack.',
          source: 'Lecture W5, Part A, slide 43',
        },
      ],
    },
    {
      id: 'end', label: 'Wrap-up', week: 0,
      slides: [
        {
          type: 'question', id: 'conf-end', ...confidence, compareWith: 'conf-start',
          text: 'And now: how confident do you feel about correcting for many tests and reading a GWAS?',
        },
        {
          type: 'question', id: 'unclear', kind: 'text',
          text: 'What from the recap would you like to go over again?',
        },
        { type: 'end', id: 'end', title: 'Next: research integrity', text: 'Week 6: research integrity, data fallacies and delivering the brief.' },
      ],
    },
  ],
};

// Every deck, by id. The weekly recap is the default; ?deck=trains opens the trains exercise.
export const DECKS = { gm2: GM2_DECK, trains: TRAINS_DECK };
const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('deck') : null;
export const DECK_ID = asked && DECKS[asked] ? asked : 'gm2';
export const DECK = DECKS[DECK_ID];

/** The id of the deck that has slide `id` (phones use it to follow the presenter to another deck). */
export function deckWith(id) {
  return Object.keys(DECKS).find((k) => DECKS[k].sections.some((sec) => sec.slides.some((s) => s.id === id))) || null;
}

/** The address of this page with another deck. */
export function deckHref(id) {
  const u = new URL(location.href);
  if (id === 'gm2') u.searchParams.delete('deck'); else u.searchParams.set('deck', id);
  return u.href;
}

// Every slide in order, with its section.
export const SLIDES = DECK.sections.flatMap((sec) => sec.slides.map((s) => ({ ...s, section: sec.id })));

// The number of each question, counted through the deck.
let qn = 0;
for (const s of SLIDES) if (s.type === 'question') s.number = ++qn;

export const byId = Object.fromEntries(SLIDES.map((s) => [s.id, s]));
