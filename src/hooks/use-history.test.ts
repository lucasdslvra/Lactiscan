import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { OffProduct } from '@/lib/off';

// The device storage, kept between two « launches » of the app.
const mockDisk = new Map<string, string>();
const mockStorage = {
  getItemSync: jest.fn((key: string): string | null => mockDisk.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockDisk.set(key, value);
  }),
};

jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: mockStorage }));

type HistoryModule = typeof import('@/hooks/use-history');

/** A fresh start of the app: the module reads the storage again. */
function launchApp(): HistoryModule {
  let module!: HistoryModule;
  jest.isolateModules(() => {
    // A new copy of the module on each launch: only `require` can load it here.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('@/hooks/use-history');
  });
  return module;
}

const product = (code: string): OffProduct => ({ code, product_name: `Produit ${code}` });
const codes = (app: HistoryModule) => app.getHistory().map((entry) => entry.code);

// The storage failures below log a warning on purpose.
let warn: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  mockDisk.clear();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  jest.clearAllMocks();
});

describe('history on the device', () => {
  it('is empty on the first launch', () => {
    expect(launchApp().getHistory()).toEqual([]);
  });

  it('keeps the products consulted after a restart, most recent first', async () => {
    const app = launchApp();
    await app.recordProductView(product('a'), 1);
    await app.recordProductView(product('b'), 2);
    expect(codes(launchApp())).toEqual(['b', 'a']);
  });

  it('shows a new view at once, before it is written', () => {
    mockStorage.setItemAsync.mockImplementationOnce(() => new Promise(() => {}));
    const app = launchApp();
    void app.recordProductView(product('a'), 1);
    expect(codes(app)).toEqual(['a']);
  });

  it('is empty after a clear, also after a restart', async () => {
    const app = launchApp();
    await app.recordProductView(product('a'), 1);
    await app.clearHistory();
    expect(app.getHistory()).toEqual([]);
    expect(launchApp().getHistory()).toEqual([]);
  });

  it('starts empty when the storage cannot be read', () => {
    mockStorage.getItemSync.mockImplementationOnce(() => {
      throw new Error('disk');
    });
    expect(launchApp().getHistory()).toEqual([]);
  });

  it('keeps the view in memory when the write fails', async () => {
    mockStorage.setItemAsync.mockImplementationOnce(async () => {
      throw new Error('disk full');
    });
    const app = launchApp();
    await app.recordProductView(product('a'), 1);
    expect(codes(app)).toEqual(['a']);
    expect(warn).toHaveBeenCalled();
  });
});
