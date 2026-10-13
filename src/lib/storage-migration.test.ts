import { beforeEach, describe, expect, it } from 'vitest'
import { CURRENT_STORAGE_VERSION, migrateLocalStorage } from '@/lib/storage-migration'

describe('storage migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('est idempotente et crée les clés v3', () => {
    expect(migrateLocalStorage()).toBe(CURRENT_STORAGE_VERSION)
    expect(migrateLocalStorage()).toBe(CURRENT_STORAGE_VERSION)
    expect(localStorage.getItem('vtc-qcm:review-decisions')).toBe('[]')
  })
})
