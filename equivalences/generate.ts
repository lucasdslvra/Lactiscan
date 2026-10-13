// Regenerates `auto` (and `version`) of equivalences.json from Open Food Facts: for each category
// of `manual`, the most scanned products sold in France that each profile of the app accepts.
// `manual` is never touched.
// A category Open Food Facts does not answer for keeps its previous list, with a warning. An
// empty category, or more than half the categories unanswered, fails without writing anything.
//   npx tsx generate.ts [file]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { searchProducts } from '../src/lib/off/client';
import { OFF_USER_AGENT } from '../src/lib/off/config';
import type { OffClientError } from '../src/lib/off/errors';
import {
  autoCategories,
  cleanProduct,
  needsMoreProducts,
  selectAutoProducts,
  todayInParis,
  updateFileText,
  type AutoProductSchema,
  type AutoSelection,
} from './auto';
import type { AutoProduct, EquivalencesFile } from './types';

// Search is limited to 10 requests a minute: one every 7 s stays under it, retries included.
const DELAY_MS = 7_000;
// OFF search often answers 503 under load: wait longer and insist more before giving up.
const RETRY_DELAY_MS = 30_000;
const ATTEMPTS = 5;
const PAGE_SIZE = 100;
// Further pages only while the « traces exclues » profile has too few products.
const MAX_PAGES = 3;
const TIMEOUT_MS = 30_000;

const here = (name: string) => fileURLToPath(new URL(name, import.meta.url));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Both are shown as annotations on the GitHub Actions run.
function fail(message: string) {
  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
}

function warn(message: string) {
  console.warn(process.env.GITHUB_ACTIONS ? `::warning::${message}` : message);
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

/** One page of search results, retried on network errors, timeouts, 429 and 5xx. */
async function searchPage(categoryTag: string, page: number): Promise<unknown[]> {
  for (let attempt = 1; ; attempt++) {
    try {
      const { products } = await searchProducts(
        {
          categoryTag,
          countryTag: 'en:france',
          sortBy: 'unique_scans_n',
          page,
          pageSize: PAGE_SIZE,
        },
        { timeoutMs: TIMEOUT_MS }
      );
      return products;
    } catch (error) {
      if (attempt >= ATTEMPTS || !isRetryable(error)) throw error;
      const wait = `nouvel essai dans ${RETRY_DELAY_MS / 1000} s`;
      console.warn(`${categoryTag} page ${page} : ${(error as Error).message}, ${wait}`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

let requests = 0;

/** Waits between two requests, so the whole run stays under the search rate limit. */
async function throttled(categoryTag: string, page: number): Promise<unknown[]> {
  if (requests++ > 0) await sleep(DELAY_MS);
  return searchPage(categoryTag, page);
}

/**
 * Products of one category for the three profiles. The first page must answer; the next ones,
 * fetched while « traces exclues » is short, only complete it: a failure there keeps what was
 * found and is reported as a warning.
 */
async function categoryProducts(
  categoryTag: string
): Promise<{ selection: AutoSelection; pages: number }> {
  const found: AutoProduct[] = [];
  let page = 1;
  let results = await throttled(categoryTag, page);
  for (;;) {
    for (const raw of results) {
      const product = cleanProduct(raw, schema);
      if (product) found.push(product);
    }
    const selection = selectAutoProducts(found);
    if (!needsMoreProducts(selection) || results.length < PAGE_SIZE || page >= MAX_PAGES) {
      return { selection, pages: page };
    }
    page++;
    try {
      results = await throttled(categoryTag, page);
    } catch (error) {
      console.warn(`${categoryTag} page ${page} ignorée : ${(error as Error).message}`);
      return { selection, pages: page - 1 };
    }
  }
}

const path = process.argv[2] ?? here('equivalences.json');
const schemaText = await readFile(here('equivalences.schema.json'), 'utf8');
const schema = JSON.parse(schemaText) as AutoProductSchema;
const text = await readFile(path, 'utf8');
const { manual, auto: previous } = JSON.parse(text) as EquivalencesFile;
const categories = autoCategories(manual);

console.log(`User-Agent : ${OFF_USER_AGENT}`);
const auto: Record<string, AutoProduct[]> = {};
const errors: string[] = [];
const unanswered: string[] = [];

for (const categoryTag of categories) {
  try {
    const { selection, pages } = await categoryProducts(categoryTag);
    const counts = Object.entries(selection.counts)
      .map(([profile, count]) => `${profile} ${count}`)
      .join(', ');
    console.log(
      `${categoryTag} : ${selection.products.length} produits (${counts}), ${pages} page(s)`
    );
    if (selection.products.length === 0) {
      errors.push(`${categoryTag} : aucun produit compatible avec un profil`);
    }
    auto[categoryTag] = selection.products;
  } catch (error) {
    // OFF is often overloaded: the last good list of the category stays until the next run.
    unanswered.push(categoryTag);
    const kept = previous[categoryTag];
    if (kept) auto[categoryTag] = kept;
    warn(
      `${categoryTag} : ${(error as Error).message}, ` +
        (kept ? `ancienne liste conservée (${kept.length} produits)` : 'catégorie laissée vide')
    );
  }
}

// Beyond half, Open Food Facts is down rather than overloaded: nothing is written.
if (unanswered.length * 2 > categories.length) {
  errors.push(
    `${unanswered.length} catégories sur ${categories.length} sans réponse d'Open Food Facts`
  );
}

if (errors.length > 0) {
  errors.forEach(fail);
  fail(`${path} : non modifié (${errors.length} erreur(s))`);
  process.exit(1);
}

const updated = updateFileText(text, auto, todayInParis(new Date()));
if (updated === null) {
  console.log(`${path} : auto inchangé, fichier non modifié`);
} else {
  await writeFile(path, updated);
  const stale = unanswered.length > 0 ? `, ${unanswered.length} catégorie(s) non à jour` : '';
  console.log(`${path} : auto régénéré, version ${JSON.parse(updated).version}${stale}`);
}
