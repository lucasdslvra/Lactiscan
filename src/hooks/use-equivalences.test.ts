import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EMBEDDED_EQUIVALENCES, EQUIVALENCES_URL, type EquivalencesFile } from '@/lib/equivalences';

// The device storage, kept between two « launches » of the app.
const mockDisk = new Map<string, string>();
const mockStorage = {
  getItemSync: jest.fn((key: string) => mockDisk.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockDisk.set(key, value);
  }),
};

jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: mockStorage }));

type EquivalencesModule = typeof import('@/hooks/use-equivalences');

/** A fresh start of the app: the module reads the storage again. */
function launchApp(): EquivalencesModule {
  let module!: EquivalencesModule;
  jest.isolateModules(() => {
    // A new copy of the module on each launch: only `require` can load it here.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('@/hooks/use-equivalences');
  });
  return module;
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-13T08:00:00Z');

// Later than the embedded copy, so it replaces it.
const LATEST: EquivalencesFile = {
  ...EMBEDDED_EQUIVALENCES,
  version: '2099-01-01',
  auto: { 'en:margarines': [{ code: '3017620422003' }] },
};

const fetchMock = jest.fn<typeof fetch>();

function respondWith(body: string, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(body, { status }));
}

// Network failures and invalid files log a warning on purpose.
let warn: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  mockDisk.clear();
  fetchMock.mockReset();
  global.fetch = fetchMock;
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe('equivalences download', () => {
  it('uses the embedded copy before any download', () => {
    expect(launchApp().getEquivalences()).toEqual(EMBEDDED_EQUIVALENCES);
  });

  it('downloads the raw file and keeps it for the next launches', async () => {
    respondWith(JSON.stringify(LATEST));
    const app = launchApp();
    // What `useEquivalences` listens to: screens showing equivalences re-render.
    const listener = jest.fn();
    const unsubscribe = app.subscribeToEquivalences(listener);

    await app.refreshEquivalences(NOW);

    expect(fetchMock).toHaveBeenCalledWith(EQUIVALENCES_URL, expect.anything());
    expect(app.getEquivalences()).toEqual(LATEST);
    expect(listener).toHaveBeenCalled();
    expect(launchApp().getEquivalences()).toEqual(LATEST);
    unsubscribe();
  });

  it('downloads at most once a day', async () => {
    respondWith(JSON.stringify(LATEST));
    await launchApp().refreshEquivalences(NOW);

    await launchApp().refreshEquivalences(NOW + DAY - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    respondWith(JSON.stringify(LATEST));
    await launchApp().refreshEquivalences(NOW + DAY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('downloads once per launch, however many times it is asked', async () => {
    respondWith(JSON.stringify(LATEST));
    const app = launchApp();
    await Promise.all([app.refreshEquivalences(NOW), app.refreshEquivalences(NOW)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['not JSON', '<!DOCTYPE html>'],
    ['not in the expected format', JSON.stringify({ ...LATEST, manual: [{ name: 'Beurre' }] })],
  ])('ignores a file %s and keeps the previous version', async (_case, body) => {
    respondWith(JSON.stringify(LATEST));
    await launchApp().refreshEquivalences(NOW);

    respondWith(body);
    const app = launchApp();
    await app.refreshEquivalences(NOW + DAY);

    expect(app.getEquivalences()).toEqual(LATEST);
    expect(launchApp().getEquivalences()).toEqual(LATEST);
    // Received all the same: no new download that day.
    await launchApp().refreshEquivalences(NOW + DAY + 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      'without network',
      () => fetchMock.mockRejectedValueOnce(new TypeError('Network request failed')),
    ],
    ['on a server error', () => respondWith('', 503)],
  ])('tries again on the next launch %s', async (_case, fail) => {
    fail();
    const app = launchApp();
    await app.refreshEquivalences(NOW);
    expect(app.getEquivalences()).toEqual(EMBEDDED_EQUIVALENCES);

    respondWith(JSON.stringify(LATEST));
    await launchApp().refreshEquivalences(NOW + 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the embedded copy when the saved file cannot be read', () => {
    mockDisk.set('equivalences-file', '{"version":');
    expect(launchApp().getEquivalences()).toEqual(EMBEDDED_EQUIVALENCES);
  });

  it('prefers a newer embedded copy to an older download', () => {
    mockDisk.set('equivalences-file', JSON.stringify({ ...LATEST, version: '2000-01-01' }));
    expect(launchApp().getEquivalences()).toEqual(EMBEDDED_EQUIVALENCES);
  });
});
