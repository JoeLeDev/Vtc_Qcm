import { describe, expect, it } from 'vitest'
import { resolveQuestionId } from '@/lib/question-id-aliases'
import type { Question } from '@/types/exam'
import allQuestions from './all.json'
import idAliases from './id-aliases.json'
import extractionPatches from './extraction-patches.json'
import lotA01 from '../../../docs/corrections/lot-A-01-suggestions.json'
import lotA02 from '../../../docs/corrections/lot-A-02-suggestions.json'
import lotB01 from '../../../docs/corrections/lot-B-01-suggestions.json'
import lotC01 from '../../../docs/corrections/lot-C-01-suggestions.json'
import lotD01 from '../../../docs/corrections/lot-D-01-suggestions.json'
import lotE01 from '../../../docs/corrections/lot-E-01-suggestions.json'
import lotFV01 from '../../../docs/corrections/lot-FV-01-suggestions.json'
import lotGV01 from '../../../docs/corrections/lot-GV-01-suggestions.json'
import overlays from '@/data/corrections/overlays.json'

const questions = allQuestions as Question[]

const EXPECTED_COUNTS: Record<string, Record<string, number>> = {
  '2021': { A: 15, B: 18, C: 20, D: 10, E: 20, FV: 16, GV: 8, GT: 15, FM: 16, GM: 8 },
  '2022': { A: 15, B: 18, C: 20, D: 10, E: 20, FV: 16, GV: 8, GT: 16, FM: 16, GM: 8 },
}

const STABLE_Q1: Array<{ year: number; subject: string; id: string; type: Question['type'] }> = [
  { year: 2021, subject: 'A', id: '2021-A-q01-6f0023fa', type: 'multiple' },
  { year: 2021, subject: 'B', id: '2021-B-q01-f4004dbb', type: 'single' },
  { year: 2021, subject: 'C', id: '2021-C-q01-a8bb3e17', type: 'single' },
  { year: 2022, subject: 'A', id: '2022-A-q01-34dc9cf1', type: 'single' },
]

function byYearSubject(year: number, subject: string): Question[] {
  return questions.filter((q) => q.year === year && q.subject === subject)
}

describe('intégrité banque annales', () => {
  it('couvre le total attendu 293 questions', () => {
    expect(questions).toHaveLength(293)
  })

  it('présente la première et la dernière question de chaque matière/année', () => {
    for (const [year, subjects] of Object.entries(EXPECTED_COUNTS)) {
      for (const [subject, count] of Object.entries(subjects)) {
        const list = byYearSubject(Number(year), subject)
        expect(list.length, `${year} ${subject}`).toBe(count)
        const numbers = list.map((q) => q.number).sort((a, b) => a - b)
        expect(numbers[0]).toBe(1)
        expect(numbers.at(-1)).toBe(count)
        expect(numbers).toEqual(Array.from({ length: count }, (_, i) => i + 1))
      }
    }
  })

  it('stabilise les identifiants Q1 prioritaires et leurs types', () => {
    for (const expected of STABLE_Q1) {
      const q = questions.find((item) => item.id === expected.id)
      expect(q, expected.id).toBeDefined()
      expect(q!.year).toBe(expected.year)
      expect(q!.subject).toBe(expected.subject)
      expect(q!.number).toBe(1)
      expect(q!.type).toBe(expected.type)
      expect(q!.stem.length).toBeGreaterThan(10)
      expect(q!.stem).not.toMatch(/Examen:\s*n°/i)
      expect(q!.stem).not.toMatch(/après-midi\s*-\s*[A-G]/i)
    }
  })

  it('conserve C 2021 Q4 en multiple (consigne plurielle)', () => {
    const q = questions.find((item) => item.id === '2021-C-q04-3f61e04a')
    expect(q?.type).toBe('multiple')
    expect(q?.stem).toMatch(/^Quelles sont/i)
    expect(q?.choices.length).toBe(4)
  })

  it('résout les aliases d’anciens identifiants', () => {
    for (const [legacy, canonical] of Object.entries(idAliases)) {
      expect(resolveQuestionId(legacy, questions)).toBe(canonical)
      expect(questions.some((q) => q.id === canonical)).toBe(true)
    }
  })

  it('expose legacyIds sur les Q1 patchées', () => {
    for (const q of questions.filter((item) => item.number === 1)) {
      expect(q.legacyIds?.length, q.id).toBeGreaterThan(0)
    }
  })

  it('conserve les suggestions des lots A–GV sur des IDs existants sans doublon ni verified', () => {
    const lots = [lotA01, lotA02, lotB01, lotC01, lotD01, lotE01, lotFV01, lotGV01] as Array<{
      suggestions: Array<{ questionId: string; status?: string }>
    }>
    const seen = new Set<string>()
    for (const lot of lots) {
      for (const suggestion of lot.suggestions) {
        const canonical = resolveQuestionId(suggestion.questionId, questions)
        expect(questions.some((q) => q.id === canonical), suggestion.questionId).toBe(true)
        expect(suggestion.status === 'verified').toBe(false)
        expect(seen.has(canonical), `doublon ${canonical}`).toBe(false)
        seen.add(canonical)
      }
    }
  })

  it('associe correctement les illustrations prioritaires après patches', () => {
    const c20 = questions.find((q) => q.id === '2021-C-q20-a2677f4a')
    expect(c20?.hasIllustration).toBe(true)
    expect(c20?.illustrationPath).toBe('/annales/images/2021-p8.png')

    const d1 = questions.find((q) => q.id === '2021-D-q01-5033fa43')
    expect(d1?.hasIllustration).toBe(true)
    expect(d1?.illustrationPath).toBe('/annales/images/2021-p9.png')

    const c18 = questions.find((q) => q.year === 2022 && q.subject === 'C' && q.number === 18)
    expect(c18?.hasIllustration).toBe(false)
  })

  it('ne touche pas aux overlays seed (fichier vide ou intact)', () => {
    expect(Array.isArray(overlays)).toBe(true)
    expect(overlays).toEqual([])
  })

  it('n’a pas de proposition vide ou fragmentée (hors numériques courts)', () => {
    for (const q of questions) {
      if (q.type === 'open') {
        expect(q.choices).toEqual([])
        continue
      }
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2)
      for (const choice of q.choices) {
        const text = choice.text.trim()
        expect(text.length, `${q.id} ${choice.label}`).toBeGreaterThan(0)
        if (text.length < 2) {
          expect(text).toMatch(/^\d+[.,]?\d*$/)
        }
      }
    }
  })

  it('applique des patches structurels recensés sans inventer de verified', () => {
    expect(extractionPatches.length).toBeGreaterThanOrEqual(20)
    for (const q of questions) {
      expect(q.verificationStatus).not.toBe('verified')
      expect(q.correctChoiceIds ?? []).toEqual([])
    }
  })
})
