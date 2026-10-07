import { describe, expect, it } from '@jest/globals';

import type { OffProduct } from '@/lib/off';
import { evaluateVerdict, type Verdict, type VerdictSettings } from '@/lib/verdict';

/** A complete sheet with no milk anywhere; each case overrides what it needs. */
function product(overrides: Partial<OffProduct> = {}): OffProduct {
  return {
    code: '3760123456784',
    product_name: 'Produit test',
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
const milkTracesOnly = { traces_tags: ['en:milk', 'en:nuts'] };
const noIngredients = { ingredients_text_fr: undefined, ingredients_text: undefined };

type Case = [situation: string, OffProduct | null, VerdictSettings, Verdict];

// One row per situation of the « Détection du lait » table, for each mode and traces option.
const TABLE: Case[] = [
  // 1. en:milk in the allergens, no « sans lactose » label
  ['lait, sans label', product(withMilk), LACTOSE_FREE, { kind: 'contains-milk', acceptable: false, milkTraces: false }],
  ['lait, sans label', product(withMilk), STRICT, { kind: 'contains-milk', acceptable: false, milkTraces: false }],
  ['lait, sans label', product(withMilk), STRICT_NO_TRACES, { kind: 'contains-milk', acceptable: false, milkTraces: false }],
  // 2. en:milk in the allergens, with the « sans lactose » label
  ['lait + label', product(withMilkAndLabel), LACTOSE_FREE, { kind: 'lactose-free', acceptable: true, milkTraces: false }],
  ['lait + label', product(withMilkAndLabel), STRICT, { kind: 'contains-milk', acceptable: false, milkTraces: false }],
  ['lait + label', product(withMilkAndLabel), STRICT_NO_TRACES, { kind: 'contains-milk', acceptable: false, milkTraces: false }],
  // 3. en:milk only in the traces
  ['traces seules', product(milkTracesOnly), LACTOSE_FREE, { kind: 'milk-free', acceptable: true, milkTraces: true }],
  ['traces seules', product(milkTracesOnly), STRICT, { kind: 'traces', acceptable: true, milkTraces: true }],
  ['traces seules', product(milkTracesOnly), STRICT_NO_TRACES, { kind: 'traces', acceptable: false, milkTraces: true }],
  // 4. No mention of milk, ingredients filled in
  ['aucun lait', product(), LACTOSE_FREE, { kind: 'milk-free', acceptable: true, milkTraces: false }],
  ['aucun lait', product(), STRICT, { kind: 'milk-free', acceptable: true, milkTraces: false }],
  ['aucun lait', product(), STRICT_NO_TRACES, { kind: 'milk-free', acceptable: true, milkTraces: false }],
  // 5. Ingredients or allergens not filled in
  ['incomplète', product(noIngredients), LACTOSE_FREE, { kind: 'incomplete', acceptable: false, milkTraces: false }],
  ['incomplète', product(noIngredients), STRICT, { kind: 'incomplete', acceptable: false, milkTraces: false }],
  ['incomplète', product(noIngredients), STRICT_NO_TRACES, { kind: 'incomplete', acceptable: false, milkTraces: false }],
  // 6. Unknown barcode
  ['code inconnu', null, LACTOSE_FREE, { kind: 'not-found', acceptable: false, milkTraces: false }],
  ['code inconnu', null, STRICT, { kind: 'not-found', acceptable: false, milkTraces: false }],
  ['code inconnu', null, STRICT_NO_TRACES, { kind: 'not-found', acceptable: false, milkTraces: false }],
];

describe('evaluateVerdict', () => {
  const namedTable = TABLE.map(([situation, input, settings, expected]) => {
    const option = settings.excludeTraces ? ', traces exclues' : '';
    return [`${situation} · ${settings.mode}${option}`, input, settings, expected] as const;
  });

  it.each(namedTable)('%s', (_name, input, settings, expected) => {
    expect(evaluateVerdict(input, settings)).toEqual(expected);
  });

  it('reads both Open Food Facts tags of the « sans lactose » label', () => {
    for (const label of ['en:no-lactose', 'en:lactose-free']) {
      const verdict = evaluateVerdict(product({ ...withMilk, labels_tags: [label] }), LACTOSE_FREE);
      expect(verdict.kind).toBe('lactose-free');
    }
  });

  it('ignores unrelated labels', () => {
    const verdict = evaluateVerdict(product({ ...withMilk, labels_tags: ['en:organic'] }), LACTOSE_FREE);
    expect(verdict.kind).toBe('contains-milk');
  });

  it('gives milk in the allergens priority over milk in the traces', () => {
    const sheet = product({ ...withMilk, traces_tags: ['en:milk'] });
    expect(evaluateVerdict(sheet, STRICT)).toEqual({
      kind: 'contains-milk',
      acceptable: false,
      milkTraces: true,
    });
  });

  it('only applies the traces option in strict mode', () => {
    const verdict = evaluateVerdict(product(milkTracesOnly), {
      mode: 'lactose-free',
      excludeTraces: true,
    });
    expect(verdict).toEqual({ kind: 'milk-free', acceptable: true, milkTraces: true });
  });

  it('falls back to the ingredients in the original language', () => {
    const sheet = product({ ingredients_text_fr: '', ingredients_text: 'Oat water, salt.' });
    expect(evaluateVerdict(sheet, STRICT).kind).toBe('milk-free');
  });

  describe('never says « Sans lait » for an incomplete sheet', () => {
    const incompleteSheets: [string, Partial<OffProduct>][] = [
      ['no ingredients', noIngredients],
      ['blank ingredients', { ingredients_text_fr: '   ', ingredients_text: '' }],
      ['no allergens field', { allergens_tags: undefined }],
      ['empty allergens', { allergens_tags: [] }],
      ['ingredients to be completed', { states_tags: ['en:ingredients-to-be-completed'] }],
      ['milk traces but no allergens', { ...milkTracesOnly, allergens_tags: [] }],
      ['« sans lactose » label but no ingredients', { ...withMilkAndLabel, ...noIngredients }],
    ];

    it.each(incompleteSheets)('%s', (_case, overrides) => {
      for (const settings of [LACTOSE_FREE, STRICT, STRICT_NO_TRACES]) {
        const verdict = evaluateVerdict(product(overrides), settings);
        expect(verdict.kind).toBe('incomplete');
        expect(verdict.acceptable).toBe(false);
      }
    });
  });
});
