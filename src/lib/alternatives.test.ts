import { describe, expect, it } from '@jest/globals';

import {
  MAX_ALTERNATIVES,
  MIN_ALTERNATIVES,
  alternativeCategoryTag,
  alternativesSearchParams,
  compareAlternatives,
  nutriScoreGrade,
  pickParentCategory,
  selectAlternatives,
  type Alternative,
  type AlternativeSources,
} from '@/lib/alternatives';
import type { OffProduct } from '@/lib/off';
import type { VerdictSettings } from '@/lib/verdict';

const SCANNED = '3760123456784';

/** A complete sheet with no milk anywhere; each case overrides what it needs. */
function product(code: string, overrides: Partial<OffProduct> = {}): OffProduct {
  return {
    code,
    product_name: `Produit ${code}`,
    ingredients_text_fr: 'Farine de blé, sucre, œufs, levure.',
    allergens_tags: ['en:gluten', 'en:eggs'],
    traces_tags: [],
    labels_tags: [],
    states_tags: ['en:ingredients-completed'],
    ...overrides,
  };
}

const LACTOSE_FREE: VerdictSettings = { mode: 'lactose-free', excludeTraces: false };
const STRICT: VerdictSettings = { mode: 'strict', excludeTraces: false };
const STRICT_NO_TRACES: VerdictSettings = { mode: 'strict', excludeTraces: true };

const withMilk = { allergens_tags: ['en:gluten', 'en:milk'] };
const withMilkAndLabel = { ...withMilk, labels_tags: ['en:no-lactose'] };
const milkTracesOnly = { traces_tags: ['en:milk'] };
const noIngredients = { ingredients_text_fr: undefined, ingredients_text: undefined };

function codes(products: OffProduct[]): string[] {
  return products.map((p) => p.code);
}

describe('alternativeCategoryTag', () => {
  it('keeps the last, most specific category', () => {
    const scanned = product(SCANNED, {
      categories_tags: ['en:breads', 'en:viennoiseries', 'en:sliced-brioches'],
    });
    expect(alternativeCategoryTag(scanned)).toBe('en:sliced-brioches');
  });

  it('skips the free entries contributors add after the taxonomy ones', () => {
    // Real categories of Nutella (3017620422003).
    const nutella = product(SCANNED, {
      categories_tags: [
        'en:breakfasts',
        'en:spreads',
        'en:sweet-spreads',
        'en:confectionary-based-spreads',
        'en:Petit-déjeuners',
        'en:Pâtes à tartiner',
        'fr:Nutella',
        'fr:pates-a-tartiner',
      ],
    });
    expect(alternativeCategoryTag(nutella)).toBe('en:confectionary-based-spreads');
  });

  it('gives null without a taxonomy category', () => {
    expect(alternativeCategoryTag(product(SCANNED))).toBeNull();
    expect(alternativeCategoryTag(product(SCANNED, { categories_tags: [] }))).toBeNull();
    expect(alternativeCategoryTag(product(SCANNED, { categories_tags: ['fr:Nutella'] }))).toBeNull();
  });
});

describe('alternativesSearchParams', () => {
  it('searches the category among products sold in France', () => {
    expect(alternativesSearchParams('en:sliced-brioches')).toMatchObject({
      categoryTag: 'en:sliced-brioches',
      countryTag: 'en:france',
      sortBy: 'unique_scans_n',
    });
  });
});

describe('nutriScoreGrade', () => {
  it.each<[string | undefined, string | null]>([
    ['a', 'A'],
    ['E', 'E'],
    ['unknown', null],
    ['not-applicable', null],
    ['', null],
    [undefined, null],
  ])('%j → %j', (grade, expected) => {
    expect(nutriScoreGrade(product('1', { nutriscore_grade: grade }))).toBe(expected);
  });
});

describe('selectAlternatives', () => {
  const EXACT = 'en:wholemeal-sliced-breads';
  const PARENT = 'en:sliced-breads';

  function select(sources: AlternativeSources, settings: VerdictSettings = STRICT) {
    return selectAlternatives(sources, { scannedCode: SCANNED, categoryTag: EXACT, settings });
  }

  function listed(alternatives: Alternative[]): string[] {
    return alternatives.map(({ product: p, origin }) => `${p.code}:${origin}`);
  }

  type Case = [situation: string, Partial<OffProduct>, VerdictSettings, kept: boolean];

  // Same engine as the product sheet: an alternative is kept only when its verdict is acceptable.
  const TABLE: Case[] = [
    ['sans lait', {}, LACTOSE_FREE, true],
    ['sans lait', {}, STRICT, true],
    ['sans lait', {}, STRICT_NO_TRACES, true],
    ['contient du lait', withMilk, LACTOSE_FREE, false],
    ['contient du lait', withMilk, STRICT, false],
    ['contient du lait', withMilk, STRICT_NO_TRACES, false],
    ['lait + label sans lactose', withMilkAndLabel, LACTOSE_FREE, true],
    ['lait + label sans lactose', withMilkAndLabel, STRICT, false],
    ['traces seules', milkTracesOnly, LACTOSE_FREE, true],
    ['traces seules', milkTracesOnly, STRICT, true],
    ['traces seules', milkTracesOnly, STRICT_NO_TRACES, false],
    ['fiche incomplète', noIngredients, LACTOSE_FREE, false],
    ['fiche incomplète', noIngredients, STRICT, false],
    ['fiche à compléter', { states_tags: ['en:ingredients-to-be-completed'] }, STRICT, false],
    ['allergènes vides', { allergens_tags: [] }, LACTOSE_FREE, false],
  ];

  const namedTable = TABLE.map(([situation, overrides, settings, kept]) => {
    const option = settings.excludeTraces ? ', traces exclues' : '';
    return [`${situation} · ${settings.mode}${option}`, overrides, settings, kept] as const;
  });

  describe.each<[string, keyof AlternativeSources]>([
    ['catégorie exacte', 'category'],
    ['catégorie parente', 'parent'],
    ['équivalences', 'equivalences'],
  ])('filtre par le verdict · %s', (_source, source) => {
    it.each(namedTable)('%s', (_name, overrides, settings, kept) => {
      const sources: AlternativeSources = { category: [], [source]: [product('1', overrides)] };
      expect(codes(select(sources, settings).map((a) => a.product))).toEqual(kept ? ['1'] : []);
    });
  });

  it('excludes the scanned product', () => {
    const result = select({ category: [product(SCANNED), product('1')] });
    expect(listed(result)).toEqual(['1:category']);
  });

  it('removes duplicates, the first source winning', () => {
    const result = select({
      category: [product('1'), product('1')],
      parent: [product('1'), product('2')],
      equivalences: [product('2'), product('3')],
    });
    expect(listed(result)).toEqual(['1:category', '2:parent', '3:equivalence']);
  });

  it(`keeps at most ${MAX_ALTERNATIVES} products`, () => {
    const many = Array.from({ length: 30 }, (_, i) => product(String(i + 1)));
    expect(select({ category: many })).toHaveLength(MAX_ALTERNATIVES);
  });

  it('keeps the most scanned products when it cuts the list', () => {
    const many = Array.from({ length: 30 }, (_, i) => product(String(i + 1), { unique_scans_n: i }));
    const result = select({ category: many });
    expect(result[0].product.code).toBe('30');
    expect(result.at(-1)?.product.code).toBe('21');
  });

  describe(`fewer than ${MIN_ALTERNATIVES} results (US-19)`, () => {
    it(`ignores the fallbacks with ${MIN_ALTERNATIVES} exact results`, () => {
      const result = select({
        category: [product('1'), product('2'), product('3')],
        parent: [product('4')],
        equivalences: [product('5')],
      });
      expect(listed(result)).toEqual(['1:category', '2:category', '3:category']);
    });

    it('completes with the parent category', () => {
      const result = select({
        category: [product('1'), product('milk', withMilk)],
        parent: [product('2'), product('3')],
        equivalences: [product('4')],
      });
      expect(listed(result)).toEqual(['1:category', '2:parent', '3:parent']);
    });

    it('then with the equivalences', () => {
      const result = select({
        category: [product('1')],
        parent: [product('2')],
        equivalences: [product('3'), product('4')],
      });
      expect(listed(result)).toEqual(['1:category', '2:parent', '3:equivalence', '4:equivalence']);
    });

    it('labels a parent result that carries the exact category « même catégorie »', () => {
      const result = select({
        category: [],
        parent: [product('1', { categories_tags: [PARENT, EXACT] }), product('2', { categories_tags: [PARENT] })],
      });
      expect(listed(result)).toEqual(['1:category', '2:parent']);
    });

    it('lists by origin, then by popularity and Nutri-Score', () => {
      const result = select({
        category: [product('rare', { unique_scans_n: 1 })],
        parent: [
          product('p-popular', { unique_scans_n: 900 }),
          product('p-b', { unique_scans_n: 10, nutriscore_grade: 'b' }),
          product('p-a', { unique_scans_n: 10, nutriscore_grade: 'a' }),
        ],
      });
      expect(listed(result)).toEqual(['rare:category', 'p-popular:parent', 'p-a:parent', 'p-b:parent']);
    });

    it('gives nothing when no source has a compatible product', () => {
      const result = select({
        category: [product('1', withMilk)],
        parent: [product('2', noIngredients)],
        equivalences: [product('3', withMilk)],
      });
      expect(result).toEqual([]);
    });
  });
});

describe('pickParentCategory', () => {
  const scanned = product(SCANNED, {
    categories_tags: ['en:breads', 'en:sliced-breads', 'en:wholemeal-sliced-breads'],
  });

  it('prefers a parent the product carries', () => {
    expect(pickParentCategory(['en:wholemeal-breads', 'en:sliced-breads'], scanned)).toBe(
      'en:sliced-breads'
    );
  });

  it('falls back to the first taxonomy parent', () => {
    expect(pickParentCategory(['fr:Pains', 'en:wholemeal-breads'], product(SCANNED))).toBe(
      'en:wholemeal-breads'
    );
  });

  it('gives null without parent', () => {
    expect(pickParentCategory([], scanned)).toBeNull();
  });
});

describe('compareAlternatives', () => {
  it('sorts by popularity, then Nutri-Score A to E, products without a grade last', () => {
    const products = [
      product('no-grade', { unique_scans_n: 50 }),
      product('d', { unique_scans_n: 50, nutriscore_grade: 'd' }),
      product('rare', { unique_scans_n: 2, nutriscore_grade: 'a' }),
      product('popular', { unique_scans_n: 300, nutriscore_grade: 'e' }),
      product('b', { unique_scans_n: 50, nutriscore_grade: 'b' }),
      product('unscanned', { nutriscore_grade: 'a' }),
    ];
    expect(codes([...products].sort(compareAlternatives))).toEqual([
      'popular',
      'b',
      'd',
      'no-grade',
      'rare',
      'unscanned',
    ]);
  });
});
