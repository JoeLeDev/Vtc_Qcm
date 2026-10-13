/**
 * Extraction reproductible des annales PDF Evalbox / CMA France.
 * Ne jamais inventer de corrections : seules les « Indication/Right answer »
 * présentes dans le PDF sont stockées, avec le statut needs_review.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ANNALES_DIR = path.join(ROOT, 'docs', 'annales')
const DATA_DIR = path.join(ROOT, 'src', 'data', 'questions')
const IMAGES_DIR = path.join(ROOT, 'public', 'annales', 'images')
const REPORTS_DIR = path.join(ROOT, 'docs', 'reports')

const ChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string().min(1),
})

const QuestionSchema = z.object({
  id: z.string(),
  subject: z.enum(['A', 'B', 'C', 'D', 'E', 'FV', 'GV', 'FT', 'GT', 'FM', 'GM']),
  scope: z.enum(['common', 'vtc', 'taxi', 'vmdtr']),
  year: z.number().int(),
  number: z.number().int().positive(),
  stem: z.string().min(1),
  choices: z.array(ChoiceSchema),
  type: z.enum(['single', 'multiple', 'open']),
  correctChoiceIds: z.array(z.string()).optional(),
  openReferenceAnswer: z.string().optional(),
  explanation: z.string().optional(),
  origin: z.literal('official_annals'),
  sourceDocument: z.string(),
  sourceExamTitle: z.string(),
  pdfPage: z.number().int().positive(),
  verificationStatus: z.enum(['verified', 'unverified', 'needs_review']),
  lastRegulatoryCheck: z.string().optional(),
  lifecycleStatus: z.enum(['active', 'possibly_obsolete']),
  hasIllustration: z.boolean(),
  illustrationPath: z.string().optional(),
  points: z.number().optional(),
  extractionNotes: z.array(z.string()).optional(),
  /** Présent si un doublon inter-années a été détecté — l'original n'est jamais supprimé. */
  duplicateOf: z.string().optional(),
  /** Anciens IDs conservés après correctif (aliases pour overlays / suggestions). */
  legacyIds: z.array(z.string()).optional(),
})

type ExtractedQuestion = z.infer<typeof QuestionSchema>

interface ExtractionReport {
  generatedAt: string
  years: number[]
  imported: number
  byYear: Record<string, number>
  bySubject: Record<string, number>
  byType: Record<string, number>
  byVerification: Record<string, number>
  vtcRelevant: number
  duplicates: Array<{ id: string; duplicateOf: string; stem: string }>
  extractionErrors: string[]
  missingCorrections: number
  openWithReference: number
  illustrations: number
  notes: string[]
}

function detectSubject(title: string): {
  subject: ExtractedQuestion['subject']
  scope: ExtractedQuestion['scope']
} | null {
  const t = title.toUpperCase()

  if (/\bF\s*\(\s*V\s*\)|\bFV\b|DÉVELOPPEMENT COMMERCIAL.*VTC|DEVELOPPEMENT COMMERCIAL/.test(t) && !/\bFM\b|\bF\s*\(\s*M\s*\)/.test(t)) {
    if (/\bFV\b|F\s*\(\s*V\s*\)/.test(t) || /VTC/.test(t)) {
      return { subject: 'FV', scope: 'vtc' }
    }
  }
  if (/\bG\s*\(\s*V\s*\)|\bGV\b/.test(t)) return { subject: 'GV', scope: 'vtc' }
  if (/\bF\s*\(\s*T\s*\)|\bFT\b/.test(t)) return { subject: 'FT', scope: 'taxi' }
  if (/\bG\s*\(\s*T\s*\)|\bGT\b/.test(t)) return { subject: 'GT', scope: 'taxi' }
  if (/\bF\s*\(\s*M\s*\)|\bFM\b/.test(t)) return { subject: 'FM', scope: 'vmdtr' }
  if (/\bG\s*\(\s*M\s*\)|\bGM\b/.test(t)) return { subject: 'GM', scope: 'vmdtr' }

  // Ordre important : codes courts après les spécialités
  if (/\bA\b.*R[ÈE]GLEMENT|-\s*A\s*-|\bA\s*-\s*T3P|\bA\s*-\s*R[ÈE]GLEMENT/.test(t) || /APR[ÈE]S-MIDI\s*-\s*A\s*-/.test(t)) {
    return { subject: 'A', scope: 'common' }
  }
  if (/-\s*B\s*-|GESTION/.test(t) && !/COMMERCIAL/.test(t)) {
    if (/\bB\b/.test(t) || /GESTION/.test(t)) return { subject: 'B', scope: 'common' }
  }
  if (/-\s*C\s*-|S[ÉE]CURIT[ÉE] ROUTI[ÈE]RE/.test(t) && !/VMDTR/.test(t)) {
    return { subject: 'C', scope: 'common' }
  }
  if (/-\s*D\s*-|FRAN[ÇC]AIS/.test(t)) return { subject: 'D', scope: 'common' }
  if (/-\s*E\s*-|ANGLAIS/.test(t)) return { subject: 'E', scope: 'common' }

  // Titres courts 2022
  if (/\bA\s*-\s*T3P\b/.test(t) || /APR[ÈE]S-MIDI\s*-\s*A\s*-/.test(title)) {
    return { subject: 'A', scope: 'common' }
  }
  if (/\bB\s*-\s*GESTION\b/.test(t)) return { subject: 'B', scope: 'common' }
  if (/\bC\s*-\s*S[ÉE]CURIT/.test(t)) return { subject: 'C', scope: 'common' }
  if (/\bD\s*-\s*FRAN/.test(t)) return { subject: 'D', scope: 'common' }
  if (/\bE\s*-\s*ANGLAIS\b/.test(t)) return { subject: 'E', scope: 'common' }
  if (/\bFV\b/.test(t)) return { subject: 'FV', scope: 'vtc' }
  if (/\bGV\b/.test(t)) return { subject: 'GV', scope: 'vtc' }
  if (/\bFT\b/.test(t)) return { subject: 'FT', scope: 'taxi' }
  if (/\bGT\b/.test(t)) return { subject: 'GT', scope: 'taxi' }
  if (/\bFM\b/.test(t)) return { subject: 'FM', scope: 'vmdtr' }
  if (/\bGM\b/.test(t)) return { subject: 'GM', scope: 'vmdtr' }

  return null
}

function normalizeStem(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[\d.\s]+/, '')
    .trim()
    .toLowerCase()
}

function makeId(year: number, subject: string, number: number, stem: string): string {
  const hash = createHash('sha1').update(normalizeStem(stem)).digest('hex').slice(0, 8)
  return `${year}-${subject}-q${String(number).padStart(2, '0')}-${hash}`
}

const MONTH_RE =
  'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre'

function stripNoise(text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, '\n')
    .replace(/Evalbox Copie de CMA France/g, '\n')
    .replace(/©Evalbox page \d+\/\d+/g, '\n')
    .replace(/Copie n°\d+/g, '\n')
    // Critique : n° d'examen + titre daté ne doivent jamais être capturés comme Q1.
    // Ne pas retirer les dates dans le corps des questions (ex. « né le 12 mai 1950 »).
    .replace(/Examen:\s*n°\d+\s*"[^"]*"/gi, '\n')
    .replace(/Examen:\s*n°\d+/gi, '\n')
    .replace(
      new RegExp(
        `\\d{1,2}\\s+(?:${MONTH_RE})\\b[^\\n]*(?:après-midi|matin|T3P|Gestion|Sécurité|Francais|Français|Anglais|Règlementation|Reglementation)[^\\n]*`,
        'gi',
      ),
      '\n',
    )
    .replace(/Reference de l'examen:[^\n]+/g, '\n')
    .replace(/Attention, l'étudiant n'a pas encore passé l'examen/g, '\n')
    .replace(/Légende\s*\n?\s*à cocher/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}

/** Retire un titre d'examen collé en tête d'énoncé (artefact PDF). */
function cleanStemArtifacts(stem: string, examTitle: string): string {
  let s = stem.replace(/\s+/g, ' ').trim()
  if (examTitle) {
    const escaped = examTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    s = s.replace(new RegExp(`^"?${escaped}"?\\s*\\d*\\s*`, 'i'), '').trim()
  }
  s = s.replace(new RegExp(`^(?:octobre|${MONTH_RE})\\b[^"]*"?\\s*\\d+\\s+`, 'i'), '').trim()
  s = s.replace(/^"[^"]{5,160}"\s+\d+\s+/u, '').trim()
  // Résidu « octobre - après-midi - B - …" 1 Énoncé »
  s = s.replace(
    new RegExp(`^(?:${MONTH_RE})\\b[\\s\\S]{0,120}?\\b1\\s+`, 'i'),
    '',
  ).trim()
  return s
}

/** True si le « numéro » ressemble à un artefact (n° examen ou jour du mois dans le titre). */
function isSpuriousQuestionNumber(number: number, stem: string): boolean {
  if (number >= 1000) return true
  if (number > 50) return true
  // Jour du mois (25/27/28 octobre) capturé : résidu de titre ou « 1 Énoncé » encore dans le stem.
  if (number >= 20 && number <= 31) {
    if (new RegExp(`^(?:${MONTH_RE})\\b`, 'i').test(stem)) return true
    if (/après-midi\s*-\s*[A-G(]/i.test(stem)) return true
    if (
      /\b1\s+(?:Quel|Quelle|Quels|Quelles|Parmi|Sur|Vous|Savez|Citez|Le |La |Un |Une |How |What |When |Where )/i.test(
        stem,
      )
    ) {
      return true
    }
  }
  return false
}

function buildPageMap(rawText: string): Map<number, number> {
  /** Maps character index -> pdf page number */
  const map = new Map<number, number>()
  const re = /--\s*(\d+)\s+of\s+\d+\s*--/g
  let match: RegExpExecArray | null
  let lastIndex = 0
  let lastPage = 1
  while ((match = re.exec(rawText)) !== null) {
    for (let i = lastIndex; i < match.index; i++) map.set(i, lastPage)
    lastPage = Number(match[1])
    lastIndex = match.index
  }
  for (let i = lastIndex; i < rawText.length; i++) map.set(i, lastPage)
  return map
}

function pageAt(pageMap: Map<number, number>, index: number): number {
  return pageMap.get(index) ?? 1
}

function detectType(kindLabel: string, stem: string): ExtractedQuestion['type'] {
  if (/ouverte/i.test(kindLabel)) return 'open'
  // Consignes explicites dans l'énoncé ( Evalbox : « Question à choix multiple » = QCM,
  // sans distinguer single/multi — on s'appuie sur la formulation de l'énoncé ).
  if (/(la ou )?lesquelles|plusieurs r[ée]ponses|cochez les|cochez la ou les/i.test(stem)) {
    return 'multiple'
  }
  // Interrogatifs pluriels typiques des QCM à plusieurs bonnes réponses.
  if (/^\s*quelles\b/i.test(stem) || /^\s*quels\b/i.test(stem)) {
    return 'multiple'
  }
  return 'single'
}

function parseInlineChoices(text: string): { choices: ExtractedQuestion['choices']; stem: string } | null {
  // Fallback quand les propositions sont collées sur une seule ligne.
  const re = /\s+([A-D])\s+/g
  const hits: Array<{ label: string; index: number }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[1]) hits.push({ label: m[1], index: m.index })
  }
  if (hits.length < 2 || hits[0]!.label !== 'A') return null

  let expected = 'A'.charCodeAt(0)
  const sequence: typeof hits = []
  for (const hit of hits) {
    if (hit.label.charCodeAt(0) !== expected) break
    sequence.push(hit)
    expected += 1
    if (expected > 'D'.charCodeAt(0)) break
  }
  if (sequence.length < 2) return null

  const first = sequence[0]!
  const stem = text.slice(0, first.index).trim()
  const choices: ExtractedQuestion['choices'] = []
  for (let i = 0; i < sequence.length; i++) {
    const cur = sequence[i]!
    const labelMatch = text.slice(cur.index).match(/^\s+([A-D])\s+/)
    const start = cur.index + (labelMatch?.[0]?.length ?? 0)
    const end = i + 1 < sequence.length ? sequence[i + 1]!.index : text.length
    const choiceText = text.slice(start, end).trim()
    if (!choiceText) continue
    choices.push({ id: cur.label.toLowerCase(), label: cur.label, text: choiceText })
  }
  return choices.length >= 2 ? { choices, stem } : null
}

function parseChoices(body: string): { choices: ExtractedQuestion['choices']; stem: string } {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)

  // Accepte « A texte », « B » seul (coupure de page), etc.
  type Marked = { index: number; label: string; text: string }
  const marked: Marked[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const m = line.match(/^([A-D])(?:\s+(.*))?$/)
    if (m?.[1]) marked.push({ index: i, label: m[1], text: (m[2] ?? '').trim() })
  }

  let blockStart = -1
  let blockLabels: Marked[] = []
  for (let i = 0; i < marked.length; i++) {
    if (marked[i]!.label !== 'A') continue
    let expected = 'A'.charCodeAt(0)
    let j = i
    const collected: Marked[] = []
    while (j < marked.length) {
      const item = marked[j]!
      if (item.label.charCodeAt(0) !== expected) break
      collected.push(item)
      expected += 1
      j += 1
      if (expected > 'D'.charCodeAt(0)) break
    }
    if (collected.length >= 2) {
      blockStart = collected[0]!.index
      blockLabels = collected
      break
    }
  }

  if (blockStart < 0) {
    const inline = parseInlineChoices(lines.join(' '))
    if (inline) return inline
    return { choices: [], stem: lines.join(' ').trim() }
  }

  const stem = lines.slice(0, blockStart).join(' ').trim()
  const choices: ExtractedQuestion['choices'] = []

  for (let i = 0; i < blockLabels.length; i++) {
    const item = blockLabels[i]!
    const nextIndex =
      i + 1 < blockLabels.length ? blockLabels[i + 1]!.index : lines.length
    const parts = [item.text, ...lines.slice(item.index + 1, nextIndex)].filter(Boolean)
    const text = parts.join(' ').trim()
    if (!text) continue
    choices.push({
      id: item.label.toLowerCase(),
      label: item.label,
      text,
    })
  }

  if (choices.length < 2) {
    const inline = parseInlineChoices([stem, ...lines.slice(blockStart)].join(' '))
    if (inline) return inline
  }

  return { choices, stem }
}

function parseExamBlock(
  block: string,
  year: number,
  sourceDocument: string,
  pageMap: Map<number, number>,
  absoluteOffset: number,
  imagesByPage: Map<number, string>,
  errors: string[],
): ExtractedQuestion[] {
  const headerMatch = block.match(/Examen:\s*n°\d+\s*"([^"]+)"/)
  if (!headerMatch?.[1]) {
    errors.push(`En-tête d'examen introuvable (année ${year})`)
    return []
  }

  const examTitle = headerMatch[1]
  const detected = detectSubject(examTitle)
  if (!detected) {
    errors.push(`Matière non détectée pour « ${examTitle} »`)
    return []
  }

  const cleaned = stripNoise(block)
  const questionRe =
    /(\d+)\s+([\s\S]*?)\((\d+)\s*point\s*\/\s*(\d+)\)\s*(Question à choix multiple|Question ouverte)/gi

  const questions: ExtractedQuestion[] = []
  let match: RegExpExecArray | null

  while ((match = questionRe.exec(cleaned)) !== null) {
    const number = Number(match[1])
    const rawBody = (match[2] ?? '').trim()
    const points = Number(match[4])
    const kindLabel = match[5] ?? ''

    const rightMatch = rawBody.match(/Indication\/Right answer\s*:\s*([\s\S]*)$/i)
    const openReferenceAnswer = rightMatch?.[1]?.trim() || undefined
    const bodyWithoutAnswer = rightMatch
      ? rawBody.slice(0, rightMatch.index).trim()
      : rawBody

    const { choices, stem: parsedStem } = parseChoices(bodyWithoutAnswer)
    let stem = cleanStemArtifacts(parsedStem.replace(/\s+/g, ' ').trim(), examTitle)
    let questionNumber = number

    // Filet de sécurité : n° d'examen (49954) ou jour du mois (27 octobre) capturé comme Qn.
    if (isSpuriousQuestionNumber(questionNumber, stem) || isSpuriousQuestionNumber(questionNumber, parsedStem)) {
      const fromEmbedded = (parsedStem.match(/\b1\s+([A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜa-zàâäéèêëîïôöùûü«].+)$/u) ??
        stem.match(/\b1\s+([A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜa-zàâäéèêëîïôöùûü«].+)$/u))?.[1]
      const stripped = cleanStemArtifacts(stem, examTitle)
      stem = cleanStemArtifacts((fromEmbedded ?? stripped).trim(), examTitle)
      questionNumber = 1
      errors.push(
        `${year} ${detected.subject}: numéro parasite ${number} capturé comme Q1 — récupération appliquée`,
      )
    }

    if (!stem && choices.length > 0) {
      stem = `[Question ${questionNumber} — énoncé principalement illustré, voir page ${pageAt(pageMap, absoluteOffset + (match.index ?? 0))} du PDF]`
      // sera enrichi avec hasIllustration ci-dessous
    }

    if (!stem) {
      errors.push(`${year} ${detected.subject} Q${questionNumber}: énoncé vide`)
      continue
    }

    const type = detectType(kindLabel, stem)
    if (type !== 'open') {
      for (const choice of choices) {
        const t = choice.text.trim()
        // Les propositions numériques courtes (« 2 », « 3 ») sont valides.
        if (!t || (t.length < 2 && !/^\d+[.,]?\d*$/.test(t))) {
          errors.push(
            `${year} ${detected.subject} Q${questionNumber}: proposition ${choice.label} vide ou fragmentée`,
          )
        }
      }
    }
    if (type !== 'open' && choices.length < 2) {
      errors.push(
        `${year} ${detected.subject} Q${questionNumber}: moins de 2 propositions détectées (${choices.length})`,
      )
    }

    const approxIndex = absoluteOffset + (match.index ?? 0)
    const pdfPage = pageAt(pageMap, approxIndex)
    // Ne pas associer automatiquement toute image de page à toutes les questions :
    // les liens question↔illustration sont gérés par extraction-patches.json.
    const illustrationPath = undefined
    const extractionNotes: string[] = []
    if (imagesByPage.has(pdfPage)) {
      extractionNotes.push(
        `Image(s) extraites sur la page PDF ${pdfPage} — association manuelle via patches si pertinent.`,
      )
    }

    let verificationStatus: ExtractedQuestion['verificationStatus'] = 'unverified'
    if (type === 'open' && openReferenceAnswer) {
      verificationStatus = 'needs_review'
      extractionNotes.push(
        'Correction ouverte issue de Indication/Right answer — à revalider réglementairement.',
      )
    } else if (type !== 'open') {
      extractionNotes.push(
        'Aucune bonne réponse QCM explicitement marquée dans le PDF (copie non remplie).',
      )
    } else {
      extractionNotes.push('Question ouverte sans Indication/Right answer dans le PDF.')
    }

    // Jamais de correctChoiceIds sans vérification explicite
    const question: ExtractedQuestion = {
      id: makeId(year, detected.subject, questionNumber, stem),
      subject: detected.subject,
      scope: detected.scope,
      year,
      number: questionNumber,
      stem,
      choices: type === 'open' ? [] : choices,
      type,
      openReferenceAnswer,
      origin: 'official_annals',
      sourceDocument,
      sourceExamTitle: examTitle,
      pdfPage,
      verificationStatus,
      lifecycleStatus: year < 2024 ? 'possibly_obsolete' : 'active',
      hasIllustration: Boolean(illustrationPath),
      illustrationPath,
      points,
      extractionNotes,
    }

    const parsed = QuestionSchema.safeParse(question)
    if (!parsed.success) {
      errors.push(
        `${year} ${detected.subject} Q${number}: validation Zod — ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      )
      continue
    }
    questions.push(parsed.data)
  }

  return questions
}

async function extractImages(
  year: number,
  buffer: Buffer,
): Promise<Map<number, string>> {
  const parser = new PDFParse({ data: buffer })
  const imageResult = await parser.getImage()
  const map = new Map<number, string>()
  await mkdir(IMAGES_DIR, { recursive: true })

  for (const page of imageResult.pages ?? []) {
    const imgs = page.images ?? []
    if (!imgs.length) continue
    // Une illustration principale par page pour l'instant
    const img = imgs[0]
    if (!img?.data) continue
    const bytes = Buffer.from(Object.values(img.data as Record<string, number>))
    const fileName = `${year}-p${page.pageNumber}.png`
    const abs = path.join(IMAGES_DIR, fileName)
    await writeFile(abs, bytes)
    map.set(page.pageNumber, `/annales/images/${fileName}`)
  }
  return map
}

async function extractYear(year: number, report: ExtractionReport): Promise<ExtractedQuestion[]> {
  const sourceDocument = `Annales Examen Taxi VTC ${year}.pdf`
  const pdfPath = path.join(ANNALES_DIR, sourceDocument)
  const buffer = await readFile(pdfPath)
  const parser = new PDFParse({ data: buffer })
  const textResult = await parser.getText()
  const rawText = textResult.text
  await writeFile(path.join(ANNALES_DIR, `raw-${year}.txt`), rawText)

  const pageMap = buildPageMap(rawText)
  const imagesByPage = await extractImages(year, buffer)
  report.illustrations += imagesByPage.size

  const examSplits = rawText.split(/(?=Examen:\s*n°\d+)/g).filter((b) => /Examen:\s*n°/.test(b))
  const questions: ExtractedQuestion[] = []

  for (const block of examSplits) {
    const offset = rawText.indexOf(block)
    questions.push(
      ...parseExamBlock(block, year, sourceDocument, pageMap, offset, imagesByPage, report.extractionErrors),
    )
  }

  return questions
}

function findDuplicates(questions: ExtractedQuestion[]): ExtractionReport['duplicates'] {
  const duplicates: ExtractionReport['duplicates'] = []
  const byNorm = new Map<string, ExtractedQuestion>()
  for (const q of questions) {
    const key = `${q.subject}::${normalizeStem(q.stem)}`
    const existing = byNorm.get(key)
    if (existing) {
      q.duplicateOf = existing.id
      q.extractionNotes = [
        ...(q.extractionNotes ?? []),
        `Doublon potentiel de ${existing.id} (original conservé).`,
      ]
      duplicates.push({ id: q.id, duplicateOf: existing.id, stem: q.stem.slice(0, 120) })
    } else {
      byNorm.set(key, q)
    }
  }
  return duplicates
}

const StructuralPatchSchema = z.object({
  questionId: z.string(),
  newId: z.string().optional(),
  number: z.number().int().positive().optional(),
  stem: z.string().optional(),
  choices: z
    .array(z.object({ id: z.string(), label: z.string(), text: z.string() }))
    .optional(),
  type: z.enum(['single', 'multiple', 'open']).optional(),
  hasIllustration: z.boolean().optional(),
  illustrationPath: z.string().optional(),
  legacyIds: z.array(z.string()).optional(),
  year: z.number().int().optional(),
  subject: z.string().optional(),
  note: z.string().optional(),
})

async function applyStructuralPatches(questions: ExtractedQuestion[]): Promise<number> {
  const patchPath = path.join(DATA_DIR, 'extraction-patches.json')
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(patchPath, 'utf8'))
  } catch {
    return 0
  }
  const patches = z.array(StructuralPatchSchema).parse(raw)
  let applied = 0
  for (const patch of patches) {
    let q = questions.find(
      (item) =>
        item.id === patch.questionId ||
        item.id === patch.newId ||
        item.legacyIds?.includes(patch.questionId),
    )
    // Reprise après extracteur corrigé : retrouver Q1 par année/matière/numéro.
    if (!q && patch.year && patch.subject && patch.number !== undefined) {
      q = questions.find(
        (item) =>
          item.year === patch.year &&
          item.subject === patch.subject &&
          item.number === patch.number,
      )
    }
    if (!q) continue
    if (patch.newId && patch.newId !== q.id) {
      q.legacyIds = [...new Set([...(q.legacyIds ?? []), q.id, patch.questionId])]
      q.id = patch.newId
    } else if (patch.questionId !== q.id) {
      q.legacyIds = [...new Set([...(q.legacyIds ?? []), patch.questionId])]
    }
    if (patch.legacyIds?.length) {
      q.legacyIds = [...new Set([...(q.legacyIds ?? []), ...patch.legacyIds])]
    }
    if (patch.number !== undefined) q.number = patch.number
    if (patch.stem) q.stem = patch.stem
    if (patch.choices) q.choices = patch.choices
    if (patch.type) q.type = patch.type
    if (patch.hasIllustration !== undefined) {
      q.hasIllustration = patch.hasIllustration
      if (!patch.hasIllustration) {
        delete q.illustrationPath
      }
    }
    if (patch.illustrationPath !== undefined) {
      if (patch.illustrationPath) {
        q.illustrationPath = patch.illustrationPath
        q.hasIllustration = true
      } else {
        delete q.illustrationPath
      }
    }
    q.extractionNotes = [
      ...(q.extractionNotes ?? []),
      patch.note ?? 'Correctif structurel manuel (extraction-patches.json).',
    ]
    applied += 1
  }
  return applied
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true })
  await mkdir(path.join(DATA_DIR, '2021'), { recursive: true })
  await mkdir(path.join(DATA_DIR, '2022'), { recursive: true })
  await mkdir(REPORTS_DIR, { recursive: true })

  const report: ExtractionReport = {
    generatedAt: new Date().toISOString(),
    years: [2021, 2022],
    imported: 0,
    byYear: {},
    bySubject: {},
    byType: {},
    byVerification: {},
    vtcRelevant: 0,
    duplicates: [],
    extractionErrors: [],
    missingCorrections: 0,
    openWithReference: 0,
    illustrations: 0,
    notes: [
      'Usage personnel uniquement — vérifier les conditions de réutilisation avant publication.',
      'Les QCM des annales Evalbox n’ont généralement pas de bonnes réponses cochées (copie non passée).',
      'Les « Indication/Right answer » des QRC sont stockées avec verificationStatus=needs_review.',
      'Aucune réponse QCM n’a été inventée ni marquée verified.',
      'Les validations utilisateur vivent dans src/data/corrections/overlays.json + localStorage — jamais écrasées ici.',
    ],
  }

  const all: ExtractedQuestion[] = []
  for (const year of [2021, 2022]) {
    const qs = await extractYear(year, report)
    all.push(...qs)
  }

  report.duplicates = findDuplicates(all)
  const patchesApplied = await applyStructuralPatches(all)
  report.notes.push(`Correctifs structurels appliqués : ${patchesApplied}.`)

  // Réécriture par année après patches / doublons
  for (const year of [2021, 2022]) {
    const qs = all.filter((q) => q.year === year)
    report.byYear[String(year)] = qs.length
    const bySubjectFile: Record<string, ExtractedQuestion[]> = {}
    for (const q of qs) {
      bySubjectFile[q.subject] ??= []
      bySubjectFile[q.subject]!.push(q)
    }
    for (const [subject, list] of Object.entries(bySubjectFile)) {
      const out = path.join(DATA_DIR, String(year), `${subject.toLowerCase()}.json`)
      await writeFile(out, JSON.stringify(list, null, 2) + '\n')
    }
    await writeFile(
      path.join(DATA_DIR, String(year), 'index.json'),
      JSON.stringify(qs, null, 2) + '\n',
    )
  }

  report.imported = all.length
  for (const q of all) {
    report.bySubject[q.subject] = (report.bySubject[q.subject] ?? 0) + 1
    report.byType[q.type] = (report.byType[q.type] ?? 0) + 1
    report.byVerification[q.verificationStatus] =
      (report.byVerification[q.verificationStatus] ?? 0) + 1
    if (q.scope === 'common' || q.scope === 'vtc') report.vtcRelevant += 1
    if (q.verificationStatus === 'unverified') report.missingCorrections += 1
    if (q.openReferenceAnswer) report.openWithReference += 1
  }

  await writeFile(
    path.join(DATA_DIR, 'all.json'),
    JSON.stringify(all, null, 2) + '\n',
  )
  await writeFile(
    path.join(REPORTS_DIR, 'extraction-report.json'),
    JSON.stringify(report, null, 2) + '\n',
  )

  const md = `# Rapport d'extraction des annales

Généré le : ${report.generatedAt}

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| Questions importées | ${report.imported} |
| Pertinentes VTC (common + FV/GV) | ${report.vtcRelevant} |
| Doublons détectés | ${report.duplicates.length} |
| Erreurs d'extraction | ${report.extractionErrors.length} |
| Corrections manquantes (unverified) | ${report.missingCorrections} |
| QRC avec référence (needs_review) | ${report.openWithReference} |
| Pages illustrées extraites | ${report.illustrations} |

## Par année

${Object.entries(report.byYear)
  .map(([y, n]) => `- ${y} : ${n}`)
  .join('\n')}

## Par matière

${Object.entries(report.bySubject)
  .map(([s, n]) => `- ${s} : ${n}`)
  .join('\n')}

## Par type

${Object.entries(report.byType)
  .map(([t, n]) => `- ${t} : ${n}`)
  .join('\n')}

## Par statut de vérification

${Object.entries(report.byVerification)
  .map(([t, n]) => `- ${t} : ${n}`)
  .join('\n')}

## Erreurs

${report.extractionErrors.length ? report.extractionErrors.map((e) => `- ${e}`).join('\n') : '_Aucune_'}

## Doublons

${
  report.duplicates.length
    ? report.duplicates.map((d) => `- ${d.id} ≈ ${d.duplicateOf} — ${d.stem}`).join('\n')
    : '_Aucun_'
}

## Notes

${report.notes.map((n) => `- ${n}`).join('\n')}
`

  await writeFile(path.join(REPORTS_DIR, 'extraction-report.md'), md)
  console.log(md)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
