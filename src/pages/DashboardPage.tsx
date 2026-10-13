import { useEffect, useState } from 'react'
import { CalendarDays, Library } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getBankStats } from '@/data/questions'
import { SUBJECTS } from '@/data/subjects'
import { daysUntil } from '@/lib/exam-engine'
import { getProgressStore } from '@/lib/persistence/local-adapter'
import { DEFAULT_EXAM_TARGET_DATE } from '@/lib/persistence/types'

export function DashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getBankStats>> | null>(null)
  const [examDate, setExamDate] = useState(DEFAULT_EXAM_TARGET_DATE)
  const [hasActive, setHasActive] = useState(false)

  useEffect(() => {
    void getBankStats().then(setStats)
    void getProgressStore().getSettings().then((s) => setExamDate(s.examTargetDate))
    void getProgressStore()
      .getActiveSession()
      .then((s) => setHasActive(Boolean(s && s.status === 'in_progress')))
  }, [])

  const days = daysUntil(examDate)
  const verifiedPct = stats
    ? Math.round(((stats.byVerification.verified ?? 0) / Math.max(stats.total, 1)) * 100)
    : 0

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Suivez votre préparation à l’examen théorique VTC."
        actions={
          <div className="flex flex-wrap gap-2">
            {hasActive ? (
              <Button asChild variant="secondary">
                <Link to="/reviser">Reprendre la session</Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link to="/reviser">Commencer une révision</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Objectif d’examen</CardDescription>
            <CardTitle className="font-display text-2xl">
              {new Date(`${examDate}T00:00:00`).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {days >= 0 ? `${days} jours restants` : `Échéance dépassée de ${Math.abs(days)} jours`}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Objectif personnel — ne constitue pas une inscription CMA.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Banque VTC</CardDescription>
            <CardTitle className="font-display text-2xl">
              {stats ? `${stats.total} questions` : '…'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats
                ? `Années ${stats.years.join(' · ')} · ${stats.allImported} importées au total`
                : 'Chargement…'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Corrections vérifiées</CardDescription>
            <CardTitle className="font-display text-2xl">{stats ? `${verifiedPct}%` : '…'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={verifiedPct} className="mb-2" />
            <div className="flex flex-wrap gap-2">
              <Badge variant="muted">Non vérifiées : {stats?.byVerification.unverified ?? 0}</Badge>
              <Badge variant="warning">À revoir : {stats?.byVerification.needs_review ?? 0}</Badge>
              <Badge variant="success">Vérifiées : {stats?.byVerification.verified ?? 0}</Badge>
            </div>
            <Button asChild variant="ghost" className="mt-2 h-auto px-0">
              <Link to="/corrections">Valider des corrections</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progression globale</CardTitle>
            <CardDescription>Les stats de session apparaîtront après vos révisions.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Library}
              title="Prêt à démarrer"
              description="Répondez à vos premières questions pour voir le taux de réussite et votre série."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matières</CardTitle>
            <CardDescription>Répartition de la banque officielle importée.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SUBJECTS.map((subject) => {
              const count = stats?.bySubject[subject.code] ?? 0
              const pct = Math.round((count / Math.max(stats?.total ?? 1, 1)) * 100)
              return (
                <div key={subject.code} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{subject.shortLabel}</span>
                    <span className="text-muted-foreground">{count} · {pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
