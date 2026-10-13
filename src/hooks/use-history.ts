import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { parseHistory, recordView, type HistoryEntry } from '@/lib/history';
import type { OffProduct } from '@/lib/off';

const STORAGE_KEY = 'history';

/** An unreadable storage starts an empty history rather than blocking the screen. */
function readSaved(): HistoryEntry[] {
  try {
    return parseHistory(Storage.getItemSync(STORAGE_KEY));
  } catch (error) {
    console.warn('Historique illisible sur l’appareil', error);
    return [];
  }
}

// Read synchronously once, so the Historique tab is filled from its first frame.
let current: HistoryEntry[] = readSaved();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Shown at once; a failed write only loses the history after the app is closed. */
function update(history: HistoryEntry[]): Promise<void> {
  current = history;
  listeners.forEach((listener) => listener());
  return Storage.setItemAsync(STORAGE_KEY, JSON.stringify(history)).catch((error: unknown) => {
    console.warn('Historique non enregistré sur l’appareil', error);
  });
}

/** Products consulted, most recent first. */
export function getHistory(): HistoryEntry[] {
  return current;
}

/** Called each time a product sheet shows: the product goes to the top of the history. */
export function recordProductView(product: OffProduct, nowMs: number = Date.now()) {
  return update(recordView(current, product, nowMs));
}

export function clearHistory() {
  return update([]);
}

/** Products consulted, most recent first; screens re-render when it changes. */
export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribe, getHistory);
}
