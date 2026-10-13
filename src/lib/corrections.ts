import type {
  ConfidenceLevel,
  CorrectionSuggestion,
  QuestionReviewDecision,
  ValidationHistoryEntry,
} from '@/types/corrections'
import type { CorrectionOverlay, Question } from '@/types/exam'
import {
  canMarkVerified,
  correctionOverlaysSchema,
} from '@/lib/exam/question-schema'
import {
  correctionSuggestionsSchema,
  externalSuggestionImportSchema,
  progressBackupSchema,
  questionReviewDecisionsSchema,
  validationHistorySchema,
} from '@/lib/exam/correction-schemas'
import { migrateLocalStorage } from '@/lib/storage-migration'
import { resolveQuestionId } from '@/lib/question-id-aliases'
import seedOverlays from '@/data/corrections/overlays.json' with { type: 'json' }
import seedSuggestions from '@/data/corrections/suggestions.json' with { type: 'json' }

function canonicalizeQuestionId(id: string): string {
  return resolveQuestionId(id)
}

const OVERLAYS_KEY = 'vtc-qcm:correction-overlays'
const SUGGESTIONS_KEY = 'vtc-qcm:correction-suggestions'
const HISTORY_KEY = 'vtc-qcm:validation-history'
const REVIEW_KEY = 'vtc-qcm:review-decisions'

function ensureMigrated() {
  if (typeof localStorage === 'undefined') return
  migrateLocalStorage()
}

function readJson<T>(key: string, fallback: T, parse: (data: unknown) => T | null): T {
  if (typeof localStorage === 'undefined') return fallback
  ensureMigrated()
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const parsed = parse(JSON.parse(raw))
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  ensureMigrated()
  localStorage.setItem(key, JSON.stringify(value))
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function appendHistory(entry: Omit<ValidationHistoryEntry, 'id' | 'at'> & { at?: string }) {
  const history = getValidationHistory()
  history.unshift({
    id: newId('hist'),
    at: entry.at ?? new Date().toISOString(),
    questionId: entry.questionId,
    action: entry.action,
    note: entry.note,
    suggestionId: entry.suggestionId,
    toVerificationStatus: entry.toVerificationStatus,
  })
  writeJson(HISTORY_KEY, history.slice(0, 500))
}

export function getValidationHistory(questionId?: string): ValidationHistoryEntry[] {
  const all = readJson(HISTORY_KEY, [] as ValidationHistoryEntry[], (data) => {
    const parsed = validationHistorySchema.safeParse(data)
    return parsed.success ? parsed.data : null
  })
  return questionId ? all.filter((h) => h.questionId === questionId) : all
}

export function getSeedOverlays(): CorrectionOverlay[] {
  const parsed = correctionOverlaysSchema.safeParse(seedOverlays)
  return parsed.success ? (parsed.data as CorrectionOverlay[]) : []
}

function readLocalOverlays(): CorrectionOverlay[] {
  return readJson(OVERLAYS_KEY, [] as CorrectionOverlay[], (data) => {
    const parsed = correctionOverlaysSchema.safeParse(data)
    return parsed.success ? (parsed.data as CorrectionOverlay[]) : null
  })
}

export function getMergedOverlays(): CorrectionOverlay[] {
  const map = new Map<string, CorrectionOverlay>()
  for (const overlay of [...getSeedOverlays(), ...readLocalOverlays()]) {
    const questionId = canonicalizeQuestionId(overlay.questionId)
    map.set(questionId, { ...overlay, questionId })
  }
  return [...map.values()]
}

export function getOverlayForQuestion(questionId: string): CorrectionOverlay | undefined {
  const canonical = canonicalizeQuestionId(questionId)
  return getMergedOverlays().find((o) => o.questionId === canonical)
}

/**
 * Applique uniquement les overlays validés pour le scoring.
 * Les suggestions ne passent jamais ici → jamais scorées.
 */
export function applyOverlay(question: Question, overlay?: CorrectionOverlay): Question {
  if (!overlay) return question
  return {
    ...question,
    verificationStatus: overlay.verificationStatus,
    correctChoiceIds:
      overlay.verificationStatus === 'verified' ? overlay.correctChoiceIds : undefined,
    openReferenceAnswer: overlay.openReferenceAnswer ?? question.openReferenceAnswer,
    explanation:
      overlay.verificationStatus === 'verified' ? overlay.explanation : question.explanation,
    justificationRef:
      overlay.verificationStatus === 'verified'
        ? overlay.justificationRef
        : question.justificationRef,
    verifiedByUser: overlay.verifiedByUser,
    verifiedAt: overlay.verifiedAt,
    lastRegulatoryCheck:
      overlay.verificationStatus === 'verified'
        ? overlay.verifiedAt.slice(0, 10)
        : question.lastRegulatoryCheck,
    lifecycleStatus: overlay.possiblyObsolete ? 'possibly_obsolete' : question.lifecycleStatus,
  }
}

export function applyOverlays(questions: Question[]): Question[] {
  const map = new Map(getMergedOverlays().map((o) => [o.questionId, o]))
  return questions.map((q) =>
    applyOverlay(q, map.get(q.id) ?? map.get(canonicalizeQuestionId(q.id))),
  )
}

export function saveOverlay(
  overlay: CorrectionOverlay,
): { ok: true } | { ok: false; reason: string } {
  if (overlay.verificationStatus === 'verified') {
    if (!overlay.explanation.trim() || !overlay.justificationRef.trim()) {
      return { ok: false, reason: 'Explication et référence obligatoires pour vérifier.' }
    }
    if (!overlay.correctChoiceIds?.length && !overlay.openReferenceAnswer?.trim()) {
      return { ok: false, reason: 'Une réponse correcte est obligatoire pour vérifier.' }
    }
  }

  const current = readLocalOverlays().filter((o) => o.questionId !== overlay.questionId)
  current.push(overlay)
  writeJson(OVERLAYS_KEY, current)
  return { ok: true }
}

export function getSeedSuggestions(): CorrectionSuggestion[] {
  const parsed = correctionSuggestionsSchema.safeParse(seedSuggestions)
  return parsed.success ? parsed.data : []
}

function readLocalSuggestions(): CorrectionSuggestion[] {
  return readJson(SUGGESTIONS_KEY, [] as CorrectionSuggestion[], (data) => {
    const parsed = correctionSuggestionsSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  })
}

export function getMergedSuggestions(): CorrectionSuggestion[] {
  const map = new Map<string, CorrectionSuggestion>()
  for (const item of getSeedSuggestions()) {
    map.set(item.id, {
      ...item,
      questionId: canonicalizeQuestionId(item.questionId),
    })
  }
  for (const item of readLocalSuggestions()) {
    map.set(item.id, {
      ...item,
      questionId: canonicalizeQuestionId(item.questionId),
    })
  }
  return [...map.values()]
}

export function getActiveSuggestionForQuestion(
  questionId: string,
): CorrectionSuggestion | undefined {
  const canonical = canonicalizeQuestionId(questionId)
  return getMergedSuggestions().find(
    (s) =>
      canonicalizeQuestionId(s.questionId) === canonical && s.status === 'suggested',
  )
}

export function listSuggestionsForQuestion(questionId: string): CorrectionSuggestion[] {
  const canonical = canonicalizeQuestionId(questionId)
  return getMergedSuggestions()
    .filter((s) => canonicalizeQuestionId(s.questionId) === canonical)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function writeLocalSuggestions(items: CorrectionSuggestion[]) {
  writeJson(SUGGESTIONS_KEY, items)
}

export function saveManualSuggestion(input: {
  questionId: string
  proposedChoiceIds?: string[]
  proposedOpenAnswer?: string
  pedagogicalExplanation: string
  documentaryRef: string
  confidence: ConfidenceLevel
}): { ok: true; suggestion: CorrectionSuggestion } | { ok: false; reason: string } {
  if (!input.pedagogicalExplanation.trim() || !input.documentaryRef.trim()) {
    return { ok: false, reason: 'Explication pédagogique et référence documentaire obligatoires.' }
  }
  if (!input.proposedChoiceIds?.length && !input.proposedOpenAnswer?.trim()) {
    return { ok: false, reason: 'Proposez au moins une réponse (choix ou texte).' }
  }

  const now = new Date().toISOString()
  const existing = readLocalSuggestions().filter(
    (s) => !(s.questionId === input.questionId && s.status === 'suggested'),
  )
  const suggestion: CorrectionSuggestion = {
    id: newId('sug'),
    questionId: input.questionId,
    status: 'suggested',
    proposedChoiceIds: input.proposedChoiceIds,
    proposedOpenAnswer: input.proposedOpenAnswer?.trim() || undefined,
    pedagogicalExplanation: input.pedagogicalExplanation.trim(),
    documentaryRef: input.documentaryRef.trim(),
    confidence: input.confidence,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  }
  existing.push(suggestion)
  writeLocalSuggestions(existing)
  appendHistory({
    questionId: input.questionId,
    action: 'create_suggestion',
    suggestionId: suggestion.id,
  })
  return { ok: true, suggestion }
}

export function importSuggestionsJson(
  json: string,
): { ok: true; count: number } | { ok: false; reason: string } {
  try {
    const data = JSON.parse(json) as unknown
    const asObject =
      Array.isArray(data) ? { suggestions: data } : data
    const parsed = externalSuggestionImportSchema.safeParse(asObject)
    if (!parsed.success) {
      return {
        ok: false,
        reason:
          'JSON invalide. Attendu : { "suggestions": [ { questionId, pedagogicalExplanation, documentaryRef, ... } ] }',
      }
    }

    const now = new Date().toISOString()
    let current = readLocalSuggestions()
    let count = 0
    for (const item of parsed.data.suggestions) {
      const questionId = canonicalizeQuestionId(item.questionId)
      current = current.filter(
        (s) => !(s.questionId === questionId && s.status === 'suggested'),
      )
      const suggestion: CorrectionSuggestion = {
        id: newId('sug'),
        questionId,
        status: 'suggested',
        proposedChoiceIds: item.proposedChoiceIds,
        proposedOpenAnswer: item.proposedOpenAnswer,
        pedagogicalExplanation: item.pedagogicalExplanation,
        documentaryRef: item.documentaryRef,
        confidence: item.confidence,
        source: 'external_import',
        createdAt: now,
        updatedAt: now,
      }
      current.push(suggestion)
      appendHistory({
        questionId,
        action: 'import_suggestion',
        suggestionId: suggestion.id,
      })
      count += 1
    }
    writeLocalSuggestions(current)
    return { ok: true, count }
  } catch {
    return { ok: false, reason: 'Impossible de lire le JSON de suggestions.' }
  }
}

export function rejectSuggestion(
  suggestionId: string,
  note?: string,
): { ok: true } | { ok: false; reason: string } {
  const current = readLocalSuggestions()
  const index = current.findIndex((s) => s.id === suggestionId)
  const seedHit = getSeedSuggestions().find((s) => s.id === suggestionId)
  if (index < 0 && !seedHit) return { ok: false, reason: 'Suggestion introuvable.' }

  if (index >= 0) {
    current[index] = {
      ...current[index]!,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    }
  } else if (seedHit) {
    current.push({
      ...seedHit,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    })
  }
  writeLocalSuggestions(current)
  const target = current.find((s) => s.id === suggestionId) ?? seedHit!
  appendHistory({
    questionId: target.questionId,
    action: 'reject_suggestion',
    suggestionId,
    note,
  })
  return { ok: true }
}

export function saveOverlayForQuestion(
  question: Question,
  draft: {
    correctChoiceIds?: string[]
    openReferenceAnswer?: string
    explanation: string
    justificationRef: string
    possiblyObsolete?: boolean
    markVerified: boolean
    officialSourceEstablished?: boolean
    suggestionId?: string
    modifiedFromSuggestion?: boolean
  },
): { ok: true; overlay: CorrectionOverlay } | { ok: false; reason: string } {
  if (draft.markVerified) {
    const check = canMarkVerified({
      type: question.type,
      correctChoiceIds: draft.correctChoiceIds,
      openReferenceAnswer: draft.openReferenceAnswer ?? question.openReferenceAnswer,
      explanation: draft.explanation,
      justificationRef: draft.justificationRef,
    })
    if (!check.ok) return check
  }

  const overlay: CorrectionOverlay = {
    questionId: question.id,
    verificationStatus: draft.markVerified
      ? 'verified'
      : question.openReferenceAnswer || draft.openReferenceAnswer
        ? 'needs_review'
        : 'unverified',
    correctChoiceIds: draft.correctChoiceIds,
    openReferenceAnswer: draft.openReferenceAnswer ?? question.openReferenceAnswer,
    explanation: draft.explanation.trim(),
    justificationRef: draft.justificationRef.trim(),
    possiblyObsolete: draft.possiblyObsolete,
    verifiedAt: new Date().toISOString(),
    verifiedByUser: true,
    sourceKind: draft.markVerified
      ? draft.officialSourceEstablished
        ? 'official_documented'
        : 'user_validated'
      : question.openReferenceAnswer
        ? 'annals_indicative'
        : 'pedagogical_suggestion',
    officialSourceEstablished: Boolean(draft.officialSourceEstablished),
  }

  const result = saveOverlay(overlay)
  if (!result.ok) return result

  if (draft.markVerified && draft.suggestionId) {
    const suggestions = readLocalSuggestions()
    const idx = suggestions.findIndex((s) => s.id === draft.suggestionId)
    const now = new Date().toISOString()
    if (idx >= 0) {
      suggestions[idx] = {
        ...suggestions[idx]!,
        status: 'rejected',
        updatedAt: now,
      }
    } else {
      const seedHit = getSeedSuggestions().find((s) => s.id === draft.suggestionId)
      if (seedHit) {
        suggestions.push({
          ...seedHit,
          questionId: canonicalizeQuestionId(seedHit.questionId),
          status: 'rejected',
          updatedAt: now,
        })
      }
    }
    writeLocalSuggestions(suggestions)
  }

  appendHistory({
    questionId: question.id,
    action: draft.markVerified
      ? draft.modifiedFromSuggestion
        ? 'modify_and_confirm'
        : 'confirm_verified'
      : 'save_draft',
    suggestionId: draft.suggestionId,
    toVerificationStatus: overlay.verificationStatus,
  })

  return { ok: true, overlay }
}

export function exportOverlaysJson(): string {
  return JSON.stringify(getMergedOverlays(), null, 2) + '\n'
}

export function exportSuggestionsJson(): string {
  return (
    JSON.stringify(
      {
        version: 1,
        suggestions: getMergedSuggestions().filter((s) => s.status === 'suggested'),
      },
      null,
      2,
    ) + '\n'
  )
}

export function importOverlaysJson(
  json: string,
): { ok: true; count: number } | { ok: false; reason: string } {
  try {
    const parsed = correctionOverlaysSchema.safeParse(JSON.parse(json))
    if (!parsed.success) return { ok: false, reason: 'JSON de corrections validées invalide.' }
    const remapped = parsed.data.map((overlay) => ({
      ...overlay,
      questionId: canonicalizeQuestionId(overlay.questionId),
    }))
    writeJson(OVERLAYS_KEY, remapped)
    return { ok: true, count: remapped.length }
  } catch {
    return { ok: false, reason: 'Impossible de lire le JSON.' }
  }
}

function readLocalReviewDecisions(): QuestionReviewDecision[] {
  return readJson(REVIEW_KEY, [] as QuestionReviewDecision[], (data) => {
    const parsed = questionReviewDecisionsSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  })
}

export function getMergedReviewDecisions(): QuestionReviewDecision[] {
  const map = new Map<string, QuestionReviewDecision>()
  for (const item of readLocalReviewDecisions()) {
    map.set(canonicalizeQuestionId(item.questionId), {
      ...item,
      questionId: canonicalizeQuestionId(item.questionId),
    })
  }
  return [...map.values()]
}

export function getReviewDecision(questionId: string): QuestionReviewDecision | undefined {
  const canonical = canonicalizeQuestionId(questionId)
  return getMergedReviewDecisions().find((d) => d.questionId === canonical)
}

export function saveReviewDecision(
  input: Omit<QuestionReviewDecision, 'updatedAt'> & { updatedAt?: string },
  historyAction:
    | 'add_review_note'
    | 'request_recheck'
    | 'mark_not_scoreable'
    | 'clear_scoring_block' = 'add_review_note',
): { ok: true; decision: QuestionReviewDecision } {
  const questionId = canonicalizeQuestionId(input.questionId)
  const decision: QuestionReviewDecision = {
    ...input,
    questionId,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  }
  const current = readLocalReviewDecisions().filter(
    (d) => canonicalizeQuestionId(d.questionId) !== questionId,
  )
  current.push(decision)
  writeJson(REVIEW_KEY, current)
  appendHistory({
    questionId,
    action: historyAction,
    note: decision.note,
  })
  return { ok: true, decision }
}

export function exportReviewDecisionsJson(): string {
  return JSON.stringify(getMergedReviewDecisions(), null, 2) + '\n'
}

export function importReviewDecisionsJson(
  json: string,
): { ok: true; count: number } | { ok: false; reason: string } {
  try {
    const parsed = questionReviewDecisionsSchema.safeParse(JSON.parse(json))
    if (!parsed.success) return { ok: false, reason: 'JSON de décisions de revue invalide.' }
    const remapped = parsed.data.map((item) => ({
      ...item,
      questionId: canonicalizeQuestionId(item.questionId),
    }))
    writeJson(REVIEW_KEY, remapped)
    return { ok: true, count: remapped.length }
  } catch {
    return { ok: false, reason: 'Impossible de lire le JSON de décisions.' }
  }
}

export async function exportProgressBackup(): Promise<string> {
  ensureMigrated()
  const backup = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    settings: safeParseStorage('vtc-qcm:settings'),
    progress: safeParseStorage('vtc-qcm:progress'),
    sessions: safeParseStorage('vtc-qcm:sessions'),
    activeSession: safeParseStorage('vtc-qcm:active-session'),
    overlays: getMergedOverlays(),
    suggestions: getMergedSuggestions(),
    validationHistory: getValidationHistory(),
    reviewDecisions: getMergedReviewDecisions(),
  }
  return JSON.stringify(backup, null, 2) + '\n'
}

function safeParseStorage(key: string): unknown {
  if (typeof localStorage === 'undefined') return undefined
  const raw = localStorage.getItem(key)
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function importProgressBackup(
  json: string,
): { ok: true } | { ok: false; reason: string } {
  try {
    const parsed = progressBackupSchema.safeParse(JSON.parse(json))
    if (!parsed.success) return { ok: false, reason: 'Sauvegarde JSON invalide.' }
    const data = parsed.data
    if (data.settings !== undefined) {
      localStorage.setItem('vtc-qcm:settings', JSON.stringify(data.settings))
    }
    if (data.progress !== undefined) {
      localStorage.setItem('vtc-qcm:progress', JSON.stringify(data.progress))
    }
    if (data.sessions !== undefined) {
      localStorage.setItem('vtc-qcm:sessions', JSON.stringify(data.sessions))
    }
    if (data.activeSession !== undefined) {
      localStorage.setItem('vtc-qcm:active-session', JSON.stringify(data.activeSession))
    }
    if (data.overlays) {
      writeJson(
        OVERLAYS_KEY,
        data.overlays.map((o) => ({ ...o, questionId: canonicalizeQuestionId(o.questionId) })),
      )
    }
    if (data.suggestions) {
      writeJson(
        SUGGESTIONS_KEY,
        data.suggestions.map((s) => ({
          ...s,
          questionId: canonicalizeQuestionId(s.questionId),
        })),
      )
    }
    if (data.validationHistory) writeJson(HISTORY_KEY, data.validationHistory)
    if (data.reviewDecisions) {
      writeJson(
        REVIEW_KEY,
        data.reviewDecisions.map((d) => ({
          ...d,
          questionId: canonicalizeQuestionId(d.questionId),
        })),
      )
    }
    migrateLocalStorage()
    return { ok: true }
  } catch {
    return { ok: false, reason: 'Impossible d’importer la sauvegarde.' }
  }
}

export function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'Confiance élevée'
    case 'medium':
      return 'Confiance moyenne'
    default:
      return 'Confiance faible'
  }
}
