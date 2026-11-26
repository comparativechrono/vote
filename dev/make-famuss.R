# Builds js/data/famuss.js: the numbers behind the week 5 graphs, derived from the FAMuSS and
# Virco data that Leonardo's lecture W5 uses. The raw data are not in this repository; they come
# with Foulkes (2009), Applied Statistical Genetics with R (www.stat-gen.org):
#   Rscript dev/make-famuss.R path/to/FMS_data.txt path/to/Virco_data.csv
# It reproduces the lecture: 78 SNPs after quality control, P = 0.026 for vdr_rs731236, lambda 1.49
# and 1.02, PC1 6.6% and PC2 5.8%, and 47 Virco tests with 39, 35 and 38 hits.

args <- commandArgs(trailingOnly = TRUE)
fms <- read.delim(args[1], header = TRUE, stringsAsFactors = FALSE)
virco <- read.csv(args[2], stringsAsFactors = FALSE)

# ---- quality control, as in the lecture: biallelic, call rate >= 80%, minor allele frequency >= 1%
nm <- names(fms)
snps <- nm[2:(which(nm == "Status") - 1)]
pairs <- function(x) {
  x[is.na(x) | x %in% c("", "Und", "NN", "XX", "xx")] <- NA
  out <- matrix(NA_character_, length(x), 2)
  ok <- !is.na(x)
  sp <- if (any(grepl(", ", x[ok]))) NULL                                  # b2b: not read as biallelic
        else if (all(nchar(x[ok]) == 4)) lapply(x[ok], function(z) c(substr(z, 1, 2), substr(z, 3, 4)))
        else strsplit(x[ok], "")
  if (!is.null(sp)) out[ok, ] <- do.call(rbind, lapply(sp, function(z) if (length(z) == 2) z else c(NA, NA)))
  out
}
P <- lapply(fms[snps], pairs)
bi <- snps[sapply(P, function(m) length(unique(na.omit(c(m))))) == 2]
keep <- bi[sapply(P[bi], function(m) mean(!is.na(m[, 1]))) >= 0.8]
G <- sapply(keep, function(s) {
  m <- P[[s]]; al <- sort(unique(na.omit(c(m))))
  c1 <- rowSums(m == al[1]); if (mean(c1, na.rm = TRUE) / 2 <= 0.5) c1 else 2 - c1   # copies of the minor allele
})
G <- G[, colMeans(G, na.rm = TRUE) / 2 >= 0.01]
stopifnot(ncol(G) == 78)

# ---- the scan, then the PCA and the scan adjusted for ancestry
y <- fms$NDRM.CH
fit <- function(s, adj) {
  f <- if (adj) lm(y ~ G[, s] + X[, 1] + X[, 2] + X[, 3] + fms$Gender + fms$Age) else lm(y ~ G[, s])
  summary(f)$coefficients[2, c(1, 2, 4)]
}
X <- NULL
crude <- t(sapply(colnames(G), fit, adj = FALSE))
Gi <- apply(G, 2, function(x) { x[is.na(x)] <- mean(x, na.rm = TRUE); x })
pc <- prcomp(Gi, center = TRUE, scale. = TRUE)
X <- pc$x[, 1:3]
adjusted <- t(sapply(colnames(G), fit, adj = TRUE))
ve <- pc$sdev^2 / sum(pc$sdev^2)
lam <- function(p) median(qchisq(p, 1, lower.tail = FALSE)) / qchisq(0.5, 1)
cat("lambda", lam(crude[, 3]), lam(adjusted[, 3]), "PC1", ve[1], "PC2", ve[2], "\n")

# ---- linkage disequilibrium: r squared between allele counts
r2 <- function(s) round(cor(G[, s], use = "pairwise.complete.obs")^2, 2)
akt1 <- grep("^akt1", colnames(G), value = TRUE)
actn3 <- c("actn3_rs540874", "actn3_rs1815739", "actn3_1671064")

# ---- Virco: log10 fold-resistance to indinavir, mutated against not, at 47 positions
yv <- log10(as.numeric(virco$IDV.Fold))
vp <- c(); vn <- c()
for (p in paste0("P", 1:99)) {
  x <- virco[[p]]; mut <- ifelse(x == ".", NA, x != "-")
  if (sum(mut, na.rm = TRUE) < 50) next
  ok <- !is.na(mut) & !is.na(yv)
  vp <- c(vp, t.test(yv[ok & mut], yv[ok & !mut])$p.value); vn <- c(vn, p)
}
stopifnot(length(vp) == 47)

# ---- write the module
races <- c("Caucasian", "African Am", "Asian", "Hispanic", "Other", "Am Indian")
js <- function(x, d = NULL) paste0("[", paste(if (is.character(x)) paste0('"', x, '"') else if (is.null(d)) x else formatC(x, digits = d, format = "fg"), collapse = ", "), "]")
sig <- function(x) signif(x, 4)
mat <- function(m) paste0("[", paste(apply(m, 1, function(r) js(r)), collapse = ", "), "]")
lines <- c(
  "// Numbers behind the week 5 graphs, derived from the FAMuSS and Virco data of lecture W5.",
  "// Made by dev/make-famuss.R; the raw data are not in this repository (see THIRD_PARTY.md).",
  "",
  "export const FAMUSS = {",
  "  // the 78 SNPs that pass quality control, in file order, and NDRM.CH ~ SNP",
  paste0("  snps: ", js(colnames(G)), ","),
  paste0("  beta: ", js(sig(crude[, 1])), ","),
  paste0("  se: ", js(sig(crude[, 2])), ","),
  paste0("  p: ", js(sig(crude[, 3])), ","),
  "  // NDRM.CH ~ SNP + PC1 + PC2 + PC3 + Gender + Age",
  paste0("  betaAdj: ", js(sig(adjusted[, 1])), ","),
  paste0("  pAdj: ", js(sig(adjusted[, 3])), ","),
  "  // principal components of the 78 SNPs for the 1,397 volunteers, and their self-reported race",
  paste0("  pcVar: ", js(round(ve[1:3], 4)), ","),
  paste0("  races: ", js(races), ","),
  paste0("  race: ", js(ifelse(is.na(fms$Race), -1, match(fms$Race, races) - 1)), ","),
  paste0("  pc1: ", js(round(pc$x[, 1], 2)), ","),
  paste0("  pc2: ", js(round(pc$x[, 2], 2)), ","),
  "  // r squared between allele counts",
  paste0("  akt1: { snps: ", js(akt1), ", r2: ", mat(r2(akt1)), " },"),
  paste0("  actn3: { snps: ", js(actn3), ", r2: ", mat(r2(actn3)), " },"),
  "  // Virco: indinavir resistance, mutated against not, Welch t-tests",
  paste0("  virco: { positions: ", js(vn), ", p: ", js(sig(vp)), " },"),
  "};")
writeLines(lines, "js/data/famuss.js")
cat("written js/data/famuss.js\n")
