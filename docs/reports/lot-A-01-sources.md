# Lot A-01 — Réglementation T3P (2021 Q1–Q15)

**Date de consultation des sources :** 13 octobre 2026  
**Fichier JSON :** `docs/corrections/lot-A-01-suggestions.json`  
**Statut des suggestions :** `suggested` uniquement (aucune validation `verified`)  
**Overlays vérifiés existants :** non modifiés

## Périmètre

| # | ID question | Type | Proposition |
|---|-------------|------|-------------|
| 1 | `2021-A-q49953-942e405b` | QCM (multi attendu) | A + D |
| 2 | `2021-A-q02-f1d3d2e2` | QCM | B |
| 3 | `2021-A-q03-f89927f8` | QCM | C |
| 4 | `2021-A-q04-21f97d5d` | QRC | Préfet / préfectures |
| 5 | `2021-A-q05-ffc0ef7b` | QCM | A |
| 6 | `2021-A-q06-94ae2b9a` | QCM | B |
| 7 | `2021-A-q07-61c19a41` | QRC | Papier/électronique + 2 mentions |
| 8 | `2021-A-q08-2de1b526` | QRC | Justificatif écrit papier/électronique |
| 9 | `2021-A-q09-080e6ea7` | QCM | A |
| 10 | `2021-A-q10-ac166b31` | QRC | RC circulation + RC pro |
| 11 | `2021-A-q11-01fdc9ac` | QCM | D |
| 12 | `2021-A-q12-adcd7c27` | QCM | D |
| 13 | `2021-A-q13-ce3e9c73` | QCM | B (annale 2021) |
| 14 | `2021-A-q14-00110411` | QRC | 2 cas de retrait |
| 15 | `2021-A-q15-bfd027be` | QCM | D |

## Sources consultées (officielles ou institutionnelles)

| Source | Usage |
|--------|--------|
| [Légifrance — Code des transports](https://www.legifrance.gouv.fr) art. L. 3120-2, L. 3120-2-2, L. 3120-4, L. 3120-5, L. 3124-11, R. 3120-2, R. 3120-4, R. 3120-6, R. 3120-8, R. 3120-9, R. 3124-12 | Cadre T3P |
| [Légifrance — Code de la route](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045072417) L. 130-4 ; R. 221-10 / R. 221-11 | Contrôles / visite médicale |
| [Compil. DGITM Code transports T3P (PDF)](https://www.ecologie.gouv.fr/sites/default/files/documents/CodeTransportsT3PMAJ%2020012022.pdf) | Texte consolidé de travail |
| [Ministère — page T3P](https://www.ecologie.gouv.fr/politiques-publiques/taxi-vtc-vmdtr-cpa-reglementation-transports-publics-particuliers-personnes) | Cadre + arrêtés réservation 2025 |
| Arrêté du 26 mars 2015 (caractéristiques VTC) | Âge / exemption hybride-électrique |
| [Service-Public F1255](https://www.service-public.gouv.fr/particuliers/vosdroits/F1255) | Périodicité contrôle médical pro |
| Annales CMA 2021 (PDF / `docs/annales/raw-2021.txt`) | Indications QRC ; légende « choix multiple » Q1 |

### Accès partiel

- Les fiches Service-Public F21907 / F31027 ont renvoyé **HTTP 404** le 13/10/2026 ; non citées comme sources exploitables.
- Les mentions exactes du justificatif de réservation s’appuient sur l’indication d’annale 2021 + R. 3120-2 ; l’arrêté du 6 août 2025 (entrée en vigueur 30/10/2025) est signalé comme **évolution post-annale**, sans remplacer la réponse historique.

## Questions sans proposition fiable

Aucune question du lot n’a été laissée sans proposition. Confiance **medium** uniquement pour :

- **Q7** — liste des mentions : texte d’arrêté 2013 non relu mot à mot sur Légifrance dans cette session ; évolution 2025 documentée.
- **Q14** — formulation ouverte : cas illustratifs tirés de L. 3124-11 / R. 3120-6 / R. 3120-8 (pas de barème officiel CMA).

## Questions potentiellement obsolètes / à distinguer 2021 vs aujourd’hui

| Question | Annale (2021) | Aujourd’hui (2026) |
|----------|---------------|---------------------|
| **Q7** mentions réservation | Liste indication CMA / arrêté antérieur | Arrêté 6 août 2025 (JO 29/08/2025, applic. 30/10/2025) : mentions actualisées + souplesse contact client |
| **Q13** visite médicale | Né 12/05/1950 → 71 ans → **2 ans** | Même naissance → > 76 ans → **1 an** |
| **Q1** qualité données | ID / stem corrompus (titre examen collé) | À corriger côté banque de questions (hors lot suggestions) |

Les autres propositions du lot restent alignées droit actuel = droit applicable en 2021 sur le fond.

## Contrôles qualité effectués

- Schéma Zod `externalSuggestionImportSchema`
- Correspondance des 15 `questionId` avec `all.json`
- Pas de doublon d’`questionId` dans le fichier
- Aucun statut `verified` dans l’import
- Tests unitaires du projet
