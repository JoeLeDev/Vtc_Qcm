import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  FIRST_30_QUESTION_IDS,
  first30Order,
  isFirst30Question,
} from '@/data/corrections/first-30-series'
import {
  getAnomalyResolution,
  getPriorityAnomaly,
  PRIORITY_ANOMALIES,
} from '@/data/corrections/priority-anomalies'
import { SUBJECTS } from '@/data/subjects'
import { useVtcQuestions } from '@/hooks/useQuestions'
import {
  confidenceLabel,
  exportOverlaysJson,
  exportProgressBackup,
  exportReviewDecisionsJson,
  exportSuggestionsJson,
  getActiveSuggestionForQuestion,
  getOverlayForQuestion,
  getReviewDecision,
  getValidationHistory,
  importOverlaysJson,
  importProgressBackup,
  importReviewDecisionsJson,
  importSuggestionsJson,
  rejectSuggestion,
  saveManualSuggestion,
  saveOverlayForQuestion,
  saveReviewDecision,
} from '@/lib/corrections'
import { computeCorrectionsDashboard, isAutoScoreableQcm } from '@/lib/evaluability'
import { cn } from '@/lib/utils'
import type { ConfidenceLevel } from '@/types/corrections'
import type { Question, SubjectCode, VerificationStatus } from '@/types/exam'

type ListFilter =
  | 'all_pending'
  | VerificationStatus
  | 'suggested'
  | 'priority'
  | 'no_suggestion'
  | 'evaluable'
  | 'first30'

export function CorrectionsPage() {
  const { questions, loading, reload } = useVtcQuestions()
  const [year, setYear] = useState<'all' | number>('all')
  const [subject, setSubject] = useState<'all' | SubjectCode>('all')
  const [status, setStatus] = useState<ListFilter>('first30')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const suggestionsRef = useRef<HTMLInputElement>(null)
  const overlaysRef = useRef<HTMLInputElement>(null)
  const backupRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => computeCorrectionsDashboard(questions), [questions])

  const pending = useMemo(() => {
    const filtered = questions.filter((q) => {
      if (year !== 'all' && q.year !== year) return false
      if (subject !== 'all' && q.subject !== subject) return false
      const suggestion = getActiveSuggestionForQuestion(q.id)
      if (status === 'first30') return isFirst30Question(q.id)
      if (status === 'suggested') return Boolean(suggestion)
      if (status === 'priority') return Boolean(getPriorityAnomaly(q.id))
      if (status === 'no_suggestion') {
        return q.verificationStatus !== 'verified' && !suggestion
      }
      if (status === 'evaluable') return isAutoScoreableQcm(q)
      if (status === 'all_pending') return q.verificationStatus !== 'verified'
      return q.verificationStatus === status
    })
    if (status !== 'first30') return filtered
    return [...filtered].sort(
      (a, b) => (first30Order(a.id) ?? 999) - (first30Order(b.id) ?? 999),
    )
  }, [questions, year, subject, status])

  const selected = questions.find((q) => q.id === selectedId) ?? pending[0] ?? null

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(
    file: File,
    kind: 'suggestions' | 'overlays' | 'backup' | 'review',
  ) {
    const text = await file.text()
    if (kind === 'suggestions') {
      const result = importSuggestionsJson(text)
      if (!result.ok) {
        setMessage(result.reason)
        return
      }
      setMessage(`${result.count} suggestion(s) importée(s). Aucune validation automatique.`)
    } else if (kind === 'overlays') {
      const result = importOverlaysJson(text)
      if (!result.ok) {
        setMessage(result.reason)
        return
      }
      setMessage(`${result.count} correction(s) validée(s) importée(s) (aliases préservés).`)
    } else if (kind === 'review') {
      const result = importReviewDecisionsJson(text)
      if (!result.ok) {
        setMessage(result.reason)
        return
      }
      setMessage(`${result.count} décision(s) de revue importée(s).`)
    } else {
      const result = importProgressBackup(text)
      if (!result.ok) {
        setMessage(result.reason)
        return
      }
      setMessage('Sauvegarde complète restaurée.')
    }
    reload()
  }

  return (
    <div>
      <PageHeader
        title="Validation des corrections"
        description="Validation humaine explicite uniquement. Les suggestions à confiance élevée ne sont jamais vérifiées automatiquement. QRC hors notation auto."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => download('overlays.json', exportOverlaysJson())}>
              Exporter validées
            </Button>
            <Button
              variant="outline"
              onClick={() => download('suggestions.json', exportSuggestionsJson())}
            >
              Exporter suggestions
            </Button>
            <Button
              variant="outline"
              onClick={() => download('review-decisions.json', exportReviewDecisionsJson())}
            >
              Exporter décisions
            </Button>
            <Button
              variant="outline"
              onClick={() => void exportProgressBackup().then((c) => download('backup.json', c))}
            >
              Sauvegarde complète
            </Button>
            <Button variant="secondary" onClick={() => suggestionsRef.current?.click()}>
              Importer suggestions
            </Button>
            <Button variant="secondary" onClick={() => overlaysRef.current?.click()}>
              Importer validées
            </Button>
            <Button variant="secondary" onClick={() => reviewRef.current?.click()}>
              Importer décisions
            </Button>
            <Button variant="secondary" onClick={() => backupRef.current?.click()}>
              Restaurer backup
            </Button>
            <input
              ref={suggestionsRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImport(file, 'suggestions')
                e.target.value = ''
              }}
            />
            <input
              ref={overlaysRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImport(file, 'overlays')
                e.target.value = ''
              }}
            />
            <input
              ref={reviewRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImport(file, 'review')
                e.target.value = ''
              }}
            />
            <input
              ref={backupRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImport(file, 'backup')
                e.target.value = ''
              }}
            />
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Questions VTC" value={stats.totalQuestions} />
        <StatCard label="Suggestions actives" value={stats.totalSuggestions} tone="warning" />
        <StatCard label="Vérifiées" value={stats.totalVerified} tone="success" />
        <StatCard label="QCM évaluables" value={stats.evaluableQcm} tone="success" />
        <StatCard label="Couverture" value={`${stats.coveragePercent} %`} />
        <StatCard label="Sans suggestion" value={stats.withoutSuggestion} />
        <StatCard label="Revue prioritaire" value={stats.priorityReview} tone="warning" />
        <StatCard
          label="Anomalies catalogue"
          value={PRIORITY_ANOMALIES.length}
          tone="warning"
        />
        <StatCard
          label="Première série"
          value={`${FIRST_30_QUESTION_IDS.filter((id) => questions.some((q) => q.id === id && q.verificationStatus === 'verified')).length}/${FIRST_30_QUESTION_IDS.length}`}
          tone="warning"
        />
      </div>

      {status === 'first30' ? (
        <Card className="mb-4 border-amber-300/50 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Première série à valider</CardTitle>
            <CardDescription>
              30 QCM du dossier `docs/reports/first-30-validation.md`, dans l’ordre. Validation
              individuelle et explicite uniquement — aucun bouton de validation groupée.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Couverture par matière</CardTitle>
          <CardDescription>Cliquez une matière pour filtrer la file de validation.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Matière</th>
                <th className="py-1 pr-2">Total</th>
                <th className="py-1 pr-2">Suggestions</th>
                <th className="py-1 pr-2">Vérifiées</th>
                <th className="py-1 pr-2">Couverture</th>
                <th className="py-1 pr-2">Évaluables</th>
                <th className="py-1">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {stats.bySubject.map((row) => (
                <tr
                  key={row.subject}
                  className={cn(
                    'cursor-pointer border-t hover:bg-accent/40',
                    subject === row.subject && 'bg-primary/5',
                  )}
                  onClick={() => {
                    setSubject(row.subject)
                    setStatus('suggested')
                  }}
                >
                  <td className="py-2 pr-2 font-medium">{row.subject}</td>
                  <td className="py-2 pr-2">{row.total}</td>
                  <td className="py-2 pr-2">{row.withSuggestion}</td>
                  <td className="py-2 pr-2">{row.verified}</td>
                  <td className="py-2 pr-2">{row.coveragePercent} %</td>
                  <td className="py-2 pr-2">{row.evaluableQcm}</td>
                  <td className="py-2">{row.priorityReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={year === 'all'} onClick={() => setYear('all')}>
          Toutes années
        </FilterChip>
        {[2021, 2022].map((y) => (
          <FilterChip key={y} active={year === y} onClick={() => setYear(y)}>
            {y}
          </FilterChip>
        ))}
        <FilterChip active={subject === 'all'} onClick={() => setSubject('all')}>
          Toutes matières
        </FilterChip>
        {SUBJECTS.map((s) => (
          <FilterChip key={s.code} active={subject === s.code} onClick={() => setSubject(s.code)}>
            {s.code}
          </FilterChip>
        ))}
        {(
          [
            ['first30', 'Première série (30)'],
            ['suggested', 'Avec suggestion'],
            ['priority', 'Revue prioritaire'],
            ['no_suggestion', 'Sans suggestion'],
            ['all_pending', 'Non vérifiées'],
            ['evaluable', 'QCM évaluables'],
            ['verified', 'verified'],
            ['needs_review', 'needs_review'],
            ['unverified', 'unverified'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip key={value} active={status === value} onClick={() => setStatus(value)}>
            {label}
          </FilterChip>
        ))}
      </div>

      {message ? (
        <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Card className="max-h-[75vh] overflow-auto">
            <CardHeader>
              <CardTitle className="text-base">{pending.length} questions</CardTitle>
              <CardDescription>File de validation par matière / statut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map((q) => {
                const suggestion = getActiveSuggestionForQuestion(q.id)
                const anomaly = getPriorityAnomaly(q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedId(q.id)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50',
                      selected?.id === q.id && 'border-primary bg-primary/5',
                    )}
                  >
                    <div className="mb-1 flex flex-wrap gap-1">
                      <Badge variant="outline">{q.subject}</Badge>
                      <Badge variant="secondary">{q.year}</Badge>
                      <Badge variant="muted">{q.verificationStatus}</Badge>
                      {suggestion ? (
                        <Badge variant="warning">{confidenceLabel(suggestion.confidence)}</Badge>
                      ) : null}
                      {anomaly ? <Badge variant="warning">priorité</Badge> : null}
                      {isFirst30Question(q.id) ? (
                        <Badge variant="outline">#{first30Order(q.id)}</Badge>
                      ) : null}
                      {isAutoScoreableQcm(q) ? <Badge variant="success">évaluable</Badge> : null}
                    </div>
                    <p className="line-clamp-2">{q.stem}</p>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {selected ? (
            <CorrectionWorkspace
              key={selected.id}
              question={selected}
              onSaved={(msg) => {
                setMessage(msg)
                reload()
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucune question pour ces filtres.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'success' | 'warning'
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1 text-2xl font-semibold tracking-tight',
            tone === 'success' && 'text-emerald-700 dark:text-emerald-300',
            tone === 'warning' && 'text-amber-700 dark:text-amber-300',
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function FilterChip({
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

function CorrectionWorkspace({
  question,
  onSaved,
}: {
  question: Question
  onSaved: (message: string) => void
}) {
  const existing = getOverlayForQuestion(question.id)
  const suggestion = getActiveSuggestionForQuestion(question.id)
  const review = getReviewDecision(question.id)
  const anomaly = getPriorityAnomaly(question.id)
  const history = getValidationHistory(question.id).slice(0, 12)

  const [selected, setSelected] = useState<string[]>([])
  const [openAnswer, setOpenAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [justificationRef, setJustificationRef] = useState('')
  const [obsolete, setObsolete] = useState(false)
  const [official, setOfficial] = useState(false)
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium')
  const [reviewNote, setReviewNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingVerify, setPendingVerify] = useState<'confirm' | 'modify' | null>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = getOverlayForQuestion(question.id)
    const active = getActiveSuggestionForQuestion(question.id)
    const decision = getReviewDecision(question.id)
    setSelected(
      overlay?.correctChoiceIds ??
        active?.proposedChoiceIds ??
        question.correctChoiceIds ??
        [],
    )
    setOpenAnswer(
      overlay?.openReferenceAnswer ??
        active?.proposedOpenAnswer ??
        question.openReferenceAnswer ??
        '',
    )
    setExplanation(overlay?.explanation ?? active?.pedagogicalExplanation ?? '')
    setJustificationRef(overlay?.justificationRef ?? active?.documentaryRef ?? '')
    setObsolete(overlay?.possiblyObsolete ?? Boolean(decision?.obsoleteForCurrentExam))
    setOfficial(Boolean(overlay?.officialSourceEstablished))
    setConfidence(active?.confidence ?? 'medium')
    setReviewNote(decision?.note ?? '')
    setError(null)
    setSuccess(null)
    setPendingVerify(null)
  }, [question])

  function toggle(id: string) {
    if (question.type === 'single') {
      setSelected([id])
      return
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function applySuggestionToForm() {
    if (!suggestion) return
    setSelected(suggestion.proposedChoiceIds ?? [])
    setOpenAnswer(suggestion.proposedOpenAnswer ?? '')
    setExplanation(suggestion.pedagogicalExplanation)
    setJustificationRef(suggestion.documentaryRef)
    setConfidence(suggestion.confidence)
  }

  function showFeedback(kind: 'error' | 'success', text: string) {
    if (kind === 'error') {
      setError(text)
      setSuccess(null)
    } else {
      setSuccess(text)
      setError(null)
    }
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  function saveSuggestionOnly() {
    const result = saveManualSuggestion({
      questionId: question.id,
      proposedChoiceIds: question.type === 'open' ? undefined : selected,
      proposedOpenAnswer: question.type === 'open' ? openAnswer : undefined,
      pedagogicalExplanation: explanation,
      documentaryRef: justificationRef,
      confidence,
    })
    if (!result.ok) {
      showFeedback('error', result.reason)
      return
    }
    showFeedback('success', 'Proposition enregistrée avec le statut suggested (hors score).')
    onSaved('Proposition enregistrée avec le statut suggested (hors score).')
  }

  function saveVerified(modifiedFromSuggestion: boolean) {
    const result = saveOverlayForQuestion(question, {
      correctChoiceIds: question.type === 'open' ? undefined : selected,
      openReferenceAnswer: question.type === 'open' ? openAnswer : undefined,
      explanation,
      justificationRef,
      possiblyObsolete: obsolete,
      markVerified: true,
      officialSourceEstablished: official,
      suggestionId: suggestion?.id,
      modifiedFromSuggestion,
    })
    setPendingVerify(null)
    if (!result.ok) {
      showFeedback('error', result.reason)
      return
    }
    const msg = modifiedFromSuggestion
      ? 'Correction modifiée puis validée (verified).'
      : 'Correction validée après vérification humaine (verified).'
    showFeedback('success', msg)
    onSaved(msg)
  }

  function saveDraft() {
    const result = saveOverlayForQuestion(question, {
      correctChoiceIds: question.type === 'open' ? undefined : selected,
      openReferenceAnswer: question.type === 'open' ? openAnswer : undefined,
      explanation,
      justificationRef,
      possiblyObsolete: obsolete,
      markVerified: false,
      officialSourceEstablished: official,
      suggestionId: suggestion?.id,
    })
    if (!result.ok) {
      showFeedback('error', result.reason)
      return
    }
    showFeedback('success', 'Brouillon enregistré (non scorée).')
    onSaved('Brouillon enregistré (non scorée).')
  }

  function reject() {
    if (!suggestion) return
    const result = rejectSuggestion(suggestion.id, 'Rejetée depuis l’UI')
    if (!result.ok) {
      showFeedback('error', result.reason)
      return
    }
    showFeedback('success', 'Suggestion rejetée.')
    onSaved('Suggestion rejetée.')
  }

  function persistReview(
    patch: Parameters<typeof saveReviewDecision>[0],
    action: Parameters<typeof saveReviewDecision>[1],
    msg: string,
  ) {
    saveReviewDecision(
      {
        questionId: question.id,
        note: reviewNote || patch.note,
        needsRecheck: patch.needsRecheck ?? review?.needsRecheck,
        notScoreable: patch.notScoreable ?? review?.notScoreable,
        obsoleteForCurrentExam: patch.obsoleteForCurrentExam ?? review?.obsoleteForCurrentExam,
        clearedForScoring: patch.clearedForScoring ?? review?.clearedForScoring,
      },
      action,
    )
    onSaved(msg)
  }

  const historicalNote =
    suggestion?.documentaryRef.toLowerCase().includes('historique') ||
    suggestion?.pedagogicalExplanation.includes('RÉPONSE D’ANNALE') ||
    suggestion?.pedagogicalExplanation.includes('RÉPONSE 2026')

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{question.subject}</Badge>
          <Badge variant="secondary">{question.year}</Badge>
          <Badge variant="outline">Q{question.number}</Badge>
          <Badge variant="muted">{question.verificationStatus}</Badge>
          {suggestion ? <Badge variant="warning">suggested</Badge> : null}
          {isAutoScoreableQcm(question) ? <Badge variant="success">évaluable</Badge> : null}
          {question.type === 'open' ? <Badge variant="outline">QRC hors auto-score</Badge> : null}
        </div>
        <CardTitle className="font-sans text-lg font-medium leading-relaxed">{question.stem}</CardTitle>
        <CardDescription>
          Source PDF : {question.sourceDocument} · page {question.pdfPage} · {question.sourceExamTitle}
          {existing?.verifiedAt
            ? ` · dernière vérif. ${new Date(existing.verifiedAt).toLocaleString('fr-FR')}`
            : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SourceLegend
          hasAnnals={Boolean(question.openReferenceAnswer)}
          hasSuggestion={Boolean(suggestion)}
          isVerified={
            question.verificationStatus === 'verified' ||
            existing?.verificationStatus === 'verified'
          }
          official={Boolean(existing?.officialSourceEstablished)}
        />

        {anomaly ? (
          <div className="rounded-md border border-amber-400/50 bg-amber-50/60 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
            <p className="font-medium">Anomalie prioritaire — {anomaly.title}</p>
            <p className="mt-1 text-muted-foreground">{anomaly.detail}</p>
            {(() => {
              const resolution = getAnomalyResolution(question.id)
              const status = resolution?.status ?? anomaly.resolutionStatus
              const statusLabel =
                status === 'resolved'
                  ? 'résolue (documentaire)'
                  : status === 'partially_resolved'
                    ? 'partiellement résolue'
                    : status === 'blocked'
                      ? 'bloquée'
                      : null
              return statusLabel ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Phase 7 — statut : {statusLabel}. Voir `docs/reports/anomalies-resolution.md`.
                </p>
              ) : null
            })()}
            {anomaly.blocksScoring || getAnomalyResolution(question.id)?.blocksScoring ? (
              <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                Bloque la notation tant que non traitée / non levée manuellement.
              </p>
            ) : null}
          </div>
        ) : null}

        {question.hasIllustration && question.illustrationPath ? (
          <img
            src={question.illustrationPath}
            alt="Illustration associée"
            className="max-h-72 w-full rounded-lg border object-contain"
          />
        ) : anomaly?.code === 'missing_illustration' ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Illustration requise absente — ne pas valider pour notation tant qu’elle n’est pas
            rattachée.
          </p>
        ) : null}

        {question.type !== 'open' ? (
          <div className="space-y-2">
            <Label>Propositions originales</Label>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {question.choices.map((choice) => (
                <li key={choice.id}>
                  <span className="font-medium text-foreground">{choice.label}.</span> {choice.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {question.type === 'open' && question.openReferenceAnswer ? (
          <div className="rounded-md border border-amber-300/40 bg-amber-50/50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
            <p className="font-medium">Réponse indicative des annales (PDF)</p>
            <p className="mt-1 text-muted-foreground">{question.openReferenceAnswer}</p>
          </div>
        ) : null}

        {suggestion ? (
          <div className="rounded-md border border-sky-300/40 bg-sky-50/40 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/20">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="font-medium">Proposition pédagogique</p>
              <Badge variant="outline">{confidenceLabel(suggestion.confidence)}</Badge>
              <Badge variant="secondary">{suggestion.source}</Badge>
            </div>
            <p>
              <span className="font-medium">Réponse suggérée : </span>
              {question.type === 'open'
                ? suggestion.proposedOpenAnswer
                : question.choices
                    .filter((c) => suggestion.proposedChoiceIds?.includes(c.id))
                    .map((c) => `${c.label}. ${c.text}`)
                    .join(' · ')}
            </p>
            <p className="mt-2">{suggestion.pedagogicalExplanation}</p>
            <p className="mt-2 text-xs text-muted-foreground">Réf. : {suggestion.documentaryRef}</p>
            {historicalNote ? (
              <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                Écart éventuel historique / actuel documenté dans l’explication ou la référence.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={applySuggestionToForm}>
                Charger dans le formulaire
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={reject}>
                Rejeter
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune suggestion active pour cette question.
          </p>
        )}

        {question.type === 'open' ? (
          <div className="space-y-2">
            <Label>Réponse proposée / de référence</Label>
            <Textarea value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Sélection pour validation — cochez la ou les bonnes réponses</Label>
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => toggle(choice.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm',
                  selected.includes(choice.id) && 'border-primary bg-primary/5',
                )}
              >
                <span className="font-semibold">{choice.label}.</span>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="explanation">Justification pédagogique</Label>
          <Textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ref">Référence juridique ou documentaire</Label>
          <Input
            id="ref"
            value={justificationRef}
            onChange={(e) => setJustificationRef(e.target.value)}
            placeholder="Article / règlement / document contrôlé…"
          />
        </div>

        <div className="space-y-2">
          <Label>Indicateur de confiance (suggestion)</Label>
          <div className="flex flex-wrap gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <FilterChip key={level} active={confidence === level} onClick={() => setConfidence(level)}>
                {confidenceLabel(level)}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Potentiellement obsolète (examen actuel)</p>
            <p className="text-xs text-muted-foreground">Exclut la question des QCM évaluables</p>
          </div>
          <Switch checked={obsolete} onCheckedChange={setObsolete} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Source officielle documentée</p>
            <p className="text-xs text-muted-foreground">
              Uniquement si la référence établit clairement la réponse
            </p>
          </div>
          <Switch checked={official} onCheckedChange={setOfficial} />
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">Gestion des anomalies / revue</p>
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Note de revue…"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                persistReview({ questionId: question.id, note: reviewNote }, 'add_review_note', 'Note de revue enregistrée.')
              }
            >
              Ajouter une note
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                persistReview(
                  { questionId: question.id, needsRecheck: true, note: reviewNote },
                  'request_recheck',
                  'Nouvelle vérification demandée.',
                )
              }
            >
              Demander re-vérification
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                persistReview(
                  { questionId: question.id, notScoreable: true, note: reviewNote },
                  'mark_not_scoreable',
                  'Question marquée non exploitable pour la notation.',
                )
              }
            >
              Non exploitable notation
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                persistReview(
                  {
                    questionId: question.id,
                    clearedForScoring: true,
                    notScoreable: false,
                    note: reviewNote,
                  },
                  'clear_scoring_block',
                  'Blocage de notation levé (après revue humaine).',
                )
              }
            >
              Lever le blocage notation
            </Button>
          </div>
          {review ? (
            <p className="text-xs text-muted-foreground">
              Décision actuelle :{' '}
              {[
                review.needsRecheck ? 'recheck' : null,
                review.notScoreable ? 'non-scoreable' : null,
                review.obsoleteForCurrentExam ? 'obsolète examen' : null,
                review.clearedForScoring ? 'blocage levé' : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'note seule'}{' '}
              · {new Date(review.updatedAt).toLocaleString('fr-FR')}
            </p>
          ) : null}
        </div>

        <div ref={feedbackRef} className="space-y-3">
          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </p>
          ) : null}

          {pendingVerify ? (
            <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-3">
              <p className="text-sm font-medium">
                {pendingVerify === 'modify'
                  ? 'Confirmer la validation après modification manuelle ?'
                  : 'Confirmer la validation humaine de cette correction ?'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pendingVerify === 'modify'
                  ? 'La suggestion ne sera plus active. Aucune validation automatique.'
                  : 'Elle pourra entrer dans les QCM notés (si QCM et critères remplis). Aucune validation automatique.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => saveVerified(pendingVerify === 'modify')}
                >
                  Oui, valider
                </Button>
                <Button type="button" variant="outline" onClick={() => setPendingVerify(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setPendingVerify('confirm')}>
                Valider après vérification
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPendingVerify('modify')}>
                Modifier puis valider
              </Button>
              <Button type="button" variant="outline" onClick={saveSuggestionOnly}>
                Enregistrer suggested
              </Button>
              <Button type="button" variant="outline" onClick={saveDraft}>
                Brouillon
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Historique des décisions</h3>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun événement pour cette question.</p>
          ) : (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {history.map((entry) => (
                <li key={entry.id}>
                  {new Date(entry.at).toLocaleString('fr-FR')} — {entry.action}
                  {entry.toVerificationStatus ? ` → ${entry.toVerificationStatus}` : ''}
                  {entry.note ? ` (${entry.note})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SourceLegend({
  hasAnnals,
  hasSuggestion,
  isVerified,
  official,
}: {
  hasAnnals: boolean
  hasSuggestion: boolean
  isVerified: boolean
  official: boolean
}) {
  return (
    <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-2">
      <p>
        <span className="font-medium">Indicative annales :</span>{' '}
        {hasAnnals ? 'présentée' : 'absente'}
      </p>
      <p>
        <span className="font-medium">Proposition pédagogique :</span>{' '}
        {hasSuggestion ? 'active (suggested)' : 'aucune'}
      </p>
      <p>
        <span className="font-medium">Validée utilisateur :</span>{' '}
        {isVerified ? 'oui (verified)' : 'non'}
      </p>
      <p>
        <span className="font-medium">Officielle documentée :</span>{' '}
        {official ? 'marquée' : 'non'}
      </p>
    </div>
  )
}
