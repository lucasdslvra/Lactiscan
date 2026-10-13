import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import {
  EQUIVALENCES_URL,
  currentEquivalences,
  isDownloadDue,
  parseEquivalences,
  type EquivalencesFile,
} from '@/lib/equivalences';

const FILE_KEY = 'equivalences-file';
const DOWNLOADED_AT_KEY = 'equivalences-downloaded-at';
const TIMEOUT_MS = 10_000;

function parseText(text: string | null): EquivalencesFile | null {
  if (!text) return null;
  try {
    return parseEquivalences(JSON.parse(text));
  } catch {
    return null;
  }
}

/** The last valid download kept on the device; an unreadable one falls back to the embedded copy. */
function readDownloaded(): EquivalencesFile | null {
  try {
    return parseText(Storage.getItemSync(FILE_KEY));
  } catch (error) {
    console.warn('Équivalences téléchargées illisibles sur l’appareil', error);
    return null;
  }
}

function readDownloadedAt(): number | null {
  try {
    const raw = Storage.getItemSync(DOWNLOADED_AT_KEY);
    const ms = raw ? Number(raw) : NaN;
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

async function save(key: string, value: string) {
  try {
    await Storage.setItemAsync(key, value);
  } catch (error) {
    console.warn('Équivalences non enregistrées sur l’appareil', error);
  }
}

// Read synchronously once, so the first screens already use the last download.
let current: EquivalencesFile = currentEquivalences(readDownloaded());
const listeners = new Set<() => void>();

/** Called each time a download replaces the equivalences in use. */
export function subscribeToEquivalences(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The equivalences in use: the last valid download, or the copy shipped with the app. */
export function getEquivalences(): EquivalencesFile {
  return current;
}

/** The body of the « raw » file, or `null` when it could not be fetched. */
async function fetchText(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(EQUIVALENCES_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`Équivalences non téléchargées (HTTP ${response.status})`);
      return null;
    }
    // Reading the body stays under the timeout too.
    return await response.text();
  } catch (error) {
    console.warn('Équivalences non téléchargées', error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function download(nowMs: number) {
  if (!isDownloadDue(readDownloadedAt(), nowMs)) return;
  // Without network nothing is recorded: the next launch tries again.
  const text = await fetchText();
  if (text === null) return;

  const file = parseText(text);
  if (file) {
    await save(FILE_KEY, text);
    current = currentEquivalences(file);
    listeners.forEach((listener) => listener());
  } else {
    console.warn('Équivalences téléchargées invalides : la version précédente est conservée');
  }
  // A file was received, valid or not: no new download before a day.
  await save(DOWNLOADED_AT_KEY, String(nowMs));
}

let refresh: Promise<void> | null = null;

/**
 * Downloads the latest file at launch, at most once a day. A valid file replaces the one in use
 * and is kept for the next launches; an invalid one is ignored. Runs once per app process.
 */
export function refreshEquivalences(nowMs: number = Date.now()): Promise<void> {
  refresh ??= download(nowMs);
  return refresh;
}

/** The equivalences in use; screens re-render when a download replaces them. */
export function useEquivalences(): EquivalencesFile {
  return useSyncExternalStore(subscribeToEquivalences, getEquivalences);
}
