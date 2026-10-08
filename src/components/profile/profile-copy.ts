import type { MilkMode } from '@/lib/verdict';

export interface ProfileCopy {
  mode: MilkMode;
  /** Small label above the title on the profile screen. */
  tag: string;
  title: string;
  /** One-sentence explanation on the profile screen. */
  onboarding: string;
  /** Shorter explanation in Réglages, where the tag is not shown. */
  settings: string;
}

// Texts of the « 01 · Choix du profil » and « 07 · Réglages » mockups.
export const PROFILES: ProfileCopy[] = [
  {
    mode: 'lactose-free',
    tag: 'PROFIL 01 · INTOLÉRANCE',
    title: 'Sans lactose',
    onboarding:
      "Un produit étiqueté « sans lactose » est accepté, même s'il contient des protéines de lait.",
    settings: 'Intolérance : les produits « sans lactose » sont acceptés.',
  },
  {
    mode: 'strict',
    tag: 'PROFIL 02 · ALLERGIE (APLV)',
    title: 'Sans lait strict',
    onboarding: 'Tout produit contenant du lait est exclu, sans exception.',
    settings: 'Allergie (APLV) : tout produit contenant du lait est exclu.',
  },
];
