import { describe, expect, it } from 'vitest'
import allQuestions from '@/data/questions/all.json'
import { FIRST_30_QUESTION_IDS } from '@/data/corrections/first-30-series'
import {
  getAnomalyResolution,
  listBlockingAnomalyIds,
  PRIORITY_ANOMALIES,
} from '@/data/corrections/priority-anomalies'
import { getMergedSuggestions } from '@/lib/corrections'
import { isAutoScoreableQcm } from '@/lib/evaluability'
import type { Question } from '@/types/exam'

const questions = allQuestions as Question[]

describe('anomalies prioritaires Phase 7', () => {
  it('catalogue exactement 9 anomalies, toutes bloquantes pour la notation', () => {
    expect(PRIORITY_ANOMALIES).toHaveLength(9)
    const blocking = listBlockingAnomalyIds()
    expect(blocking.size).toBe(9)
    for (const anomaly of PRIORITY_ANOMALIES) {
      expect(blocking.has(anomaly.questionId), anomaly.questionId).toBe(true)
      const resolution = getAnomalyResolution(anomaly.questionId)
      expect(resolution, anomaly.questionId).toBeDefined()
      expect(resolution!.blocksScoring).toBe(true)
      expect(['resolved', 'partially_resolved', 'blocked']).toContain(resolution!.status)
    }
  })

  it('exclut les anomalies de la première série et des QCM auto-notables', () => {
    for (const anomaly of PRIORITY_ANOMALIES) {
      expect(FIRST_30_QUESTION_IDS.includes(anomaly.questionId)).toBe(false)
      const q = questions.find((item) => item.id === anomaly.questionId)
      expect(q, anomaly.questionId).toBeDefined()
      const asVerified = {
        ...q!,
        verificationStatus: 'verified' as const,
        correctChoiceIds: q!.choices[0] ? [q!.choices[0].id] : ['a'],
      }
      expect(isAutoScoreableQcm(asVerified)).toBe(false)
    }
  })

  it('ne promeut aucune suggestion d’anomalie en verified', () => {
    const suggestions = getMergedSuggestions()
    for (const anomaly of PRIORITY_ANOMALIES) {
      const related = suggestions.filter((s) => s.questionId === anomaly.questionId)
      for (const suggestion of related) {
        expect(suggestion.status).not.toBe('verified')
      }
    }
  })
})
