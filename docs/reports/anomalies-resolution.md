# Résolution des 9 anomalies prioritaires — Phase 7

**Date :** 2026-10-13  
**Fichier machine :** `src/data/corrections/anomaly-resolutions.json`  
**Catalogue :** `src/data/corrections/priority-anomalies.ts`  
**Règle :** aucune promotion `verified` ; `blocksScoring: true` maintenu pour les 9 tant qu’une incertitude ou une obsolescence bloque la notation.

## Synthèse

| Statut | Nombre |
|--------|--------|
| Résolue (documentaire) | **1** (GV Q2) |
| Partiellement résolue | **4** (E Q1, D Q9, C Q2, C Q5) |
| Bloquée | **4** (FV Q2, Q7, Q9, Q11) |
| Encore ouvertes / bloquant la notation | **9 / 9** |
| Exploitables pour examen actuel noté | **0** |

---

## 1. E 2021 Q1 — Illustration manquante

| Champ | Contenu |
|-------|---------|
| ID | `2021-E-q01-838fcf42` |
| Anomalie initiale | Illustration du bâtiment historique absente |
| Analyse | PDF : traduction FR→EN. Choix **C** correct linguistiquement (« when this historical monument was built »). Aucune image de bâtiment dans `public/annales/images` (disponibles : `2021-p8.png` panneau C, `2021-p9.png` Cybertruck D, `2022-p8.png`). Association visuelle impossible sans extraction supplémentaire. |
| Références | `docs/annales/raw-2021.txt` (examen E) ; inventaire images 2026-10-13 |
| Correction proposée | Garder suggestion linguistique **C** (`suggested`) ; **ne pas** rattacher d’illustration inventée ; conserver blocage notation |
| Statut | **partiellement résolue** |
| Intervention humaine | Extraire l’image depuis le PDF original, vérifier la correspondance visuelle, puis éventuellement lever le blocage |

---

## 2. D 2021 Q9 — Ambiguïté Aspect / Style

| Champ | Contenu |
|-------|---------|
| ID | `2021-D-q09-265a781b` |
| Anomalie initiale | « allure » → Aspect vs Style |
| Analyse | Indication Q10 / texte : « allure futuriste et cyberpunk » = apparence, pas vitesse. **Aspect (A)** est le sens le plus direct ; **Style (C)** reste proche. Type PDF `single` confirmé. Illustration `2021-p9.png` cohérente avec le dossier D (Cybertruck). |
| Références | `raw-2021.txt` D Q9/Q10 ; `/annales/images/2021-p9.png` |
| Correction proposée | Suggestion **A**, confiance medium ; type inchangé ; blocage notation jusqu’à tranché humain |
| Statut | **partiellement résolue** |
| Intervention humaine | Trancher A vs C après relecture du texte |

---

## 3. FV 2021 Q2 — Calcul de marge

| Champ | Contenu |
|-------|---------|
| ID | `2021-FV-q02-4cc8521f` |
| Anomalie initiale | Ambiguïté type / double expression de la marge |
| Analyse | PDF : QCM **single** (pas « la ou lesquelles »). Pédagogiquement, la marge s’exprime en % du CA **ou** du coût de revient. Forcer le type `multiple` pour coller à A+C serait artificiel. |
| Références | `raw-2021.txt` FV Q2 |
| Correction proposée | Aucune réponse unique fiable ; suggestion documentaire A+C conservée en `suggested` à titre pédagogique uniquement ; **bloquée** pour notation |
| Statut | **bloquée** |
| Intervention humaine | Barème CMA ou décision explicite A et/ou C |

---

## 4. FV 2021 Q7 — Amortissement

| Champ | Contenu |
|-------|---------|
| ID | `2021-FV-q07-e38fabec` |
| Anomalie initiale | Durée d’amortissement informatique (hypothèse 3 ans) |
| Analyse | Le BOFiP (**BOI-BIC-AMT-10-40**) ne fixe **pas** « 3 ans » pour l’informatique : durée = usages / durée d’utilisation. Matériel de bureau indicatif ~10–20 %/an (≈5–10 ans). La suggestion « 3 ans » n’est **pas** suffisamment étayée. |
| Références | [BOI-BIC-AMT-10-40](https://bofip.impots.gouv.fr/bofip/4686-PGP.html/identifiant=BOI-BIC-AMT-10-40-20170104) (consulté 2026-10-13) ; [BOI-BIC-AMT-10-40-30](https://bofip.impots.gouv.fr/bofip/4520-PGP.html/identifiant=BOI-BIC-AMT-10-40-30-20120912) (consulté 2026-10-13) |
| Correction proposée | Confiance abaissée à **low** ; ne pas valider A sans barème d’annale ; blocage notation |
| Statut | **bloquée** |
| Intervention humaine | Barème officiel ou usage documenté pour le cas d’examen |

---

## 5. FV 2021 Q9 — Question reportée

| Champ | Contenu |
|-------|---------|
| ID | `2021-FV-q09-c79f89d1` |
| Anomalie initiale | Calcul de résultat ambigu |
| Analyse | CA 50 000 − charges sociales 10 000 = 40 000 (hors choix). Inclure cession 8 000 et/ou TVA 5 000 donne A 43 000 / B 37 000 / C 27 000 selon hypothèses. La TVA n’est en principe pas une charge de résultat ; la cession est un produit. Pas d’Indication/Right answer dans le PDF. |
| Références | `raw-2021.txt` FV Q9 |
| Correction proposée | **Aucune** réponse proposée comme fiable ; exclure des QCM notés |
| Statut | **bloquée** |
| Intervention humaine | Barème CMA ou clarification pédagogique |

---

## 6. FV 2021 Q11 — Question reportée

| Champ | Contenu |
|-------|---------|
| ID | `2021-FV-q11-15a9cb61` |
| Anomalie initiale | Plusieurs vérités possibles sur CGV |
| Analyse | Type PDF **single**. Plusieurs assertions peuvent être vraies (B2C / Hamon / B2B). A est faux (CGV à communiquer au pro qui les demande). Sans consigne multi ni barème → pas de réponse unique. |
| Références | `raw-2021.txt` FV Q11 |
| Correction proposée | Ne pas changer le type en `multiple` ; exclure de la notation |
| Statut | **bloquée** |
| Intervention humaine | Barème humain |

---

## 7. GV 2021 Q2 — Sanctions historiques et actuelles

| Champ | Contenu |
|-------|---------|
| ID | `2021-GV-q02-65dc0b6d` |
| Anomalie initiale | Quantum 15 000 € vs peines actuelles |
| Analyse | Qualification : prise en charge sans réservation = délit (L. 3120-2 / L. 3124-12). Choix **C** = quantum **historique** d’annale 2021 (1 an / 15 000 €). Depuis la **loi n° 2026-534 du 25 juin 2026** (en vigueur **27/06/2026**), L. 3124-12 prévoit **3 ans / 45 000 €**. Le libellé « jusqu’à 15 000 € » est obsolète pour 2026. A faux ; B = peine complémentaire possible seulement. |
| Références | `raw-2021.txt` GV Q2 ; [L. 3124-12](https://librejustice.fr/norm/fr/code-des-transports/l3124-12) (version 27/06/2026, consulté 2026-10-13) ; Sénat QE (état antérieur 1 an / 15 000 €) |
| Correction proposée | Documenter C comme réponse d’annale 2021 ; **non exploitable** pour examen actuel ; `notScoreable` / blocage maintenu |
| Statut | **résolue** (documentaire) — **ouverte** pour notation actuelle |
| Intervention humaine | Conserver hors QCM notés ; éventuelle réécriture hors Phase 7 |

---

## 8. C 2021 Q2 — Ambiguïté de réponse

| Champ | Contenu |
|-------|---------|
| ID | `2021-C-q02-4e9aec96` |
| Anomalie initiale | Single vs multi (freinage / arrêt) |
| Analyse | PDF sans consigne « une ou plusieurs ». Type banque **single** conservé. La pluie allonge la distance de freinage et donc d’arrêt. Si barème single : **B** prioritaire ; **C** aussi physiquement lié. |
| Références | `raw-2021.txt` C Q2 ; `docs/reports/lot-C-01-ambiguity-review.md` |
| Correction proposée | Suggestion pédagogique B (+ mention C) ; type inchangé ; blocage notation |
| Statut | **partiellement résolue** |
| Intervention humaine | Trancher B seul vs B+C |

---

## 9. C 2021 Q5 — Ambiguïté de réponse

| Champ | Contenu |
|-------|---------|
| ID | `2021-C-q05-d84d0b34` |
| Anomalie initiale | Single vs multi (piétons) |
| Analyse | **R. 412-37** : (1) traverser en tenant compte visibilité/distance/vitesse → **A** ; (2) utiliser passages à &lt; 50 m → **D**. B et C faux. Type PDF **single** malgré deux obligations cumulatives. |
| Références | [R. 412-37 Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000023095943) (consulté 2026-10-13) ; `raw-2021.txt` C Q5 |
| Correction proposée | Documenter A+D ; **ne pas** passer en `multiple` sans consigne PDF ; blocage notation |
| Statut | **partiellement résolue** |
| Intervention humaine | Décider si le barème attend une ou deux cases |

---

## Contrôles techniques associés

- Les 9 IDs sont dans `listBlockingAnomalyIds()` → exclus des QCM notés tant que `clearedForScoring` n’est pas posé manuellement.
- Aucune suggestion d’anomalie n’est en `verified`.
- Les 9 anomalies restent **hors** de la première série de 30 (`first-30-series.json`).
