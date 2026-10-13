import { describe, expect, it } from 'vitest'
import {
  analyzeOfficialCoverage,
  buildExamResultSummary,
  createDeadlineAt,
  createOfficialExam,
  createTrainingExam,
  isAnswerFilled,
  remainingMs,
  saveExamDraftAnswer,
  submitExam,
} from '@/lib/mock-exam-engine'
import type { Question } from '@/types/exam'

function makeQuestion(
  partial: Partial<Question> & Pick<Question, 'id' | 'subject' | 'type'>,
): Question {
  return {
    scope: partial.subject === 'FV' || partial.subject === 'GV' ? 'vtc' : 'common',
    year: 2022,
    number: 1,
    stem: `Stem ${partial.id}`,
    choices:
      partial.type === 'open'
        ? []
        : [
            { id: 'a', label: 'A', text: '1' },
            { id: 'b', label: 'B', text: '2' },
          ],
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

function bankForOfficial(): Question[] {
  const questions: Question[] = []
  const specs: Array<{ subject: Question['subject']; qcm: number; qrc: number }> = [
    { subject: 'A', qcm: 10, qrc: 5 },
    { subject: 'B', qcm: 16, qrc: 2 },
    { subject: 'C', qcm: 20, qrc: 0 },
    { subject: 'D', qcm: 7, qrc: 3 },
    { subject: 'E', qcm: 20, qrc: 0 },
    { subject: 'FV', qcm: 12, qrc: 4 },
    { subject: 'GV', qcm: 6, qrc: 2 },
  ]
  let i = 0
  for (const spec of specs) {
    for (let n = 0; n < spec.qcm; n++) {
      i += 1
      questions.push(
        makeQuestion({
          id: `${spec.subject}-qcm-${n}`,
          subject: spec.subject,
          type: 'single',
          number: n + 1,
        }),
      )
    }
    for (let n = 0; n < spec.qrc; n++) {
      i += 1
      questions.push(
        makeQuestion({
          id: `${spec.subject}-qrc-${n}`,
          subject: spec.subject,
          type: 'open',
          number: 100 + n,
          openReferenceAnswer: 'Réf.',
          verificationStatus: 'needs_review',
        }),
      )
    }
  }
  void i
  return questions
}

describe('mock-exam-engine', () => {
  it('crée un entraînement sans inventer de questions', () => {
    const pool = Array.from({ length: 25 }, (_, index) =>
      makeQuestion({ id: `t-${index}`, subject: 'A', type: 'single' }),
    )
    const session = createTrainingExam(pool, {
      count: 60,
      subjects: 'all',
      years: 'all',
      timerEnabled: true,
      durationMinutes: 30,
      revealMode: 'at_end',
      shuffleChoices: true,
    })
    expect('error' in session).toBe(false)
    if ('error' in session) return
    expect(session.questionIds).toHaveLength(25)
    expect(session.config.isPartialSimulation).toBe(true)
    expect(session.config.deadlineAt).toBeTruthy()
  })

  it('calcule le temps restant via deadline murale', () => {
    const now = Date.UTC(2026, 9, 13, 12, 0, 0)
    const deadline = createDeadlineAt(10_000, now)
    expect(remainingMs(deadline, now + 4_000)).toBe(6_000)
    expect(remainingMs(deadline, now + 15_000)).toBe(0)
  })

  it('constitue une simulation officielle complète quand le stock le permet', () => {
    const session = createOfficialExam(bankForOfficial())
    expect('error' in session).toBe(false)
    if ('error' in session) return
    expect(session.config.papers).toHaveLength(7)
    expect(session.config.isPartialSimulation).toBe(false)
    expect(session.config.simulationCertifiable).toBe(false)
    expect(session.questionIds.length).toBe(10 + 5 + 16 + 2 + 20 + 7 + 3 + 20 + 12 + 4 + 6 + 2)
  })

  it('signale une couverture partielle', () => {
    const coverage = analyzeOfficialCoverage([
      makeQuestion({ id: '1', subject: 'A', type: 'single' }),
    ])
    const a = coverage.find((c) => c.subject === 'A')
    expect(a?.qcmOk).toBe(false)
  })

  it('n’évalue jamais une question non vérifiée comme fausse', () => {
    const q = makeQuestion({ id: 'u1', subject: 'C', type: 'single' })
    const created = createTrainingExam([q], {
      count: 20,
      subjects: 'all',
      years: 'all',
      timerEnabled: false,
      durationMinutes: 30,
      revealMode: 'at_end',
      shuffleChoices: false,
    })
    expect('error' in created).toBe(false)
    if ('error' in created) return

    const drafted = saveExamDraftAnswer(created, ['a'], '', 1000)
    expect(isAnswerFilled(drafted.answers[0]!)).toBe(true)
    const finished = submitExam(drafted, new Map([[q.id, q]]), 'user')
    expect(finished.answers[0]?.scored).toBe(false)
    expect(finished.answers[0]?.isCorrect).toBeNull()
    expect(finished.incorrectCount).toBe(0)

    const summary = buildExamResultSummary(finished, new Map([[q.id, q]]))
    expect(summary.admissionLabel).not.toBe('indeterminate')
    expect(summary.certifiable).toBe(false)
    expect(summary.incorrectCount).toBe(0)
  })
})
