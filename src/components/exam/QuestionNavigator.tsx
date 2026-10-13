import { cn } from '@/lib/utils'

interface QuestionNavigatorProps {
  total: number
  currentIndex: number
  /** Indexes globaux affichés (épreuve active). */
  indexes: number[]
  answered: boolean[]
  onSelect: (globalIndex: number) => void
}

export function QuestionNavigator({
  total,
  currentIndex,
  indexes,
  answered,
  onSelect,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Navigation · {indexes.filter((i) => answered[i]).length}/{indexes.length} répondues
        {indexes.length !== total ? ` (épreuve · ${total} au total)` : ''}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {indexes.map((globalIndex, local) => {
          const isCurrent = globalIndex === currentIndex
          const isAnswered = answered[globalIndex]
          return (
            <button
              key={globalIndex}
              type="button"
              onClick={() => onSelect(globalIndex)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                isCurrent && 'border-primary bg-primary text-primary-foreground',
                !isCurrent && isAnswered && 'border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
                !isCurrent && !isAnswered && 'hover:bg-accent',
              )}
              aria-label={`Question ${local + 1}${isAnswered ? ', répondue' : ', non répondue'}`}
            >
              {local + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
