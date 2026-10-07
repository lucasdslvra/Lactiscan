import { describe, expect, it } from '@jest/globals';

import { TEXT_PAIRS } from '@/lib/theme';

/** WCAG 2.x relative luminance of a `#RRGGBB` color. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('« Étiquette » colors', () => {
  it.each(Object.entries(TEXT_PAIRS))('%s meets WCAG AA for body text', (_name, [text, ground]) => {
    expect(contrast(text, ground)).toBeGreaterThanOrEqual(4.5);
  });
});
