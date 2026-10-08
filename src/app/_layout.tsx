import '../../global.css';

import {
  AtkinsonHyperlegibleMono_400Regular,
  AtkinsonHyperlegibleMono_600SemiBold,
} from '@expo-google-fonts/atkinson-hyperlegible-mono';
import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import {
  BigShouldersDisplay_800ExtraBold,
  BigShouldersDisplay_900Black,
} from '@expo-google-fonts/big-shoulders-display';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

import { useStoredVerdictSettings } from '@/hooks/use-verdict-settings';
import { queryClient } from '@/lib/query-client';
import { NAV_THEME } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  // No verdict is shown before the profile is chosen explicitly (US-13).
  const hasProfile = useStoredVerdictSettings() !== null;
  const scheme = colorScheme ?? 'light';
  // Keys are the family names used by `FONTS` and the `font-*` classes.
  const [fontsLoaded, fontError] = useFonts({
    BigShouldersDisplay_800ExtraBold,
    BigShouldersDisplay_900Black,
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleMono_400Regular,
    AtkinsonHyperlegibleMono_600SemiBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAV_THEME[scheme]}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Protected guard={!hasProfile}>
            <Stack.Screen name="profil" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={hasProfile}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="saisie" options={{ headerShown: false }} />
            <Stack.Screen name="produit/[code]" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
