import { useEffect, useMemo, useRef, useState } from 'react'
import { CorrectionFeedback } from '@/components/exam/CorrectionFeedback'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { SUBJECTS } from '@/data/subjects'
import { useVtcQuestions } from '@/hooks/useQuestions'
import { getProgressStore } from '@/lib/persistence/local-adapter'
import {
  completeSession,
  createReviewSession,
  goToIndex,
  sessionProgress,
  toggleChoiceSelection,
  validateCurrentAnswer,
  type ReviewSessionConfig,
} from '@/lib/session-engine'
import { cn } from '@/lib/utils'
import type { StudySession, SubjectCode } from '@/types/exam'

export function ReviewPage() {
  const { questions, loading } = useVtcQuestions()
  const [session, setSession] = useState<StudySession | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    void getProgressStore()
      .getActiveSession()
      .then((active) => {
        if (active && active.mode === 'review' && active.status === 'in_progress') {
          setSession(active)
        }
        setBootstrapped(true)
      })
  }, [])

  async function persist(next: StudySession | null) {
    setSession(next)
    const store = getProgressStore()
    await store.saveActiveSession(next)
    if (next) await store.saveSession(next)
  }

  if (!bootstrapped || loading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>
  }

  if (session && session.status === 'in_progress') {
    return (
      <ReviewSessionView
        session={session}
        questions={questions}
        onChange={(next) => void persist(next)}
        onFinish={async (finished) => {
          await persist(null)
          await getProgressStore().saveSession(finished)
          setSession(finished)
        }}
      />
    )
  }

  if (session && session.status === 'completed') {
    return (
      <ReviewSummary
        session={session}
        onRestart={() => setSession(null)}
      />
    )
  }

  return (
    <ReviewSetup
      questionsCount={questions.length}
      onStart={async (config) => {
        const created = createReviewSession(questions, config)
        if ('error' in created) {
          window.alert(created.error)
          return
        }
        await persist(created)
      }}
    />
  )
}

function ReviewSetup({
  questionsCount,
  onStart,
}: {
  questionsCount: number
  onStart: (config: ReviewSessionConfig) => void
}) {
  const [subjects, setSubjects] = useState<SubjectCode[] | 'all'>('all')
  const [years, setYears] = useState<number[] | 'all'>('all')
  const [count, setCount] = useState(10)
  const [verificationFilter, setVerificationFilter] =
    useState<ReviewSessionConfig['verificationFilter']>('all')

  function toggleSubject(code: SubjectCode) {
    setSubjects((prev) => {
      if (prev === 'all') return [code]
      if (prev.includes(code)) {
        const next = prev.filter((c) => c !== code)
        return next.length ? next : 'all'
      }
      return [...prev, code]
    })
  }

  return (
    <div>
      <PageHeader
        title="Réviser"
        description="Lancez une session interactive. Les questions non vérifiées restent consultables mais hors score."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>{questionsCount} questions VTC disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Matières</Label>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={subjects === 'all'}
                  onClick={() => setSubjects('all')}
                >
                  Toutes
                </Chip>
                {SUBJECTS.map((s) => (
                  <Chip
                    key={s.code}
                    active={subjects !== 'all' && subjects.includes(s.code)}
                    onClick={() => toggleSubject(s.code)}
                  >
                    {s.shortLabel}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Année</Label>
              <div className="flex flex-wrap gap-2">
                <Chip active={years === 'all'} onClick={() => setYears('all')}>
                  Toutes
                </Chip>
                {[2021, 2022].map((y) => (
                  <Chip
                    key={y}
                    active={years !== 'all' && years.includes(y)}
                    onClick={() =>
                      setYears((prev) => {
                        if (prev === 'all') return [y]
                        if (prev.includes(y)) {
                          const next = prev.filter((item) => item !== y)
                          return next.length ? next : 'all'
                        }
                        return [...prev, y]
                      })
                    }
                  >
                    {y}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Nombre de questions</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={60}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>Corrections</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'Toutes'],
                    ['evaluable', 'QCM évaluables'],
                    ['verified', 'Vérifiées'],
                    ['unverified', 'Non vérifiées'],
                  ] as const
                ).map(([value, label]) => (
                  <Chip
                    key={value}
                    active={verificationFilter === value}
                    onClick={() => setVerificationFilter(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            <Button
              onClick={() =>
                onStart({
                  subjects,
                  years,
                  count,
                  verificationFilter,
                })
              }
            >
              Démarrer la session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1–4 : sélectionner une proposition</p>
            <p>Entrée : valider</p>
            <p>← → : question précédente / suivante</p>
            <p>Inactifs pendant la saisie texte.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReviewSessionView({
  session,
  questions,
  onChange,
  onFinish,
}: {
  session: StudySession
  questions: ReturnType<typeof useVtcQuestions>['questions']
  onChange: (session: StudySession) => void
  onFinish: (session: StudySession) => void
}) {
  const questionMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  )
  const questionId = session.questionIds[session.currentIndex]!
  const question = questionMap.get(questionId)
  const answer = session.answers[session.currentIndex]!
  const [selected, setSelected] = useState<string[]>(answer.selectedChoiceIds ?? [])
  const [openText, setOpenText] = useState(answer.openText ?? '')
  const startedAt = useRef(Date.now())
  const progress = sessionProgress(session)

  useEffect(() => {
    setSelected(answer.selectedChoiceIds ?? [])
    setOpenText(answer.openText ?? '')
    startedAt.current = Date.now()
  }, [session.currentIndex, answer.selectedChoiceIds, answer.openText])

  useEffect(() => {
    if (!question) return

    function onKeyDown(event: KeyboardEvent) {
      const currentQuestion = question
      if (!currentQuestion) return

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      if (
        ['1', '2', '3', '4'].includes(event.key) &&
        currentQuestion.type !== 'open' &&
        !answer.validated
      ) {
        const index = Number(event.key) - 1
        const choice = currentQuestion.choices[index]
        if (choice) {
          event.preventDefault()
          setSelected((prev) => toggleChoiceSelection(currentQuestion, prev, choice.id))
        }
      }

      if (event.key === 'Enter' && !answer.validated) {
        event.preventDefault()
        const elapsed = Date.now() - startedAt.current
        onChange(validateCurrentAnswer(session, currentQuestion, selected, openText, elapsed))
      }

      if (event.key === 'ArrowRight' && answer.validated) {
        event.preventDefault()
        if (session.currentIndex >= session.questionIds.length - 1) {
          onFinish(completeSession(session))
        } else {
          onChange(goToIndex(session, session.currentIndex + 1))
        }
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onChange(goToIndex(session, session.currentIndex - 1))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [answer.validated, question, onChange, onFinish, openText, selected, session])

  if (!question) {
    return <p className="text-sm text-destructive">Question introuvable dans la banque.</p>
  }

  const activeQuestion = question

  function handleValidate() {
    if (answer.validated) return
    const elapsed = Date.now() - startedAt.current
    onChange(validateCurrentAnswer(session, activeQuestion, selected, openText, elapsed))
  }

  function goNext() {
    if (session.currentIndex >= session.questionIds.length - 1) {
      const finished = completeSession(session)
      onFinish(finished)
      return
    }
    onChange(goToIndex(session, session.currentIndex + 1))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Session de révision</h1>
          <p className="text-sm text-muted-foreground">
            Question {progress.current} / {progress.total} · {progress.validated} validées
          </p>
        </div>
        <Badge variant="secondary">{progress.percent}%</Badge>
      </div>
      <Progress value={progress.percent} />

      <QuestionCard
        question={activeQuestion}
        selectedChoiceIds={selected}
        openText={openText}
        disabled={answer.validated}
        showFeedback={answer.validated}
        onToggleChoice={(id) =>
          setSelected((prev) => toggleChoiceSelection(activeQuestion, prev, id))
        }
        onOpenTextChange={setOpenText}
      />

      {answer.validated ? (
        <CorrectionFeedback
          question={activeQuestion}
          isCorrect={answer.isCorrect}
          scored={answer.scored}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={session.currentIndex === 0}
          onClick={() => onChange(goToIndex(session, session.currentIndex - 1))}
        >
          Précédente
        </Button>
        {!answer.validated ? (
          <Button
            onClick={handleValidate}
            disabled={question.type === 'open' ? !openText.trim() : selected.length === 0}
          >
            Valider
          </Button>
        ) : (
          <Button onClick={goNext}>
            {session.currentIndex >= session.questionIds.length - 1
              ? 'Terminer la session'
              : 'Suivante'}
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewSummary({
  session,
  onRestart,
}: {
  session: StudySession
  onRestart: () => void
}) {
  return (
    <div>
      <PageHeader title="Session terminée" description="Résumé de votre révision." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Correctes" value={String(session.correctCount)} />
        <Stat label="Incorrectes" value={String(session.incorrectCount)} />
        <Stat label="Non évaluables" value={String(session.nonEvaluableCount)} />
        <Stat
          label="Durée"
          value={`${Math.round(session.totalDurationMs / 1000)} s`}
        />
      </div>
      <Button onClick={onRestart}>Nouvelle session</Button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-display text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}
