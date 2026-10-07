import type { BarcodeScanningResult } from 'expo-camera';

/** The viewfinder, in the camera view's coordinates (dp), like the scan results. */
export interface ScanWindow {
  x: number;
  y: number;
  width: number;
  height: number;
}

type BarcodeGeometry = Pick<BarcodeScanningResult, 'cornerPoints' | 'bounds'>;

/** Center of the detected code: mean of its corner points, else of its bounds; `null` if none. */
export function barcodeCenter({ cornerPoints, bounds }: BarcodeGeometry): { x: number; y: number } | null {
  if (cornerPoints?.length) {
    const sum = cornerPoints.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), {
      x: 0,
      y: 0,
    });
    return { x: sum.x / cornerPoints.length, y: sum.y / cornerPoints.length };
  }
  if (bounds && bounds.size.width > 0 && bounds.size.height > 0) {
    return {
      x: bounds.origin.x + bounds.size.width / 2,
      y: bounds.origin.y + bounds.size.height / 2,
    };
  }
  return null;
}

/**
 * The camera analyses the whole picture; only a code aimed at — its center inside the
 * viewfinder — may open a sheet, so a code held close can still overflow the corners.
 */
export function isInScanWindow(result: BarcodeGeometry, window: ScanWindow | null): boolean {
  // Not measured yet: only the very first frames.
  if (!window) return false;
  const center = barcodeCenter(result);
  // No geometry (never the case for EAN/UPC on Android and iOS): do not break scanning.
  if (!center) return true;
  return (
    center.x >= window.x &&
    center.x <= window.x + window.width &&
    center.y >= window.y &&
    center.y <= window.y + window.height
  );
}
