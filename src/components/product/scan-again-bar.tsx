import { router } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Back to the scan tab, whether the sheet was opened from the camera or a typed code. */
export function scanAnotherProduct() {
  router.dismissTo('/scan');
}

/** Bottom bar of the product sheet, always in reach of the thumb. */
export function ScanAgainBar() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-ink bg-paper border-t-2 px-4 pt-3"
      style={{ paddingBottom: insets.bottom + 16 }}>
      <Button
        onPress={scanAnotherProduct}
        className="bg-ink active:bg-ink/90 h-[58px] gap-3 rounded-none">
        <Icon as={ScanLine} size={24} strokeWidth={2.2} className="text-paper" />
        <Text className="font-display-bold text-paper text-[22px] font-normal uppercase tracking-[0.4px]">
          Scanner un autre produit
        </Text>
      </Button>
    </View>
  );
}
