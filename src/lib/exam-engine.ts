import type { AttemptAnswer, Question } from '@/types/exam'

export function isScorable(question: Question): boolean {
  return (
    question.verificationStatus === 'verified' &&
    ((question.type === 'open' && Boolean(question.openReferenceAnswer)) ||
      (question.type !== 'open' && Boolean(question.correctChoiceIds?.length)))
  )
}

export function areChoiceSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((id, i) => id === sb[i])
}

/**
 * Évalue une réponse.
 * Retourne isCorrect = null et scored = false si la correction n'est pas vérifiée.
 * Ne jamais compter une question non vérifiée comme juste ou fausse.
 */
export function evaluateAnswer(
  question: Question,
  selectedChoiceIds: string[] = [],
  openText = '',
): Pick<AttemptAnswer, 'isCorrect' | 'scored'> {
  if (!isScorable(question)) {
    return { isCorrect: null, scored: false }
  }

  if (question.type === 'open') {
    // Notation automatique officielle non supportée pour les QRC.
    // On ne marque pas comme correct/incorrect automatiquement.
    void openText
    return { isCorrect: null, scored: false }
  }

  const expected = question.correctChoiceIds ?? []
  return {
    isCorrect: areChoiceSetsEqual(selectedChoiceIds, expected),
    scored: true,
  }
}

export function computeAttemptTotals(answers: AttemptAnswer[]): {
  scoreableCount: number
  correctCount: number
  unansweredCount: number
} {
  const scoreable = answers.filter((a) => a.scored)
  return {
    scoreableCount: scoreable.length,
    correctCount: scoreable.filter((a) => a.isCorrect === true).length,
    unansweredCount: answers.filter(
      (a) =>
        (!a.selectedChoiceIds || a.selectedChoiceIds.length === 0) &&
        !a.openText?.trim(),
    ).length,
  }
}

export function filterVtcQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.scope === 'common' || q.scope === 'vtc')
}

export function daysUntil(targetIsoDate: string, now = new Date()): number {
  const [y, m, d] = targetIsoDate.split('-').map(Number)
  if (!y || !m || !d) return NaN
  const targetUtc = Date.UTC(y, m - 1, d)
  const startUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((targetUtc - startUtc) / (1000 * 60 * 60 * 24))
}
