// Regenerates `auto` (and `version`) of equivalences.json from Open Food Facts: for each category
// of `manual`, the most scanned milk-free products sold in France. `manual` is never touched.
// Any OFF error or empty category fails without writing anything.
//   npx tsx generate.ts [file]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { searchProducts } from '../src/lib/off/client';
import { OFF_USER_AGENT } from '../src/lib/off/config';
import type { OffClientError } from '../src/lib/off/errors';
import {
  autoCategories,
  cleanProduct,
  selectAutoProducts,
  todayInParis,
  updateFileText,
  type AutoProductSchema,
} from './auto';
import type { AutoProduct, EquivalencesFile } from './types';

// Search is limited to 10 requests a minute: one every 7 s stays under it, retries included.
const DELAY_MS = 7_000;
const RETRY_DELAY_MS = 20_000;
const ATTEMPTS = 3;
const PAGE_SIZE = 100;
const TIMEOUT_MS = 30_000;

const here = (name: string) => fileURLToPath(new URL(name, import.meta.url));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message: string) {
  // Shown as an annotation on the GitHub Actions run.
  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
}

/**
 * Same rule as `isRetryableOffError` of the app: network error, timeout, 429 or 5xx. Read from
 * the `kind` field, since `instanceof` fails here: tsx loads errors.ts twice (once for this ESM
 * script, once for the client), so the client's error classes are not the ones imported here.
 */
function isRetryable(error: unknown): boolean {
  const { kind, status } = (error ?? {}) as Partial<OffClientError> & { status?: number };
  if (kind === 'network' || kind === 'timeout') return true;
  return kind === 'http' && status !== undefined && (status === 429 || status >= 500);
}

/** Search results of one category, retried on network errors, timeouts, 429 and 5xx. */
async function search(categoryTag: string): Promise<unknown[]> {
  for (let attempt = 1; ; attempt++) {
    try {
      const { products } = await searchProducts(
        { categoryTag, countryTag: 'en:france', sortBy: 'unique_scans_n', pageSize: PAGE_SIZE },
        { timeoutMs: TIMEOUT_MS }
      );
      return products;
    } catch (error) {
      if (attempt >= ATTEMPTS || !isRetryable(error)) throw error;
      console.warn(`${categoryTag} : ${(error as Error).message}, nouvel essai dans 20 s`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

const path = process.argv[2] ?? here('equivalences.json');
const schema = JSON.parse(await readFile(here('equivalences.schema.json'), 'utf8')) as AutoProductSchema;
const text = await readFile(path, 'utf8');
const { manual } = JSON.parse(text) as EquivalencesFile;
const categories = autoCategories(manual);

console.log(`User-Agent : ${OFF_USER_AGENT}`);
const auto: Record<string, AutoProduct[]> = {};
const errors: string[] = [];

for (const [index, categoryTag] of categories.entries()) {
  if (index > 0) await sleep(DELAY_MS);
  try {
    const found = (await search(categoryTag))
      .map((raw) => cleanProduct(raw, schema))
      .filter((product) => product !== null);
    const kept = selectAutoProducts(found);
    console.log(`${categoryTag} : ${kept.length} produits sans lait sur ${found.length} trouvés`);
    if (kept.length === 0) errors.push(`${categoryTag} : aucun produit sans lait`);
    auto[categoryTag] = kept;
  } catch (error) {
    errors.push(`${categoryTag} : ${(error as Error).message}`);
  }
}

if (errors.length > 0) {
  errors.forEach(fail);
  fail(`${path} : non modifié (${errors.length} catégorie(s) en échec)`);
  process.exit(1);
}

const updated = updateFileText(text, auto, todayInParis(new Date()));
if (updated === null) {
  console.log(`${path} : auto inchangé, fichier non modifié`);
} else {
  await writeFile(path, updated);
  console.log(`${path} : auto régénéré, version ${JSON.parse(updated).version}`);
}
