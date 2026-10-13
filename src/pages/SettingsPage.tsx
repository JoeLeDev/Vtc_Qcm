import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/hooks/useTheme'
import {
  exportOverlaysJson,
  exportProgressBackup,
  exportSuggestionsJson,
  importOverlaysJson,
  importProgressBackup,
  importSuggestionsJson,
} from '@/lib/corrections'
import { getProgressStore } from '@/lib/persistence/local-adapter'
import { DEFAULT_EXAM_TARGET_DATE, DEFAULT_SETTINGS } from '@/lib/persistence/types'
import type { UserSettings } from '@/types/exam'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const backupRef = useRef<HTMLInputElement>(null)
  const overlaysRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void getProgressStore().getSettings().then(setSettings)
  }, [])

  async function handleSave() {
    await getProgressStore().saveSettings({ ...settings, theme })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Objectif d’examen, apparence, sauvegarde et import/export des corrections."
      />

      <div className="grid max-w-2xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Date d’objectif</CardTitle>
            <CardDescription>
              Objectif personnel de révision (défaut {DEFAULT_EXAM_TARGET_DATE}). Ce n’est pas une
              confirmation d’inscription à la CMA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="exam-date">Date cible</Label>
            <Input
              id="exam-date"
              type="date"
              value={settings.examTargetDate}
              onChange={(e) => setSettings((s) => ({ ...s, examTargetDate: e.target.value }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>Mode clair / sombre</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Mode sombre</p>
              <p className="text-sm text-muted-foreground">Active le thème sombre immédiatement</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Activer le mode sombre"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectif quotidien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="daily-goal">Questions par jour</Label>
            <Input
              id="daily-goal"
              type="number"
              min={5}
              max={100}
              value={settings.dailyGoalQuestions}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  dailyGoalQuestions: Number(e.target.value) || DEFAULT_SETTINGS.dailyGoalQuestions,
                }))
              }
            />
            <Button onClick={() => void handleSave()}>{saved ? 'Enregistré' : 'Enregistrer'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sauvegarde & corrections</CardTitle>
            <CardDescription>
              Les validations survivent aux réimports d’annales. Exportez régulièrement une sauvegarde JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  void exportProgressBackup().then((json) =>
                    download(`vtc-prep-backup-${new Date().toISOString().slice(0, 10)}.json`, json),
                  )
                }
              >
                Exporter progression
              </Button>
              <Button variant="outline" onClick={() => backupRef.current?.click()}>
                Importer progression
              </Button>
              <Button
                variant="outline"
                onClick={() => download('overlays.json', exportOverlaysJson())}
              >
                Exporter corrections validées
              </Button>
              <Button variant="outline" onClick={() => overlaysRef.current?.click()}>
                Importer corrections validées
              </Button>
              <Button
                variant="outline"
                onClick={() => download('suggestions.json', exportSuggestionsJson())}
              >
                Exporter suggestions
              </Button>
              <Button variant="outline" onClick={() => suggestionsRef.current?.click()}>
                Importer suggestions
              </Button>
            </div>
            {backupMessage ? <p className="text-sm text-muted-foreground">{backupMessage}</p> : null}
            <input
              ref={backupRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const result = importProgressBackup(await file.text())
                setBackupMessage(result.ok ? 'Sauvegarde importée.' : result.reason)
                e.target.value = ''
              }}
            />
            <input
              ref={overlaysRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const result = importOverlaysJson(await file.text())
                setBackupMessage(
                  result.ok ? `${result.count} correction(s) validée(s) importée(s).` : result.reason,
                )
                e.target.value = ''
              }}
            />
            <input
              ref={suggestionsRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const result = importSuggestionsJson(await file.text())
                setBackupMessage(
                  result.ok
                    ? `${result.count} suggestion(s) importée(s) (non scorées).`
                    : result.reason,
                )
                e.target.value = ''
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
