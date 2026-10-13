import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { getSubject } from '@/data/subjects'
import { cn } from '@/lib/utils'
import type { Question } from '@/types/exam'

interface QuestionCardProps {
  question: Question
  selectedChoiceIds: string[]
  openText: string
  disabled?: boolean
  showFeedback?: boolean
  /** Ordre d'affichage des propositions (ids), ex. après mélange. */
  choiceOrder?: string[]
  compactMeta?: boolean
  onToggleChoice: (choiceId: string) => void
  onOpenTextChange: (value: string) => void
}

export function QuestionCard({
  question,
  selectedChoiceIds,
  openText,
  disabled,
  showFeedback,
  choiceOrder,
  compactMeta,
  onToggleChoice,
  onOpenTextChange,
}: QuestionCardProps) {
  const subject = getSubject(question.subject)
  const choices = (() => {
    if (!choiceOrder?.length) return question.choices
    const map = new Map(question.choices.map((c) => [c.id, c]))
    return choiceOrder.map((id) => map.get(id)).filter(Boolean) as typeof question.choices
  })()

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{subject?.shortLabel ?? question.subject}</Badge>
          {!compactMeta ? <Badge variant="secondary">{question.year}</Badge> : null}
          {!compactMeta ? <Badge variant="outline">Q{question.number}</Badge> : null}
          <Badge variant="outline">{question.type}</Badge>
          {question.duplicateOf && !compactMeta ? (
            <Badge variant="warning">Doublon de {question.duplicateOf}</Badge>
          ) : null}
        </div>
        <CardTitle className="font-sans text-lg font-medium leading-relaxed">{question.stem}</CardTitle>
        {question.hasIllustration && question.illustrationPath ? (
          <img
            src={question.illustrationPath}
            alt="Illustration de la question"
            className="max-h-72 w-full rounded-lg border object-contain bg-muted/40"
          />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {question.type === 'open' ? (
          <Textarea
            value={openText}
            onChange={(e) => onOpenTextChange(e.target.value)}
            placeholder="Saisissez votre réponse libre…"
            disabled={disabled}
            aria-label="Réponse libre"
          />
        ) : (
          choices.map((choice, index) => {
            const selected = selectedChoiceIds.includes(choice.id)
            const isCorrect =
              showFeedback &&
              question.verificationStatus === 'verified' &&
              question.correctChoiceIds?.includes(choice.id)
            const isWrong =
              showFeedback &&
              question.verificationStatus === 'verified' &&
              selected &&
              !question.correctChoiceIds?.includes(choice.id)
            const displayLabel = String.fromCharCode(65 + index)

            return (
              <button
                key={choice.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggleChoice(choice.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                  selected && 'border-primary bg-primary/5',
                  isCorrect && 'border-emerald-500 bg-emerald-500/10',
                  isWrong && 'border-destructive bg-destructive/10',
                  !disabled && 'hover:bg-accent/50',
                )}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold">
                  {displayLabel}
                  <span className="sr-only"> (touche {index + 1})</span>
                </span>
                <span className="text-sm leading-relaxed">{choice.text}</span>
              </button>
            )
          })
        )}
        {!compactMeta ? (
          <p className="text-xs text-muted-foreground">
            {question.sourceDocument} · p.{question.pdfPage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
