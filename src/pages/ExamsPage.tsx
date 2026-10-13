import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EXAM_RULES } from '@/data/exam-rules'
import { SUBJECTS } from '@/data/subjects'
import { useVtcQuestions } from '@/hooks/useQuestions'
import {
  analyzeOfficialCoverage,
  createOfficialExam,
  createTrainingExam,
  filterTrainingPool,
  type TrainingExamConfig,
} from '@/lib/mock-exam-engine'
import { getProgressStore } from '@/lib/persistence/local-adapter'
import { cn } from '@/lib/utils'
import type { StudySession, SubjectCode } from '@/types/exam'

export function ExamsPage() {
  const { questions, loading } = useVtcQuestions()
  const [active, setActive] = useState<StudySession | null>(null)
  const [mode, setMode] = useState<'hub' | 'training' | 'official'>('hub')
  const navigate = useNavigate()

  useEffect(() => {
    void getProgressStore()
      .getActiveSession()
      .then((session) => {
        if (
          session &&
          (session.mode === 'mock_training' || session.mode === 'mock_official') &&
          session.status === 'in_progress'
        ) {
          setActive(session)
        }
      })
  }, [])

  const coverage = useMemo(() => analyzeOfficialCoverage(questions), [questions])
  const structureOk = coverage.every((c) => c.qcmOk && c.qrcOk)
  const verifiedTotal = coverage.reduce((sum, c) => sum + c.verifiedCount, 0)

  return (
    <div>
      <PageHeader
        title="Examens blancs"
        description="Entraînement libre ou simulation des sept épreuves théoriques VTC."
      />

      {active ? (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Session en cours</CardTitle>
            <CardDescription>
              Une épreuve a été interrompue. Le chronomètre reprend sur l’horloge murale (temps réellement
              écoulé pendant l’interruption).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/examens/session">Reprendre</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {mode === 'hub' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Mode entraînement</CardTitle>
                <Badge variant="secondary">20 / 40 / 60</Badge>
              </div>
              <CardDescription>
                Matières au choix, chronomètre optionnel, correction après chaque question ou en fin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled={loading} onClick={() => setMode('training')}>
                Configurer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Simulation officielle</CardTitle>
                <Badge variant="warning">Non certifiable</Badge>
              </div>
              <CardDescription>
                {EXAM_RULES.totalDurationMinutes} min · coef. {EXAM_RULES.totalCoefficient} · seuils
                éliminatoires du règlement CMA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Structure banque : {structureOk ? 'complète' : 'partielle'} · {verifiedTotal} correction(s)
                vérifiée(s) sur les matières.
              </p>
              <Button disabled={loading} onClick={() => setMode('official')}>
                Préparer la simulation
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {mode === 'training' ? (
        <TrainingSetup
          questions={questions}
          onCancel={() => setMode('hub')}
          onStart={async (config) => {
            const created = createTrainingExam(questions, config)
            if ('error' in created) {
              window.alert(created.error)
              return
            }
            await getProgressStore().saveActiveSession(created)
            await getProgressStore().saveSession(created)
            navigate('/examens/session')
          }}
        />
      ) : null}

      {mode === 'official' ? (
        <OfficialSetup
          coverage={coverage}
          structureOk={structureOk}
          verifiedTotal={verifiedTotal}
          onCancel={() => setMode('hub')}
          onStart={async () => {
            const created = createOfficialExam(questions)
            if ('error' in created) {
              window.alert(created.error)
              return
            }
            await getProgressStore().saveActiveSession(created)
            await getProgressStore().saveSession(created)
            navigate('/examens/session')
          }}
        />
      ) : null}
    </div>
  )
}

function TrainingSetup({
  questions,
  onCancel,
  onStart,
}: {
  questions: ReturnType<typeof useVtcQuestions>['questions']
  onCancel: () => void
  onStart: (config: TrainingExamConfig) => void
}) {
  const [count, setCount] = useState<20 | 40 | 60>(20)
  const [subjects, setSubjects] = useState<SubjectCode[] | 'all'>('all')
  const [years, setYears] = useState<number[] | 'all'>('all')
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [revealMode, setRevealMode] = useState<'after_each' | 'at_end'>('at_end')
  const [shuffleChoices, setShuffleChoices] = useState(true)
  const [evaluableOnly, setEvaluableOnly] = useState(true)

  const available = filterTrainingPool(questions, { subjects, years, evaluableOnly }).length
  const willUse = Math.min(count, available)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurer l’entraînement</CardTitle>
        <CardDescription>
          {available} question(s) {evaluableOnly ? 'évaluables' : 'disponibles'} · {willUse} seront
          utilisées
          {willUse < count ? ' (stock insuffisant, aucune question inventée)' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">QCM évaluables seulement</p>
            <p className="text-xs text-muted-foreground">
              Corrections verified, hors QRC, hors anomalies bloquantes
            </p>
          </div>
          <Switch checked={evaluableOnly} onCheckedChange={setEvaluableOnly} />
        </div>

        <div className="space-y-2">
          <Label>Nombre de questions</Label>
          <div className="flex flex-wrap gap-2">
            {([20, 40, 60] as const).map((value) => (
              <Chip key={value} active={count === value} onClick={() => setCount(value)}>
                {value}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Matières</Label>
          <div className="flex flex-wrap gap-2">
            <Chip active={subjects === 'all'} onClick={() => setSubjects('all')}>
              Toutes
            </Chip>
            {SUBJECTS.map((s) => (
              <Chip
                key={s.code}
                active={subjects !== 'all' && subjects.includes(s.code)}
                onClick={() =>
                  setSubjects((prev) => {
                    if (prev === 'all') return [s.code]
                    if (prev.includes(s.code)) {
                      const next = prev.filter((code) => code !== s.code)
                      return next.length ? next : 'all'
                    }
                    return [...prev, s.code]
                  })
                }
              >
                {s.code}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Années</Label>
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

        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Chronomètre</p>
            <p className="text-xs text-muted-foreground">Deadline d’horloge murale</p>
          </div>
          <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
        </div>

        {timerEnabled ? (
          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={10}
              max={240}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Correction</Label>
          <div className="flex flex-wrap gap-2">
            <Chip active={revealMode === 'at_end'} onClick={() => setRevealMode('at_end')}>
              En fin de session
            </Chip>
            <Chip active={revealMode === 'after_each'} onClick={() => setRevealMode('after_each')}>
              Après chaque question
            </Chip>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Mélanger les propositions</p>
            <p className="text-xs text-muted-foreground">Sans altérer le sens des réponses</p>
          </div>
          <Switch checked={shuffleChoices} onCheckedChange={setShuffleChoices} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={available === 0}
            onClick={() =>
              onStart({
                count,
                subjects,
                years,
                timerEnabled,
                durationMinutes,
                revealMode,
                shuffleChoices,
                evaluableOnly,
              })
            }
          >
            Démarrer ({willUse} questions)
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OfficialSetup({
  coverage,
  structureOk,
  verifiedTotal,
  onCancel,
  onStart,
}: {
  coverage: ReturnType<typeof analyzeOfficialCoverage>
  structureOk: boolean
  verifiedTotal: number
  onCancel: () => void
  onStart: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation des 7 épreuves</CardTitle>
        <CardDescription>
          Durées et coefficients issus du règlement CMA ({EXAM_RULES.version}). Simulation non
          certifiable tant que les corrections QCM/QRC ne permettent pas une admissibilité fiable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!structureOk ? (
          <p className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            Stock insuffisant sur au moins une épreuve : la simulation sera clairement marquée
            <strong> partielle</strong>, sans être présentée comme un examen officiel complet.
          </p>
        ) : (
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">
            Structure QCM/QRC disponible pour les 7 épreuves. Corrections vérifiées : {verifiedTotal}.
            Aucun statut « Admis » ne sera affiché.
          </p>
        )}

        <div className="space-y-2">
          {coverage.map((row) => (
            <div
              key={row.subject}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {SUBJECTS.find((s) => s.code === row.subject)?.shortLabel ?? row.subject}
              </span>
              <span className="text-muted-foreground">
                QCM {row.qcmAvailable}/{row.qcmNeeded}
                {row.qrcNeeded ? ` · QRC ${row.qrcAvailable}/${row.qrcNeeded}` : ''}
                {' · '}
                {row.qcmOk && row.qrcOk ? 'OK' : 'partiel'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onStart}>
            {structureOk ? 'Lancer la simulation' : 'Lancer une simulation partielle'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </CardContent>
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
