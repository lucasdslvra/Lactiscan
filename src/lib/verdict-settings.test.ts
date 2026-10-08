import { describe, expect, it } from '@jest/globals';

import type { VerdictSettings } from '@/lib/verdict';
import { parseVerdictSettings, serializeVerdictSettings } from '@/lib/verdict-settings';

describe('parseVerdictSettings', () => {
  it('reads back saved settings', () => {
    const settings: VerdictSettings = { mode: 'strict', excludeTraces: true };
    expect(parseVerdictSettings(serializeVerdictSettings(settings))).toEqual(settings);
  });

  it('reads the lactose-free mode', () => {
    expect(parseVerdictSettings('{"mode":"lactose-free","excludeTraces":false}')).toEqual({
      mode: 'lactose-free',
      excludeTraces: false,
    });
  });

  it.each([null, undefined, ''])('treats %p as « not chosen »', (raw) => {
    expect(parseVerdictSettings(raw)).toBeNull();
  });

  it.each(['{', 'null', '"strict"', '[]', '{"mode":"vegan"}', '{"excludeTraces":true}'])(
    'never guesses a mode from %s',
    (raw) => {
      expect(parseVerdictSettings(raw)).toBeNull();
    }
  );

  it('keeps the traces option off unless it was explicitly on', () => {
    expect(parseVerdictSettings('{"mode":"strict"}')).toEqual({
      mode: 'strict',
      excludeTraces: false,
    });
    expect(parseVerdictSettings('{"mode":"strict","excludeTraces":"yes"}')).toEqual({
      mode: 'strict',
      excludeTraces: false,
    });
  });
});
