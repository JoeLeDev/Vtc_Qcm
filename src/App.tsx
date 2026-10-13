import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { BankPage } from '@/pages/BankPage'
import { CorrectionsPage } from '@/pages/CorrectionsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ErrorsPage } from '@/pages/ErrorsPage'
import { ExamResultsPage } from '@/pages/ExamResultsPage'
import { ExamSessionPage } from '@/pages/ExamSessionPage'
import { ExamsPage } from '@/pages/ExamsPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StatsPage } from '@/pages/StatsPage'
import { StudySheetsPage } from '@/pages/StudySheetsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="reviser" element={<ReviewPage />} />
          <Route path="examens" element={<ExamsPage />} />
          <Route path="examens/session" element={<ExamSessionPage />} />
          <Route path="examens/resultats/:sessionId" element={<ExamResultsPage />} />
          <Route path="erreurs" element={<ErrorsPage />} />
          <Route path="statistiques" element={<StatsPage />} />
          <Route path="banque" element={<BankPage />} />
          <Route path="fiches" element={<StudySheetsPage />} />
          <Route path="corrections" element={<CorrectionsPage />} />
          <Route path="parametres" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
