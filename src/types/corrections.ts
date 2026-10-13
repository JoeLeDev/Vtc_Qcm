import type { SubjectCode, VerificationStatus } from '@/types/exam'

/** Niveau de confiance d'une proposition pédagogique (jamais un score d'examen). */
export type ConfidenceLevel = 'low' | 'medium' | 'high'

/**
 * Statut d'une proposition — distinct de `verified`.
 * Les suggestions ne sont jamais scorées automatiquement.
 */
export type SuggestionLifecycle = 'suggested' | 'rejected'

export type SuggestionOrigin = 'external_import' | 'manual'

export type CorrectionSourceKind =
  | 'annals_indicative'
  | 'pedagogical_suggestion'
  | 'user_validated'
  | 'official_documented'

export interface CorrectionSuggestion {
  id: string
  questionId: string
  status: SuggestionLifecycle
  proposedChoiceIds?: string[]
  proposedOpenAnswer?: string
  pedagogicalExplanation: string
  documentaryRef: string
  confidence: ConfidenceLevel
  source: SuggestionOrigin
  createdAt: string
  updatedAt: string
}

export type ValidationAction =
  | 'import_suggestion'
  | 'create_suggestion'
  | 'confirm_verified'
  | 'modify_and_confirm'
  | 'reject_suggestion'
  | 'save_draft'
  | 'add_review_note'
  | 'request_recheck'
  | 'mark_not_scoreable'
  | 'clear_scoring_block'

export interface ValidationHistoryEntry {
  id: string
  questionId: string
  action: ValidationAction
  at: string
  note?: string
  suggestionId?: string
  toVerificationStatus?: VerificationStatus
}

/** Décisions de revue d’anomalies — distinctes des overlays verified. */
export interface QuestionReviewDecision {
  questionId: string
  note?: string
  needsRecheck?: boolean
  /** Non exploitable pour la notation automatique. */
  notScoreable?: boolean
  /** Exclure de l’examen actuel malgré une correction verified. */
  obsoleteForCurrentExam?: boolean
  /** Lève un blocage d’anomalie prioritaire après revue humaine. */
  clearedForScoring?: boolean
  updatedAt: string
}

/** Overlay de correction validée / brouillon — séparé des suggestions. */
export interface CorrectionOverlayV2 {
  questionId: string
  verificationStatus: VerificationStatus
  correctChoiceIds?: string[]
  openReferenceAnswer?: string
  explanation: string
  justificationRef: string
  possiblyObsolete?: boolean
  verifiedAt: string
  verifiedByUser: true
  /** Nature de la source après validation humaine. */
  sourceKind?: CorrectionSourceKind
  /** True uniquement si une source officielle documentée est citée. */
  officialSourceEstablished?: boolean
}

export interface SubjectStudySheet {
  subject: SubjectCode
  title: string
  presentation: string
  keyConcepts: Array<{ label: string; detail?: string; verified: boolean }>
  definitions: Array<{ term: string; definition: string; reference?: string; verified: boolean }>
  regulatoryPoints: Array<{ point: string; reference?: string; verified: boolean }>
  references: Array<{ label: string; url?: string; verified: boolean }>
  lastUpdated?: string
  notes?: string[]
}

export interface ProgressBackupV1 {
  version: 1
  exportedAt: string
  settings?: unknown
  progress?: unknown
  sessions?: unknown
  activeSession?: unknown
  overlays?: CorrectionOverlayV2[]
  suggestions?: CorrectionSuggestion[]
  validationHistory?: ValidationHistoryEntry[]
  reviewDecisions?: QuestionReviewDecision[]
}
