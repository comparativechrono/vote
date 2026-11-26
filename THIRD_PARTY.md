# Third-party material

## Fonts: Recap Sans and Recap Mono

`fonts/RecapSans-*.woff2` and `fonts/RecapMono-Regular.woff2` are subsets of **IBM Plex Sans** and **IBM Plex Mono**, Copyright © 2017 IBM Corp., licensed under the SIL Open Font License 1.1 ([`fonts/OFL.txt`](fonts/OFL.txt)). They keep only the characters these pages use, and are renamed because the licence reserves the name “Plex” for the original fonts. `dev/subset-fonts.py` rebuilds them from the `@ibm/plex-sans` and `@ibm/plex-mono` packages.

## QR codes: qrcode-generator 2.0.4

`js/vendor/qrcode.mjs` is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase, Copyright © 2009, under the MIT licence, unchanged; its licence notice is at the top of the file. “QR Code” is a registered trademark of DENSO WAVE INCORPORATED.

## Data

`js/data/birthwt.js` holds the `birthwt` data of the R package MASS (Venables and Ripley, GPL-2 or GPL-3): 189 births at Baystate Medical Center, Springfield, Massachusetts, in 1986, from Hosmer and Lemeshow (1989), *Applied Logistic Regression*. The copy was taken from the Rdatasets collection (github.com/vincentarelbundock/Rdatasets).

`js/data/famuss.js` holds numbers derived from two datasets that lecture W5 uses, as distributed with Foulkes (2009), *Applied Statistical Genetics with R* (Springer): the FAMuSS study of muscle size and strength (Thompson and others, 2004), and the Virco HIV-1 protease data of the Stanford HIV Drug Resistance Database. It keeps each SNP’s regression results, two principal components per volunteer with their self-reported race, linkage disequilibrium between some SNPs, and the Virco tests’ p-values; no genotypes. `dev/make-famuss.R` makes it from the original files, which are not in this repository.

## Figures

The numbers in the recap come from Dr Leonardo Bottolo’s GM2 lectures (University of Cambridge, 2026), which use the `birthwt` data, the ALL data (Bioconductor) and the FAMuSS data.
