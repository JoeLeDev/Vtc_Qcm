import { beforeEach, describe, expect, it } from 'vitest'
import {
  exportProgressBackup,
  importProgressBackup,
  saveOverlayForQuestion,
  saveReviewDecision,
} from '@/lib/corrections'
import {
  computeCorrectionsDashboard,
  hasIllustrationGap,
  isAutoScoreableQcm,
} from '@/lib/evaluability'
import { evaluateAnswer, isScorable } from '@/lib/exam-engine'
import { createTrainingExam, filterTrainingPool } from '@/lib/mock-exam-engine'
import { createReviewSession } from '@/lib/session-engine'
import { migrateLocalStorage } from '@/lib/storage-migration'
import type { Question } from '@/types/exam'

function qcm(overrides: Partial<Question> = {}): Question {
  return {
    id: '2022-A-q99-eval',
    subject: 'A',
    scope: 'common',
    year: 2022,
    number: 99,
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

describe('évaluabilité Phase 6', () => {
  beforeEach(() => {
    localStorage.clear()
    migrateLocalStorage()
  })

  it('exige une validation humaine : suggested ne rend pas évaluable', () => {
    const q = qcm()
    expect(isAutoScoreableQcm(q)).toBe(false)
    expect(isScorable(q)).toBe(false)
  })

  it('rend un QCM évaluable seulement après verified + réponses', () => {
    const raw = qcm()
    saveOverlayForQuestion(raw, {
      correctChoiceIds: ['a'],
      explanation: 'Explication pédagogique contrôlée.',
      justificationRef: 'Code des transports',
      markVerified: true,
    })
    const verified = {
      ...raw,
      verificationStatus: 'verified' as const,
      correctChoiceIds: ['a'],
    }
    expect(isAutoScoreableQcm(verified)).toBe(true)
    expect(evaluateAnswer(verified, ['a'])).toEqual({ isCorrect: true, scored: true })
  })

  it('exclut les QRC de la notation automatique', () => {
    const open = qcm({
      id: '2022-A-q98-open',
      type: 'open',
      choices: [],
      verificationStatus: 'verified',
      openReferenceAnswer: 'Réponse indicative',
      correctChoiceIds: undefined,
    })
    expect(isScorable(open)).toBe(true)
    expect(isAutoScoreableQcm(open)).toBe(false)
    expect(evaluateAnswer(open, [], 'Réponse indicative')).toEqual({
      isCorrect: null,
      scored: false,
    })
  })

  it('bloque les questions à illustration manquante prioritaire', () => {
    const missing = qcm({
      id: '2021-E-q01-838fcf42',
      subject: 'E',
      year: 2021,
      number: 1,
      verificationStatus: 'verified',
      correctChoiceIds: ['c'],
      hasIllustration: false,
    })
    expect(hasIllustrationGap(missing)).toBe(true)
    expect(isAutoScoreableQcm(missing)).toBe(false)
  })

  it('exclut les questions marquées non exploitables ou obsolètes examen', () => {
    const verified = qcm({
      verificationStatus: 'verified',
      correctChoiceIds: ['a'],
    })
    expect(isAutoScoreableQcm(verified)).toBe(true)
    saveReviewDecision(
      { questionId: verified.id, notScoreable: true, note: 'Ambiguë' },
      'mark_not_scoreable',
    )
    expect(isAutoScoreableQcm(verified)).toBe(false)

    saveReviewDecision(
      {
        questionId: verified.id,
        notScoreable: false,
        obsoleteForCurrentExam: true,
        note: 'Obsolète 2026',
      },
      'add_review_note',
    )
    expect(isAutoScoreableQcm(verified)).toBe(false)
  })

  it('filtre le pool d’entraînement évaluable et tronque sans inventer', () => {
    const bank = [
      qcm({
        id: 'e1',
        verificationStatus: 'verified',
        correctChoiceIds: ['a'],
      }),
      qcm({
        id: 'e2',
        number: 2,
        verificationStatus: 'verified',
        correctChoiceIds: ['b'],
      }),
      qcm({ id: 'u1', number: 3, verificationStatus: 'unverified' }),
    ]
    const pool = filterTrainingPool(bank, {
      subjects: 'all',
      years: 'all',
      evaluableOnly: true,
    })
    expect(pool).toHaveLength(2)
    const session = createTrainingExam(bank, {
      count: 20,
      subjects: 'all',
      years: 'all',
      timerEnabled: false,
      durationMinutes: 60,
      revealMode: 'at_end',
      shuffleChoices: false,
      evaluableOnly: true,
    })
    expect('error' in session).toBe(false)
    if ('error' in session) return
    expect(session.questionIds).toHaveLength(2)
    expect(session.config.count).toBe(2)
    expect(session.config.isPartialSimulation).toBe(true)
  })

  it('crée une session révision filtrée évaluable', () => {
    const bank = [
      qcm({
        id: 'r1',
        verificationStatus: 'verified',
        correctChoiceIds: ['a'],
      }),
      qcm({ id: 'r2', number: 2 }),
    ]
    const session = createReviewSession(bank, {
      subjects: 'all',
      years: 'all',
      count: 20,
      verificationFilter: 'evaluable',
    })
    expect('error' in session).toBe(false)
    if ('error' in session) return
    expect(session.questionIds).toEqual(['r1'])
  })

  it('conserve overlays, suggestions et décisions après réimport backup', async () => {
    const raw = qcm({ id: '2022-A-q01-backup' })
    saveOverlayForQuestion(raw, {
      correctChoiceIds: ['a'],
      explanation: 'Validée',
      justificationRef: 'Réf',
      markVerified: true,
    })
    saveReviewDecision(
      { questionId: raw.id, note: 'OK après revue', clearedForScoring: true },
      'clear_scoring_block',
    )
    const backup = await exportProgressBackup()
    localStorage.clear()
    migrateLocalStorage()
    expect(importProgressBackup(backup).ok).toBe(true)
    const restored = {
      ...raw,
      verificationStatus: 'verified' as const,
      correctChoiceIds: ['a'],
    }
    expect(isAutoScoreableQcm(restored)).toBe(true)
  })

  it('calcule le dashboard sans inventer de verified', () => {
    const stats = computeCorrectionsDashboard([
      qcm({ id: 'd1', subject: 'A' }),
      qcm({ id: 'd2', subject: 'B', number: 2 }),
    ])
    expect(stats.totalVerified).toBe(0)
    expect(stats.evaluableQcm).toBe(0)
    expect(stats.bySubject.find((s) => s.subject === 'A')?.total).toBe(1)
  })
})
