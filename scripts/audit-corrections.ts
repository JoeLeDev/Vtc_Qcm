/**
 * Audit lecture seule de la banque VTC — ne modifie aucune réponse.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const all = JSON.parse(
  await readFile(path.join(ROOT, 'src/data/questions/all.json'), 'utf8'),
) as Array<{
  id: string
  scope: string
  subject: string
  type: string
  year: number
  verificationStatus: string
  openReferenceAnswer?: string
  lifecycleStatus: string
  hasIllustration: boolean
  duplicateOf?: string
}>

const correctionsDir = path.join(ROOT, 'docs', 'corrections')
const lotFiles = (await readdir(correctionsDir))
  .filter((f) => /^lot-.*-suggestions\.json$/.test(f))
  .sort()

const suggestionIds = new Set<string>()
const suggestionsByLot: Record<string, number> = {}
for (const file of lotFiles) {
  const raw = JSON.parse(await readFile(path.join(correctionsDir, file), 'utf8')) as {
    suggestions?: Array<{ questionId: string }>
  }
  const items = raw.suggestions ?? []
  suggestionsByLot[file] = items.length
  for (const item of items) suggestionIds.add(item.questionId)
}

const vtc = all.filter((q) => q.scope === 'common' || q.scope === 'vtc')
const subjects = ['A', 'B', 'C', 'D', 'E', 'FV', 'GV'] as const
const bankIds = new Set(vtc.map((q) => q.id))
const orphanSuggestions = [...suggestionIds].filter((id) => !bankIds.has(id))

const bySubject: Record<string, Record<string, number>> = {}
for (const s of subjects) {
  const qs = vtc.filter((q) => q.subject === s)
  bySubject[s] = {
    total: qs.length,
    qcm: qs.filter((q) => q.type !== 'open').length,
    qrc: qs.filter((q) => q.type === 'open').length,
    unverified: qs.filter((q) => q.verificationStatus === 'unverified').length,
    needs_review: qs.filter((q) => q.verificationStatus === 'needs_review').length,
    verified: qs.filter((q) => q.verificationStatus === 'verified').length,
    withIndicativeAnswer: qs.filter((q) => Boolean(q.openReferenceAnswer)).length,
    possiblyObsolete: qs.filter((q) => q.lifecycleStatus === 'possibly_obsolete').length,
    withIllustration: qs.filter((q) => q.hasIllustration).length,
    withLotSuggestion: qs.filter((q) => suggestionIds.has(q.id)).length,
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: 'VTC (common + FV/GV)',
  total: vtc.length,
  totals: {
    qcm: vtc.filter((q) => q.type !== 'open').length,
    qrc: vtc.filter((q) => q.type === 'open').length,
    unverified: vtc.filter((q) => q.verificationStatus === 'unverified').length,
    needs_review: vtc.filter((q) => q.verificationStatus === 'needs_review').length,
    verified: vtc.filter((q) => q.verificationStatus === 'verified').length,
    withIndicativeAnswerFromPdf: vtc.filter((q) => Boolean(q.openReferenceAnswer)).length,
    withoutAnyCorrection: vtc.filter(
      (q) => q.verificationStatus === 'unverified' && !q.openReferenceAnswer,
    ).length,
    possiblyObsolete: vtc.filter((q) => q.lifecycleStatus === 'possibly_obsolete').length,
    withIllustration: vtc.filter((q) => q.hasIllustration).length,
    needingRegulatoryCheck: vtc.filter(
      (q) => q.verificationStatus !== 'verified' || q.lifecycleStatus === 'possibly_obsolete',
    ).length,
    duplicatesMarked: vtc.filter((q) => Boolean(q.duplicateOf)).length,
    lotSuggestions: suggestionIds.size,
    orphanLotSuggestions: orphanSuggestions.length,
  },
  suggestionsByLot,
  bySubject,
  notes: [
    'Audit en lecture seule : aucune réponse modifiée.',
    'Les Indication/Right answer des PDF sont en needs_review, pas verified.',
    'Les lots docs/corrections/lot-*-suggestions.json restent au statut suggested (jamais verified auto).',
    'Illustrations : associations via extraction-patches.json (plus d’auto-lien page→toutes questions).',
  ],
}

const reportsDir = path.join(ROOT, 'docs/reports')
await mkdir(reportsDir, { recursive: true })
await writeFile(path.join(reportsDir, 'corrections-coverage.json'), JSON.stringify(report, null, 2) + '\n')

const md = `# Rapport de couverture des corrections VTC

Généré le : ${report.generatedAt}

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| Questions VTC | ${report.total} |
| QCM | ${report.totals.qcm} |
| QRC | ${report.totals.qrc} |
| \`unverified\` | ${report.totals.unverified} |
| \`needs_review\` (indicatives PDF) | ${report.totals.needs_review} |
| \`verified\` | ${report.totals.verified} |
| Sans aucune correction | ${report.totals.withoutAnyCorrection} |
| Potentiellement obsolètes | ${report.totals.possiblyObsolete} |
| Illustrations associées | ${report.totals.withIllustration} |
| Suggestions de lots (IDs uniques) | ${report.totals.lotSuggestions} |
| Suggestions orphelines | ${report.totals.orphanLotSuggestions} |
| Vérification réglementaire nécessaire | ${report.totals.needingRegulatoryCheck} |

## Lots de suggestions

| Fichier | Suggestions |
|---------|------------:|
${Object.entries(suggestionsByLot)
  .map(([f, n]) => `| \`${f}\` | ${n} |`)
  .join('\n')}

## Par matière

| Matière | Total | QCM | QRC | unverified | needs_review | verified | Indicatives | Illustrations | Suggestions lot |
|--------|------:|----:|----:|-----------:|-------------:|---------:|------------:|--------------:|----------------:|
${subjects
  .map((s) => {
    const r = bySubject[s]!
    return `| ${s} | ${r.total} | ${r.qcm} | ${r.qrc} | ${r.unverified} | ${r.needs_review} | ${r.verified} | ${r.withIndicativeAnswer} | ${r.withIllustration} | ${r.withLotSuggestion} |`
  })
  .join('\n')}

## Notes

${report.notes.map((n) => `- ${n}`).join('\n')}
`

await writeFile(path.join(reportsDir, 'corrections-coverage.md'), md)
console.log(md)
