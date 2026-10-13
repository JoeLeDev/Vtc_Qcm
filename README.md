# VTC Prep

Plateforme personnelle de préparation à l’examen théorique VTC (annales CMA 2021–2022).

## Démarrage

```bash
npm install
npm run extract:annales   # régénère la banque depuis docs/annales/
npm run dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm test` | Tests Vitest |
| `npm run extract:annales` | Extraction PDF → JSON + rapport |

## Fonctionnalités phase 3 / 4

- `/corrections` : suggestions (`suggested`) ≠ validations (`verified`) + historique
- Import JSON de propositions externes (`docs/corrections/suggestions.example.json`)
- `/fiches` : fiches pédagogiques par matière (sans dispositions inventées)
- `/reviser` · `/examens` : révision et examens blancs
- Sauvegarde JSON progression (Paramètres)
- Audit : `npm run audit:corrections` → `docs/reports/corrections-coverage.md`
- Chronomètre murale + raccourcis révision `1–4` / `Entrée` / `←→`

## Règles métier

- Aucune correction inventée.
- Statuts : `verified` · `unverified` · `needs_review`.
- Les questions non vérifiées ne sont jamais scorées automatiquement.
- Les validations vivent dans `src/data/corrections/overlays.json` + localStorage.
- Objectif d’examen par défaut : **26 janvier 2027** (modifiable).

Usage personnel uniquement — vérifier les conditions de réutilisation des annales avant toute publication.
# Vtc_Qcm
