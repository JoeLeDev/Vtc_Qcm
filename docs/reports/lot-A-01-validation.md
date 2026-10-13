# Revue de fiabilité — Lot A-01 (matière A 2021, Q1–Q15)

**Date de revue :** 13 octobre 2026  
**Statut des suggestions :** toutes restent `suggested` (aucune promotion `verified`)  
**Correctif structurel Q1 :** ID canonique `2021-A-q01-6f0023fa` ; alias `2021-A-q49953-942e405b` via `legacyIds`

## Synthèse exécutive

| Fiabilité | Questions |
|-----------|-----------|
| **Élevée** (source justifie directement la réponse) | Q2, Q3, Q4, Q5, Q6, Q8, Q9, Q10, Q11, Q12, Q15 |
| **Élevée avec distinction 2021/2026** | Q7, Q13 |
| **Moyenne** (texte clair, formulation ouverte / multi) | Q1, Q14 |
| **Réponse historique ≠ actuelle** | **Q7** (mentions), **Q13** (périodicité selon âge) |

---

## Correctif Q1 (données)

| Avant | Après |
|-------|--------|
| ID `2021-A-q49953-942e405b` | ID `2021-A-q01-6f0023fa` |
| `number: 49953` | `number: 1` |
| Stem collé au titre d’examen | Stem PDF : « Quels agents sont habilités à effectuer un contrôle routier de conducteur de T3P ? » |
| `type: single` | `type: multiple` (légende annale « Question à choix multiple » + pluriel « Quels agents ») |
| — | `legacyIds: ["2021-A-q49953-942e405b"]` |

Mécanisme anti-casse : `resolveQuestionId` / import suggestions / overlays remappent l’ancien ID vers le canonique. Patch durable : `src/data/questions/extraction-patches.json`.

---

## Question par question

### Q1 — Agents de contrôle routier T3P

- **ID :** `2021-A-q01-6f0023fa` (legacy `2021-A-q49953-942e405b`)
- **Énoncé :** Quels agents sont habilités à effectuer un contrôle routier de conducteur de T3P ?
- **Choix :** A Les gendarmes · B Le juge du tribunal judiciaire · C Les agents représentant la SNCF · D Les policiers
- **Réponse proposée :** A et D
- **Justification :** La police nationale et la gendarmerie nationale ont compétence générale pour constater les infractions sur la voie publique (circulation et contrôles professionnels). Le juge n’effectue pas de contrôle routier. Les agents SNCF agissent sur le domaine ferroviaire, pas comme contrôleurs T3P routiers.
- **Source précise :** Code de la route, art. L. 130-4 (compétence OPJ/APJ et agents de contrôle, sans préjudice de la compétence générale) — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045072417 — version en vigueur consultée 2026-10-13. Appui : Code des transports R. 3124-12 (« agents des services chargés des contrôles ») — compil. DGITM T3P https://www.ecologie.gouv.fr/sites/default/files/documents/CodeTransportsT3PMAJ%2020012022.pdf
- **Applicable 2021 :** A + D
- **Applicable 2026 :** A + D (inchangé sur le fond)
- **Statut de fiabilité :** Moyenne-élevée — le principe est solide ; la liste exhaustive des agents spécialisés transports (L. 1451-1) n’a pas été re-lue mot à mot sur Légifrance dans cette session pour exclure d’autres agents hors choix.
- **Validation humaine :** Confirmer le barème Evalbox (1 point pour les deux cases). Vérifier si d’autres agents (contrôleurs des transports terrestres) auraient pu entrer dans un QCM plus large.

### Q2 — Recours après tribunal correctionnel

- **ID :** `2021-A-q02-f1d3d2e2`
- **Énoncé :** Un conducteur sanctionné par le tribunal correctionnel pour délit de fuite peut saisir :
- **Choix :** A tribunal judiciaire (< 4 000 €) · B cour d’appel · C Cour de cassation · D même tribunal correctionnel
- **Réponse proposée :** B
- **Justification :** L’appel des jugements correctionnels est porté devant la cour d’appel. La cassation n’est pas la voie de premier recours ; le correctionnel ne rejugera pas hors voies prévues.
- **Source :** Code de procédure pénale, art. 496 et s. — https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006071154/ — version en vigueur 2026-10-13
- **2021 / 2026 :** B / B
- **Fiabilité :** Élevée
- **Validation humaine :** Aucune (sauf confirmation pédagogique du délai d’appel, hors énoncé).

### Q3 — Taille minimale de commune

- **ID :** `2021-A-q03-f89927f8`
- **Énoncé :** Quelle est la taille minimum de la commune dans laquelle peut s’exercer une activité du T3P ?
- **Choix :** A 11 000 · B 1 500 · C Il n’y a pas de taille minimum · D 20 000
- **Réponse proposée :** C
- **Justification :** Aucune condition de seuil démographique communal dans L. 3120-1 et s. Les seuils PDU/LOTI ne créent pas une taille minimale pour exercer le T3P.
- **Source :** Code des transports, L. 3120-1 et s. — https://www.legifrance.gouv.fr/codes/id/LEGISCTA000023083933/ — absence de seuil ; page ministère T3P https://www.ecologie.gouv.fr/politiques-publiques/taxi-vtc-vmdtr-cpa-reglementation-transports-publics-particuliers-personnes — consultés 2026-10-13
- **2021 / 2026 :** C / C
- **Fiabilité :** Élevée (preuve par absence de norme — à accepter comme telle)
- **Validation humaine :** Accepter le raisonnement a contrario.

### Q4 — Agrément formation continue

- **ID :** `2021-A-q04-21f97d5d` (QRC)
- **Énoncé :** Qui agrée les organismes de formation continue des conducteurs de T3P ?
- **Réponse proposée :** Le préfet du département du lieu du centre (à Paris : préfet de police) / les préfectures
- **Justification :** R. 3120-9 soumet l’agrément des centres de formation initiale ou continue au préfet (ou préfet de police à Paris), agrément valable 5 ans.
- **Source :** Code des transports, art. R. 3120-9 — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000034389387 — version depuis 08/04/2017, consultée 2026-10-13
- **2021 / 2026 :** Identique
- **Fiabilité :** Élevée — le texte cite explicitement l’agrément des centres de formation continue.
- **Validation humaine :** Harmoniser la formulation attendue (« préfectures » vs « préfet »).

### Q5 — Vérification du casier (carte pro)

- **ID :** `2021-A-q05-ffc0ef7b`
- **Énoncé :** Quelle est l’autorité qui effectue la vérification du casier judiciaire d’un candidat à la carte professionnelle… ?
- **Choix :** A préfet de police ou préfet · B préfet de région · C forces de l’ordre · D ministère des transports
- **Réponse proposée :** A
- **Justification :** La carte est délivrée par l’autorité administrative (préfet / préfet de police). L’honorabilité s’apprécie notamment au regard du B2 (R. 3120-8) lors de cette délivrance.
- **Source :** L. 3120-2-2 ; R. 3120-6 ; R. 3120-8 ; R. 3122-10 (VTC) — compil. DGITM T3P ; Légifrance code des transports — consultés 2026-10-13. Service-Public F21907/F31027 : 404 le 2026-10-13 (non retenus).
- **2021 / 2026 :** A / A
- **Fiabilité :** Élevée
- **Validation humaine :** Aucune majeure.

### Q6 — Ancienneté véhicule hybride

- **ID :** `2021-A-q06-94ae2b9a`
- **Énoncé :** Quelle est l’ancienneté maximum pour un véhicule hybride ?
- **Choix :** A 6 ans · B aucune · C 7 ans · D 2 ans
- **Réponse proposée :** B
- **Justification :** L. 3120-5 autorise hybrides/électriques par dérogation aux caractéristiques techniques réglementaires. Arrêté 26/03/2015 art. 1 (moins de 6 ans) **non applicable** aux hybrides/électriques (art. 2).
- **Source :** L. 3120-5 code des transports ; Arrêté du 26 mars 2015 (NOR DEVT1500042A), art. 1 et 2 — texte publié JO 03/04/2015, toujours applicable sur ce point — consulté 2026-10-13
- **2021 / 2026 :** B / B
- **Fiabilité :** Élevée pour le cadre VTC / L. 3120-5 ; l’énoncé dit « véhicule hybride » sans préciser VTC, mais le sujet est T3P.
- **Validation humaine :** Confirmer que le barème vise bien l’exemption VTC (et non d’autres régimes locaux taxi).

### Q7 — Réservation préalable — mentions (FOCUS)

- **ID :** `2021-A-q07-61c19a41` (QRC)
- **Énoncé :** Comment se présente une réservation préalable ? Citez 2 mentions obligatoires.
- **Réponse proposée (suggestion)** : Support papier ou électronique + 2 mentions de la liste applicable **à la date de l’annale**.

#### Comparaison 2021 vs depuis le 30 octobre 2025

| Élément | Régime 2021 (arrêté 30/07/2013 + R. 3120-2) | Régime depuis 30/10/2025 (arrêté 06/08/2025) |
|---------|--------------------------------------------|-----------------------------------------------|
| Support | Papier ou électronique | Papier ou électronique (inchangé) |
| Exploitant (nom + coordonnées) | Oui | Oui (1°) |
| RCS / RM ou SIREN | Oui (n° inscription RCS/RM — indication CMA) | N° unique d’identification D. 123-235 code de commerce (3°) |
| N° registre VTC (L. 3122-3) | Non (pas dans la liste 2013 telle que rappelée) | **Oui, obligatoire pour VTC (2°)** — **nouveauté** |
| Nom + téléphone client | Oui | Oui (4°), **sauf** si le conducteur fournit sans délai un moyen de contact — **assouplissement** |
| Date/heure réservation | Oui | Oui (5°) |
| Date/heure prise en charge | Oui | Oui (6°) |
| Lieu de prise en charge | Oui | Oui (7°) |

- **Source 2021 :** R. 3120-2 — compil. DGITM ; indication d’annale CMA 2021 ; arrêté du 30 juillet 2013 (abrogé par l’arrêté 2025) — régime applicable à l’époque de l’annale.
- **Source 2026 :** Arrêté du 6 août 2025 relatif au justificatif de réservation préalable VTC/VMDTR, art. 1 — texte art. 1 : https://librejustice.fr/norm/fr/arrete-du-6-aout-2025-relatif-au-justificatif-de-la-reservation-prealable-applicable-aux-voitures-de-transport-avec/1 (base LEGI/DILA) ; JO 29/08/2025 ; **entrée en vigueur 30/10/2025** (deux mois après publication) — page ministère T3P.
- **Réponse applicable 2021 :** Papier/électronique + 2 mentions parmi la liste CMA/2013 (sans n° registre VTC comme exigence nouvelle).
- **Réponse applicable 2026 :** Même support + mentions de l’arrêté 2025 (dont n° registre VTC pour VTC ; souplesse client).
- **Fiabilité :** Élevée sur le **changement** ; moyenne sur la citation mot à mot de l’arrêté 2013 (non relu intégralement sur Légifrance — s’appuie sur indication CMA + sources secondaires alignées).
- **Validation humaine :** Relire l’arrêté 2013 sur Légifrance (archive) pour figer la liste exacte 2021. Confirmer la date d’entrée en vigueur sur le JO (art. final de l’arrêté 2025).

### Q8 — Document à présenter en contrôle

- **ID :** `2021-A-q08-2de1b526` (QRC)
- **Énoncé :** Que devez-vous présenter… pour justifier d’une réservation préalable ?
- **Réponse proposée :** Un document écrit sur support papier ou électronique
- **Justification :** R. 3120-2 impose explicitement ce justificatif et sa présentation aux agents.
- **Source :** Code des transports R. 3120-2 — compil. DGITM ; Légifrance — consulté 2026-10-13
- **2021 / 2026 :** Identique sur le **support** (le contenu évolue — voir Q7)
- **Fiabilité :** Élevée
- **Validation humaine :** Aucune.

### Q9 — Nature du retrait de carte

- **ID :** `2021-A-q09-080e6ea7`
- **Énoncé :** Le retrait de la carte professionnelle est :
- **Choix :** A sanction administrative prise par un préfet · B par un juge · C suite juge administratif · D suite juge pénal
- **Réponse proposée :** A
- **Justification :** L. 3124-11 : l’autorité administrative peut avertir ou retirer temporairement/définitivement la carte. Textes d’application : préfet / préfet de police (R. 3124-4, R. 3124-8). Ce n’est pas une peine judiciaire ; un jugement pénal peut toutefois faire cesser une condition d’honorabilité (R. 3120-6 / R. 3120-8).
- **Source :** L. 3124-11 ; R. 3124-4 ; R. 3124-8 ; R. 3120-6 — compil. DGITM T3P (texte L. 3124-11 : « l’autorité administrative peut… ») — consulté 2026-10-13
- **2021 / 2026 :** A / A
- **Fiabilité :** Élevée — le texte justifie « sanction administrative » et l’autorité préfectorale.
- **Validation humaine :** Distinguer clairement retrait-sanction (L. 3124-11) et retrait faute de conditions (R. 3120-6).

### Q10 — Assurances obligatoires

- **ID :** `2021-A-q10-ac166b31` (QRC)
- **Énoncé :** Quelles assurances doit souscrire un professionnel effectuant du T3P ?
- **Réponse proposée :** RC circulation (transport de personnes à titre onéreux) + RC professionnelle
- **Justification :** L. 3120-4 (RC professionnelle) ; R. 3120-4 (justificatif d’assurance transport de personnes à titre onéreux).
- **Source :** L. 3120-4 et R. 3120-4 — compil. DGITM — consultés 2026-10-13
- **2021 / 2026 :** Identique
- **Fiabilité :** Élevée
- **Validation humaine :** Aucune.

### Q11 — Code applicable

- **ID :** `2021-A-q11-01fdc9ac`
- **Énoncé :** La réglementation du T3P se trouve dans le :
- **Choix :** A Code préfectoral · B Code pénal · C Code du travail · D Code des transports
- **Réponse proposée :** D
- **Justification :** Titre II livre Ier 3e partie du code des transports.
- **Source :** Code des transports L. 3120-1 à L. 3124-15 — https://www.legifrance.gouv.fr/codes/id/LEGISCTA000023083933/
- **2021 / 2026 :** D / D
- **Fiabilité :** Élevée
- **Validation humaine :** Aucune.

### Q12 — Véhicule électrique

- **ID :** `2021-A-q12-adcd7c27`
- **Énoncé :** Pour être exploitable en T3P, un véhicule électrique doit être :
- **Choix :** A noir · B pack confort · C soumis à contraintes particulières · D sans contraintes particulières
- **Réponse proposée :** D
- **Justification :** Même logique que Q6 : L. 3120-5 + art. 2 de l’arrêté 26/03/2015 → exemption des contraintes techniques d’âge/dimensions/puissance. « Sans contraintes particulières » = au sens de ces contraintes réglementaires (pas une dispense totale d’obligations T3P).
- **Source :** L. 3120-5 ; arrêté 26/03/2015 art. 2
- **2021 / 2026 :** D / D
- **Fiabilité :** Élevée (sous la réserve d’interprétation de « sans contraintes particulières »)
- **Validation humaine :** Valider le sens pédagogique de l’option D.

### Q13 — Visite médicale selon l’âge (FOCUS)

- **ID :** `2021-A-q13-ce3e9c73`
- **Énoncé :** Chauffeur T3P né le 12 mai 1950. Périodicité de l’examen médical d’aptitude ?
- **Choix :** A 5 ans · B 2 ans · C 1 an
- **Règle (inchangée sur le principe) :** Pour permis B à usage professionnel (taxi/VTC), périodicité max. : 5 ans avant 60 ans ; **2 ans à partir de 60 ans** ; **1 an à partir de 76 ans** (R. 221-11 II code de la route, via D. 3120-5).
- **Source :** D. 3120-5 code des transports ; R. 221-10 / R. 221-11 code de la route ; Service-Public F1255 https://www.service-public.gouv.fr/particuliers/vosdroits/F1255 — consultés 2026-10-13. Version historique R. 221-11 déjà en ce sens (périodicités 5 / 2 / 1 an).
- **Réponse applicable 27/10/2021 :** Âge 71 ans → tranche 60–76 → **B (2 ans)**
- **Réponse applicable 13/10/2026 :** Né 12/05/1950 → 76 ans et 5 mois → **à partir de 76 ans** → **C (1 an)**
- **Fiabilité :** Élevée sur la règle et sur le calcul d’âge
- **Validation humaine :** Confirmer le traitement exact du jour des 76 ans (anniversaire inclus « à partir de »). La suggestion A-01 conserve **B** comme réponse d’annale.

### Q14 — Cas de retrait de carte (FOCUS)

- **ID :** `2021-A-q14-00110411` (QRC)
- **Énoncé :** Citez deux cas dans lesquels la carte professionnelle peut être retirée…
- **Réponse proposée :** (1) Sanction administrative pour violation de la réglementation de la profession — avertissement / retrait temporaire / retrait définitif (L. 3124-11) ; (2) Une condition de délivrance cesse d’être remplie (ex. permis annulé/invalidé, condamnation au B2 au sens de R. 3120-8) → restitution sinon retrait après observations (R. 3120-6).
- **Textes et mise en œuvre :**
  - **L. 3124-11** — pouvoir de l’autorité administrative : avertissement, retrait temporaire ou définitif en cas de violation de la réglementation applicable à la profession.
  - **R. 3124-4 / R. 3124-8** — autorité compétente : préfet du lieu de l’infraction / préfet de police à Paris.
  - **R. 3120-6** — restitution obligatoire si cessation définitive d’activité **ou** si une condition de délivrance n’est plus remplie ; à défaut, retrait après observations écrites.
  - **R. 3120-8** — honorabilité (ex. stupéfiants, vol, agressions sexuelles, certaines infractions code de la route) : fait obstacle à l’exercice → peut déclencher R. 3120-6.
- **Source :** Compil. DGITM T3P (textes cités) ; Légifrance code des transports — consultés 2026-10-13. Indication CMA : annulation du permis ; délits / honorabilité.
- **2021 / 2026 :** Même cadre
- **Fiabilité :** Moyenne-élevée — les textes justifient les **mécanismes** ; le barème ouvert CMA n’est pas un texte officiel.
- **Validation humaine :** Choisir deux formulations « attendues examen » sans sur-interpréter.

### Q15 — Kilométrage max. de course

- **ID :** `2021-A-q15-bfd027be`
- **Énoncé :** Quel kilométrage maximum un conducteur de T3P peut-il réaliser pour sa course ?
- **Choix :** A 1000 · B 500 · C 300 · D pas de limitation
- **Réponse proposée :** D
- **Justification :** Aucun plafond kilométrique dans L. 3120-1 et s.
- **Source :** Code des transports titre T3P — absence de norme ; compil. DGITM
- **2021 / 2026 :** D / D
- **Fiabilité :** Élevée (preuve par absence)
- **Validation humaine :** Accepter le raisonnement a contrario.

---

## Questions dont la réponse historique diffère de 2026

1. **Q7** — contenu obligatoire du justificatif de réservation (registre VTC + assouplissement coordonnées client depuis le 30/10/2025).
2. **Q13** — même date de naissance : **2 ans** en 2021 vs **1 an** en 2026.

Toutes les autres propositions du lot sont alignées 2021 = 2026 sur le fond.

---

## Points transverses pour validation humaine réglementaire

- Relire sur Légifrance l’**arrêté 30/07/2013** (archive) pour figer Q7-2021.
- Confirmer l’**article d’entrée en vigueur** de l’arrêté 06/08/2025 (30/10/2025).
- Valider le barème multi de **Q1** et le sens de « sans contraintes particulières » (**Q12**).
- Ne pas promouvoir en `verified` sans ces contrôles.
