import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  AUTO_PRODUCTS_PER_CATEGORY,
  autoCategories,
  cleanProduct,
  replaceTopLevelValue,
  selectAutoProducts,
  todayInParis,
  topLevelValueSpan,
  updateFileText,
  type AutoProductSchema,
} from './auto';
import type { AutoProduct, ManualEquivalence } from './types';

const SCHEMA = JSON.parse(
  readFileSync(join(__dirname, 'equivalences.schema.json'), 'utf8')
) as AutoProductSchema;
const FILE_TEXT = readFileSync(join(__dirname, 'equivalences.json'), 'utf8');

/** A sheet the verdict engine reads as « Sans lait ». */
function milkFree(code: string, scans: number): AutoProduct {
  return {
    code,
    ingredients_text_fr: 'eau, soja 8 %, sel',
    allergens_tags: ['en:soybeans'],
    unique_scans_n: scans,
  };
}

function entry(id: string, categoryTags: string[]): ManualEquivalence {
  return {
    id,
    name: id,
    synonyms: [`${id} bis`],
    categoryTags,
    replacements: [{ name: 'x', mode: 'strict' }],
  };
}

describe('autoCategories', () => {
  it('lists each category once, in order of appearance', () => {
    expect(
      autoCategories([
        entry('a', ['en:creams', 'en:margarines']),
        entry('b', ['en:creams', 'en:yogurts']),
      ])
    ).toEqual(['en:creams', 'en:margarines', 'en:yogurts']);
  });
});

describe('selectAutoProducts', () => {
  it('keeps only milk-free sheets, traces allowed', () => {
    const withMilk = { ...milkFree('milk', 900), allergens_tags: ['en:milk'] };
    const incomplete: AutoProduct = { code: 'incomplete', unique_scans_n: 800 };
    const traces = { ...milkFree('traces', 700), traces_tags: ['en:milk'] };
    const codes = selectAutoProducts([withMilk, incomplete, traces, milkFree('ok', 1)]).map(
      (product) => product.code
    );
    expect(codes).toEqual(['traces', 'ok']);
  });

  it('sorts by popularity, drops duplicates and stops at the limit', () => {
    const products = Array.from({ length: 15 }, (_, index) => milkFree(String(index), index));
    const codes = selectAutoProducts([milkFree('14', 14), ...products]).map((p) => p.code);
    expect(codes).toHaveLength(AUTO_PRODUCTS_PER_CATEGORY);
    expect(codes.slice(0, 3)).toEqual(['14', '13', '12']);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('cleanProduct', () => {
  it('keeps the schema fields of the expected type, in the schema order', () => {
    const product = cleanProduct(
      {
        unique_scans_n: 12,
        code: '123',
        product_name: 'Margarine',
        brands: null,
        allergens_tags: ['en:soybeans', 3],
        labels_tags: ['en:vegan'],
        ecoscore_grade: 'b',
      },
      SCHEMA
    );
    expect(product).toEqual({
      code: '123',
      product_name: 'Margarine',
      labels_tags: ['en:vegan'],
      unique_scans_n: 12,
    });
    expect(Object.keys(product!)).toEqual(['code', 'product_name', 'labels_tags', 'unique_scans_n']);
  });

  it('drops a product without a code', () => {
    expect(cleanProduct({ code: '' }, SCHEMA)).toBeNull();
    expect(cleanProduct({ product_name: 'x' }, SCHEMA)).toBeNull();
    expect(cleanProduct(null, SCHEMA)).toBeNull();
  });
});

describe('replaceTopLevelValue', () => {
  const text = '{\n  "a": {"auto": 1, "s": "}\\"auto\\""},\n  "auto": {}\n}\n';

  it('only replaces the top-level key', () => {
    expect(replaceTopLevelValue(text, 'auto', { 'en:x': [1] })).toBe(
      '{\n  "a": {"auto": 1, "s": "}\\"auto\\""},\n  "auto": {\n    "en:x": [\n      1\n    ]\n  }\n}\n'
    );
  });

  it('fails on a missing key', () => {
    expect(() => replaceTopLevelValue(text, 'version', '2026-10-13')).toThrow('version');
  });
});

describe('updateFileText', () => {
  const auto = { 'en:margarines': [milkFree('1', 5)] };

  it('replaces auto and version and leaves manual byte for byte', () => {
    const updated = updateFileText(FILE_TEXT, auto, '2030-01-31')!;
    const span = (text: string) => topLevelValueSpan(text, 'manual')!;
    const manualOf = (text: string) => text.slice(span(text).start, span(text).end);

    expect(manualOf(updated)).toBe(manualOf(FILE_TEXT));
    expect(updated.slice(0, span(updated).end)).toBe(
      FILE_TEXT.slice(0, span(FILE_TEXT).end).replace(/"version": "[^"]+"/, '"version": "2030-01-31"')
    );
    expect(updated.endsWith('\n}\n')).toBe(FILE_TEXT.endsWith('\n}\n'));
    const parsed = JSON.parse(updated);
    expect(parsed.version).toBe('2030-01-31');
    expect(parsed.auto).toEqual(auto);
  });

  it('returns null when auto did not change', () => {
    const updated = updateFileText(FILE_TEXT, auto, '2030-01-31')!;
    expect(updateFileText(updated, auto, '2030-02-07')).toBeNull();
  });
});

describe('todayInParis', () => {
  it('gives the French date', () => {
    // 23:30 UTC on 31 December is already 1 January in Paris.
    expect(todayInParis(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
    expect(todayInParis(new Date('2026-10-13T08:00:00Z'))).toBe('2026-10-13');
  });
});
