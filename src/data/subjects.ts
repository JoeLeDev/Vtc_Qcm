import type { SubjectDefinition } from '@/types/exam'

export const SUBJECTS: SubjectDefinition[] = [
  {
    code: 'A',
    label: 'Réglementation du T3P',
    shortLabel: 'A — T3P',
    group: 'common',
    description: 'Réglementation du transport public particulier de personnes, discriminations et violences.',
  },
  {
    code: 'B',
    label: 'Gestion',
    shortLabel: 'B — Gestion',
    group: 'common',
    description: 'Gestion d’entreprise, fiscalité et obligations administratives.',
  },
  {
    code: 'C',
    label: 'Sécurité routière',
    shortLabel: 'C — Sécurité',
    group: 'common',
    description: 'Code de la route, risques et comportements de conduite.',
  },
  {
    code: 'D',
    label: 'Français',
    shortLabel: 'D — Français',
    group: 'common',
    description: 'Compréhension et expression en langue française.',
  },
  {
    code: 'E',
    label: 'Anglais',
    shortLabel: 'E — Anglais',
    group: 'common',
    description: 'Compréhension et expression en langue anglaise.',
  },
  {
    code: 'FV',
    label: 'Développement commercial VTC',
    shortLabel: 'F(V) — Commercial',
    group: 'vtc',
    description: 'Développement commercial et gestion propre à l’activité VTC.',
  },
  {
    code: 'GV',
    label: 'Réglementation nationale VTC',
    shortLabel: 'G(V) — Réglementation VTC',
    group: 'vtc',
    description: 'Réglementation nationale spécifique à l’activité VTC.',
  },
]

export function getSubject(code: string): SubjectDefinition | undefined {
  return SUBJECTS.find((s) => s.code === code)
}
