import { useNetworkState } from 'expo-network';
import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { LABEL } from '@/lib/theme';

/** Offline only when the phone says so: an unknown state counts as online. */
export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected === false || isInternetReachable === false;
}

/** Ink band of the « 06 · Historique hors ligne » mockup. */
export function OfflineBanner() {
  return (
    <View role="status" className="bg-ink flex-row items-center gap-3 px-3.5 py-3">
      <WifiOff color={LABEL.paper} size={22} strokeWidth={2} />
      <Text className="font-body text-paper flex-1 text-sm leading-[19px]">
        <Text className="font-body-bold text-paper text-sm">Hors ligne.</Text> Les fiches déjà
        consultées restent disponibles.
      </Text>
    </View>
  );
}
