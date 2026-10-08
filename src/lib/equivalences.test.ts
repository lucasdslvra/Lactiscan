import { describe, expect, it } from '@jest/globals';

import {
  EMBEDDED_EQUIVALENCES,
  equivalenceProducts,
  parseEquivalences,
  type EquivalencesFile,
} from '@/lib/equivalences';

const FILE: EquivalencesFile = {
  version: '2026-10-08',
  manual: [{ name: 'Beurre' }],
  auto: {
    'en:sliced-breads': [{ code: '1' }, { code: '2' }],
    'en:breads': [{ code: '3' }],
  },
};

describe('parseEquivalences', () => {
  it('accepts a file with its three parts', () => {
    expect(parseEquivalences(FILE)).toEqual(FILE);
  });

  it.each<[string, unknown]>([
    ['not an object', 'equivalences'],
    ['no version', { manual: [], auto: {} }],
    ['manual not a list', { version: 'v', manual: {}, auto: {} }],
    ['auto a list', { version: 'v', manual: [], auto: [] }],
    ['auto category not a list', { version: 'v', manual: [], auto: { 'en:breads': {} } }],
    ['product without code', { version: 'v', manual: [], auto: { 'en:breads': [{ product_name: 'Pain' }] } }],
  ])('rejects %s', (_case, raw) => {
    expect(parseEquivalences(raw)).toBeNull();
  });

  it('reads the copy shipped with the app', () => {
    expect(EMBEDDED_EQUIVALENCES.version).not.toBe('');
  });
});

describe('equivalenceProducts', () => {
  it('lists the products of each category, in the order of the tags', () => {
    const products = equivalenceProducts(FILE, ['en:sliced-breads', 'en:breads']);
    expect(products.map((p) => p.code)).toEqual(['1', '2', '3']);
  });

  it('skips unknown and missing tags', () => {
    expect(equivalenceProducts(FILE, ['en:spreads', null, undefined])).toEqual([]);
  });
});
