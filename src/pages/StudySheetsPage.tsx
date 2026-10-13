import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { STUDY_SHEETS } from '@/data/study-sheets'
import { SUBJECTS } from '@/data/subjects'
import { useVtcQuestions } from '@/hooks/useQuestions'
import type { SubjectCode } from '@/types/exam'

export function StudySheetsPage() {
  const { questions } = useVtcQuestions()
  const [subject, setSubject] = useState<SubjectCode>('A')
  const sheet = STUDY_SHEETS.find((item) => item.subject === subject) ?? STUDY_SHEETS[0]!
  const meta = SUBJECTS.find((s) => s.code === subject)

  const linked = useMemo(
    () => questions.filter((q) => q.subject === subject).slice(0, 12),
    [questions, subject],
  )

  const verifiedCount = questions.filter(
    (q) => q.subject === subject && q.verificationStatus === 'verified',
  ).length

  return (
    <div>
      <PageHeader
        title="Fiches de révision"
        description="Cadrage pédagogique par matière. Aucune disposition réglementaire n’est inventée : seuls les éléments explicitement vérifiés sont affirmés."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <Button
            key={s.code}
            size="sm"
            variant={subject === s.code ? 'default' : 'outline'}
            onClick={() => setSubject(s.code)}
          >
            {s.shortLabel}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>{sheet.title}</CardTitle>
            <CardDescription>{meta?.group === 'vtc' ? 'Spécialité VTC' : 'Tronc commun'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold">Présentation</h3>
              <p className="text-muted-foreground">{sheet.presentation}</p>
            </section>

            <EmptyOrList
              title="Concepts importants"
              empty="Aucun concept vérifié renseigné pour l’instant."
              items={sheet.keyConcepts.map((c) => c.label)}
            />
            <EmptyOrList
              title="Définitions"
              empty="Aucune définition vérifiée renseignée pour l’instant."
              items={sheet.definitions.map((d) => `${d.term} — ${d.definition}`)}
            />
            <EmptyOrList
              title="Points réglementaires"
              empty="Aucun point réglementaire n’est affirmé ici sans source contrôlée."
              items={sheet.regulatoryPoints.map(
                (p) => `${p.point}${p.reference ? ` (${p.reference})` : ''}`,
              )}
            />

            <section className="space-y-2">
              <h3 className="font-semibold">Références disponibles</h3>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {sheet.references.map((ref) => (
                  <li key={ref.label}>
                    {ref.url ? (
                      <a className="underline underline-offset-2" href={ref.url} target="_blank" rel="noreferrer">
                        {ref.label}
                      </a>
                    ) : (
                      ref.label
                    )}{' '}
                    {ref.verified ? <Badge variant="success">vérifiée</Badge> : null}
                  </li>
                ))}
              </ul>
            </section>

            {sheet.notes?.length ? (
              <section className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                {sheet.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </section>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Banque liée</CardTitle>
              <CardDescription>
                {linked.length > 0 ? `${questions.filter((q) => q.subject === subject).length} questions` : '—'} ·{' '}
                {verifiedCount} vérifiée(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {linked.map((q) => (
                <div key={q.id} className="rounded-md border px-2 py-1.5 text-xs">
                  <div className="mb-1 flex gap-1">
                    <Badge variant="secondary">{q.year}</Badge>
                    <Badge variant="muted">{q.verificationStatus}</Badge>
                  </div>
                  <p className="line-clamp-2">{q.stem}</p>
                </div>
              ))}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/corrections`}>Valider des corrections ({subject})</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function EmptyOrList({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: string[]
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
