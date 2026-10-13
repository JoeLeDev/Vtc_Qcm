import { describe, expect, it } from 'vitest'
import { evaluateAnswer } from '@/lib/exam-engine'
import {
  createReviewSession,
  filterQuestionsForReview,
  toggleChoiceSelection,
  validateCurrentAnswer,
} from '@/lib/session-engine'
import type { Question } from '@/types/exam'

function q(partial: Partial<Question> & Pick<Question, 'id' | 'subject' | 'year'>): Question {
  return {
    scope: 'common',
    number: 1,
    stem: 'Stem',
    choices: [
      { id: 'a', label: 'A', text: '1' },
      { id: 'b', label: 'B', text: '2' },
      { id: 'c', label: 'C', text: '3' },
    ],
    type: 'single',
    origin: 'official_annals',
    sourceDocument: 't.pdf',
    sourceExamTitle: 't',
    pdfPage: 1,
    verificationStatus: 'unverified',
    lifecycleStatus: 'active',
    hasIllustration: false,
    ...partial,
  }
}

describe('session-engine', () => {
  const bank: Question[] = [
    q({ id: '1', subject: 'A', year: 2021, verificationStatus: 'verified', correctChoiceIds: ['a'] }),
    q({ id: '2', subject: 'B', year: 2022, verificationStatus: 'unverified' }),
    q({
      id: '3',
      subject: 'A',
      year: 2022,
      type: 'multiple',
      verificationStatus: 'verified',
      correctChoiceIds: ['a', 'c'],
    }),
    q({
      id: '4',
      subject: 'D',
      year: 2021,
      type: 'open',
      choices: [],
      verificationStatus: 'needs_review',
      openReferenceAnswer: 'Réf.',
    }),
  ]

  it('filtre les questions pour une session', () => {
    const filtered = filterQuestionsForReview(bank, {
      subjects: ['A'],
      years: 'all',
      count: 10,
      verificationFilter: 'verified',
    })
    expect(filtered.map((item) => item.id).sort()).toEqual(['1', '3'])
  })

  it('crée une session et ne score pas les non vérifiées', () => {
    const session = createReviewSession(bank, {
      subjects: 'all',
      years: 'all',
      count: 4,
      verificationFilter: 'all',
    })
    expect('error' in session).toBe(false)
    if ('error' in session) return

    const unverified = bank.find((item) => item.id === '2')!
    const next = validateCurrentAnswer(session, unverified, ['a'], '', 1000)
    const answer = next.answers.find((a) => a.questionId === '2')
    // currentIndex may not be 2 — find by forcing index
    void answer
    const forced = {
      ...session,
      currentIndex: session.questionIds.indexOf('2'),
    }
    const evaluated = validateCurrentAnswer(forced, unverified, ['a'], '', 500)
    const a2 = evaluated.answers[forced.currentIndex]!
    expect(a2.scored).toBe(false)
    expect(a2.isCorrect).toBeNull()
    expect(evaluated.nonEvaluableCount).toBe(1)
  })

  it('gère la sélection multiple', () => {
    const multi = bank[2]!
    expect(toggleChoiceSelection(multi, [], 'a')).toEqual(['a'])
    expect(toggleChoiceSelection(multi, ['a'], 'c')).toEqual(['a', 'c'])
    expect(toggleChoiceSelection(multi, ['a', 'c'], 'a')).toEqual(['c'])
    expect(evaluateAnswer(multi, ['c', 'a'])).toEqual({ isCorrect: true, scored: true })
  })

  it('accepte une réponse libre QRC sans notation automatique', () => {
    const open = bank[3]!
    expect(evaluateAnswer(open, [], 'Ma réponse')).toEqual({ isCorrect: null, scored: false })
  })
})
