import { describe, expect, it } from '@jest/globals';

import {
  EMBEDDED_EQUIVALENCES,
  EQUIVALENCES_DOWNLOAD_INTERVAL_MS,
  currentEquivalences,
  equivalenceProducts,
  isDownloadDue,
  parseEquivalences,
  type EquivalencesFile,
  type ManualEquivalence,
} from '@/lib/equivalences';

const BUTTER: ManualEquivalence = {
  id: 'beurre',
  name: 'Beurre',
  synonyms: ['beurre doux'],
  categoryTags: ['en:margarines'],
  replacements: [
    { name: 'Margarine végétale', mode: 'strict', note: 'Sans lactosérum.' },
    { name: 'Beurre sans lactose', mode: 'lactose-free' },
  ],
};

const FILE: EquivalencesFile = {
  version: '2026-10-08',
  manual: [BUTTER],
  auto: {
    'en:sliced-breads': [{ code: '1' }, { code: '2' }],
    'en:breads': [{ code: '3' }],
  },
};

describe('parseEquivalences', () => {
  it('accepts a file with its three parts', () => {
    expect(parseEquivalences(FILE)).toEqual(FILE);
  });

  it('tolerates fields added by a newer format', () => {
    const raw = {
      ...FILE,
      $schema: './equivalences.schema.json',
      manual: [{ ...BUTTER, icon: 'butter' }],
      auto: { 'en:breads': [{ code: '3', ecoscore_grade: 'b' }] },
    };
    expect(parseEquivalences(raw)).not.toBeNull();
  });

  const withButter = (changes: Partial<Record<keyof ManualEquivalence, unknown>>) => ({
    ...FILE,
    manual: [{ ...BUTTER, ...changes }],
  });

  it.each<[string, unknown]>([
    ['not an object', 'equivalences'],
    ['no version', { manual: [], auto: {} }],
    ['a version that is not a date', { ...FILE, version: 'v2' }],
    ['an impossible date', { ...FILE, version: '2026-13-01' }],
    ['manual not a list', { ...FILE, manual: {} }],
    ['an entry without id', withButter({ id: undefined })],
    ['an entry without synonyms', withButter({ synonyms: [] })],
    ['an empty synonym', withButter({ synonyms: [''] })],
    ['an entry without categoryTags', withButter({ categoryTags: undefined })],
    ['an entry without replacements', withButter({ replacements: [] })],
    ['an unknown mode', withButter({ replacements: [{ name: 'Margarine', mode: 'vegan' }] })],
    ['a replacement without name', withButter({ replacements: [{ mode: 'strict' }] })],
    [
      'an empty note',
      withButter({
        replacements: [{ name: 'Margarine', mode: 'strict', note: '' }],
      }),
    ],
    ['auto a list', { ...FILE, auto: [] }],
    ['auto category not a list', { ...FILE, auto: { 'en:breads': {} } }],
    ['product without code', { ...FILE, auto: { 'en:breads': [{ product_name: 'Pain' }] } }],
    [
      'a product field of the wrong type',
      {
        ...FILE,
        auto: { 'en:breads': [{ code: '3', allergens_tags: 'en:milk' }] },
      },
    ],
  ])('rejects %s', (_case, raw) => {
    expect(parseEquivalences(raw)).toBeNull();
  });

  it('reads the copy shipped with the app', () => {
    expect(EMBEDDED_EQUIVALENCES.version).not.toBe('');
  });

  it('ships the generic equivalences of the consultation mode', () => {
    expect(EMBEDDED_EQUIVALENCES.manual.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'lait',
        'beurre',
        'creme-fraiche',
        'creme-liquide',
        'fromage-rape',
        'yaourt',
        'chocolat-au-lait',
      ])
    );
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

describe('isDownloadDue', () => {
  const NOW = Date.parse('2026-10-13T08:00:00Z');

  it('downloads on the first launch', () => {
    expect(isDownloadDue(null, NOW)).toBe(true);
  });

  it('waits a day after the last download', () => {
    expect(isDownloadDue(NOW - EQUIVALENCES_DOWNLOAD_INTERVAL_MS + 1, NOW)).toBe(false);
    expect(isDownloadDue(NOW - EQUIVALENCES_DOWNLOAD_INTERVAL_MS, NOW)).toBe(true);
  });

  it('downloads again when the clock went back', () => {
    expect(isDownloadDue(NOW + 60_000, NOW)).toBe(true);
  });
});

describe('currentEquivalences', () => {
  const embeddedCopy = { ...FILE, version: '2026-10-08' };

  it('uses the embedded copy without download', () => {
    expect(currentEquivalences(null, embeddedCopy)).toBe(embeddedCopy);
  });

  it('prefers a newer download', () => {
    const downloaded = { ...FILE, version: '2026-10-15' };
    expect(currentEquivalences(downloaded, embeddedCopy)).toBe(downloaded);
  });

  it('prefers the download of the same date, which may hold a fix', () => {
    const downloaded = { ...FILE, version: '2026-10-08' };
    expect(currentEquivalences(downloaded, embeddedCopy)).toBe(downloaded);
  });

  it('prefers a newer copy shipped by an app update', () => {
    const downloaded = { ...FILE, version: '2026-09-30' };
    expect(currentEquivalences(downloaded, embeddedCopy)).toBe(embeddedCopy);
  });
});
