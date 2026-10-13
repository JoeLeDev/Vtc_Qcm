const VERSION_KEY = 'vtc-qcm:storage-version'
export const CURRENT_STORAGE_VERSION = 3

/**
 * Migrations localStorage idempotentes.
 * v1 → v2 : crée les clés suggestions / historique si absentes.
 * v2 → v3 : crée la clé des décisions de revue d’anomalies.
 */
export function migrateLocalStorage(storage: Storage = localStorage): number {
  const raw = storage.getItem(VERSION_KEY)
  let version = raw ? Number(raw) : 1
  if (Number.isNaN(version)) version = 1

  if (version < 2) {
    if (storage.getItem('vtc-qcm:correction-suggestions') === null) {
      storage.setItem('vtc-qcm:correction-suggestions', '[]')
    }
    if (storage.getItem('vtc-qcm:validation-history') === null) {
      storage.setItem('vtc-qcm:validation-history', '[]')
    }
    version = 2
  }

  if (version < 3) {
    if (storage.getItem('vtc-qcm:review-decisions') === null) {
      storage.setItem('vtc-qcm:review-decisions', '[]')
    }
    version = 3
  }

  storage.setItem(VERSION_KEY, String(CURRENT_STORAGE_VERSION))
  return CURRENT_STORAGE_VERSION
}
