import { describe, expect, it } from 'vitest'
import allQuestions from '@/data/questions/all.json'
import {
  FIRST_30_QUESTION_IDS,
  FIRST_30_SERIES,
  first30Order,
  isFirst30Question,
} from '@/data/corrections/first-30-series'
import { getPriorityAnomaly } from '@/data/corrections/priority-anomalies'
import { getMergedSuggestions } from '@/lib/corrections'
import type { Question } from '@/types/exam'

const questions = allQuestions as Question[]

describe('première série de 30', () => {
  it('contient exactement 30 IDs uniques dans l’ordre du dossier', () => {
    expect(FIRST_30_QUESTION_IDS).toHaveLength(30)
    expect(new Set(FIRST_30_QUESTION_IDS).size).toBe(30)
    expect(FIRST_30_SERIES.count).toBe(30)
    FIRST_30_QUESTION_IDS.forEach((id, index) => {
      expect(first30Order(id)).toBe(index + 1)
      expect(isFirst30Question(id)).toBe(true)
    })
  })

  it('ne contient aucune anomalie prioritaire', () => {
    for (const id of FIRST_30_QUESTION_IDS) {
      expect(getPriorityAnomaly(id), id).toBeUndefined()
    }
  })

  it('ne contient que des QCM avec suggestion active et propositions cohérentes', () => {
    const byId = new Map(questions.map((q) => [q.id, q]))
    const suggestions = getMergedSuggestions().filter((s) => s.status === 'suggested')
    const sugByQ = new Map(suggestions.map((s) => [s.questionId, s]))

    for (const id of FIRST_30_QUESTION_IDS) {
      const q = byId.get(id)
      expect(q, id).toBeDefined()
      expect(q!.type).not.toBe('open')
      expect(q!.choices.length).toBeGreaterThanOrEqual(2)
      if (q!.hasIllustration) {
        expect(q!.illustrationPath).toBeTruthy()
      }
      const suggestion = sugByQ.get(id)
      expect(suggestion, id).toBeDefined()
      expect(suggestion!.confidence).not.toBe('low')
      expect(suggestion!.documentaryRef.trim().length).toBeGreaterThan(0)
      expect(suggestion!.proposedChoiceIds?.length).toBeGreaterThan(0)
      const choiceIds = new Set(q!.choices.map((c) => c.id))
      for (const cid of suggestion!.proposedChoiceIds ?? []) {
        expect(choiceIds.has(cid), `${id} → ${cid}`).toBe(true)
      }
      if (q!.type === 'single') {
        expect(suggestion!.proposedChoiceIds).toHaveLength(1)
      }
    }
  })

  it('répartit les sept matières VTC', () => {
    const byId = new Map(questions.map((q) => [q.id, q]))
    const subjects = new Set(
      FIRST_30_QUESTION_IDS.map((id) => byId.get(id)?.subject).filter(Boolean),
    )
    expect(subjects).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'FV', 'GV']))
  })

  it('ne marque aucune question verified dans le seed', () => {
    const byId = new Map(questions.map((q) => [q.id, q]))
    for (const id of FIRST_30_QUESTION_IDS) {
      expect(byId.get(id)?.verificationStatus).not.toBe('verified')
    }
  })
})
