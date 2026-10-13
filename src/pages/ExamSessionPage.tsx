import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CorrectionFeedback } from '@/components/exam/CorrectionFeedback'
import { ExamTimer } from '@/components/exam/ExamTimer'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { QuestionNavigator } from '@/components/exam/QuestionNavigator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getSubject } from '@/data/subjects'
import { useExamDeadline } from '@/hooks/useExamDeadline'
import { useVtcQuestions } from '@/hooks/useQuestions'
import { evaluateAnswer } from '@/lib/exam-engine'
import {
  allPapersCompleted,
  completeActivePaperAndAdvance,
  getActivePaper,
  getActivePaperQuestionIndexes,
  isAnswerFilled,
  saveExamDraftAnswer,
  submitExam,
} from '@/lib/mock-exam-engine'
import { getProgressStore } from '@/lib/persistence/local-adapter'
import { goToIndex, toggleChoiceSelection } from '@/lib/session-engine'
import type { StudySession } from '@/types/exam'

export function ExamSessionPage() {
  const { questions, loading } = useVtcQuestions()
  const [session, setSession] = useState<StudySession | null>(null)
  const [ready, setReady] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const navigate = useNavigate()
  const startedAt = useRef(Date.now())
  const sessionRef = useRef<StudySession | null>(null)
  const handlingExpire = useRef(false)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    void getProgressStore()
      .getActiveSession()
      .then((active) => {
        if (
          active &&
          (active.mode === 'mock_training' || active.mode === 'mock_official') &&
          active.status === 'in_progress'
        ) {
          setSession(active)
        }
        setReady(true)
      })
  }, [])

  const questionsById = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  )

  async function persist(next: StudySession | null) {
    sessionRef.current = next
    setSession(next)
    const store = getProgressStore()
    await store.saveActiveSession(next)
    if (next) await store.saveSession(next)
  }

  const finalize = useCallback(
    async (current: StudySession, endedBy: 'user' | 'timeout') => {
      const finished = submitExam(current, questionsById, endedBy)
      await getProgressStore().saveSession(finished)
      await getProgressStore().saveActiveSession(null)
      sessionRef.current = null
      setSession(null)
      navigate(`/examens/resultats/${finished.id}`)
    },
    [navigate, questionsById],
  )

  const onExpire = useCallback(() => {
    const current = sessionRef.current
    if (!current || handlingExpire.current) return
    handlingExpire.current = true

    void (async () => {
      if (current.mode === 'mock_official') {
        const advanced = completeActivePaperAndAdvance(current)
        if (allPapersCompleted(advanced)) {
          await finalize(advanced, 'timeout')
          return
        }
        await persist(advanced)
        handlingExpire.current = false
        return
      }
      await finalize(current, 'timeout')
    })()
  }, [finalize])

  const activePaper = session ? getActivePaper(session) : undefined
  const deadlineAt =
    session?.mode === 'mock_official' ? activePaper?.deadlineAt : session?.config.deadlineAt

  const { remaining } = useExamDeadline(deadlineAt, onExpire)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (sessionRef.current?.status === 'in_progress') {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  if (!ready || loading) {
    return <p className="text-sm text-muted-foreground">Chargement de la session…</p>
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucune session d’examen en cours</CardTitle>
          <CardDescription>
            Configurez un entraînement ou une simulation depuis la page Examens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/examens">Retour aux examens</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeSession = session
  const answer = activeSession.answers[activeSession.currentIndex]!
  const question = questionsById.get(activeSession.questionIds[activeSession.currentIndex]!)
  const paperIndexes = getActivePaperQuestionIndexes(activeSession)
  const answeredFlags = activeSession.answers.map(isAnswerFilled)
  const unansweredInPaper = paperIndexes.filter((i) => !answeredFlags[i]).length
  const progressPercent = Math.round(
    (answeredFlags.filter(Boolean).length / Math.max(activeSession.questionIds.length, 1)) * 100,
  )
  const revealNow = activeSession.config.revealMode === 'after_each' && answer.validated
  const minPaper = paperIndexes.length ? Math.min(...paperIndexes) : 0
  const maxPaper = paperIndexes.length ? Math.max(...paperIndexes) : 0

  if (!question) {
    return <p className="text-sm text-destructive">Question introuvable.</p>
  }

  const activeQuestion = question

  function syncDraft(nextSelected: string[], nextOpen: string) {
    const elapsed = Date.now() - startedAt.current
    startedAt.current = Date.now()
    void persist(saveExamDraftAnswer(activeSession, nextSelected, nextOpen, elapsed))
  }

  function go(index: number) {
    const elapsed = Date.now() - startedAt.current
    startedAt.current = Date.now()
    let next = saveExamDraftAnswer(
      activeSession,
      answer.selectedChoiceIds ?? [],
      answer.openText ?? '',
      elapsed,
    )
    next = goToIndex(next, index)
    void persist(next)
  }

  async function handleValidateCurrent() {
    if (activeSession.config.revealMode !== 'after_each' || answer.validated) return
    const elapsed = Date.now() - startedAt.current
    startedAt.current = Date.now()
    const draft = saveExamDraftAnswer(
      activeSession,
      answer.selectedChoiceIds ?? [],
      answer.openText ?? '',
      elapsed,
    )
    const result = evaluateAnswer(
      activeQuestion,
      answer.selectedChoiceIds ?? [],
      answer.openText ?? '',
    )
    const next: StudySession = {
      ...draft,
      answers: draft.answers.map((item, index) =>
        index === draft.currentIndex
          ? {
              ...item,
              validated: true,
              isCorrect: result.isCorrect,
              scored: result.scored,
            }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    }
    await persist(next)
  }

  async function handleSubmitPaperOrExam() {
    const elapsed = Date.now() - startedAt.current
    startedAt.current = Date.now()
    let next = saveExamDraftAnswer(
      activeSession,
      answer.selectedChoiceIds ?? [],
      answer.openText ?? '',
      elapsed,
    )

    if (activeSession.mode === 'mock_official') {
      next = completeActivePaperAndAdvance(next)
      if (allPapersCompleted(next)) {
        await finalize(next, 'user')
        return
      }
      setConfirmSubmit(false)
      await persist(next)
      return
    }

    await finalize(next, 'user')
  }

  return (
    <div className="-mx-4 -mt-2 min-h-[calc(100vh-3.5rem)] bg-background md:-mx-8">
      <div className="sticky top-14 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold">
                {activeSession.mode === 'mock_official' ? 'Simulation officielle' : 'Entraînement'}
              </h1>
              {activeSession.config.isPartialSimulation ? (
                <Badge variant="warning">Simulation partielle</Badge>
              ) : null}
              {!activeSession.config.simulationCertifiable ? (
                <Badge variant="muted">Non certifiable</Badge>
              ) : null}
            </div>
            {activePaper ? (
              <p className="text-sm text-muted-foreground">
                Épreuve {getSubject(activePaper.subject)?.shortLabel ?? activePaper.subject} · coef.{' '}
                {activePaper.coefficient}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Question {activeSession.currentIndex + 1}/{activeSession.questionIds.length}
              </p>
            )}
          </div>
          <ExamTimer remainingMs={remaining} />
        </div>
        <Progress value={progressPercent} className="mt-3" />
      </div>

      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_16rem] md:px-8">
        <div className="space-y-4">
          <QuestionCard
            question={activeQuestion}
            selectedChoiceIds={answer.selectedChoiceIds ?? []}
            openText={answer.openText ?? ''}
            choiceOrder={activeSession.choiceOrder?.[activeQuestion.id]}
            compactMeta
            showFeedback={revealNow}
            disabled={revealNow}
            onToggleChoice={(id) => {
              const nextSelected = toggleChoiceSelection(
                activeQuestion,
                answer.selectedChoiceIds ?? [],
                id,
              )
              syncDraft(nextSelected, answer.openText ?? '')
            }}
            onOpenTextChange={(value) => syncDraft(answer.selectedChoiceIds ?? [], value)}
          />

          {revealNow ? (
            <CorrectionFeedback
              question={activeQuestion}
              isCorrect={answer.isCorrect}
              scored={answer.scored}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={activeSession.currentIndex <= minPaper}
              onClick={() => {
                const pos = paperIndexes.indexOf(activeSession.currentIndex)
                const prev = paperIndexes[pos - 1]
                if (prev !== undefined) go(prev)
              }}
            >
              Précédente
            </Button>
            <Button
              variant="outline"
              disabled={activeSession.currentIndex >= maxPaper}
              onClick={() => {
                const pos = paperIndexes.indexOf(activeSession.currentIndex)
                const nextIndex = paperIndexes[pos + 1]
                if (nextIndex !== undefined) go(nextIndex)
              }}
            >
              Suivante
            </Button>
            {activeSession.config.revealMode === 'after_each' && !answer.validated ? (
              <Button onClick={() => void handleValidateCurrent()}>Valider la réponse</Button>
            ) : null}
            <Button variant="secondary" onClick={() => setConfirmSubmit(true)}>
              {activeSession.mode === 'mock_official' ? 'Terminer l’épreuve' : 'Remettre la copie'}
            </Button>
          </div>
        </div>

        <Card className="h-fit lg:sticky lg:top-36">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vue d’ensemble</CardTitle>
            <CardDescription>
              {unansweredInPaper > 0
                ? `${unansweredInPaper} non répondue(s) sur cette épreuve`
                : 'Toutes les questions de l’épreuve sont répondues'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionNavigator
              total={activeSession.questionIds.length}
              currentIndex={activeSession.currentIndex}
              indexes={paperIndexes}
              answered={answeredFlags}
              onSelect={go}
            />
          </CardContent>
        </Card>
      </div>

      {confirmSubmit ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {activeSession.mode === 'mock_official'
                  ? 'Confirmer la fin de l’épreuve'
                  : 'Confirmer la remise de copie'}
              </CardTitle>
              <CardDescription>
                {unansweredInPaper > 0
                  ? `Attention : ${unansweredInPaper} question(s) non répondue(s).`
                  : 'Vous pourrez consulter les résultats ensuite.'}
                {activeSession.mode === 'mock_official'
                  ? ' Les épreuves suivantes démarreront si disponibles.'
                  : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => void handleSubmitPaperOrExam()}>Confirmer</Button>
              <Button variant="outline" onClick={() => setConfirmSubmit(false)}>
                Continuer
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
