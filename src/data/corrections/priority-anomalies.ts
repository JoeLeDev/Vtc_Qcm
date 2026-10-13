import anomalyResolutions from './anomaly-resolutions.json' with { type: 'json' }

/** Anomalies prioritaires Phase 5D/7 — revue humaine obligatoire avant notation. */
export interface PriorityAnomaly {
  questionId: string
  code: string
  title: string
  detail: string
  /** Si true, la question ne doit pas entrer dans les QCM notés tant que non traitée. */
  blocksScoring: boolean
  resolutionStatus?: 'resolved' | 'partially_resolved' | 'blocked'
}

const resolutionById = new Map(
  (anomalyResolutions.resolutions ?? []).map((r) => [r.questionId, r]),
)

export const PRIORITY_ANOMALIES: PriorityAnomaly[] = [
  {
    questionId: '2021-E-q01-838fcf42',
    code: 'missing_illustration',
    title: 'E 2021 Q1 — illustration manquante',
    detail: 'Bâtiment historique non extrait du PDF. Réponse linguistique C documentée.',
    blocksScoring: true,
    resolutionStatus: 'partially_resolved',
  },
  {
    questionId: '2021-D-q09-265a781b',
    code: 'ambiguous_answer',
    title: 'D 2021 Q9 — Aspect / Style',
    detail: 'Ambiguïté lexicale résiduelle pour « allure » (Aspect recommandé, Style proche).',
    blocksScoring: true,
    resolutionStatus: 'partially_resolved',
  },
  {
    questionId: '2021-FV-q02-4cc8521f',
    code: 'ambiguous_type',
    title: 'FV 2021 Q2 — marge',
    detail: 'Type single PDF vs double expression pédagogique (CA / coût de revient).',
    blocksScoring: true,
    resolutionStatus: 'blocked',
  },
  {
    questionId: '2021-FV-q07-e38fabec',
    code: 'needs_recheck',
    title: 'FV 2021 Q7 — amortissement',
    detail: '« 3 ans » non fixé par le BOFiP pour l’informatique — barème d’examen requis.',
    blocksScoring: true,
    resolutionStatus: 'blocked',
  },
  {
    questionId: '2021-FV-q09-c79f89d1',
    code: 'deferred',
    title: 'FV 2021 Q9 — calcul de résultat',
    detail: 'Ambiguïté comptable (CA / cession / TVA) — aucun choix fiable sans barème.',
    blocksScoring: true,
    resolutionStatus: 'blocked',
  },
  {
    questionId: '2021-FV-q11-15a9cb61',
    code: 'deferred',
    title: 'FV 2021 Q11 — CGV',
    detail: 'Plusieurs assertions possibles ; type PDF single — barème humain requis.',
    blocksScoring: true,
    resolutionStatus: 'blocked',
  },
  {
    questionId: '2021-GV-q02-65dc0b6d',
    code: 'historical_vs_current',
    title: 'GV 2021 Q2 — sanctions',
    detail: 'C = réponse d’annale 2021 ; quantum 2026 = 3 ans / 45 000 € (L. 3124-12).',
    blocksScoring: true,
    resolutionStatus: 'resolved',
  },
  {
    questionId: '2021-C-q02-4e9aec96',
    code: 'ambiguous_type',
    title: 'C 2021 Q2 — une ou plusieurs réponses',
    detail: 'Type single conservé ; B (freinage) prioritaire, C aussi lié — barème humain.',
    blocksScoring: true,
    resolutionStatus: 'partially_resolved',
  },
  {
    questionId: '2021-C-q05-d84d0b34',
    code: 'ambiguous_type',
    title: 'C 2021 Q5 — une ou plusieurs réponses',
    detail: 'R. 412-37 justifie A et D ; type PDF single — barème humain.',
    blocksScoring: true,
    resolutionStatus: 'partially_resolved',
  },
]

export function getPriorityAnomaly(questionId: string): PriorityAnomaly | undefined {
  return PRIORITY_ANOMALIES.find((a) => a.questionId === questionId)
}

export function getAnomalyResolution(questionId: string) {
  return resolutionById.get(questionId)
}

/** Blocage notation : résolution `blocksScoring` si présente, sinon catalogue. */
export function listBlockingAnomalyIds(): Set<string> {
  const ids = new Set<string>()
  for (const anomaly of PRIORITY_ANOMALIES) {
    const resolution = resolutionById.get(anomaly.questionId)
    const blocks = resolution?.blocksScoring ?? anomaly.blocksScoring
    if (blocks) ids.add(anomaly.questionId)
  }
  return ids
}
