import { Clock } from 'lucide-react'
import { formatDuration } from '@/lib/mock-exam-engine'
import { cn } from '@/lib/utils'

interface ExamTimerProps {
  remainingMs: number | null
  label?: string
}

export function ExamTimer({ remainingMs, label = 'Temps restant' }: ExamTimerProps) {
  if (remainingMs === null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Sans limite de temps
      </div>
    )
  }

  const urgent = remainingMs <= 60_000
  const warning = remainingMs <= 5 * 60_000

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm tabular-nums',
        urgent && 'border-destructive bg-destructive/10 text-destructive',
        !urgent && warning && 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200',
      )}
      role="timer"
      aria-live="polite"
      aria-label={label}
    >
      <Clock className="h-4 w-4" />
      <span className="font-medium">{formatDuration(remainingMs)}</span>
    </div>
  )
}
