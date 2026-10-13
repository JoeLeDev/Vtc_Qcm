import {
  BookMarked,
  BookOpen,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Library,
  LineChart,
  Settings,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    description: 'Vue d’ensemble de votre préparation',
  },
  {
    to: '/reviser',
    label: 'Réviser',
    icon: BookOpen,
    description: 'Sessions de révision ciblées',
  },
  {
    to: '/examens',
    label: 'Examens blancs',
    icon: ClipboardList,
    description: 'Entraînement et simulation',
  },
  {
    to: '/erreurs',
    label: 'Mes erreurs',
    icon: TriangleAlert,
    description: 'Revoir les questions ratées',
  },
  {
    to: '/statistiques',
    label: 'Mes statistiques',
    icon: LineChart,
    description: 'Suivi de progression',
  },
  {
    to: '/banque',
    label: 'Banque de questions',
    icon: Library,
    description: 'Annales importées',
  },
  {
    to: '/fiches',
    label: 'Fiches',
    icon: BookMarked,
    description: 'Révision par matière',
  },
  {
    to: '/corrections',
    label: 'Corrections',
    icon: CheckSquare,
    description: 'Valider les réponses des annales',
  },
  {
    to: '/parametres',
    label: 'Paramètres',
    icon: Settings,
    description: 'Objectif et préférences',
  },
]
