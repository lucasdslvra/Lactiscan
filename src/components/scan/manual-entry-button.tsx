import { router } from 'expo-router';
import { Keyboard } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Outlined « Saisir le code à la main » button, shared by the scanner and the denied state. */
export function ManualEntryButton() {
  return (
    <Button
      variant="ghost"
      className="border-ink h-[52px] gap-2.5 rounded-none border-2 bg-transparent"
      onPress={() => router.push('/saisie')}>
      <Icon as={Keyboard} size={22} className="text-ink" />
      {/* `font-normal` drops the button's `font-medium`: on Android a weight on a custom
          font falls back to the system font. */}
      <Text className="font-body-bold text-ink text-base font-normal">Saisir le code à la main</Text>
    </Button>
  );
}
