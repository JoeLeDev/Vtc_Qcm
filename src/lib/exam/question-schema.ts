import { z } from 'zod'
import { correctionOverlaySchema, correctionOverlaysSchema } from '@/lib/exam/correction-schemas'

export const choiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string().min(1),
})

export const questionSchema = z.object({
  id: z.string(),
  subject: z.enum(['A', 'B', 'C', 'D', 'E', 'FV', 'GV', 'FT', 'GT', 'FM', 'GM']),
  scope: z.enum(['common', 'vtc', 'taxi', 'vmdtr']),
  year: z.number().int(),
  number: z.number().int().positive(),
  stem: z.string().min(1),
  choices: z.array(choiceSchema),
  type: z.enum(['single', 'multiple', 'open']),
  correctChoiceIds: z.array(z.string()).optional(),
  openReferenceAnswer: z.string().optional(),
  explanation: z.string().optional(),
  origin: z.enum(['official_annals', 'training']),
  sourceDocument: z.string(),
  sourceExamTitle: z.string(),
  pdfPage: z.number().int().positive(),
  verificationStatus: z.enum(['verified', 'unverified', 'needs_review']),
  lastRegulatoryCheck: z.string().optional(),
  lifecycleStatus: z.enum(['active', 'possibly_obsolete']),
  hasIllustration: z.boolean(),
  illustrationPath: z.string().optional(),
  points: z.number().optional(),
  extractionNotes: z.array(z.string()).optional(),
  duplicateOf: z.string().optional(),
  legacyIds: z.array(z.string()).optional(),
  justificationRef: z.string().optional(),
  verifiedByUser: z.boolean().optional(),
  verifiedAt: z.string().optional(),
})

export const questionsArraySchema = z.array(questionSchema)

export { correctionOverlaySchema, correctionOverlaysSchema }

export function canMarkVerified(input: {
  type: 'single' | 'multiple' | 'open'
  correctChoiceIds?: string[]
  openReferenceAnswer?: string
  explanation?: string
  justificationRef?: string
}): { ok: true } | { ok: false; reason: string } {
  if (!input.explanation?.trim()) {
    return { ok: false, reason: 'Une explication est obligatoire.' }
  }
  if (!input.justificationRef?.trim()) {
    return { ok: false, reason: 'Une référence justificative est obligatoire.' }
  }
  if (input.type === 'open') {
    if (!input.openReferenceAnswer?.trim()) {
      return { ok: false, reason: 'Une réponse de référence est obligatoire pour une QRC.' }
    }
  } else if (!input.correctChoiceIds?.length) {
    return { ok: false, reason: 'Sélectionnez au moins une bonne réponse.' }
  }
  return { ok: true }
}
