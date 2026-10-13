import { describe, expect, it } from '@jest/globals';

import {
  EMBEDDED_EQUIVALENCES,
  type EquivalencesFile,
  type ManualEquivalence,
} from '@/lib/equivalences';
import {
  CATEGORY_LABEL,
  MAX_FOOD_PRODUCTS,
  categoryTagLabel,
  foodProducts,
  foodSuggestions,
  isSameTerm,
  normalizeTerm,
  replacementsForMode,
  searchFoods,
} from '@/lib/food-search';
import type { OffProduct } from '@/lib/off';

const ids = (foods: ManualEquivalence[]) => foods.map((food) => food.id);
const firstId = (query: string) => searchFoods(EMBEDDED_EQUIVALENCES, query)[0]?.id;

const BUTTER: ManualEquivalence = {
  id: 'beurre',
  name: 'Beurre',
  synonyms: ['beurre doux'],
  categoryTags: ['en:margarines', 'en:plant-based-spreads'],
  replacements: [
    { name: 'Margarine végétale', mode: 'strict' },
    { name: 'Beurre sans lactose', mode: 'lactose-free' },
    { name: 'Huile de colza', mode: 'strict' },
  ],
};

/** A sheet the verdict engine reads as « Sans lait ». */
function milkFree(code: string, scans: number): OffProduct {
  return {
    code,
    ingredients_text_fr: 'huiles végétales, eau, sel',
    allergens_tags: ['en:none'],
    unique_scans_n: scans,
  };
}

const STRICT = { mode: 'strict', excludeTraces: false } as const;

describe('normalizeTerm', () => {
  it('ignores case, accents, punctuation and plurals', () => {
    expect(normalizeTerm('  Crèmes   FRAÎCHES ')).toBe('creme fraiche');
    expect(normalizeTerm("Crème d'avoine")).toBe('creme d avoine');
    expect(normalizeTerm('Gâteaux')).toBe('gateau');
    expect(normalizeTerm('Bœuf')).toBe('boeuf');
  });

  it('keeps short words whole', () => {
    expect(normalizeTerm('jus')).toBe('jus');
  });
});

describe('isSameTerm', () => {
  it('compares texts as the search does', () => {
    expect(isSameTerm('Beurre demi-sel', 'beurres demi sel')).toBe(true);
    expect(isSameTerm('Beurre', 'Beurre doux')).toBe(false);
  });
});

describe('searchFoods', () => {
  it('finds a food by name, whatever the case, accents or plural', () => {
    expect(firstId('beurre')).toBe('beurre');
    expect(firstId('BEURRES')).toBe('beurre');
    expect(firstId('creme fraiche')).toBe('creme-fraiche');
    expect(firstId('Crèmes fraîches')).toBe('creme-fraiche');
    expect(firstId('yaourts')).toBe('yaourt');
  });

  it('finds a food by one of its synonyms', () => {
    expect(firstId('crème épaisse')).toBe('creme-fraiche');
    expect(firstId('gruyère râpé')).toBe('fromage-rape');
    expect(firstId('demi-sel')).toBe('beurre');
  });

  it('finds a food named inside a longer query', () => {
    expect(firstId('beurre doux bio')).toBe('beurre');
  });

  it('puts the exact food before the ones that only contain the word', () => {
    expect(ids(searchFoods(EMBEDDED_EQUIVALENCES, 'lait'))).toEqual([
      'lait',
      'chocolat-au-lait',
      'creme-dessert',
    ]);
    expect(firstId('chocolat au lait')).toBe('chocolat-au-lait');
  });

  it('lists every food sharing a word, in the order of the file', () => {
    expect(ids(searchFoods(EMBEDDED_EQUIVALENCES, 'crème'))).toEqual([
      'creme-fraiche',
      'creme-liquide',
      'glace',
      'creme-dessert',
    ]);
  });

  it('searches nothing below two letters', () => {
    expect(searchFoods(EMBEDDED_EQUIVALENCES, 'b')).toEqual([]);
    expect(searchFoods(EMBEDDED_EQUIVALENCES, ' é ')).toEqual([]);
  });

  it('finds nothing for an unknown food', () => {
    expect(searchFoods(EMBEDDED_EQUIVALENCES, 'quinoa')).toEqual([]);
  });
});

describe('foodSuggestions', () => {
  it('suggests names and synonyms from two letters, capitalized', () => {
    expect(foodSuggestions(EMBEDDED_EQUIVALENCES, 'be')).toEqual([
      { label: 'Beurre', foodId: 'beurre' },
      { label: 'Beurre doux', foodId: 'beurre' },
      { label: 'Beurre demi-sel', foodId: 'beurre' },
      { label: 'Beurre salé', foodId: 'beurre' },
      { label: 'Beurre de baratte', foodId: 'beurre' },
    ]);
  });

  it('puts the exact term first', () => {
    expect(foodSuggestions(EMBEDDED_EQUIVALENCES, 'creme fraiche')[0]).toEqual({
      label: 'Crème fraîche',
      foodId: 'creme-fraiche',
    });
  });

  it('suggests nothing below two letters', () => {
    expect(foodSuggestions(EMBEDDED_EQUIVALENCES, 'c')).toEqual([]);
  });

  it('stops at the limit', () => {
    expect(foodSuggestions(EMBEDDED_EQUIVALENCES, 'crème')).toHaveLength(6);
    expect(foodSuggestions(EMBEDDED_EQUIVALENCES, 'crème', 2)).toHaveLength(2);
  });

  it('suggests a term shared by two foods once', () => {
    const file: EquivalencesFile = {
      version: '2026-10-13',
      manual: [BUTTER, { ...BUTTER, id: 'autre', name: 'Beurre doux' }],
      auto: {},
    };
    expect(foodSuggestions(file, 'beurre')).toEqual([
      { label: 'Beurre', foodId: 'beurre' },
      { label: 'Beurre doux', foodId: 'beurre' },
    ]);
  });
});

describe('replacementsForMode', () => {
  it('keeps only milk-free replacements for the strict profile', () => {
    expect(replacementsForMode(BUTTER.replacements, 'strict').map((r) => r.name)).toEqual([
      'Margarine végétale',
      'Huile de colza',
    ]);
  });

  it('keeps every replacement, in order, for the lactose-free profile', () => {
    expect(replacementsForMode(BUTTER.replacements, 'lactose-free')).toEqual(BUTTER.replacements);
  });

  it('can leave nothing for a food with only lactose-free replacements', () => {
    expect(
      replacementsForMode([{ name: 'Beurre sans lactose', mode: 'lactose-free' }], 'strict')
    ).toEqual([]);
  });
});

describe('categoryTagLabel', () => {
  it('names the categories of the equivalences in French', () => {
    expect(categoryTagLabel('en:plant-based-spreads')).toBe('MATIÈRES GRASSES À TARTINER');
  });

  it('every category of the file has a French name', () => {
    const tags = EMBEDDED_EQUIVALENCES.manual.flatMap((food) => food.categoryTags);
    expect(tags.filter((tag) => !Object.hasOwn(CATEGORY_LABEL, tag))).toEqual([]);
  });

  it('shows an unknown category as its readable tag', () => {
    expect(categoryTagLabel('en:oat-drinks')).toBe('OAT DRINKS');
  });
});

describe('foodProducts', () => {
  const containsMilk: OffProduct = {
    ...milkFree('milk', 1000),
    allergens_tags: ['en:milk'],
  };
  const incomplete: OffProduct = { code: 'incomplete', unique_scans_n: 900 };
  const file: EquivalencesFile = {
    version: '2026-10-13',
    manual: [BUTTER],
    auto: {
      'en:margarines': [milkFree('a', 10), containsMilk, milkFree('b', 50), incomplete],
      'en:plant-based-spreads': [milkFree('b', 50), milkFree('c', 5)],
    },
  };

  it('keeps the products the profile accepts, most scanned first, per category', () => {
    expect(
      foodProducts(file, BUTTER, STRICT).map(({ categoryTag, label, products }) => ({
        categoryTag,
        label,
        codes: products.map((product) => product.code),
      }))
    ).toEqual([
      { categoryTag: 'en:margarines', label: 'MARGARINES', codes: ['b', 'a'] },
      { categoryTag: 'en:plant-based-spreads', label: 'MATIÈRES GRASSES À TARTINER', codes: ['c'] },
    ]);
  });

  it('omits categories without products', () => {
    expect(foodProducts({ ...file, auto: { 'en:margarines': [containsMilk] } }, BUTTER, STRICT)).toEqual(
      []
    );
    expect(foodProducts({ ...file, auto: {} }, BUTTER, STRICT)).toEqual([]);
  });

  it(`shows at most ${MAX_FOOD_PRODUCTS} products per category`, () => {
    const many = Array.from({ length: 8 }, (_, index) => milkFree(String(index), index));
    const [margarines] = foodProducts({ ...file, auto: { 'en:margarines': many } }, BUTTER, STRICT);
    expect(margarines?.products.map((product) => product.code)).toEqual(['7', '6', '5', '4', '3']);
  });

  it('applies the traces option of the strict profile', () => {
    const traces: OffProduct = { ...milkFree('t', 100), traces_tags: ['en:milk'] };
    const only = { ...file, auto: { 'en:margarines': [traces] } };
    expect(foodProducts(only, BUTTER, STRICT)).toHaveLength(1);
    expect(foodProducts(only, BUTTER, { mode: 'strict', excludeTraces: true })).toEqual([]);
  });
});
