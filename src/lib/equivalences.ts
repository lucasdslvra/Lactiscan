import embedded from '@equivalences/equivalences.json';
import type {
  AutoProduct,
  EquivalencesFile,
  ManualEquivalence,
  Replacement,
} from '@equivalences/types';
import type { OffProduct } from '@/lib/off';
import { MODE_LABEL } from '@/lib/verdict';

export type { EquivalencesFile, ManualEquivalence, Replacement } from '@equivalences/types';

/*
 * `equivalences.json` and its format live in `equivalences/` (schema, generated types). The checks
 * below follow `equivalences.schema.json`, except that unknown fields are tolerated, so a file
 * written for a newer app still loads.
 */

const EMPTY: EquivalencesFile = { version: '', manual: [], auto: {} };

const VERSION = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

type FieldKind = 'string' | 'strings' | 'number';

// Every optional field of `AutoProduct`: a wrong type would break the verdict engine.
const PRODUCT_FIELDS: Record<Exclude<keyof AutoProduct, 'code'>, FieldKind> = {
  product_name: 'string',
  product_name_fr: 'string',
  brands: 'string',
  quantity: 'string',
  image_front_url: 'string',
  image_front_small_url: 'string',
  ingredients_text: 'string',
  ingredients_text_fr: 'string',
  allergens_tags: 'strings',
  traces_tags: 'strings',
  labels_tags: 'strings',
  categories: 'string',
  categories_tags: 'strings',
  states_tags: 'strings',
  nutriscore_grade: 'string',
  unique_scans_n: 'number',
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isTextList(value: unknown, { nonEmpty = false } = {}): value is string[] {
  return Array.isArray(value) && (!nonEmpty || value.length > 0) && value.every(isText);
}

function hasKind(value: unknown, kind: FieldKind): boolean {
  if (kind === 'number') return typeof value === 'number';
  if (kind === 'string') return typeof value === 'string';
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isProduct(value: unknown): value is AutoProduct {
  return (
    isObject(value) &&
    isText(value.code) &&
    Object.entries(PRODUCT_FIELDS).every(
      ([field, kind]) => value[field] === undefined || hasKind(value[field], kind)
    )
  );
}

function isReplacement(value: unknown): value is Replacement {
  return (
    isObject(value) &&
    isText(value.name) &&
    typeof value.mode === 'string' &&
    Object.hasOwn(MODE_LABEL, value.mode) &&
    (value.note === undefined || isText(value.note))
  );
}

function isManualEquivalence(value: unknown): value is ManualEquivalence {
  return (
    isObject(value) &&
    isText(value.id) &&
    isText(value.name) &&
    isTextList(value.synonyms, { nonEmpty: true }) &&
    isTextList(value.categoryTags) &&
    Array.isArray(value.replacements) &&
    value.replacements.length > 0 &&
    value.replacements.every(isReplacement)
  );
}

/** The file when its three parts have the expected shape, `null` otherwise. */
export function parseEquivalences(raw: unknown): EquivalencesFile | null {
  if (!isObject(raw)) return null;
  const { version, manual, auto } = raw;
  if (typeof version !== 'string' || !VERSION.test(version)) return null;
  if (!Array.isArray(manual) || !manual.every(isManualEquivalence)) return null;
  if (!isObject(auto)) return null;
  const categories = Object.values(auto);
  if (!categories.every((products) => Array.isArray(products) && products.every(isProduct))) {
    return null;
  }
  return { version, manual, auto: auto as EquivalencesFile['auto'] };
}

/** Copy shipped with the app, used until a downloaded version exists. */
export const EMBEDDED_EQUIVALENCES: EquivalencesFile = parseEquivalences(embedded) ?? EMPTY;

/** « raw » link of the file on the default branch, downloaded at launch. */
export const EQUIVALENCES_URL =
  'https://raw.githubusercontent.com/lucasdslvra/Lactiscan/main/equivalences/equivalences.json';

export const EQUIVALENCES_DOWNLOAD_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * At most one download a day: none yet, or the last one is a day old. A last download in the
 * future (the clock was set back) does not block downloads until that date.
 */
export function isDownloadDue(lastDownloadMs: number | null, nowMs: number): boolean {
  if (lastDownloadMs === null || lastDownloadMs > nowMs) return true;
  return nowMs - lastDownloadMs >= EQUIVALENCES_DOWNLOAD_INTERVAL_MS;
}

/**
 * File in use: the downloaded one, unless the app was updated with a newer embedded copy
 * (`AAAA-MM-JJ` versions sort as text). On the same date the download wins: it may hold a fix
 * made that day.
 */
export function currentEquivalences(
  downloaded: EquivalencesFile | null,
  embeddedCopy: EquivalencesFile = EMBEDDED_EQUIVALENCES
): EquivalencesFile {
  return downloaded && downloaded.version >= embeddedCopy.version ? downloaded : embeddedCopy;
}

/** `auto` products of each category, in the order of the tags given. */
export function equivalenceProducts(
  file: EquivalencesFile,
  categoryTags: readonly (string | null | undefined)[]
): OffProduct[] {
  return categoryTags.flatMap((tag) => (tag ? (file.auto[tag] ?? []) : []));
}
