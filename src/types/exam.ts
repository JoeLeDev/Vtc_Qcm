/** Codes des matières de l'examen théorique VTC (tronc commun + spécialités). */
export type SubjectCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'FV' | 'GV'

/** Spécialités hors VTC présentes dans les annales mixtes Taxi/VTC/VMDTR. */
export type ExtraSubjectCode = 'FT' | 'GT' | 'FM' | 'GM'

export type AnySubjectCode = SubjectCode | ExtraSubjectCode

export type QuestionType = 'single' | 'multiple' | 'open'

/**
 * Statut de vérification d'une correction.
 * - verified : correction confirmée après contrôle réglementaire
 * - unverified : aucune correction explicitement établie dans la source
 * - needs_review : correction trouvée dans les annales, à revalider réglementairement
 */
export type VerificationStatus = 'verified' | 'unverified' | 'needs_review'

export type QuestionOrigin = 'official_annals' | 'training'

export type QuestionLifecycleStatus = 'active' | 'possibly_obsolete'

export type ProfessionScope = 'common' | 'vtc' | 'taxi' | 'vmdtr'

export interface Choice {
  id: string
  label: string
  text: string
}

export interface Question {
  id: string
  subject: AnySubjectCode
  scope: ProfessionScope
  year: number
  number: number
  stem: string
  choices: Choice[]
  type: QuestionType
  /** Uniquement renseigné si verificationStatus === 'verified'. */
  correctChoiceIds?: string[]
  /** Texte de référence pour QRC, jamais inventé. */
  openReferenceAnswer?: string
  explanation?: string
  origin: QuestionOrigin
  sourceDocument: string
  sourceExamTitle: string
  pdfPage: number
  verificationStatus: VerificationStatus
  lastRegulatoryCheck?: string
  lifecycleStatus: QuestionLifecycleStatus
  hasIllustration: boolean
  illustrationPath?: string
  points?: number
  extractionNotes?: string[]
  /** ID de la question originale si doublon inter-années détecté. */
  duplicateOf?: string
  /** Anciens identifiants conservés après correctif d’extraction (aliases). */
  legacyIds?: string[]
  /** Référence justificative de la correction (overlay utilisateur). */
  justificationRef?: string
  /** Indique que la vérification est utilisateur, non officielle CMA. */
  verifiedByUser?: boolean
  verifiedAt?: string
}

/** Correction utilisateur stockée hors extraction (résiste aux réimports). */
export interface CorrectionOverlay {
  questionId: string
  verificationStatus: VerificationStatus
  correctChoiceIds?: string[]
  openReferenceAnswer?: string
  explanation: string
  justificationRef: string
  possiblyObsolete?: boolean
  verifiedAt: string
  /** Toujours true pour les overlays issus de l'UI. */
  verifiedByUser: true
  /**
   * Nature de la source après validation humaine.
   * `official_documented` seulement si une source officielle est explicitement citée.
   */
  sourceKind?:
    | 'annals_indicative'
    | 'pedagogical_suggestion'
    | 'user_validated'
    | 'official_documented'
  officialSourceEstablished?: boolean
}

export type SessionMode = 'review' | 'mock_training' | 'mock_official'

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

export interface StudySessionAnswer {
  questionId: string
  selectedChoiceIds?: string[]
  openText?: string
  validated: boolean
  isCorrect: boolean | null
  scored: boolean
  timeSpentMs: number
}

export interface ExamPaperRuntime {
  subject: SubjectCode
  questionIds: string[]
  durationMinutes: number
  coefficient: number
  eliminatoryBelow: number
  qcmRequested: number
  qrcRequested: number
  qcmSelected: number
  qrcSelected: number
  status: 'pending' | 'active' | 'completed'
  /** Deadline absolue (horloge murale) — base du chronomètre fiable après interruption. */
  deadlineAt?: string
  startedAt?: string
  completedAt?: string
}

export interface StudySession {
  id: string
  mode: SessionMode
  status: SessionStatus
  startedAt: string
  updatedAt: string
  finishedAt?: string
  questionIds: string[]
  currentIndex: number
  answers: StudySessionAnswer[]
  config: {
    subjects?: SubjectCode[]
    years?: number[]
    count: number
    verificationFilter?: 'all' | 'verified' | 'unverified' | 'evaluable'
    evaluableOnly?: boolean
    timerEnabled?: boolean
    /** Durée totale allouée (entraînement). */
    durationMs?: number
    /** Deadline absolue d’horloge murale pour l’entraînement. */
    deadlineAt?: string
    revealMode?: 'after_each' | 'at_end'
    shuffleChoices?: boolean
    /** Simulation officielle incomplète faute de stock. */
    isPartialSimulation?: boolean
    /** True seulement si structure complète + assez de corrections vérifiées pour une admissibilité. */
    simulationCertifiable?: boolean
    papers?: ExamPaperRuntime[]
    currentPaperIndex?: number
  }
  /** Ordre mélangé des propositions par question (ids). */
  choiceOrder?: Record<string, string[]>
  scoreableCount: number
  correctCount: number
  incorrectCount: number
  nonEvaluableCount: number
  totalDurationMs: number
  endedBy?: 'user' | 'timeout' | 'abandon'
}

export interface ExamSubjectResult {
  subject: SubjectCode
  total: number
  answered: number
  correct: number
  incorrect: number
  nonEvaluable: number
  openUnevaluated: number
  scoreable: number
}

export interface ExamResultSummary {
  sessionId: string
  mode: SessionMode
  partial: boolean
  certifiable: boolean
  treatedCount: number
  correctCount: number
  incorrectCount: number
  unverifiedCount: number
  openUnevaluatedCount: number
  unansweredCount: number
  durationMs: number
  bySubject: ExamSubjectResult[]
  /** Jamais « Admis » si non certifiable. */
  admissionLabel: 'non_certifiable' | 'partial' | 'indeterminate'
}

export interface SubjectDefinition {
  code: SubjectCode
  label: string
  shortLabel: string
  group: 'common' | 'vtc'
  description: string
}

export interface ExamPaperRules {
  subject: SubjectCode
  qcmCount: number
  qrcCount: number
  durationMinutes: number
  coefficient: number
  eliminatoryBelow: number
}

export interface ExamRulesConfig {
  version: string
  source: string
  sourceUrl: string
  verified: boolean
  verifiedAt?: string
  totalDurationMinutes: number
  totalCoefficient: number
  admissibilityAverage: number
  papers: ExamPaperRules[]
  notes: string[]
}

export interface AttemptAnswer {
  questionId: string
  selectedChoiceIds?: string[]
  openText?: string
  /** null si la question n'est pas scorable (correction non vérifiée). */
  isCorrect: boolean | null
  scored: boolean
  timeSpentMs: number
}

export interface Attempt {
  id: string
  mode: SessionMode
  startedAt: string
  finishedAt?: string
  subjectFilter?: SubjectCode[]
  yearFilter?: number[]
  answers: AttemptAnswer[]
  scoreableCount: number
  correctCount: number
  unansweredCount: number
}

export interface SpacedRepetitionState {
  questionId: string
  easeFactor: number
  intervalDays: number
  repetitions: number
  nextReviewAt: string
  lastResult: 'again' | 'hard' | 'good' | 'easy' | null
}

export interface UserSettings {
  examTargetDate: string
  theme: 'light' | 'dark' | 'system'
  dailyGoalQuestions: number
}

export interface UserProgressSnapshot {
  totalAnswered: number
  totalCorrect: number
  totalStudyTimeMs: number
  streakDays: number
  lastStudyDate?: string
  favorites: string[]
  masteredErrors: string[]
}
