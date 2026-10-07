import type { VerdictSettings } from '@/lib/verdict';

// Until the profile is chosen and persisted (US-13, US-15), every verdict uses the most
// cautious profile: « Sans lait strict ».
const DEFAULT_SETTINGS: VerdictSettings = { mode: 'strict', excludeTraces: false };

/** The user's verdict profile; the only place screens read it from. */
export function useVerdictSettings(): VerdictSettings {
  return DEFAULT_SETTINGS;
}
