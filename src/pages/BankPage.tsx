import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getSubject } from '@/data/subjects'
import { useVtcQuestions } from '@/hooks/useQuestions'
import type { VerificationStatus } from '@/types/exam'

const statusLabel: Record<VerificationStatus, string> = {
  verified: 'Vérifiée',
  unverified: 'Correction à vérifier',
  needs_review: 'À revoir',
}

const statusVariant: Record<VerificationStatus, 'success' | 'muted' | 'warning'> = {
  verified: 'success',
  unverified: 'muted',
  needs_review: 'warning',
}

export function BankPage() {
  const { questions, loading } = useVtcQuestions()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return questions.slice(0, 50)
    return questions
      .filter(
        (item) =>
          item.stem.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          String(item.year).includes(q),
      )
      .slice(0, 50)
  }, [query, questions])

  return (
    <div>
      <PageHeader
        title="Banque de questions"
        description={
          loading
            ? 'Chargement…'
            : `${questions.length} questions VTC. Les spécialités taxi/VMDTR restent dans les fichiers sources.`
        }
      />

      <div className="mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un énoncé, une matière ou une année…"
          aria-label="Rechercher dans la banque"
        />
      </div>

      <ScrollArea className="h-[70vh] rounded-xl border">
        <div className="space-y-3 p-4">
          {filtered.map((question) => (
            <Card key={question.id}>
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {getSubject(question.subject)?.shortLabel ?? question.subject}
                  </Badge>
                  <Badge variant="secondary">{question.year}</Badge>
                  <Badge variant="outline">Q{question.number}</Badge>
                  <Badge variant="outline">{question.type}</Badge>
                  <Badge variant={statusVariant[question.verificationStatus]}>
                    {statusLabel[question.verificationStatus]}
                  </Badge>
                  {question.hasIllustration ? <Badge variant="secondary">Illustration</Badge> : null}
                  {question.duplicateOf ? <Badge variant="warning">Doublon</Badge> : null}
                </div>
                <CardTitle className="text-base font-medium leading-relaxed">{question.stem}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {question.choices.map((choice) => (
                  <p key={choice.id}>
                    <span className="font-medium text-foreground">{choice.label}.</span> {choice.text}
                  </p>
                ))}
                {question.type === 'open' && question.openReferenceAnswer ? (
                  <p className="rounded-md bg-muted/60 p-3 text-foreground">
                    <span className="font-medium">Référence (à revoir) : </span>
                    {question.openReferenceAnswer}
                  </p>
                ) : null}
                <p className="text-xs">
                  {question.sourceDocument} · p.{question.pdfPage} · {question.sourceExamTitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
