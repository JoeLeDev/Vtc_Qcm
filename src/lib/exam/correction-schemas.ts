import { z } from 'zod'

export const confidenceSchema = z.enum(['low', 'medium', 'high'])

export const correctionSuggestionSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  status: z.enum(['suggested', 'rejected']),
  proposedChoiceIds: z.array(z.string()).optional(),
  proposedOpenAnswer: z.string().optional(),
  pedagogicalExplanation: z.string().min(1),
  documentaryRef: z.string().min(1),
  confidence: confidenceSchema,
  source: z.enum(['external_import', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const correctionSuggestionsSchema = z.array(correctionSuggestionSchema)

/** Format d'import externe (propositions préparées hors app, sans IA simulée). */
export const externalSuggestionImportSchema = z.object({
  version: z.literal(1).optional(),
  suggestions: z.array(
    z.object({
      questionId: z.string(),
      proposedChoiceIds: z.array(z.string()).optional(),
      proposedOpenAnswer: z.string().optional(),
      pedagogicalExplanation: z.string().min(1),
      documentaryRef: z.string().min(1),
      confidence: confidenceSchema.default('medium'),
    }),
  ),
})

export const validationHistoryEntrySchema = z.object({
  id: z.string(),
  questionId: z.string(),
  action: z.enum([
    'import_suggestion',
    'create_suggestion',
    'confirm_verified',
    'modify_and_confirm',
    'reject_suggestion',
    'save_draft',
    'add_review_note',
    'request_recheck',
    'mark_not_scoreable',
    'clear_scoring_block',
  ]),
  at: z.string(),
  note: z.string().optional(),
  suggestionId: z.string().optional(),
  toVerificationStatus: z.enum(['verified', 'unverified', 'needs_review']).optional(),
})

export const validationHistorySchema = z.array(validationHistoryEntrySchema)

export const questionReviewDecisionSchema = z.object({
  questionId: z.string(),
  note: z.string().optional(),
  needsRecheck: z.boolean().optional(),
  notScoreable: z.boolean().optional(),
  obsoleteForCurrentExam: z.boolean().optional(),
  clearedForScoring: z.boolean().optional(),
  updatedAt: z.string(),
})

export const questionReviewDecisionsSchema = z.array(questionReviewDecisionSchema)

export const correctionOverlaySchema = z.object({
  questionId: z.string(),
  verificationStatus: z.enum(['verified', 'unverified', 'needs_review']),
  correctChoiceIds: z.array(z.string()).optional(),
  openReferenceAnswer: z.string().optional(),
  explanation: z.string().min(1),
  justificationRef: z.string().min(1),
  possiblyObsolete: z.boolean().optional(),
  verifiedAt: z.string(),
  verifiedByUser: z.literal(true),
  sourceKind: z
    .enum([
      'annals_indicative',
      'pedagogical_suggestion',
      'user_validated',
      'official_documented',
    ])
    .optional(),
  officialSourceEstablished: z.boolean().optional(),
})

export const correctionOverlaysSchema = z.array(correctionOverlaySchema)

export const progressBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  settings: z.unknown().optional(),
  progress: z.unknown().optional(),
  sessions: z.unknown().optional(),
  activeSession: z.unknown().optional(),
  overlays: correctionOverlaysSchema.optional(),
  suggestions: correctionSuggestionsSchema.optional(),
  validationHistory: validationHistorySchema.optional(),
  reviewDecisions: questionReviewDecisionsSchema.optional(),
})
