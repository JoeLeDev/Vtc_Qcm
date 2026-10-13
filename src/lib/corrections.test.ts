import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyOverlay,
  exportOverlaysJson,
  exportProgressBackup,
  exportReviewDecisionsJson,
  getActiveSuggestionForQuestion,
  getMergedOverlays,
  getMergedSuggestions,
  getReviewDecision,
  getValidationHistory,
  importOverlaysJson,
  importProgressBackup,
  importReviewDecisionsJson,
  importSuggestionsJson,
  rejectSuggestion,
  saveManualSuggestion,
  saveOverlayForQuestion,
  saveReviewDecision,
} from '@/lib/corrections'
import { canMarkVerified } from '@/lib/exam/question-schema'
import { isScorable } from '@/lib/exam-engine'
import { CURRENT_STORAGE_VERSION, migrateLocalStorage } from '@/lib/storage-migration'
import type { Question } from '@/types/exam'

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: '2022-A-q01-test',
    subject: 'A',
    scope: 'common',
    year: 2022,
    number: 1,
    stem: 'Question test ?',
    choices: [
      { id: 'a', label: 'A', text: 'Oui' },
      { id: 'b', label: 'B', text: 'Non' },
    ],
    type: 'single',
    origin: 'official_annals',
    sourceDocument: 'test.pdf',
    sourceExamTitle: 'Test',
    pdfPage: 1,
    verificationStatus: 'unverified',
    lifecycleStatus: 'active',
    hasIllustration: false,
    ...overrides,
  }
}

describe('corrections workflow', () => {
  beforeEach(() => {
    localStorage.clear()
    migrateLocalStorage()
  })

  it('refuse de vérifier sans explication ni référence', () => {
    expect(
      canMarkVerified({
        type: 'single',
        correctChoiceIds: ['a'],
        explanation: '',
        justificationRef: 'Code des transports',
      }).ok,
    ).toBe(false)
  })

  it('enregistre une correction vérifiée sans toucher à l’extraction', () => {
    const q = question()
    const result = saveOverlayForQuestion(q, {
      correctChoiceIds: ['a'],
      explanation: 'Réponse prévue par le code des transports.',
      justificationRef: 'Code des transports L.3120-1',
      markVerified: true,
    })
    expect(result.ok).toBe(true)
    const overlays = getMergedOverlays()
    expect(overlays[0]?.verificationStatus).toBe('verified')
    const resolved = applyOverlay(q, overlays[0])
    expect(resolved.verificationStatus).toBe('verified')
    expect(q.verificationStatus).toBe('unverified')
    expect(getValidationHistory(q.id)[0]?.action).toBe('confirm_verified')
  })

  it('stocke les suggestions séparément et ne les score pas', () => {
    const q = question()
    const created = saveManualSuggestion({
      questionId: q.id,
      proposedChoiceIds: ['a'],
      pedagogicalExplanation: 'Proposition pédagogique externe.',
      documentaryRef: 'Notes personnelles à vérifier',
      confidence: 'low',
    })
    expect(created.ok).toBe(true)
    const suggestion = getActiveSuggestionForQuestion(q.id)
    expect(suggestion?.status).toBe('suggested')

    const withSuggestionOnly = applyOverlay(q)
    expect(withSuggestionOnly.verificationStatus).toBe('unverified')
    expect(isScorable(withSuggestionOnly)).toBe(false)
    expect(getMergedOverlays().some((o) => o.questionId === q.id && o.verificationStatus === 'verified')).toBe(
      false,
    )
  })

  it('importe des suggestions JSON externes sans les vérifier', () => {
    const json = JSON.stringify({
      version: 1,
      suggestions: [
        {
          questionId: '2022-A-q01-test',
          proposedChoiceIds: ['b'],
          pedagogicalExplanation: 'Préparé hors app',
          documentaryRef: 'Source à contrôler',
          confidence: 'medium',
        },
      ],
    })
    const imported = importSuggestionsJson(json)
    expect(imported).toEqual({ ok: true, count: 1 })
    expect(getActiveSuggestionForQuestion('2022-A-q01-test')?.proposedChoiceIds).toEqual(['b'])
    expect(getMergedOverlays()).toHaveLength(0)
  })

  it('permet de rejeter une suggestion', () => {
    saveManualSuggestion({
      questionId: '2022-A-q01-test',
      proposedChoiceIds: ['a'],
      pedagogicalExplanation: 'X',
      documentaryRef: 'Y',
      confidence: 'low',
    })
    const active = getActiveSuggestionForQuestion('2022-A-q01-test')
    expect(active).toBeTruthy()
    expect(rejectSuggestion(active!.id).ok).toBe(true)
    expect(getActiveSuggestionForQuestion('2022-A-q01-test')).toBeUndefined()
  })

  it('exporte et réimporte les overlays', () => {
    saveOverlayForQuestion(question(), {
      correctChoiceIds: ['b'],
      explanation: 'Explication',
      justificationRef: 'Réf.',
      markVerified: true,
    })
    const json = exportOverlaysJson()
    localStorage.clear()
    migrateLocalStorage()
    expect(importOverlaysJson(json)).toEqual({ ok: true, count: 1 })
    expect(getMergedOverlays()[0]?.correctChoiceIds).toEqual(['b'])
  })

  it('exporte / importe une sauvegarde de progression', async () => {
    saveOverlayForQuestion(question(), {
      correctChoiceIds: ['a'],
      explanation: 'E',
      justificationRef: 'R',
      markVerified: true,
    })
    const backup = await exportProgressBackup()
    localStorage.clear()
    expect(importProgressBackup(backup).ok).toBe(true)
    expect(getMergedOverlays()).toHaveLength(1)
  })

  it('migre le localStorage vers la version courante', () => {
    localStorage.clear()
    expect(migrateLocalStorage()).toBe(CURRENT_STORAGE_VERSION)
    expect(localStorage.getItem('vtc-qcm:storage-version')).toBe(String(CURRENT_STORAGE_VERSION))
    expect(localStorage.getItem('vtc-qcm:correction-suggestions')).toBe('[]')
    expect(localStorage.getItem('vtc-qcm:review-decisions')).toBe('[]')
  })

  it('exige une confirmation métier : save verified ne change pas le seed suggested sans action', () => {
    const seeds = getMergedSuggestions().filter((s) => s.status === 'suggested')
    expect(seeds.length).toBeGreaterThan(0)
    expect(getMergedOverlays().filter((o) => o.verificationStatus === 'verified')).toHaveLength(0)
  })

  it('enregistre les décisions de revue et les réimporte', () => {
    saveReviewDecision(
      {
        questionId: '2021-C-q02-4e9aec96',
        note: 'Barème single conservé',
        needsRecheck: true,
      },
      'request_recheck',
    )
    expect(getReviewDecision('2021-C-q02-4e9aec96')?.needsRecheck).toBe(true)
    expect(getValidationHistory('2021-C-q02-4e9aec96')[0]?.action).toBe('request_recheck')
    const json = exportReviewDecisionsJson()
    localStorage.clear()
    migrateLocalStorage()
    expect(importReviewDecisionsJson(json)).toEqual({ ok: true, count: 1 })
    expect(getReviewDecision('2021-C-q02-4e9aec96')?.note).toBe('Barème single conservé')
  })
})
