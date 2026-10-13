import { compareAlternatives } from '@/lib/alternatives';
import type { EquivalencesFile, ManualEquivalence, Replacement } from '@/lib/equivalences';
import type { OffProduct } from '@/lib/off';
import { evaluateVerdict, type MilkMode, type VerdictSettings } from '@/lib/verdict';

/** Below this many letters, nothing is searched nor suggested. */
export const MIN_QUERY_LENGTH = 2;

/** Longest suggestion row under the search field. */
export const MAX_SUGGESTIONS = 6;

/** Most scanned products shown per category under the equivalences. */
export const MAX_FOOD_PRODUCTS = 5;

// A plural `s` or `x` is dropped from words long enough not to lose their meaning (« jus »).
function singular(word: string): string {
  return word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word;
}

/**
 * Form compared by the search: lower case, no accents, words separated by single spaces, each
 * word in the singular. « Crèmes fraîches » and « creme fraiche » give `creme fraiche`.
 */
export function normalizeTerm(text: string): string {
  return text
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map(singular)
    .join(' ');
}

/**
 * How well a normalized term matches a normalized query, best first: same term, term starting
 * with the query, every query word starting a word of the term (« fraiche » → « creme
 * fraiche »), query holding the whole term (« beurre doux bio » → « beurre »). `null`: no match.
 */
function matchRank(term: string, query: string): number | null {
  if (term === query) return 0;
  if (term.startsWith(query)) return 1;
  const termWords = term.split(' ');
  if (query.split(' ').every((word) => termWords.some((termWord) => termWord.startsWith(word)))) {
    return 2;
  }
  if (` ${query} `.includes(` ${term} `)) return 3;
  return null;
}

/** Name first, then synonyms: every term the search recognizes for a food. */
function foodTerms(food: ManualEquivalence): string[] {
  return [food.name, ...food.synonyms];
}

function normalizedQuery(query: string): string | null {
  const normalized = normalizeTerm(query);
  return normalized.length >= MIN_QUERY_LENGTH ? normalized : null;
}

/** Foods whose name or a synonym matches the query, best match first, then in the file's order. */
export function searchFoods(file: EquivalencesFile, query: string): ManualEquivalence[] {
  const normalized = normalizedQuery(query);
  if (!normalized) return [];
  return file.manual
    .map((food, index) => {
      const ranks = foodTerms(food)
        .map((term) => matchRank(normalizeTerm(term), normalized))
        .filter((rank) => rank !== null);
      return { food, index, rank: ranks.length > 0 ? Math.min(...ranks) : null };
    })
    .filter((match) => match.rank !== null)
    .sort((a, b) => a.rank! - b.rank! || a.index - b.index)
    .map((match) => match.food);
}

export interface FoodSuggestion {
  /** Name or synonym as written in the file, with a capital letter. */
  label: string;
  foodId: string;
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1);
}

/**
 * Names and synonyms matching what is typed, best match first, from {@link MIN_QUERY_LENGTH}
 * letters. A term shared by two foods is suggested once.
 */
export function foodSuggestions(
  file: EquivalencesFile,
  query: string,
  limit: number = MAX_SUGGESTIONS
): FoodSuggestion[] {
  const normalized = normalizedQuery(query);
  if (!normalized) return [];
  const matches: (FoodSuggestion & { rank: number; order: number })[] = [];
  const seen = new Set<string>();
  file.manual.forEach((food) =>
    foodTerms(food).forEach((term) => {
      const key = normalizeTerm(term);
      const rank = matchRank(key, normalized);
      if (rank === null || seen.has(key)) return;
      seen.add(key);
      matches.push({ label: capitalize(term), foodId: food.id, rank, order: matches.length });
    })
  );
  return matches
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .slice(0, limit)
    .map(({ label, foodId }) => ({ label, foodId }));
}

/** Whether two texts are the same term for the search (case, accents, plural ignored). */
export function isSameTerm(a: string, b: string): boolean {
  return normalizeTerm(a) === normalizeTerm(b);
}

/**
 * Replacements the active profile can use, in the file's order: a `strict` one has no milk at
 * all and suits both profiles, a `lactose-free` one only the « Sans lactose » profile.
 */
export function replacementsForMode(
  replacements: readonly Replacement[],
  mode: MilkMode
): Replacement[] {
  return replacements.filter(
    (replacement) => mode === 'lactose-free' || replacement.mode === 'strict'
  );
}

// French names of the categories used by the equivalences file, as shown in « Les plus scannés ».
export const CATEGORY_LABEL: Record<string, string> = {
  'en:margarines': 'MARGARINES',
  'en:plant-based-spreads': 'MATIÈRES GRASSES À TARTINER',
  'en:plant-based-creams': 'CRÈMES VÉGÉTALES',
  'en:plant-based-milk-alternatives': 'BOISSONS VÉGÉTALES',
  'en:cheese-substitutes': 'SUBSTITUTS DE FROMAGE',
  'en:non-dairy-yogurts': 'YAOURTS VÉGÉTAUX',
  'en:dark-chocolates': 'CHOCOLATS NOIRS',
};

/** `en:plant-based-creams` → `CRÈMES VÉGÉTALES`; a category added later shows its readable tag. */
export function categoryTagLabel(categoryTag: string): string {
  return (
    CATEGORY_LABEL[categoryTag] ??
    categoryTag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').toLocaleUpperCase('fr-FR')
  );
}

export interface CategoryProducts {
  categoryTag: string;
  label: string;
  products: OffProduct[];
}

/**
 * `auto` products of the food's categories that the active profile accepts (same verdict engine
 * as the product sheet), most scanned first. A product listed under two categories shows under
 * the first one; categories left empty are omitted.
 */
export function foodProducts(
  file: EquivalencesFile,
  food: ManualEquivalence,
  settings: VerdictSettings
): CategoryProducts[] {
  const seen = new Set<string>();
  return food.categoryTags
    .map((categoryTag) => {
      const products = (file.auto[categoryTag] ?? [])
        .filter(
          (product) => !seen.has(product.code) && evaluateVerdict(product, settings).acceptable
        )
        .sort(compareAlternatives)
        .slice(0, MAX_FOOD_PRODUCTS);
      products.forEach((product) => seen.add(product.code));
      return { categoryTag, label: categoryTagLabel(categoryTag), products };
    })
    .filter((category) => category.products.length > 0);
}
