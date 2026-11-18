# Third-party material

## Fonts: Recap Sans and Recap Mono

`fonts/RecapSans-*.woff2` and `fonts/RecapMono-Regular.woff2` are subsets of **IBM Plex Sans** and **IBM Plex Mono**, Copyright © 2017 IBM Corp., licensed under the SIL Open Font License 1.1 ([`fonts/OFL.txt`](fonts/OFL.txt)). They keep only the characters these pages use, and are renamed because the licence reserves the name “Plex” for the original fonts. `dev/subset-fonts.py` rebuilds them from the `@ibm/plex-sans` and `@ibm/plex-mono` packages.

## QR codes: qrcode-generator 2.0.4

`js/vendor/qrcode.mjs` is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase, Copyright © 2009, under the MIT licence, unchanged; its licence notice is at the top of the file. “QR Code” is a registered trademark of DENSO WAVE INCORPORATED.

## Figures

The numbers in the recap come from Dr Leonardo Bottolo’s GM2 lectures of weeks 2 and 3 (University of Cambridge, 2026), which use the `birthwt` data (R package MASS), the ALL data (Bioconductor) and the FAMuSS data.
