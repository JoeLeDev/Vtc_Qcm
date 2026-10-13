import { describe, expect, it } from 'vitest'
import {
  areChoiceSetsEqual,
  computeAttemptTotals,
  daysUntil,
  evaluateAnswer,
  isScorable,
} from '@/lib/exam-engine'
import type { Question } from '@/types/exam'

function baseQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'test-1',
    subject: 'A',
    scope: 'common',
    year: 2022,
    number: 1,
    stem: 'Question test ?',
    choices: [
      { id: 'a', label: 'A', text: 'Oui' },
      { id: 'b', label: 'B', text: 'Non' },
    ],
    type: 'single',
    origin: 'official_annals',
    sourceDocument: 'test.pdf',
    sourceExamTitle: 'Test',
    pdfPage: 1,
    verificationStatus: 'unverified',
    lifecycleStatus: 'active',
    hasIllustration: false,
    ...overrides,
  }
}

describe('exam-engine', () => {
  it('ne score pas une question non vérifiée', () => {
    const q = baseQuestion()
    expect(isScorable(q)).toBe(false)
    expect(evaluateAnswer(q, ['a'])).toEqual({ isCorrect: null, scored: false })
  })

  it('ne score pas needs_review comme une réussite/échec', () => {
    const q = baseQuestion({
      verificationStatus: 'needs_review',
      type: 'open',
      openReferenceAnswer: 'Réponse de référence',
      choices: [],
    })
    expect(isScorable(q)).toBe(false)
    expect(evaluateAnswer(q, [], 'Réponse de référence')).toEqual({
      isCorrect: null,
      scored: false,
    })
  })

  it('évalue un QCM simple vérifié', () => {
    const q = baseQuestion({
      verificationStatus: 'verified',
      correctChoiceIds: ['a'],
      lastRegulatoryCheck: '2026-10-13',
    })
    expect(evaluateAnswer(q, ['a'])).toEqual({ isCorrect: true, scored: true })
    expect(evaluateAnswer(q, ['b'])).toEqual({ isCorrect: false, scored: true })
  })

  it('évalue un QCM multiple vérifié indépendamment de l’ordre', () => {
    const q = baseQuestion({
      type: 'multiple',
      verificationStatus: 'verified',
      correctChoiceIds: ['a', 'b'],
      choices: [
        { id: 'a', label: 'A', text: '1' },
        { id: 'b', label: 'B', text: '2' },
        { id: 'c', label: 'C', text: '3' },
      ],
    })
    expect(areChoiceSetsEqual(['b', 'a'], ['a', 'b'])).toBe(true)
    expect(evaluateAnswer(q, ['b', 'a'])).toEqual({ isCorrect: true, scored: true })
    expect(evaluateAnswer(q, ['a'])).toEqual({ isCorrect: false, scored: true })
  })

  it('calcule les totaux en ignorant les non scorés', () => {
    const totals = computeAttemptTotals([
      {
        questionId: '1',
        selectedChoiceIds: ['a'],
        isCorrect: true,
        scored: true,
        timeSpentMs: 1000,
      },
      {
        questionId: '2',
        selectedChoiceIds: ['b'],
        isCorrect: null,
        scored: false,
        timeSpentMs: 1000,
      },
      {
        questionId: '3',
        selectedChoiceIds: [],
        isCorrect: null,
        scored: false,
        timeSpentMs: 0,
      },
    ])
    expect(totals).toEqual({
      scoreableCount: 1,
      correctCount: 1,
      unansweredCount: 1,
    })
  })

  it('calcule les jours restants jusqu’à l’objectif', () => {
    const days = daysUntil('2027-01-26', new Date(2026, 9, 13))
    expect(days).toBe(105)
  })

})
