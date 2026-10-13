import {
  experimental_createQueryPersister,
  type AsyncStorage,
} from '@tanstack/query-persist-client-core';
import Storage from 'expo-sqlite/kv-store';

import { offKeys } from '@/lib/off';

const DAY = 24 * 60 * 60 * 1000;

/** How long a product sheet or a search stays available offline after it was loaded. */
export const CACHE_MAX_AGE_MS = 30 * DAY;

const PREFIX = 'off-cache';

/**
 * The device storage under the interface the persister expects. A failed write only costs the
 * offline copy: the answer is still shown. `entries` reads the cache's own keys only, not the
 * profile, history or equivalences kept in the same storage.
 */
const storage: AsyncStorage = {
  getItem: (key) => Storage.getItemAsync(key),
  setItem: async (key, value) => {
    try {
      await Storage.setItemAsync(key, value);
    } catch (error) {
      console.warn('Fiche non enregistrée pour le hors ligne', error);
    }
  },
  removeItem: async (key) => {
    await Storage.removeItemAsync(key);
  },
  entries: async () => {
    const keys = (await Storage.getAllKeysAsync()).filter((key) => key.startsWith(`${PREFIX}-`));
    const pairs = await Storage.multiGet(keys);
    return pairs.filter((pair): pair is [string, string] => pair[1] !== null);
  },
};

/**
 * Every Open Food Facts answer (sheets, alternatives searches, parent categories) is kept on the
 * phone for {@link CACHE_MAX_AGE_MS}, each under its own key, and read back when a screen asks
 * for it: a product already consulted shows at once, offline too.
 */
export const queryPersister = experimental_createQueryPersister({
  storage,
  maxAge: CACHE_MAX_AGE_MS,
  prefix: PREFIX,
  // Change it when the shape of `OffProduct` changes: older copies are then ignored.
  buster: '1',
  filters: { queryKey: offKeys.all },
});
