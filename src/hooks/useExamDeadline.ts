import { useEffect, useRef, useState } from 'react'
import { remainingMs } from '@/lib/mock-exam-engine'

/**
 * Chronomètre basé sur une deadline d'horloge murale.
 * Après rechargement, le temps réellement écoulé est déduit automatiquement.
 */
export function useExamDeadline(
  deadlineAt: string | undefined,
  onExpire?: () => void,
): { remaining: number | null; expired: boolean } {
  const [remaining, setRemaining] = useState<number | null>(() => remainingMs(deadlineAt))
  const [expired, setExpired] = useState(() => {
    const value = remainingMs(deadlineAt)
    return value !== null && value <= 0
  })
  const firedForDeadline = useRef<string | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    firedForDeadline.current = null
    const initial = remainingMs(deadlineAt)
    setRemaining(initial)
    setExpired(initial !== null && initial <= 0)
  }, [deadlineAt])

  useEffect(() => {
    if (!deadlineAt) return

    const tick = () => {
      const value = remainingMs(deadlineAt)
      setRemaining(value)
      if (value !== null && value <= 0) {
        setExpired(true)
        if (firedForDeadline.current !== deadlineAt) {
          firedForDeadline.current = deadlineAt
          onExpireRef.current?.()
        }
      }
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [deadlineAt])

  return { remaining, expired }
}
