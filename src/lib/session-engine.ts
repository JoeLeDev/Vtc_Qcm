import { isAutoScoreableQcm } from '@/lib/evaluability'
import { evaluateAnswer, isScorable } from '@/lib/exam-engine'
import type {
  Question,
  StudySession,
  StudySessionAnswer,
  SubjectCode,
  VerificationStatus,
} from '@/types/exam'

export interface ReviewSessionConfig {
  subjects: SubjectCode[] | 'all'
  years: number[] | 'all'
  count: number
  verificationFilter: 'all' | 'verified' | 'unverified' | 'evaluable'
}

export function filterQuestionsForReview(
  questions: Question[],
  config: ReviewSessionConfig,
): Question[] {
  return questions.filter((q) => {
    if (config.subjects !== 'all' && !config.subjects.includes(q.subject as SubjectCode)) {
      return false
    }
    if (config.years !== 'all' && !config.years.includes(q.year)) return false
    if (config.verificationFilter === 'evaluable') return isAutoScoreableQcm(q)
    if (config.verificationFilter === 'verified' && q.verificationStatus !== 'verified') {
      return false
    }
    if (
      config.verificationFilter === 'unverified' &&
      q.verificationStatus === 'verified'
    ) {
      return false
    }
    return true
  })
}

export function shuffleIds(ids: string[]): string[] {
  const copy = [...ids]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function createReviewSession(
  questions: Question[],
  config: ReviewSessionConfig,
): StudySession | { error: string } {
  const pool = filterQuestionsForReview(questions, config)
  if (pool.length === 0) {
    return { error: 'Aucune question ne correspond à ces filtres.' }
  }
  const selected = shuffleIds(pool.map((q) => q.id)).slice(0, Math.min(config.count, pool.length))
  const now = new Date().toISOString()
  return {
    id: `review-${crypto.randomUUID()}`,
    mode: 'review',
    status: 'in_progress',
    startedAt: now,
    updatedAt: now,
    questionIds: selected,
    currentIndex: 0,
    answers: selected.map((questionId) => ({
      questionId,
      selectedChoiceIds: [],
      openText: '',
      validated: false,
      isCorrect: null,
      scored: false,
      timeSpentMs: 0,
    })),
    config: {
      subjects: config.subjects === 'all' ? undefined : config.subjects,
      years: config.years === 'all' ? undefined : config.years,
      count: selected.length,
      verificationFilter: config.verificationFilter,
      revealMode: 'after_each',
    },
    scoreableCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    nonEvaluableCount: 0,
    totalDurationMs: 0,
  }
}

export function toggleChoiceSelection(
  question: Question,
  current: string[],
  choiceId: string,
): string[] {
  if (question.type === 'single') return [choiceId]
  if (current.includes(choiceId)) return current.filter((id) => id !== choiceId)
  return [...current, choiceId]
}

export function validateCurrentAnswer(
  session: StudySession,
  question: Question,
  selectedChoiceIds: string[],
  openText: string,
  elapsedMs: number,
): StudySession {
  const evaluation = evaluateAnswer(question, selectedChoiceIds, openText)
  const answers = session.answers.map((answer, index) => {
    if (index !== session.currentIndex) return answer
    const updated: StudySessionAnswer = {
      ...answer,
      selectedChoiceIds,
      openText,
      validated: true,
      isCorrect: evaluation.isCorrect,
      scored: evaluation.scored,
      timeSpentMs: answer.timeSpentMs + elapsedMs,
    }
    return updated
  })

  return recalculateSession({
    ...session,
    answers,
    updatedAt: new Date().toISOString(),
    totalDurationMs: session.totalDurationMs + elapsedMs,
  })
}

export function recalculateSession(session: StudySession): StudySession {
  const validated = session.answers.filter((a) => a.validated)
  const scoreable = validated.filter((a) => a.scored)
  return {
    ...session,
    scoreableCount: scoreable.length,
    correctCount: scoreable.filter((a) => a.isCorrect === true).length,
    incorrectCount: scoreable.filter((a) => a.isCorrect === false).length,
    nonEvaluableCount: validated.filter((a) => !a.scored).length,
  }
}

export function goToIndex(session: StudySession, index: number): StudySession {
  if (index < 0 || index >= session.questionIds.length) return session
  return { ...session, currentIndex: index, updatedAt: new Date().toISOString() }
}

export function completeSession(session: StudySession): StudySession {
  return {
    ...session,
    status: 'completed',
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function verificationLabel(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'Correction vérifiée'
    case 'needs_review':
      return 'Correction en attente de vérification'
    default:
      return 'Correction en attente de vérification'
  }
}

export function sessionProgress(session: StudySession): {
  current: number
  total: number
  validated: number
  percent: number
} {
  const validated = session.answers.filter((a) => a.validated).length
  const total = session.questionIds.length
  return {
    current: session.currentIndex + 1,
    total,
    validated,
    percent: total === 0 ? 0 : Math.round((validated / total) * 100),
  }
}

export { isScorable }
