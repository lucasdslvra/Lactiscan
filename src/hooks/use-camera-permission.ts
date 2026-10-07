import { useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Camera permission for the scan screen.
 * - Asked by the system the first time the screen is shown (status `undetermined`).
 * - Re-read whenever the app comes back to the foreground: the expo-camera hook only reads
 *   it on mount, so without this a permission granted in the system settings would go unseen.
 */
export function useCameraPermission() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const askedRef = useRef(false);

  // A failed request (native error, browser without camera access…) must not leave the
  // status stuck: fall back to reading it.
  const request = useCallback(async () => {
    try {
      return await requestPermission();
    } catch {
      return getPermission();
    }
  }, [requestPermission, getPermission]);

  useEffect(() => {
    if (!isFocused || askedRef.current) return;
    if (permission?.status === 'undetermined' && permission.canAskAgain) {
      askedRef.current = true;
      request().catch(() => {});
    }
  }, [isFocused, permission, request]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') getPermission().catch(() => {});
    });
    return () => subscription.remove();
  }, [getPermission]);

  return {
    /** `null` while the current status is being read. */
    permission,
    request,
    /** Opens this app's page in the system settings. */
    openSettings: () => Linking.openSettings(),
  };
}
