import type { ExamRulesConfig } from '@/types/exam'

/**
 * Règles d'admissibilité théorique VTC.
 * Source : règlement d'examen CMA (version décembre 2024).
 * Ne pas inventer de modalités : toute mise à jour doit citer une source vérifiée.
 */
export const EXAM_RULES: ExamRulesConfig = {
  version: 'decembre-2024',
  source: 'Règlement de l’examen d’accès aux professions de chauffeur de taxi/VTC/VMDTR — CMA France',
  sourceUrl: 'https://cma-normandie.fr/wp-content/uploads/2025/02/Reglement-taxiVTCVMDTR_decembre2024.pdf',
  verified: true,
  verifiedAt: '2026-10-13',
  totalDurationMinutes: 230,
  totalCoefficient: 17,
  admissibilityAverage: 10,
  papers: [
    {
      subject: 'A',
      qcmCount: 10,
      qrcCount: 5,
      durationMinutes: 45,
      coefficient: 3,
      eliminatoryBelow: 6,
    },
    {
      subject: 'B',
      qcmCount: 16,
      qrcCount: 2,
      durationMinutes: 45,
      coefficient: 2,
      eliminatoryBelow: 6,
    },
    {
      subject: 'C',
      qcmCount: 20,
      qrcCount: 0,
      durationMinutes: 30,
      coefficient: 3,
      eliminatoryBelow: 6,
    },
    {
      subject: 'D',
      qcmCount: 7,
      qrcCount: 3,
      durationMinutes: 30,
      coefficient: 2,
      eliminatoryBelow: 6,
    },
    {
      subject: 'E',
      qcmCount: 20,
      qrcCount: 0,
      durationMinutes: 30,
      coefficient: 1,
      eliminatoryBelow: 4,
    },
    {
      subject: 'FV',
      qcmCount: 12,
      qrcCount: 4,
      durationMinutes: 30,
      coefficient: 3,
      eliminatoryBelow: 6,
    },
    {
      subject: 'GV',
      qcmCount: 6,
      qrcCount: 2,
      durationMinutes: 20,
      coefficient: 3,
      eliminatoryBelow: 6,
    },
  ],
  notes: [
    'Admissibilité : moyenne pondérée ≥ 10/20 et aucune note éliminatoire.',
    'Ces règles concernent l’admissibilité théorique écrite ; l’épreuve pratique d’admission n’est pas simulée ici.',
    'Une estimation de réussite ne doit être affichée que si corrections et règles sont vérifiées.',
  ],
}
