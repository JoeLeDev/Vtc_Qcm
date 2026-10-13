import { LineChart } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function StatsPage() {
  return (
    <div>
      <PageHeader
        title="Mes statistiques"
        description="Taux de réussite, temps moyen, évolution des scores et questions difficiles."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {['Réussite globale', 'Temps moyen / question', 'Série actuelle'].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-semibold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <EmptyState
          icon={LineChart}
          title="Pas encore de données"
          description="Les graphiques de progression par matière seront alimentés par votre historique local."
        />
      </div>
    </div>
  )
}
