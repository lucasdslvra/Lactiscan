import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/** How long a code must stay out of view before it can open its sheet again. */
const SAME_CODE_COOLDOWN_MS = 2000;

/**
 * Filters the camera's continuous stream of detections so that each product opens its sheet
 * once:
 * - after a code is accepted, nothing else goes through until the screen is focused again;
 * - the last accepted code is ignored for as long as it keeps being seen (every sighting
 *   restarts the cooldown), so coming back from the sheet with the product still in frame
 *   does not reopen it. Moving it away for a moment, or scanning another code, does.
 */
export function useScanGuard(onAccept: (code: string) => void) {
  const lockedRef = useRef(false);
  const lastRef = useRef<{ code: string; seenAt: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      lockedRef.current = false;
      // The camera was off while the screen was away: count from the return.
      if (lastRef.current) lastRef.current.seenAt = Date.now();
    }, [])
  );

  return useCallback(
    (code: string) => {
      const now = Date.now();
      const last = lastRef.current;
      const isLast = last?.code === code;

      if (isLast && (lockedRef.current || now - last.seenAt < SAME_CODE_COOLDOWN_MS)) {
        last.seenAt = now;
        return;
      }
      if (lockedRef.current) return;

      lockedRef.current = true;
      lastRef.current = { code, seenAt: now };
      onAccept(code);
    },
    [onAccept]
  );
}
