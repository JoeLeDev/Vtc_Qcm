# Rapport d'intégrité — extraction des annales VTC

**Date :** 2026-10-13  
**Sources PDF :** `Annales Examen Taxi VTC 2021.pdf`, `Annales Examen Taxi VTC 2022.pdf`  
**Banque :** `src/data/questions/all.json` (générée par `npm run extract:annales`)  
**Correctifs structurels :** `src/data/questions/extraction-patches.json` (23 patches)  
**Aliases :** `src/data/questions/id-aliases.json`

## Verdict

| Indicateur | Valeur |
|------------|--------|
| Questions attendues (marqueurs PDF « point / Question ») | **293** |
| Questions extraites | **293** |
| Couverture numérique (présence Qn) | **100 %** |
| Intégrité globale déclarée | **Non — ~96 %** (incertitudes restantes, voir ci-dessous) |

La couverture « 100 % » désigne uniquement le **dénombrement** matière × année × numéros. Elle ne signifie pas une intégrité sémantique totale (illustrations, ambiguïtés de type).

## Comptages attendus vs extraits

| Année | Matière | Attendu | Extrait | Manquantes | Doublons de numéro |
|-------|---------|---------|---------|------------|--------------------|
| 2021 | A | 15 | 15 | — | — |
| 2021 | B | 18 | 18 | — | — |
| 2021 | C | 20 | 20 | — | — |
| 2021 | D | 10 | 10 | — | — |
| 2021 | E | 20 | 20 | — | — |
| 2021 | FV | 16 | 16 | — | — |
| 2021 | GV | 8 | 8 | — | — |
| 2021 | GT | 15 | 15 | — | — |
| 2021 | FM | 16 | 16 | — | — |
| 2021 | GM | 8 | 8 | — | — |
| 2022 | A | 15 | 15 | — | — |
| 2022 | B | 18 | 18 | — | — |
| 2022 | C | 20 | 20 | — | — |
| 2022 | D | 10 | 10 | — | — |
| 2022 | E | 20 | 20 | — | — |
| 2022 | FV | 16 | 16 | — | — |
| 2022 | GV | 8 | 8 | — | — |
| 2022 | GT | 16 | 16 | — | — |
| 2022 | FM | 16 | 16 | — | — |
| 2022 | GM | 8 | 8 | — | — |
| **Total** | | **293** | **293** | **0** | **0** |

Répartition types : single 229 · multiple 12 · open 52 (toutes les QRC ont une `openReferenceAnswer` → `needs_review`).  
Aucun statut `verified` n’a été modifié. Aucune réponse QCM fictive n’a été inventée.

## Questions manquantes

Aucune (après correctif d’extraction du titre d’examen / date capturés comme numéro de question).

## Questions corrigées (Phase 5C)

### Cause systémique

L’extracteur capturait le **jour du mois** du titre Evalbox (`27 octobre…` / `25 octobre…`) comme numéro de question dès que le `n°` d’examen était retiré. Les Q1 devenaient absentes ; le contenu Q1 vivait sous `number: 27` (ou 25).

### Correctifs extracteur (`scripts/extract-annales.ts`)

- Neutralisation des en-têtes `Examen: n°… "…"` et des lignes de titre datées (sans effacer les dates dans le corps des questions, ex. « né le 12 mai 1950 »).
- Filet `isSpuriousQuestionNumber` + récupération vers Q1.
- `cleanStemArtifacts` enrichi pour les résidus de titre.
- Types QCM : pluriels (`Quels` / `Quelles`) et formulations « la ou lesquelles » → `multiple` (jamais déduit du nombre de suggestions).
- Propositions numériques d’un caractère (`2`, `3`) ne sont plus signalées comme fragmentées.

### Correctifs données (patches + aliases)

| Cible | Correction | ID canonique |
|-------|------------|--------------|
| B 2021 Q1 | Restaurée (absente) | `2021-B-q01-f4004dbb` |
| C 2021 Q1 | Restaurée (absente) | `2021-C-q01-a8bb3e17` |
| C 2021 Q4 | Type `multiple` (énoncé « Quelles sont… ») | `2021-C-q04-3f61e04a` |
| A 2021 Q1 | Correctif antérieur conservé | `2021-A-q01-6f0023fa` (`multiple`) |
| A 2022 Q1 | Correctif antérieur conservé | `2022-A-q01-34dc9cf1` (`single`) |
| Toutes les Q1 2021/2022 | Patches + `legacyIds` (anciens IDs `q{n°examen}`) | voir `id-aliases.json` |

Les overlays (`src/data/corrections/overlays.json`) et suggestions seed ne sont **pas** écrasés par l’extraction. Les lots A-01/A-02/B-01/C-01 référencent les IDs canoniques stables.

## Ambiguïtés de type — vérification manuelle requise

Evalbox libelle presque tous les QCM « Question à choix multiple » sans distinguer une / plusieurs bonnes réponses. La banque s’appuie sur la **formulation de l’énoncé**, pas sur le nombre de propositions dans les lots de suggestions.

| Question | Type banque | Motif | Note |
|----------|-------------|-------|------|
| C 2021 Q2 | `single` | Pas d’interrogatif pluriel | Lot C-01 propose B+C — barème multi possible ; **ne pas** forcer `multiple` sans consigne PDF |
| C 2021 Q4 | `multiple` | « Quelles sont… » | Aligné PDF ; 2 réponses suggérées (C+D) cohérentes |
| C 2021 Q5 | `single` | Formulation affirmative | Lot C-01 propose A+D — vérification barème humain |
| C 2021 Q11 | `single` | Une distance attendue | Suggestion unique C ; OK |

## Anomalies illustrations (mises à jour Phase 5D)

| Fichier | Contenu réel | Association corrigée |
|---------|--------------|----------------------|
| `2021-p8.png` | Panneau A1a cassis/dos-d'âne | → **C 2021 Q20** (plus les questions D) |
| `2021-p9.png` | Article 20 Minutes Cybertruck | → **D 2021 Q1–Q10** |
| `2022-p8.png` | Pictogramme pollution « NIVEAU 3 » | **Orphelin** (dissocié de C 2022 Q18–20) |

| Manquantes | Détail |
|------------|--------|
| E 2021 Q1 | Bâtiment historique — non extrait |
| C 2022 Q17 | Pictogramme médicaments — non extrait |
| Autres panneaux / photos Evalbox | Non récupérés par `pdf-parse` (3 images seulement) |

L’extracteur **n’associe plus** automatiquement une image de page à toutes les questions : les liens passent par `extraction-patches.json` (reproductible).

## Doublons inter-années

11 énoncés quasi-identiques entre 2021 et 2022 (marqués `duplicateOf`, originaux conservés). Pas de perte : les deux années restent en banque.

## Propositions / QRC

- Aucune proposition vide après correction du faux positif numérique FM.
- FM 2021 Q5 / FM 2022 Q1 : propositions `2` / `3` / `4` — **valides** (PDF).
- 52/52 QRC avec `Indication/Right answer` → `needs_review`.

## Reproductibilité

1. `npm run extract:annales` (deux exécutions successives → même `all.json` hors horodatage du rapport).
2. Patches réappliqués à chaque run ; overlays / suggestions utilisateur intacts.
3. Tests de non-régression : `src/data/questions/annales-integrity.test.ts`.

## Taux de couverture réel (intégrité)

| Couche | Taux | Commentaire |
|--------|------|-------------|
| Présence des questions | 100 % (293/293) | |
| Stems Q1 + aliases | 100 % | Correctifs confirmés PDF |
| Types pluriels explicites | 100 % des cas détectés | |
| Types ambigus (C Q2/Q5) | Incertain | Vérification manuelle |
| Illustrations | ~faible confiance | Sur/sous-association |
| **Intégrité globale prudente** | **≈ 96 %** | Ne pas annoncer 100 % |
