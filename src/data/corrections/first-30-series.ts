import first30Series from './first-30-series.json' with { type: 'json' }

export interface First30SeriesItem {
  order: number
  questionId: string
  subject: string
  year: number
  number: number
}

export const FIRST_30_SERIES = first30Series as {
  version: number
  title: string
  generatedAt: string
  count: number
  note: string
  questionIds: string[]
  items: First30SeriesItem[]
}

/** Ordre stable du dossier `docs/reports/first-30-validation.md`. */
export const FIRST_30_QUESTION_IDS: string[] = FIRST_30_SERIES.questionIds

export function isFirst30Question(questionId: string): boolean {
  return FIRST_30_QUESTION_IDS.includes(questionId)
}

export function first30Order(questionId: string): number | undefined {
  const index = FIRST_30_QUESTION_IDS.indexOf(questionId)
  return index >= 0 ? index + 1 : undefined
}
