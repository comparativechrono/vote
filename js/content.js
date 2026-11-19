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

const confidence = {
  kind: 'scale',
  labels: ['Not at all', 'A little', 'Somewhat', 'Fairly', 'Very'],
};

export const DECK = {
  title: 'Weeks 2 and 3, recapped',
  subtitle: 'Describing data, uncertainty and hypothesis tests, from Leonardo’s lectures',
  course: 'GM2 Research and Statistical Skills',
  when: 'Week 4',
  sections: [
    {
      id: 'start', label: 'Start', week: 0,
      slides: [
        { type: 'title', id: 'join' },
        {
          type: 'question', id: 'conf-start', ...confidence,
          text: 'How confident do you feel about choosing a statistical test and reading its result?',
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
          options: ['Two-sample t-test', 'ANOVA', 'Chi-square test', 'Regression, which is next week'],
          answer: 3,
          explain: 'A continuous outcome and a continuous predictor: regression, which unifies the tests of this week.',
          source: 'Lecture W3, Part A, slide 46',
        },
      ],
    },
    {
      id: 'end', label: 'Wrap-up', week: 0,
      slides: [
        {
          type: 'question', id: 'conf-end', ...confidence, compareWith: 'conf-start',
          text: 'And now: how confident do you feel about choosing a statistical test and reading its result?',
        },
        {
          type: 'question', id: 'unclear', kind: 'text',
          text: 'What from weeks 2 and 3 would you like to go over again?',
        },
        { type: 'end', id: 'end', title: 'Next: regression', text: 'Week 4: regression unifies the tests of this week.' },
      ],
    },
  ],
};

// Every slide in order, with its section.
export const SLIDES = DECK.sections.flatMap((sec) => sec.slides.map((s) => ({ ...s, section: sec.id })));

// The number of each question, counted through the deck.
let qn = 0;
for (const s of SLIDES) if (s.type === 'question') s.number = ++qn;

export const byId = Object.fromEntries(SLIDES.map((s) => [s.id, s]));
