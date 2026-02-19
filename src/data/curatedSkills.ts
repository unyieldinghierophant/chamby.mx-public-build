export interface SkillCategory {
  name: string;
  skills: string[];
}

export const CURATED_SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: 'Handyman / Hogar',
    skills: [
      'Pintura',
      'Fontanería',
      'Jardinería',
      'Instalaciones',
      'Armado de muebles',
      'Ayuda con muebles (cargar / mover muebles)',
      'Reparación de electrodomésticos',
      'Cortinas y detalles (cortinas, soportes, repisas, acabados)',
    ],
  },
  {
    name: 'Exterior (solo exterior, sin interior)',
    skills: [
      'Limpieza con agua a presión (fachadas / exteriores)',
      'Lavado de cocheras con agua a presión',
    ],
  },
  {
    name: 'Retiro',
    skills: [
      'Retiro de escombro y basura',
    ],
  },
  {
    name: 'Auto',
    skills: [
      'Autolavado',
      'Cambio de batería',
      'Cambio de llantas',
      'Parchado de llantas',
    ],
  },
];

/** Flat list of all curated skill names */
export const ALL_CURATED_SKILLS: string[] = CURATED_SKILL_CATEGORIES.flatMap(c => c.skills);

export const MAX_SKILLS = 8;
export const MIN_SKILLS = 1;
