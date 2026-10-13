import type { SubjectStudySheet } from '@/types/corrections'
import type { SubjectCode } from '@/types/exam'
import { SUBJECTS } from '@/data/subjects'

/**
 * Fiches pédagogiques initiales.
 * Uniquement des éléments génériques de cadrage — aucune disposition réglementaire inventée.
 * Les points `verified: true` doivent citer une source contrôlée.
 */
export const STUDY_SHEETS: SubjectStudySheet[] = SUBJECTS.map((subject) =>
  createEmptySheet(subject.code, subject.label, subject.description),
)

function createEmptySheet(
  subject: SubjectCode,
  title: string,
  presentation: string,
): SubjectStudySheet {
  return {
    subject,
    title,
    presentation,
    keyConcepts: [],
    definitions: [],
    regulatoryPoints: [],
    references: [
      {
        label: 'Règlement d’examen taxi/VTC/VMDTR — CMA (déc. 2024)',
        url: 'https://cma-normandie.fr/wp-content/uploads/2025/02/Reglement-taxiVTCVMDTR_decembre2024.pdf',
        verified: true,
      },
    ],
    notes: [
      'Fiche cadre : aucun point réglementaire détaillé n’est affirmé ici sans source vérifiée.',
      'Complétez cette fiche uniquement avec des éléments que vous avez contrôlés.',
    ],
  }
}

export function getStudySheet(subject: SubjectCode): SubjectStudySheet | undefined {
  return STUDY_SHEETS.find((sheet) => sheet.subject === subject)
}
