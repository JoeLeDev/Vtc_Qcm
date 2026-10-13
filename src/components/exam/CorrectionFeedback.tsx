import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { verificationLabel } from '@/lib/session-engine'
import type { Question } from '@/types/exam'

interface CorrectionFeedbackProps {
  question: Question
  isCorrect: boolean | null
  scored: boolean
}

export function CorrectionFeedback({ question, isCorrect, scored }: CorrectionFeedbackProps) {
  const verified = question.verificationStatus === 'verified'

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Correction</CardTitle>
          <Badge variant={verified ? 'success' : 'warning'}>
            {verificationLabel(question.verificationStatus)}
          </Badge>
          {scored && isCorrect === true ? <Badge variant="success">Bonne réponse</Badge> : null}
          {scored && isCorrect === false ? <Badge variant="muted">À revoir</Badge> : null}
          {!scored ? <Badge variant="muted">Non évaluée dans le score</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!verified ? (
          <p className="text-muted-foreground">
            Correction en attente de vérification. Cette question n’entre pas dans le score automatique.
          </p>
        ) : null}

        {verified && question.type !== 'open' && question.correctChoiceIds?.length ? (
          <p>
            <span className="font-medium">Bonne(s) réponse(s) : </span>
            {question.choices
              .filter((c) => question.correctChoiceIds?.includes(c.id))
              .map((c) => `${c.label}. ${c.text}`)
              .join(' · ')}
          </p>
        ) : null}

        {question.type === 'open' && question.openReferenceAnswer ? (
          <div className="rounded-md bg-muted/60 p-3">
            <p className="mb-1 font-medium">
              {verified ? 'Réponse de référence' : 'Réponse indicative (annales)'}
            </p>
            <p className="text-muted-foreground">{question.openReferenceAnswer}</p>
          </div>
        ) : null}

        {question.explanation ? (
          <p>
            <span className="font-medium">Explication : </span>
            {question.explanation}
          </p>
        ) : null}

        {question.justificationRef ? (
          <p className="text-xs text-muted-foreground">Réf. : {question.justificationRef}</p>
        ) : null}

        {question.verifiedByUser ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Vérification utilisateur — ne constitue pas une certification officielle de la CMA.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
