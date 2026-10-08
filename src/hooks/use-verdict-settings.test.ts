import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { VerdictSettings } from '@/lib/verdict';

// The device storage, kept between two « launches » of the app.
const mockDisk = new Map<string, string>();
const mockStorage = {
  getItemSync: jest.fn((key: string) => mockDisk.get(key) ?? null),
  setItemSync: jest.fn((key: string, value: string) => {
    mockDisk.set(key, value);
  }),
};

jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: mockStorage }));

type SettingsModule = typeof import('@/hooks/use-verdict-settings');

/** A fresh start of the app: the module reads the storage again. */
function launchApp(): SettingsModule {
  let module!: SettingsModule;
  jest.isolateModules(() => {
    // A new copy of the module on each launch: only `require` can load it here.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('@/hooks/use-verdict-settings');
  });
  return module;
}

const STRICT_NO_TRACES: VerdictSettings = { mode: 'strict', excludeTraces: true };

// The storage failures below log a warning on purpose.
let warn: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  mockDisk.clear();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe('verdict settings on the device', () => {
  it('has no profile on the first launch', () => {
    expect(launchApp().getVerdictSettings()).toBeNull();
  });

  it('keeps the profile after a restart', () => {
    launchApp().setVerdictSettings(STRICT_NO_TRACES);
    expect(launchApp().getVerdictSettings()).toEqual(STRICT_NO_TRACES);
  });

  it('keeps the last change after a restart', () => {
    const app = launchApp();
    app.setVerdictSettings(STRICT_NO_TRACES);
    app.setVerdictSettings({ mode: 'lactose-free', excludeTraces: true });
    expect(launchApp().getVerdictSettings()).toEqual({
      mode: 'lactose-free',
      excludeTraces: true,
    });
  });

  it('asks for the profile again when the storage cannot be read', () => {
    mockDisk.set('verdict-settings', JSON.stringify(STRICT_NO_TRACES));
    mockStorage.getItemSync.mockImplementationOnce(() => {
      throw new Error('disk I/O error');
    });
    expect(launchApp().getVerdictSettings()).toBeNull();
  });

  it('still applies the profile when it cannot be saved', () => {
    const app = launchApp();
    mockStorage.setItemSync.mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    expect(() => app.setVerdictSettings(STRICT_NO_TRACES)).not.toThrow();
    expect(app.getVerdictSettings()).toEqual(STRICT_NO_TRACES);
  });
});
