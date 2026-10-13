// Pure part of the `auto` generation (generate.ts): which categories, which products, and how
// the file text is rewritten so that everything but `version` and `auto` stays byte for byte.
import type { OffProduct } from '../src/lib/off/types';
import { evaluateVerdict, type VerdictSettings } from '../src/lib/verdict';
import type { AutoProduct, EquivalencesFile, ManualEquivalence } from './types';

/** Products kept per category: the app shows 5 in Consultation and up to 10 alternatives. */
export const AUTO_PRODUCTS_PER_CATEGORY = 10;

// Milk-free sheets, traces allowed: the app drops those itself when « traces exclues » is on.
const MILK_FREE: VerdictSettings = { mode: 'strict', excludeTraces: false };

/** Categories of every `manual` entry, once each, in order of appearance. */
export function autoCategories(manual: readonly ManualEquivalence[]): string[] {
  return [...new Set(manual.flatMap((entry) => entry.categoryTags))];
}

/**
 * The most scanned products the app's verdict engine reads as milk-free: an incomplete sheet or
 * a product containing milk never makes it into the file.
 */
export function selectAutoProducts(products: readonly AutoProduct[]): AutoProduct[] {
  const seen = new Set<string>();
  return products
    .filter((product) => {
      if (seen.has(product.code)) return false;
      seen.add(product.code);
      return evaluateVerdict(product as OffProduct, MILK_FREE).acceptable;
    })
    .sort((a, b) => (b.unique_scans_n ?? 0) - (a.unique_scans_n ?? 0))
    .slice(0, AUTO_PRODUCTS_PER_CATEGORY);
}

interface PropertySchema {
  type?: string;
  items?: { type?: string };
}

/** The part of `equivalences.schema.json` read here. */
export interface AutoProductSchema {
  definitions: { AutoProduct: { properties: Record<string, PropertySchema> } };
}

function matches(value: unknown, { type, items }: PropertySchema): boolean {
  if (type === 'string') return typeof value === 'string';
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'array') {
    return Array.isArray(value) && value.every((item) => matches(item, items ?? {}));
  }
  return false;
}

/**
 * The fields of the schema's `AutoProduct`, in its order, when OFF gave them the expected type.
 * A `null` or an odd value is left out instead of failing the whole file; `null` without a code.
 */
export function cleanProduct(raw: unknown, schema: AutoProductSchema): AutoProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const source = raw as Record<string, unknown>;
  const product: Record<string, unknown> = {};
  for (const [field, property] of Object.entries(schema.definitions.AutoProduct.properties)) {
    if (matches(source[field], property)) product[field] = source[field];
  }
  return typeof product.code === 'string' && product.code.length > 0
    ? (product as unknown as AutoProduct)
    : null;
}

/** Index just past the string starting at `start` (on its opening quote). */
function stringEnd(text: string, start: number): number {
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === '\\') i++;
    else if (text[i] === '"') return i + 1;
  }
  throw new Error('JSON invalide : chaîne non terminée');
}

function skipSpaces(text: string, index: number): number {
  while (/\s/.test(text[index] ?? '')) index++;
  return index;
}

/** Index just past the JSON value starting at `start`. */
function valueEnd(text: string, start: number): number {
  const first = text[start];
  if (first === '"') return stringEnd(text, start);
  if (first !== '{' && first !== '[') {
    let i = start;
    while (i < text.length && !/[\s,}\]]/.test(text[i]!)) i++;
    return i;
  }
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === '"') i = stringEnd(text, i) - 1;
    else if (char === '{' || char === '[') depth++;
    else if ((char === '}' || char === ']') && --depth === 0) return i + 1;
  }
  throw new Error('JSON invalide : objet ou tableau non fermé');
}

/** Where the value of `key` of the top-level object sits in the text, `null` without that key. */
export function topLevelValueSpan(text: string, key: string): { start: number; end: number } | null {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      const end = stringEnd(text, i);
      const colon = skipSpaces(text, end);
      if (depth === 1 && text[colon] === ':' && JSON.parse(text.slice(i, end)) === key) {
        const start = skipSpaces(text, colon + 1);
        return { start, end: valueEnd(text, start) };
      }
      i = end - 1;
    } else if (char === '{' || char === '[') depth++;
    else if (char === '}' || char === ']') depth--;
  }
  return null;
}

/**
 * The text with the value of the top-level `key` replaced by `value`, written with 2-space
 * indentation at the key's level. Everything else is copied untouched.
 */
export function replaceTopLevelValue(text: string, key: string, value: unknown): string {
  const span = topLevelValueSpan(text, key);
  if (!span) throw new Error(`Clé « ${key} » absente du fichier`);
  const lineStart = text.lastIndexOf('\n', span.start) + 1;
  const indent = /^[ \t]*/.exec(text.slice(lineStart))![0];
  const json = JSON.stringify(value, null, 2).replace(/\n/g, `\n${indent}`);
  return text.slice(0, span.start) + json + text.slice(span.end);
}

function manualText(text: string): string {
  const span = topLevelValueSpan(text, 'manual');
  if (!span) throw new Error('Clé « manual » absente du fichier');
  return text.slice(span.start, span.end);
}

/**
 * The file text with the new `auto` and `version` = `today`, or `null` when `auto` did not
 * change (the version then stays, so nothing is committed). Throws if `manual` would not stay
 * byte for byte the same.
 */
export function updateFileText(
  text: string,
  auto: EquivalencesFile['auto'],
  today: string
): string | null {
  const current = JSON.parse(text) as EquivalencesFile;
  if (JSON.stringify(current.auto) === JSON.stringify(auto)) return null;

  const updated = replaceTopLevelValue(
    replaceTopLevelValue(text, 'auto', auto),
    'version',
    today
  );
  if (manualText(updated) !== manualText(text)) {
    throw new Error('La partie manual a changé : fichier non écrit');
  }
  return updated;
}

/** `AAAA-MM-JJ` of the given instant in France, the date shown in the app's « À propos ». */
export function todayInParis(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((candidate) => candidate.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
