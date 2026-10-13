import type { Question } from '@/types/exam'
import staticAliases from '@/data/questions/id-aliases.json' with { type: 'json' }

const staticAliasMap = new Map<string, string>(Object.entries(staticAliases))

/** Mappe un ID legacy (extraction corrompue) vers l’ID canonique. */
export function buildQuestionIdAliasMap(questions?: Question[]): Map<string, string> {
  const map = new Map<string, string>(staticAliasMap)
  for (const q of questions ?? []) {
    for (const legacy of q.legacyIds ?? []) {
      map.set(legacy, q.id)
    }
  }
  return map
}

export function resolveQuestionId(
  id: string,
  questions?: Question[],
  aliasMap?: Map<string, string>,
): string {
  const map = aliasMap ?? buildQuestionIdAliasMap(questions)
  return map.get(id) ?? id
}
