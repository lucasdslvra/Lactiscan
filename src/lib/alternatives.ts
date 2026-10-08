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
 * Parent category searched when the exact one gives too few alternatives: among the taxonomy
 * parents, the one the product itself carries, otherwise the first.
 */
export function pickParentCategory(
  parents: readonly string[],
  product: OffProduct
): string | null {
  const valid = parents.filter((tag) => TAXONOMY_CATEGORY.test(tag));
  return valid.find((tag) => product.categories_tags?.includes(tag)) ?? valid[0] ?? null;
}

/** Where a proposal comes from, shown on its badge. */
export type AlternativeOrigin = 'category' | 'parent' | 'equivalence';

export interface Alternative {
  product: OffProduct;
  origin: AlternativeOrigin;
}

/** Below this many alternatives, the parent category then the equivalences fill in. */
export const MIN_ALTERNATIVES = 3;

const ORIGIN_RANK: Record<AlternativeOrigin, number> = { category: 0, parent: 1, equivalence: 2 };

export interface AlternativeSources {
  /** Search results of the exact category. */
  category: readonly OffProduct[];
  /** Search results of the parent category. */
  parent?: readonly OffProduct[];
  /** Products of the equivalences JSON for those categories. */
  equivalences?: readonly OffProduct[];
}

export interface AlternativeContext {
  scannedCode: string;
  /** Exact category; a parent result that carries it counts as « même catégorie ». */
  categoryTag: string | null;
  settings: VerdictSettings;
}

/**
 * Proposals the user can eat: the scanned product and duplicates removed (the first source
 * wins), then the same verdict engine as the product sheet, so an incomplete sheet, a product
 * containing milk or, with the traces option, a product with milk traces never shows up.
 * Exact category first, then parent category, then equivalences; each sorted by popularity.
 */
function pick(
  candidates: readonly Alternative[],
  { scannedCode, settings }: AlternativeContext
): Alternative[] {
  const seen = new Set<string>([scannedCode]);
  const kept: Alternative[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.product.code)) continue;
    seen.add(candidate.product.code);
    if (evaluateVerdict(candidate.product, settings).acceptable) kept.push(candidate);
  }
  return kept
    .sort(
      (a, b) =>
        ORIGIN_RANK[a.origin] - ORIGIN_RANK[b.origin] || compareAlternatives(a.product, b.product)
    )
    .slice(0, MAX_ALTERNATIVES);
}

/**
 * The alternatives list: the exact category alone when it gives at least
 * {@link MIN_ALTERNATIVES} products, otherwise completed with the parent category, then with
 * the equivalences JSON.
 */
export function selectAlternatives(
  { category, parent = [], equivalences = [] }: AlternativeSources,
  context: AlternativeContext
): Alternative[] {
  const exact = category.map((product) => ({ product, origin: 'category' as const }));
  const fromExact = pick(exact, context);
  if (fromExact.length >= MIN_ALTERNATIVES) return fromExact;

  const { categoryTag } = context;
  const fromParent = parent.map((product) => ({
    product,
    // Beyond the first page of the exact search, but still the same category.
    origin:
      categoryTag && product.categories_tags?.includes(categoryTag)
        ? ('category' as const)
        : ('parent' as const),
  }));
  const withParent = pick([...exact, ...fromParent], context);
  if (withParent.length >= MIN_ALTERNATIVES) return withParent;

  const fromJson = equivalences.map((product) => ({ product, origin: 'equivalence' as const }));
  return pick([...exact, ...fromParent, ...fromJson], context);
}
