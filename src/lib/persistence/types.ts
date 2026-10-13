import type {
  Attempt,
  CorrectionOverlay,
  SpacedRepetitionState,
  StudySession,
  UserProgressSnapshot,
  UserSettings,
} from '@/types/exam'

export const DEFAULT_EXAM_TARGET_DATE = '2027-01-26'

export const DEFAULT_SETTINGS: UserSettings = {
  examTargetDate: DEFAULT_EXAM_TARGET_DATE,
  theme: 'system',
  dailyGoalQuestions: 20,
}

export const EMPTY_PROGRESS: UserProgressSnapshot = {
  totalAnswered: 0,
  totalCorrect: 0,
  totalStudyTimeMs: 0,
  streakDays: 0,
  favorites: [],
  masteredErrors: [],
}

/**
 * Abstraction de persistance — implémentation locale aujourd'hui,
 * migration Supabase possible sans réécrire le métier.
 */
export interface ProgressStore {
  getSettings(): Promise<UserSettings>
  saveSettings(settings: UserSettings): Promise<void>
  getProgress(): Promise<UserProgressSnapshot>
  saveProgress(progress: UserProgressSnapshot): Promise<void>
  listAttempts(): Promise<Attempt[]>
  saveAttempt(attempt: Attempt): Promise<void>
  getSpacedRepetition(): Promise<SpacedRepetitionState[]>
  saveSpacedRepetition(states: SpacedRepetitionState[]): Promise<void>
  getActiveSession(): Promise<StudySession | null>
  saveActiveSession(session: StudySession | null): Promise<void>
  listSessions(): Promise<StudySession[]>
  saveSession(session: StudySession): Promise<void>
  listCorrectionOverlays(): Promise<CorrectionOverlay[]>
  saveCorrectionOverlays(overlays: CorrectionOverlay[]): Promise<void>
  clearAll(): Promise<void>
}
