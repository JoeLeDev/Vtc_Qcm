import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { CorrectionFeedback } from '@/components/exam/CorrectionFeedback'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubject } from '@/data/subjects'
import { useVtcQuestions } from '@/hooks/useQuestions'
import {
  buildExamResultSummary,
  formatDuration,
  isAnswerFilled,
} from '@/lib/mock-exam-engine'
import { getProgressStore } from '@/lib/persistence/local-adapter'
import type { StudySession } from '@/types/exam'

export function ExamResultsPage() {
  const { sessionId } = useParams()
  const { questions, loading } = useVtcQuestions()
  const [session, setSession] = useState<StudySession | null>(null)

  useEffect(() => {
    void getProgressStore()
      .listSessions()
      .then((sessions) => {
        const found = sessions.find((s) => s.id === sessionId) ?? null
        setSession(found)
      })
  }, [sessionId])

  const questionsById = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  )

  if (loading || !session) {
    return <p className="text-sm text-muted-foreground">Chargement des résultats…</p>
  }

  const summary = buildExamResultSummary(session, questionsById)

  return (
    <div>
      <PageHeader
        title="Résultats de l’examen blanc"
        description={
          session.mode === 'mock_official'
            ? 'Simulation théorique VTC'
            : 'Entraînement personnalisé'
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/examens">Retour aux examens</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {summary.partial ? <Badge variant="warning">Résultat partiel</Badge> : null}
        {!summary.certifiable ? (
          <Badge variant="muted">Simulation non certifiable</Badge>
        ) : null}
        {session.endedBy === 'timeout' ? <Badge variant="warning">Temps écoulé</Badge> : null}
        <Badge variant="outline">
          {summary.admissionLabel === 'non_certifiable'
            ? 'Admissibilité non déterminable'
            : summary.admissionLabel === 'partial'
              ? 'Évaluation incomplète'
              : 'Indéterminé'}
        </Badge>
      </div>

      <Card className="mb-6 border-amber-300/50 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Aucun statut « Admis » ou « Réussi » n’est affiché : les corrections vérifiées et/ou le barème
          QRC ne permettent pas une admissibilité fiable. Les questions non corrigées ne sont jamais
          comptées comme fausses.
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Questions traitées" value={String(summary.treatedCount)} />
        <Stat label="Bonnes (vérifiées)" value={String(summary.correctCount)} />
        <Stat label="Mauvaises (vérifiées)" value={String(summary.incorrectCount)} />
        <Stat label="Temps utilisé" value={formatDuration(summary.durationMs)} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Sans correction vérifiée" value={String(summary.unverifiedCount)} />
        <Stat label="QRC non évaluées" value={String(summary.openUnevaluatedCount)} />
        <Stat label="Non répondues" value={String(summary.unansweredCount)} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Résultats par matière</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.bySubject.map((row) => (
            <div
              key={row.subject}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {getSubject(row.subject)?.shortLabel ?? row.subject}
              </span>
              <span className="text-muted-foreground">
                {row.correct}/{row.scoreable} scorables · {row.nonEvaluable} non évaluables ·{' '}
                {row.answered}/{row.total} traitées
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Détail des questions</h2>
        {session.answers.map((answer, index) => {
          const question = questionsById.get(answer.questionId)
          if (!question) return null
          return (
            <Card key={answer.questionId}>
              <CardHeader className="space-y-2 pb-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Q{index + 1}</Badge>
                  <Badge variant="secondary">{question.subject}</Badge>
                  {!isAnswerFilled(answer) ? <Badge variant="warning">Non répondue</Badge> : null}
                  {answer.scored && answer.isCorrect ? <Badge variant="success">Correcte</Badge> : null}
                  {answer.scored && answer.isCorrect === false ? (
                    <Badge variant="muted">Incorrecte</Badge>
                  ) : null}
                  {!answer.scored ? <Badge variant="muted">Non évaluable</Badge> : null}
                </div>
                <CardTitle className="font-sans text-base font-medium leading-relaxed">
                  {question.stem}
                </CardTitle>
                <CardDescription>
                  Votre réponse :{' '}
                  {question.type === 'open'
                    ? answer.openText?.trim() || '—'
                    : question.choices
                        .filter((c) => answer.selectedChoiceIds?.includes(c.id))
                        .map((c) => `${c.label}. ${c.text}`)
                        .join(' · ') || '—'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CorrectionFeedback
                  question={question}
                  isCorrect={answer.isCorrect}
                  scored={answer.scored}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
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
