import type { OffProduct, OffSearchParams } from '@/lib/off';
import { evaluateVerdict, type VerdictSettings } from '@/lib/verdict';

/** Longest list shown under the verdict. */
export const MAX_ALTERNATIVES = 10;

// A wide page: many results fall to the verdict filter (milk, incomplete sheets…).
const SEARCH_PAGE_SIZE = 50;
const FRANCE = 'en:france';

export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

const GRADES: readonly NutriScoreGrade[] = ['A', 'B', 'C', 'D', 'E'];

// Categories known to the OFF taxonomy are canonical English slugs. Contributors' free entries
// (`fr:Nuttela`, `en:Pâtes à tartiner`, `fr:pates-a-tartiner`) come after them in the list and
// match almost no other product, so a search on them finds nothing.
const TAXONOMY_CATEGORY = /^en:[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Category searched for replacements: the last, most specific, of the product's categories
 * that belongs to the Open Food Facts taxonomy.
 */
export function alternativeCategoryTag(product: OffProduct): string | null {
  return product.categories_tags?.findLast((tag) => TAXONOMY_CATEGORY.test(tag)) ?? null;
}

/** Products of that category sold in France, most scanned first. */
export function alternativesSearchParams(categoryTag: string): OffSearchParams {
  return {
    categoryTag,
    countryTag: FRANCE,
    sortBy: 'unique_scans_n',
    pageSize: SEARCH_PAGE_SIZE,
  };
}

/** `A`…`E`, or `null` when OFF has no grade (`unknown`, `not-applicable`, missing). */
export function nutriScoreGrade(product: OffProduct): NutriScoreGrade | null {
  const grade = product.nutriscore_grade?.trim().toUpperCase();
  return GRADES.find((candidate) => candidate === grade) ?? null;
}

function gradeRank(product: OffProduct): number {
  const grade = nutriScoreGrade(product);
  return grade ? GRADES.indexOf(grade) : GRADES.length;
}

/** Most scanned first, then Nutri-Score A to E; products without a grade last at equal popularity. */
export function compareAlternatives(a: OffProduct, b: OffProduct): number {
  return (b.unique_scans_n ?? 0) - (a.unique_scans_n ?? 0) || gradeRank(a) - gradeRank(b);
}

/**
 * Search results the user can eat: the scanned product and duplicates removed, then the same
 * verdict engine as the product sheet, so an incomplete sheet, a product containing milk or,
 * with the traces option, a product with milk traces never shows up.
 */
export function selectAlternatives(
  products: readonly OffProduct[],
  scannedCode: string,
  settings: VerdictSettings
): OffProduct[] {
  const seen = new Set<string>([scannedCode]);
  const kept: OffProduct[] = [];
  for (const product of products) {
    if (seen.has(product.code)) continue;
    seen.add(product.code);
    if (evaluateVerdict(product, settings).acceptable) kept.push(product);
  }
  return kept.sort(compareAlternatives).slice(0, MAX_ALTERNATIVES);
}
