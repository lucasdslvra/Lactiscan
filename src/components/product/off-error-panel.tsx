import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { OffClientError } from '@/lib/off';

/**
 * « Pas de connexion » / « Réessayez plus tard » ink panel with a retry button, for a failed
 * Open Food Facts request. `messages` says what could not be loaded in each case.
 */
export function OffErrorPanel({
  error,
  messages,
  onRetry,
}: {
  error: OffClientError;
  messages: { offline: string; unavailable: string };
  onRetry: () => void;
}) {
  const offline = error.kind === 'network' || error.kind === 'timeout';

  return (
    <View className="bg-ink gap-2 p-4">
      <View className="flex-row items-center gap-2">
        {offline && <Icon as={WifiOff} size={16} strokeWidth={2} className="text-paper" />}
        <Text className="font-mono text-paper text-[10px] tracking-[1.2px]">
          {offline ? 'HORS LIGNE' : 'SERVICE INDISPONIBLE'}
        </Text>
      </View>
      <Text className="font-display text-paper text-3xl uppercase leading-[27px]">
        {offline ? 'Pas de connexion' : 'Réessayez plus tard'}
      </Text>
      <Text className="font-body text-paper text-sm leading-[20px]">
        {offline ? messages.offline : messages.unavailable}
      </Text>
      <Button onPress={onRetry} className="border-paper bg-paper mt-1 h-11 rounded-none border-2">
        <Text className="font-body-bold text-ink text-sm font-normal">Réessayer</Text>
      </Button>
    </View>
  );
}
