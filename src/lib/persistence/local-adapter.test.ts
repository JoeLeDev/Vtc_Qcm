import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageAdapter } from '@/lib/persistence/local-adapter'
import { DEFAULT_EXAM_TARGET_DATE, EMPTY_PROGRESS } from '@/lib/persistence/types'
import type { StudySession } from '@/types/exam'

describe('LocalStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste les paramètres et la progression', async () => {
    const store = new LocalStorageAdapter()
    const settings = await store.getSettings()
    expect(settings.examTargetDate).toBe(DEFAULT_EXAM_TARGET_DATE)

    await store.saveSettings({
      examTargetDate: '2027-02-01',
      theme: 'dark',
      dailyGoalQuestions: 30,
    })
    expect(await store.getSettings()).toMatchObject({
      examTargetDate: '2027-02-01',
      dailyGoalQuestions: 30,
    })

    expect(await store.getProgress()).toEqual(EMPTY_PROGRESS)
    await store.saveProgress({
      ...EMPTY_PROGRESS,
      totalAnswered: 4,
      totalCorrect: 2,
      streakDays: 1,
      lastStudyDate: '2026-10-13',
    })
    const progress = await store.getProgress()
    expect(progress.totalAnswered).toBe(4)
    expect(progress.totalCorrect).toBe(2)
  })

  it('permet de reprendre une session active', async () => {
    const store = new LocalStorageAdapter()
    const session: StudySession = {
      id: 'review-1',
      mode: 'review',
      status: 'in_progress',
      startedAt: '2026-10-13T10:00:00.000Z',
      updatedAt: '2026-10-13T10:05:00.000Z',
      questionIds: ['q1', 'q2'],
      currentIndex: 1,
      answers: [
        {
          questionId: 'q1',
          selectedChoiceIds: ['a'],
          validated: true,
          isCorrect: null,
          scored: false,
          timeSpentMs: 1000,
        },
        {
          questionId: 'q2',
          selectedChoiceIds: [],
          validated: false,
          isCorrect: null,
          scored: false,
          timeSpentMs: 0,
        },
      ],
      config: { count: 2 },
      scoreableCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      nonEvaluableCount: 1,
      totalDurationMs: 1000,
    }

    await store.saveActiveSession(session)
    const restored = await store.getActiveSession()
    expect(restored?.id).toBe('review-1')
    expect(restored?.currentIndex).toBe(1)

    await store.saveSession({ ...session, status: 'completed', finishedAt: '2026-10-13T10:10:00.000Z' })
    await store.saveActiveSession(null)
    expect(await store.getActiveSession()).toBeNull()
    expect((await store.listSessions())[0]?.status).toBe('completed')
  })
})
