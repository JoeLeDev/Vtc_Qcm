import type { Question } from '@/types/exam'
import { applyOverlays } from '@/lib/corrections'
import { questionsArraySchema } from '@/lib/exam/question-schema'
import { filterVtcQuestions } from '@/lib/exam-engine'
import { buildQuestionIdAliasMap, resolveQuestionId } from '@/lib/question-id-aliases'

let cache: Question[] | null = null
let loadPromise: Promise<Question[]> | null = null

async function loadRawQuestions(): Promise<Question[]> {
  // Chargement dynamique pour ne pas gonfler le bundle initial.
  const module = await import('./all.json')
  const parsed = questionsArraySchema.safeParse(module.default)
  if (!parsed.success) {
    console.error('Banque de questions invalide', parsed.error.flatten())
    return []
  }
  return parsed.data as Question[]
}

export async function loadAllQuestions(): Promise<Question[]> {
  if (cache) return applyOverlays(cache)
  if (!loadPromise) {
    loadPromise = loadRawQuestions().then((questions) => {
      cache = questions
      return questions
    })
  }
  const questions = await loadPromise
  return applyOverlays(questions)
}

export async function loadVtcQuestions(): Promise<Question[]> {
  const all = await loadAllQuestions()
  return filterVtcQuestions(all)
}

export function getCachedVtcQuestions(): Question[] {
  if (!cache) return []
  return filterVtcQuestions(applyOverlays(cache))
}

export function invalidateQuestionCache(): void {
  // Conserve le raw cache, les overlays sont relus à chaque applyOverlays.
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  const all = await loadAllQuestions()
  const canonical = resolveQuestionId(id, all)
  return all.find((q) => q.id === canonical)
}

/** Résout un ID legacy vers l’ID canonique de la banque. */
export async function resolveBankQuestionId(id: string): Promise<string> {
  const all = await loadAllQuestions()
  return resolveQuestionId(id, all, buildQuestionIdAliasMap(all))
}

export async function getBankStats() {
  const vtc = await loadVtcQuestions()
  const all = await loadAllQuestions()
  const bySubject: Record<string, number> = {}
  const byVerification: Record<string, number> = {}
  for (const q of vtc) {
    bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1
    byVerification[q.verificationStatus] = (byVerification[q.verificationStatus] ?? 0) + 1
  }
  return {
    total: vtc.length,
    allImported: all.length,
    bySubject,
    byVerification,
    years: [...new Set(vtc.map((q) => q.year))].sort(),
  }
}
