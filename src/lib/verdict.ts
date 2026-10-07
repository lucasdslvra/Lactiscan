import type { OffProduct } from '@/lib/off';

/** « Sans lactose » (intolerance) or « Sans lait strict » (cow's milk protein allergy). */
export type MilkMode = 'lactose-free' | 'strict';

export interface VerdictSettings {
  mode: MilkMode;
  /** « Exclure aussi les traces » — only offered, and only applied, in strict mode. */
  excludeTraces: boolean;
}

export type VerdictKind =
  | 'contains-milk'
  | 'lactose-free'
  | 'traces'
  | 'milk-free'
  | 'incomplete'
  | 'not-found';

export interface Verdict {
  kind: VerdictKind;
  /** Whether the product suits the user's settings; the alternatives filter keeps only these. */
  acceptable: boolean;
  /** Milk is listed in the traces (« peut contenir »). */
  milkTraces: boolean;
}

export const MODE_LABEL: Record<MilkMode, string> = {
  'lactose-free': 'SANS LACTOSE',
  strict: 'SANS LAIT STRICT',
};

const MILK_TAG = 'en:milk';
const LACTOSE_FREE_LABELS = ['en:no-lactose', 'en:lactose-free'];
const INGREDIENTS_TO_BE_COMPLETED = 'en:ingredients-to-be-completed';

function hasText(value: string | undefined): boolean {
  return !!value?.trim();
}

/**
 * Missing ingredients, an empty allergen list or a sheet flagged as to be completed: an empty
 * allergen list cannot be told apart from « not filled in », so it never means « no milk ».
 */
function isIncomplete(product: OffProduct): boolean {
  const hasIngredients = hasText(product.ingredients_text_fr) || hasText(product.ingredients_text);
  const hasAllergens = (product.allergens_tags?.length ?? 0) > 0;
  const toBeCompleted = product.states_tags?.includes(INGREDIENTS_TO_BE_COMPLETED) ?? false;
  return !hasIngredients || !hasAllergens || toBeCompleted;
}

/**
 * « Détection du lait » table of the cahier des charges, from the Open Food Facts allergen,
 * trace and label fields. Pure: same product and settings, same verdict.
 */
export function evaluateVerdict(
  product: OffProduct | null | undefined,
  { mode, excludeTraces }: VerdictSettings
): Verdict {
  if (!product) return { kind: 'not-found', acceptable: false, milkTraces: false };

  const milkTraces = product.traces_tags?.includes(MILK_TAG) ?? false;

  // Checked first so that an incomplete sheet is never shown as « Sans lait ».
  if (isIncomplete(product)) return { kind: 'incomplete', acceptable: false, milkTraces };

  if (product.allergens_tags?.includes(MILK_TAG)) {
    const lactoseFreeLabel = LACTOSE_FREE_LABELS.some((tag) => product.labels_tags?.includes(tag));
    return mode === 'lactose-free' && lactoseFreeLabel
      ? { kind: 'lactose-free', acceptable: true, milkTraces }
      : { kind: 'contains-milk', acceptable: false, milkTraces };
  }

  if (milkTraces) {
    return mode === 'strict'
      ? { kind: 'traces', acceptable: !excludeTraces, milkTraces }
      : { kind: 'milk-free', acceptable: true, milkTraces };
  }

  return { kind: 'milk-free', acceptable: true, milkTraces };
}
