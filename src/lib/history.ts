import type { OffProduct } from '@/lib/off';

/** Longest history kept on the phone; the oldest products drop off first. */
export const MAX_HISTORY = 100;

/**
 * One product consulted. A copy of the sheet is kept with it, so the row shows its photo, name
 * and verdict, and opens offline, even once the 30-day cache has let it go.
 */
export interface HistoryEntry {
  code: string;
  /** When the sheet was last shown, in ms. */
  viewedAt: number;
  product: OffProduct;
}

/** The product moved to the top with its latest sheet; the same code is never listed twice. */
export function recordView(
  history: readonly HistoryEntry[],
  product: OffProduct,
  nowMs: number
): HistoryEntry[] {
  const others = history.filter((entry) => entry.code !== product.code);
  return [{ code: product.code, viewedAt: nowMs, product }, ...others].slice(0, MAX_HISTORY);
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { code, viewedAt, product } = value as Record<string, unknown>;
  return (
    typeof code === 'string' &&
    code.length > 0 &&
    typeof viewedAt === 'number' &&
    Number.isFinite(viewedAt) &&
    typeof product === 'object' &&
    product !== null &&
    (product as { code?: unknown }).code === code
  );
}

/** History saved on the device; unreadable entries are dropped, unreadable storage gives `[]`. */
export function parseHistory(raw: string | null | undefined): HistoryEntry[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export interface HistorySection {
  title: string;
  entries: HistoryEntry[];
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const WEEKDAY_DAY_MONTH = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const WITH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** `AUJOURD'HUI`, `HIER`, then `LUNDI 12 OCTOBRE` (with the year when it is not this one). */
export function dayTitle(viewedAtMs: number, nowMs: number): string {
  const day = new Date(viewedAtMs);
  const today = new Date(nowMs);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dayKey(day) === dayKey(today)) return "AUJOURD'HUI";
  if (dayKey(day) === dayKey(yesterday)) return 'HIER';
  const format = day.getFullYear() === today.getFullYear() ? WEEKDAY_DAY_MONTH : WITH_YEAR;
  return format.format(day).toLocaleUpperCase('fr-FR');
}

/** Entries by day of the phone's calendar, most recent first. */
export function groupByDay(history: readonly HistoryEntry[], nowMs: number): HistorySection[] {
  const sections: HistorySection[] = [];
  const byDay = new Map<string, HistorySection>();
  for (const entry of [...history].sort((a, b) => b.viewedAt - a.viewedAt)) {
    const key = dayKey(new Date(entry.viewedAt));
    let section = byDay.get(key);
    if (!section) {
      section = { title: dayTitle(entry.viewedAt, nowMs), entries: [] };
      byDay.set(key, section);
      sections.push(section);
    }
    section.entries.push(entry);
  }
  return sections;
}

/** `10:42`, in the phone's time zone. */
export function formatTime(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `0 FICHE`, `1 FICHE`, `6 FICHES`. */
export function historyCountLabel(count: number): string {
  return `${count} ${count > 1 ? 'FICHES' : 'FICHE'}`;
}
