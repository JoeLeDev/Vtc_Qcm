import { EXAM_RULES } from '@/data/exam-rules'
import { isAutoScoreableQcm } from '@/lib/evaluability'
import { evaluateAnswer } from '@/lib/exam-engine'
import type {
  ExamPaperRuntime,
  ExamResultSummary,
  ExamSubjectResult,
  Question,
  StudySession,
  StudySessionAnswer,
  SubjectCode,
} from '@/types/exam'

export interface TrainingExamConfig {
  count: 20 | 40 | 60
  subjects: SubjectCode[] | 'all'
  years: number[] | 'all'
  timerEnabled: boolean
  /** Minutes si chronomètre activé. */
  durationMinutes: number
  revealMode: 'after_each' | 'at_end'
  shuffleChoices: boolean
  /** Uniquement QCM verified auto-notables (hors QRC). */
  evaluableOnly?: boolean
}

function isQcm(q: Question): boolean {
  return q.type !== 'open'
}

function isQrc(q: Question): boolean {
  return q.type === 'open'
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function createDeadlineAt(durationMs: number, fromMs = Date.now()): string {
  return new Date(fromMs + durationMs).toISOString()
}

/** Temps restant basé sur une deadline absolue (résiste au rechargement). */
export function remainingMs(deadlineAt: string | undefined, nowMs = Date.now()): number | null {
  if (!deadlineAt) return null
  return Math.max(0, new Date(deadlineAt).getTime() - nowMs)
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function isAnswerFilled(answer: StudySessionAnswer): boolean {
  if (answer.openText?.trim()) return true
  return Boolean(answer.selectedChoiceIds && answer.selectedChoiceIds.length > 0)
}

function emptyAnswers(questionIds: string[]): StudySessionAnswer[] {
  return questionIds.map((questionId) => ({
    questionId,
    selectedChoiceIds: [],
    openText: '',
    validated: false,
    isCorrect: null,
    scored: false,
    timeSpentMs: 0,
  }))
}

function buildChoiceOrder(
  questions: Question[],
  shuffleChoices: boolean,
): Record<string, string[]> {
  const order: Record<string, string[]> = {}
  for (const q of questions) {
    const ids = q.choices.map((c) => c.id)
    order[q.id] = shuffleChoices && ids.length > 1 ? shuffleArray(ids) : ids
  }
  return order
}

export function filterTrainingPool(
  questions: Question[],
  config: Pick<TrainingExamConfig, 'subjects' | 'years' | 'evaluableOnly'>,
): Question[] {
  return questions.filter((q) => {
    if (config.subjects !== 'all' && !config.subjects.includes(q.subject as SubjectCode)) {
      return false
    }
    if (config.years !== 'all' && !config.years.includes(q.year)) return false
    if (config.evaluableOnly && !isAutoScoreableQcm(q)) return false
    return true
  })
}

export function createTrainingExam(
  questions: Question[],
  config: TrainingExamConfig,
  nowMs = Date.now(),
): StudySession | { error: string } {
  const pool = filterTrainingPool(questions, config)
  if (pool.length === 0) {
    return { error: 'Aucune question ne correspond à ces filtres.' }
  }

  const selectedCount = Math.min(config.count, pool.length)
  if (selectedCount < config.count) {
    // Pas d'invention : on démarre avec le stock disponible, signalé dans config.count réel.
  }

  const selectedQuestions = shuffleArray(pool).slice(0, selectedCount)
  const questionIds = selectedQuestions.map((q) => q.id)
  const now = new Date(nowMs).toISOString()
  const durationMs = config.timerEnabled ? config.durationMinutes * 60_000 : undefined

  return {
    id: `train-${crypto.randomUUID()}`,
    mode: 'mock_training',
    status: 'in_progress',
    startedAt: now,
    updatedAt: now,
    questionIds,
    currentIndex: 0,
    answers: emptyAnswers(questionIds),
    choiceOrder: buildChoiceOrder(selectedQuestions, config.shuffleChoices),
    config: {
      subjects: config.subjects === 'all' ? undefined : config.subjects,
      years: config.years === 'all' ? undefined : config.years,
      count: questionIds.length,
      timerEnabled: config.timerEnabled,
      durationMs,
      deadlineAt: durationMs ? createDeadlineAt(durationMs, nowMs) : undefined,
      revealMode: config.revealMode,
      shuffleChoices: config.shuffleChoices,
      evaluableOnly: Boolean(config.evaluableOnly),
      simulationCertifiable: false,
      isPartialSimulation: selectedCount < config.count,
    },
    scoreableCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    nonEvaluableCount: 0,
    totalDurationMs: 0,
  }
}

export interface OfficialCoverage {
  subject: SubjectCode
  qcmAvailable: number
  qrcAvailable: number
  qcmNeeded: number
  qrcNeeded: number
  qcmOk: boolean
  qrcOk: boolean
  verifiedCount: number
}

export function analyzeOfficialCoverage(questions: Question[]): OfficialCoverage[] {
  return EXAM_RULES.papers.map((paper) => {
    const pool = questions.filter((q) => q.subject === paper.subject)
    const qcmAvailable = pool.filter(isQcm).length
    const qrcAvailable = pool.filter(isQrc).length
    return {
      subject: paper.subject,
      qcmAvailable,
      qrcAvailable,
      qcmNeeded: paper.qcmCount,
      qrcNeeded: paper.qrcCount,
      qcmOk: qcmAvailable >= paper.qcmCount,
      qrcOk: qrcAvailable >= paper.qrcCount,
      verifiedCount: pool.filter((q) => q.verificationStatus === 'verified').length,
    }
  })
}

function pickTyped(
  pool: Question[],
  count: number,
): { selected: Question[]; missing: number } {
  const shuffled = shuffleArray(pool)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))
  return { selected, missing: Math.max(0, count - selected.length) }
}

export function createOfficialExam(
  questions: Question[],
  nowMs = Date.now(),
): StudySession | { error: string } {
  const papers: ExamPaperRuntime[] = []
  const allSelected: Question[] = []
  let partial = false

  for (const rule of EXAM_RULES.papers) {
    const pool = questions.filter((q) => q.subject === rule.subject)
    const qcmPick = pickTyped(pool.filter(isQcm), rule.qcmCount)
    const qrcPick = pickTyped(pool.filter(isQrc), rule.qrcCount)
    if (qcmPick.missing > 0 || qrcPick.missing > 0) partial = true

    const paperQuestions = shuffleArray([...qcmPick.selected, ...qrcPick.selected])
    if (paperQuestions.length === 0) {
      partial = true
      papers.push({
        subject: rule.subject,
        questionIds: [],
        durationMinutes: rule.durationMinutes,
        coefficient: rule.coefficient,
        eliminatoryBelow: rule.eliminatoryBelow,
        qcmRequested: rule.qcmCount,
        qrcRequested: rule.qrcCount,
        qcmSelected: 0,
        qrcSelected: 0,
        status: 'pending',
      })
      continue
    }

    allSelected.push(...paperQuestions)
    papers.push({
      subject: rule.subject,
      questionIds: paperQuestions.map((q) => q.id),
      durationMinutes: rule.durationMinutes,
      coefficient: rule.coefficient,
      eliminatoryBelow: rule.eliminatoryBelow,
      qcmRequested: rule.qcmCount,
      qrcRequested: rule.qrcCount,
      qcmSelected: qcmPick.selected.length,
      qrcSelected: qrcPick.selected.length,
      status: 'pending',
    })
  }

  if (allSelected.length === 0) {
    return { error: 'Impossible de constituer une simulation : aucune question disponible.' }
  }

  const questionIds = papers.flatMap((p) => p.questionIds)
  const verifiedNeeded = questionIds.length
  const verifiedCount = questions.filter(
    (q) => questionIds.includes(q.id) && q.verificationStatus === 'verified' && q.type !== 'open',
  ).length
  // Certifiable seulement si structure complète et toutes les QCM sélectionnées sont vérifiées
  // (les QRC restent non notées auto → jamais d'admissibilité fiable tant que pas de barème QRC).
  const structureComplete = !partial && papers.every(
    (p) => p.qcmSelected === p.qcmRequested && p.qrcSelected === p.qrcRequested,
  )
  const simulationCertifiable = false // QRC non évaluables auto → jamais « Admis » pour l’instant

  const now = new Date(nowMs).toISOString()
  const firstActiveIndex = papers.findIndex((p) => p.questionIds.length > 0)
  const activeIndex = firstActiveIndex >= 0 ? firstActiveIndex : 0
  const activePaper = papers[activeIndex]
  if (activePaper) {
    activePaper.status = 'active'
    activePaper.startedAt = now
    activePaper.deadlineAt = createDeadlineAt(activePaper.durationMinutes * 60_000, nowMs)
  }

  void verifiedNeeded
  void verifiedCount
  void structureComplete

  return {
    id: `official-${crypto.randomUUID()}`,
    mode: 'mock_official',
    status: 'in_progress',
    startedAt: now,
    updatedAt: now,
    questionIds,
    currentIndex: questionIds.length ? questionIds.indexOf(papers[activeIndex]!.questionIds[0]!) : 0,
    answers: emptyAnswers(questionIds),
    choiceOrder: buildChoiceOrder(allSelected, true),
    config: {
      count: questionIds.length,
      timerEnabled: true,
      revealMode: 'at_end',
      shuffleChoices: true,
      isPartialSimulation: partial || !structureComplete,
      simulationCertifiable,
      papers,
      currentPaperIndex: activeIndex,
    },
    scoreableCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    nonEvaluableCount: 0,
    totalDurationMs: 0,
  }
}

export function getActivePaper(session: StudySession): ExamPaperRuntime | undefined {
  const papers = session.config.papers
  if (!papers?.length) return undefined
  const index = session.config.currentPaperIndex ?? 0
  return papers[index]
}

export function getActivePaperQuestionIndexes(session: StudySession): number[] {
  const paper = getActivePaper(session)
  if (!paper) return session.questionIds.map((_, i) => i)
  return paper.questionIds
    .map((id) => session.questionIds.indexOf(id))
    .filter((i) => i >= 0)
}

export function saveExamDraftAnswer(
  session: StudySession,
  selectedChoiceIds: string[],
  openText: string,
  elapsedMs: number,
): StudySession {
  const answers = session.answers.map((answer, index) => {
    if (index !== session.currentIndex) return answer
    return {
      ...answer,
      selectedChoiceIds,
      openText,
      timeSpentMs: answer.timeSpentMs + elapsedMs,
    }
  })
  return {
    ...session,
    answers,
    updatedAt: new Date().toISOString(),
    totalDurationMs: session.totalDurationMs + elapsedMs,
  }
}

export function evaluateAllAnswers(
  session: StudySession,
  questionsById: Map<string, Question>,
): StudySession {
  const answers = session.answers.map((answer) => {
    const question = questionsById.get(answer.questionId)
    if (!question) return answer
    if (!isAnswerFilled(answer)) {
      return {
        ...answer,
        validated: true,
        isCorrect: null,
        scored: false,
      }
    }
    const evaluation = evaluateAnswer(
      question,
      answer.selectedChoiceIds ?? [],
      answer.openText ?? '',
    )
    return {
      ...answer,
      validated: true,
      isCorrect: evaluation.isCorrect,
      scored: evaluation.scored,
    }
  })

  const scoreable = answers.filter((a) => a.scored)
  return {
    ...session,
    answers,
    scoreableCount: scoreable.length,
    correctCount: scoreable.filter((a) => a.isCorrect === true).length,
    incorrectCount: scoreable.filter((a) => a.isCorrect === false).length,
    nonEvaluableCount: answers.filter((a) => a.validated && !a.scored).length,
    updatedAt: new Date().toISOString(),
  }
}

export function submitExam(
  session: StudySession,
  questionsById: Map<string, Question>,
  endedBy: 'user' | 'timeout' = 'user',
): StudySession {
  const evaluated = evaluateAllAnswers(session, questionsById)
  return {
    ...evaluated,
    status: 'completed',
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    endedBy,
  }
}

export function completeActivePaperAndAdvance(
  session: StudySession,
  nowMs = Date.now(),
): StudySession {
  const papers = session.config.papers
  if (!papers?.length) return session

  const currentIndex = session.config.currentPaperIndex ?? 0
  const updatedPapers = papers.map((paper, index) => {
    if (index !== currentIndex) return paper
    return {
      ...paper,
      status: 'completed' as const,
      completedAt: new Date(nowMs).toISOString(),
    }
  })

  const nextIndex = updatedPapers.findIndex(
    (paper, index) => index > currentIndex && paper.questionIds.length > 0,
  )

  if (nextIndex < 0) {
    return {
      ...session,
      config: {
        ...session.config,
        papers: updatedPapers,
        currentPaperIndex: currentIndex,
      },
      updatedAt: new Date(nowMs).toISOString(),
    }
  }

  const nextPapers = updatedPapers.map((paper, index) => {
    if (index !== nextIndex) return paper
    return {
      ...paper,
      status: 'active' as const,
      startedAt: new Date(nowMs).toISOString(),
      deadlineAt: createDeadlineAt(paper.durationMinutes * 60_000, nowMs),
    }
  })

  const firstQuestionId = nextPapers[nextIndex]!.questionIds[0]!
  const globalIndex = session.questionIds.indexOf(firstQuestionId)

  return {
    ...session,
    currentIndex: globalIndex >= 0 ? globalIndex : session.currentIndex,
    config: {
      ...session.config,
      papers: nextPapers,
      currentPaperIndex: nextIndex,
    },
    updatedAt: new Date(nowMs).toISOString(),
  }
}

export function allPapersCompleted(session: StudySession): boolean {
  const papers = session.config.papers
  if (!papers?.length) return true
  return papers
    .filter((p) => p.questionIds.length > 0)
    .every((p) => p.status === 'completed')
}

export function buildExamResultSummary(
  session: StudySession,
  questionsById: Map<string, Question>,
): ExamResultSummary {
  const bySubjectMap = new Map<SubjectCode, ExamSubjectResult>()

  for (const answer of session.answers) {
    const question = questionsById.get(answer.questionId)
    if (!question) continue
    const subject = question.subject as SubjectCode
    const current = bySubjectMap.get(subject) ?? {
      subject,
      total: 0,
      answered: 0,
      correct: 0,
      incorrect: 0,
      nonEvaluable: 0,
      openUnevaluated: 0,
      scoreable: 0,
    }
    current.total += 1
    if (isAnswerFilled(answer)) current.answered += 1
    if (answer.scored) {
      current.scoreable += 1
      if (answer.isCorrect) current.correct += 1
      else current.incorrect += 1
    } else {
      current.nonEvaluable += 1
      if (question.type === 'open') current.openUnevaluated += 1
    }
    bySubjectMap.set(subject, current)
  }

  const unansweredCount = session.answers.filter((a) => !isAnswerFilled(a)).length
  const openUnevaluatedCount = session.answers.filter((a) => {
    const q = questionsById.get(a.questionId)
    return q?.type === 'open' && a.validated
  }).length
  const unverifiedCount = session.answers.filter((a) => {
    const q = questionsById.get(a.questionId)
    return q && q.type !== 'open' && q.verificationStatus !== 'verified' && a.validated
  }).length

  const partial =
    Boolean(session.config.isPartialSimulation) ||
    session.nonEvaluableCount > 0 ||
    unansweredCount > 0

  const certifiable = Boolean(session.config.simulationCertifiable)

  return {
    sessionId: session.id,
    mode: session.mode,
    partial,
    certifiable,
    treatedCount: session.answers.filter(isAnswerFilled).length,
    correctCount: session.correctCount,
    incorrectCount: session.incorrectCount,
    unverifiedCount,
    openUnevaluatedCount,
    unansweredCount,
    durationMs: session.totalDurationMs,
    bySubject: [...bySubjectMap.values()],
    admissionLabel: certifiable ? 'indeterminate' : partial ? 'partial' : 'non_certifiable',
  }
}

export function orderedChoicesForQuestion(
  question: Question,
  choiceOrder?: Record<string, string[]>,
): Question['choices'] {
  const order = choiceOrder?.[question.id]
  if (!order?.length) return question.choices
  const map = new Map(question.choices.map((c) => [c.id, c]))
  return order.map((id) => map.get(id)).filter(Boolean) as Question['choices']
}
