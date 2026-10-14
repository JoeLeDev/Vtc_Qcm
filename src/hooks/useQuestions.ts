import { useEffect, useRef, useState } from 'react'
import { loadVtcQuestions } from '@/data/questions'
import type { Question } from '@/types/exam'

export function useVtcQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false
    // Masquer l’UI seulement au premier chargement (pas après une validation).
    if (!hasLoadedOnce.current) setLoading(true)
    void loadVtcQuestions()
      .then((data) => {
        if (!cancelled) {
          setQuestions(data)
          setError(null)
          hasLoadedOnce.current = true
        }
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger la banque de questions.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [version])

  return {
    questions,
    loading,
    error,
    reload: () => setVersion((v) => v + 1),
  }
}
