import { useIsFocused, useNavigation } from 'expo-router';
import type { NavigationProp, NavigationState, ParamListBase } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';

/** Events the native stack sends to the screen whose transition it animates. */
type StackTransitionEvents = { transitionEnd: { data: { closing: boolean } } };
type ParentStack = NavigationProp<
  ParamListBase,
  string,
  string | undefined,
  NavigationState,
  object,
  StackTransitionEvents
>;

// In case `transitionEnd` never comes (web, no animation): the back animation lasts ~350 ms.
const TRANSITION_FALLBACK_MS = 800;

/**
 * Whether this tab is focused and no stack screen is still sliding over it.
 *
 * Focus comes back as soon as the product sheet starts closing. Mounting expo-camera then lays
 * its Android preview out mid-animation: the preview keeps a transient size (half black, the
 * rest stretched) since expo-camera only lays it out again when the view size changes. Waiting
 * for the end of the transition gives the camera its final layout from the start.
 */
export function useSettledFocus(): boolean {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  // Set when a stack screen (sheet, manual entry) covers the tabs; cleared once it is gone.
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const stack = navigation.getParent<ParentStack | undefined>();
    if (!stack) return;
    const unsubscribeBlur = stack.addListener('blur', () => setCovered(true));
    const unsubscribeEnd = stack.addListener('transitionEnd', (event) => {
      if (!event.data.closing) setCovered(false);
    });
    return () => {
      unsubscribeBlur();
      unsubscribeEnd();
    };
  }, [navigation]);

  useEffect(() => {
    if (!isFocused || !covered) return;
    const timeout = setTimeout(() => setCovered(false), TRANSITION_FALLBACK_MS);
    return () => clearTimeout(timeout);
  }, [isFocused, covered]);

  return isFocused && !covered;
}
