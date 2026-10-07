import { describe, expect, it } from '@jest/globals';

import { barcodeCenter, isInScanWindow, type ScanWindow } from '@/lib/scan-window';

// 300×180 viewfinder centered on a 390 dp wide camera view.
const WINDOW: ScanWindow = { x: 45, y: 250, width: 300, height: 180 };
const NO_BOUNDS = { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } };

/** A code detected as a rectangle, with Android's corner order. */
function code(x: number, y: number, width: number, height: number) {
  return {
    cornerPoints: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
    bounds: { origin: { x, y }, size: { width, height } },
  };
}

describe('barcodeCenter', () => {
  it('averages the corner points', () => {
    expect(barcodeCenter(code(100, 300, 200, 80))).toEqual({ x: 200, y: 340 });
  });

  it('falls back to the bounds without corner points', () => {
    const { bounds } = code(100, 300, 200, 80);
    expect(barcodeCenter({ cornerPoints: [], bounds })).toEqual({ x: 200, y: 340 });
  });

  it('returns null without any geometry', () => {
    expect(barcodeCenter({ cornerPoints: [], bounds: NO_BOUNDS })).toBeNull();
  });
});

describe('isInScanWindow', () => {
  it('accepts a code aimed inside the viewfinder', () => {
    expect(isInScanWindow(code(100, 300, 200, 80), WINDOW)).toBe(true);
  });

  it.each([
    ['above', code(100, 60, 200, 80)],
    ['below', code(100, 520, 200, 80)],
    ['left', code(-150, 300, 160, 80)],
    ['right', code(360, 300, 160, 80)],
  ])('ignores a code %s the viewfinder', (_where, result) => {
    expect(isInScanWindow(result, WINDOW)).toBe(false);
  });

  it('accepts a code held close that overflows the corners', () => {
    expect(isInScanWindow(code(10, 220, 370, 240), WINDOW)).toBe(true);
  });

  it('ignores a code that only overlaps the edge', () => {
    // Center at y = 220, above the window, though its bottom reaches into it.
    expect(isInScanWindow(code(100, 180, 200, 80), WINDOW)).toBe(false);
  });

  it('uses the bounds when there are no corner points', () => {
    const { bounds } = code(100, 60, 200, 80);
    expect(isInScanWindow({ cornerPoints: [], bounds }, WINDOW)).toBe(false);
  });

  it('accepts a code without geometry rather than block scanning', () => {
    expect(isInScanWindow({ cornerPoints: [], bounds: NO_BOUNDS }, WINDOW)).toBe(true);
  });

  it('refuses everything until the viewfinder is measured', () => {
    expect(isInScanWindow(code(100, 300, 200, 80), null)).toBe(false);
  });
});
