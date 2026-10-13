import { describe, expect, it } from '@jest/globals';

import {
  MAX_HISTORY,
  dayTitle,
  formatTime,
  groupByDay,
  historyCountLabel,
  parseHistory,
  recordView,
  type HistoryEntry,
} from '@/lib/history';
import type { OffProduct } from '@/lib/off';

// Local times, so the tests hold in any time zone.
const at = (day: number, hours: number, minutes = 0) =>
  new Date(2026, 9, day, hours, minutes).getTime();
const NOW = at(13, 11);

const product = (code: string, name = code): OffProduct => ({ code, product_name: name });
const entry = (code: string, viewedAt: number): HistoryEntry => ({
  code,
  viewedAt,
  product: product(code),
});

describe('recordView', () => {
  it('adds the product on top', () => {
    const history = recordView([entry('a', at(13, 9))], product('b'), NOW);
    expect(history.map((item) => item.code)).toEqual(['b', 'a']);
    expect(history[0]).toEqual({ code: 'b', viewedAt: NOW, product: product('b') });
  });

  it('moves a product seen again to the top with its latest sheet', () => {
    const history = recordView(
      [entry('a', at(13, 10)), entry('b', at(13, 9))],
      product('b', 'Nouveau nom'),
      NOW
    );
    expect(history.map((item) => item.code)).toEqual(['b', 'a']);
    expect(history[0]?.product.product_name).toBe('Nouveau nom');
  });

  it(`keeps the ${MAX_HISTORY} most recent products`, () => {
    let history: HistoryEntry[] = [];
    for (let index = 0; index < MAX_HISTORY + 5; index++) {
      history = recordView(history, product(String(index)), index);
    }
    expect(history).toHaveLength(MAX_HISTORY);
    expect(history[0]?.code).toBe(String(MAX_HISTORY + 4));
    expect(history.at(-1)?.code).toBe('5');
  });
});

describe('parseHistory', () => {
  it('reads back what was saved', () => {
    const history = [entry('a', at(13, 9))];
    expect(parseHistory(JSON.stringify(history))).toEqual(history);
  });

  it('drops unreadable entries', () => {
    const raw = JSON.stringify([
      entry('a', 1),
      { code: 'b', viewedAt: 'hier', product: product('b') },
      { code: 'c', viewedAt: 1, product: product('autre') },
      null,
    ]);
    expect(parseHistory(raw).map((item) => item.code)).toEqual(['a']);
  });

  it('starts empty without a readable value', () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory('{')).toEqual([]);
    expect(parseHistory('{"a":1}')).toEqual([]);
  });
});

describe('dayTitle', () => {
  it('names today and yesterday', () => {
    expect(dayTitle(at(13, 0, 5), NOW)).toBe("AUJOURD'HUI");
    expect(dayTitle(at(12, 23, 59), NOW)).toBe('HIER');
  });

  it('gives the date of older days, with the year only when it differs', () => {
    expect(dayTitle(at(9, 18), NOW)).toBe('VENDREDI 9 OCTOBRE');
    const lastYear = new Date(2025, 11, 31, 12).getTime();
    expect(dayTitle(lastYear, NOW)).toBe('MERCREDI 31 DÉCEMBRE 2025');
  });

  it('knows yesterday across a month change', () => {
    expect(dayTitle(new Date(2026, 8, 30, 20).getTime(), at(1, 8))).toBe('HIER');
  });
});

describe('groupByDay', () => {
  it('groups by day, most recent first', () => {
    const sections = groupByDay(
      [
        entry('old', at(9, 18)),
        entry('a', at(13, 10, 39)),
        entry('y', at(12, 18)),
        entry('b', at(13, 10, 42)),
      ],
      NOW
    );
    const summary = sections.map(({ title, entries }) => [title, entries.map((item) => item.code)]);
    expect(summary).toEqual([
      ["AUJOURD'HUI", ['b', 'a']],
      ['HIER', ['y']],
      ['VENDREDI 9 OCTOBRE', ['old']],
    ]);
  });

  it('has no section without history', () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });
});

describe('formatTime', () => {
  it('shows hours and minutes on two digits', () => {
    expect(formatTime(at(13, 9, 5))).toBe('09:05');
    expect(formatTime(at(13, 17, 58))).toBe('17:58');
  });
});

describe('historyCountLabel', () => {
  it('agrees with the number', () => {
    expect(historyCountLabel(0)).toBe('0 FICHE');
    expect(historyCountLabel(1)).toBe('1 FICHE');
    expect(historyCountLabel(6)).toBe('6 FICHES');
  });
});
