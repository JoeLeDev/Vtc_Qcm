import { getPriorityAnomaly, listBlockingAnomalyIds } from '@/data/corrections/priority-anomalies'
import { getActiveSuggestionForQuestion, getReviewDecision } from '@/lib/corrections'
import { isScorable } from '@/lib/exam-engine'
import type { Question, SubjectCode } from '@/types/exam'

const VTC_SUBJECTS: SubjectCode[] = ['A', 'B', 'C', 'D', 'E', 'FV', 'GV']

/** Illustration absente alors que la question en dépend pour l’exercice. */
export function hasIllustrationGap(question: Question): boolean {
  const anomaly = getPriorityAnomaly(question.id)
  if (anomaly?.code === 'missing_illustration') return true
  if (question.hasIllustration && !question.illustrationPath) return true
  return false
}

/**
 * QCM automatiquement notables (hors QRC).
 * Ne jamais déduire la validation : exige `verified` + réponses + pas de blocage revue.
 */
export function isAutoScoreableQcm(question: Question): boolean {
  if (question.type === 'open') return false
  if (question.verificationStatus !== 'verified') return false
  if (!question.correctChoiceIds?.length) return false
  if (question.type === 'single' && question.correctChoiceIds.length !== 1) return false
  if (hasIllustrationGap(question)) return false

  const review = getReviewDecision(question.id)
  if (review?.notScoreable) return false
  if (review?.obsoleteForCurrentExam) return false

  // Blocage prioritaire non levé par une décision explicite « ok pour notation ».
  if (listBlockingAnomalyIds().has(question.id) && !review?.clearedForScoring) {
    return false
  }

  return true
}

export interface SubjectCorrectionStats {
  subject: SubjectCode
  total: number
  withSuggestion: number
  verified: number
  withoutSuggestion: number
  priorityReview: number
  evaluableQcm: number
  coveragePercent: number
}

export interface CorrectionsDashboardStats {
  totalQuestions: number
  totalSuggestions: number
  totalVerified: number
  coveragePercent: number
  withoutSuggestion: number
  priorityReview: number
  evaluableQcm: number
  bySubject: SubjectCorrectionStats[]
}

export function computeCorrectionsDashboard(questions: Question[]): CorrectionsDashboardStats {
  const bySubject: SubjectCorrectionStats[] = VTC_SUBJECTS.map((subject) => {
    const qs = questions.filter((q) => q.subject === subject)
    const withSuggestion = qs.filter((q) => Boolean(getActiveSuggestionForQuestion(q.id))).length
    const verified = qs.filter((q) => q.verificationStatus === 'verified').length
    const withoutSuggestion = qs.filter(
      (q) => q.verificationStatus !== 'verified' && !getActiveSuggestionForQuestion(q.id),
    ).length
    const priorityReview = qs.filter((q) => Boolean(getPriorityAnomaly(q.id))).length
    const evaluableQcm = qs.filter((q) => isAutoScoreableQcm(q)).length
    return {
      subject,
      total: qs.length,
      withSuggestion,
      verified,
      withoutSuggestion,
      priorityReview,
      evaluableQcm,
      coveragePercent: qs.length ? Math.round((verified / qs.length) * 100) : 0,
    }
  })

  const totalQuestions = questions.length
  const totalVerified = questions.filter((q) => q.verificationStatus === 'verified').length
  const totalSuggestions = questions.filter((q) =>
    Boolean(getActiveSuggestionForQuestion(q.id)),
  ).length
  const withoutSuggestion = questions.filter(
    (q) => q.verificationStatus !== 'verified' && !getActiveSuggestionForQuestion(q.id),
  ).length
  const priorityReview = questions.filter((q) => Boolean(getPriorityAnomaly(q.id))).length
  const evaluableQcm = questions.filter((q) => isAutoScoreableQcm(q)).length

  return {
    totalQuestions,
    totalSuggestions,
    totalVerified,
    coveragePercent: totalQuestions ? Math.round((totalVerified / totalQuestions) * 100) : 0,
    withoutSuggestion,
    priorityReview,
    evaluableQcm,
    bySubject,
  }
}

export function countEvaluableInPool(questions: Question[]): number {
  return questions.filter((q) => isAutoScoreableQcm(q)).length
}

/** Conservé pour affichage : verified (QCM ou QRC) sans scoring auto QRC. */
export function isVerifiedCorrection(question: Question): boolean {
  return isScorable(question)
}
