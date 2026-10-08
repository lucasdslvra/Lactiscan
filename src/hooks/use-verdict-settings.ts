import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import type { VerdictSettings } from '@/lib/verdict';
import { parseVerdictSettings, serializeVerdictSettings } from '@/lib/verdict-settings';

const STORAGE_KEY = 'verdict-settings';

// Never shown to someone who has not chosen: the navigation keeps every verdict screen behind
// the profile choice. Kept as the most cautious profile all the same.
const FALLBACK_SETTINGS: VerdictSettings = { mode: 'strict', excludeTraces: false };

// Read synchronously once, so the first frame already knows whether to show the profile screen.
let current: VerdictSettings | null = parseVerdictSettings(Storage.getItemSync(STORAGE_KEY));
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return current;
}

/** Saves the profile on the device; every screen showing a verdict recomputes it at once. */
export function setVerdictSettings(settings: VerdictSettings) {
  Storage.setItemSync(STORAGE_KEY, serializeVerdictSettings(settings));
  current = settings;
  listeners.forEach((listener) => listener());
}

/** The saved profile, or `null` until it is chosen on the first launch. */
export function useStoredVerdictSettings(): VerdictSettings | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** The user's verdict profile; the only place screens read it from. */
export function useVerdictSettings(): VerdictSettings {
  return useStoredVerdictSettings() ?? FALLBACK_SETTINGS;
}
