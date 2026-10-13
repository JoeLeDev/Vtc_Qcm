import type {
  Attempt,
  CorrectionOverlay,
  SpacedRepetitionState,
  StudySession,
  UserProgressSnapshot,
  UserSettings,
} from '@/types/exam'
import {
  DEFAULT_SETTINGS,
  EMPTY_PROGRESS,
  type ProgressStore,
} from '@/lib/persistence/types'

const PREFIX = 'vtc-qcm:'

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(PREFIX + key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export class LocalStorageAdapter implements ProgressStore {
  async getSettings(): Promise<UserSettings> {
    return readJson('settings', DEFAULT_SETTINGS)
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    writeJson('settings', settings)
  }

  async getProgress(): Promise<UserProgressSnapshot> {
    return readJson('progress', EMPTY_PROGRESS)
  }

  async saveProgress(progress: UserProgressSnapshot): Promise<void> {
    writeJson('progress', progress)
  }

  async listAttempts(): Promise<Attempt[]> {
    return readJson('attempts', [])
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    const attempts = await this.listAttempts()
    const index = attempts.findIndex((a) => a.id === attempt.id)
    if (index >= 0) attempts[index] = attempt
    else attempts.unshift(attempt)
    writeJson('attempts', attempts)
  }

  async getSpacedRepetition(): Promise<SpacedRepetitionState[]> {
    return readJson('srs', [])
  }

  async saveSpacedRepetition(states: SpacedRepetitionState[]): Promise<void> {
    writeJson('srs', states)
  }

  async getActiveSession(): Promise<StudySession | null> {
    return readJson<StudySession | null>('active-session', null)
  }

  async saveActiveSession(session: StudySession | null): Promise<void> {
    if (!session) {
      localStorage.removeItem(PREFIX + 'active-session')
      return
    }
    writeJson('active-session', session)
  }

  async listSessions(): Promise<StudySession[]> {
    return readJson('sessions', [])
  }

  async saveSession(session: StudySession): Promise<void> {
    const sessions = await this.listSessions()
    const index = sessions.findIndex((s) => s.id === session.id)
    if (index >= 0) sessions[index] = session
    else sessions.unshift(session)
    writeJson('sessions', sessions.slice(0, 100))
  }

  async listCorrectionOverlays(): Promise<CorrectionOverlay[]> {
    return readJson('correction-overlays', [])
  }

  async saveCorrectionOverlays(overlays: CorrectionOverlay[]): Promise<void> {
    writeJson('correction-overlays', overlays)
  }

  async clearAll(): Promise<void> {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key)
    }
  }
}

let storeSingleton: ProgressStore | null = null

export function getProgressStore(): ProgressStore {
  if (!storeSingleton) storeSingleton = new LocalStorageAdapter()
  return storeSingleton
}

/** Pour tests / future injection Supabase. */
export function setProgressStore(store: ProgressStore): void {
  storeSingleton = store
}
