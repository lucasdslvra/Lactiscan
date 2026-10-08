import type { MilkMode, VerdictSettings } from '@/lib/verdict';

const MODES: readonly MilkMode[] = ['lactose-free', 'strict'];

export function serializeVerdictSettings(settings: VerdictSettings): string {
  return JSON.stringify(settings);
}

/**
 * Settings saved on the device, or `null` when none were chosen yet. A value that cannot be
 * read back (corrupt, older shape, unknown mode) is treated as « not chosen »: the profile
 * screen asks again rather than guessing a mode.
 */
export function parseVerdictSettings(raw: string | null | undefined): VerdictSettings | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { mode, excludeTraces } = value as Record<string, unknown>;
  if (!MODES.includes(mode as MilkMode)) return null;
  return { mode: mode as MilkMode, excludeTraces: excludeTraces === true };
}
