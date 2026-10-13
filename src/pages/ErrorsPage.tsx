import { TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export function ErrorsPage() {
  return (
    <div>
      <PageHeader
        title="Mes erreurs"
        description="Retrouvez ici les questions ratées, filtrez par matière et relancez un QCM ciblé."
      />
      <EmptyState
        icon={TriangleAlert}
        title="Aucune erreur enregistrée"
        description="Dès que vous manquerez une question scorable, elle apparaîtra ici pour la révision espacée."
      />
    </div>
  )
}
