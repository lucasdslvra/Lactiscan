import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatGtin } from '@/lib/barcode';
import { MODE_LABEL, type MilkMode } from '@/lib/verdict';

/** Back button, scanned code and a reminder of the active profile. */
export function ProductTopBar({ code, mode }: { code: string; mode: MilkMode }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row items-center gap-2.5 px-4" style={{ paddingTop: insets.top + 12 }}>
      <Pressable
        role="button"
        aria-label="Retour au scan"
        onPress={() => router.back()}
        className="border-ink h-11 w-11 items-center justify-center border-2">
        <Icon as={ArrowLeft} size={22} className="text-ink" />
      </Pressable>
      <Text className="font-mono text-ink flex-1 text-[11px] tracking-[1.1px]" numberOfLines={1}>
        EAN {formatGtin(code)}
      </Text>
      <Text className="bg-ink font-mono text-paper px-2 py-1.5 text-[10px] tracking-[1px]">
        {MODE_LABEL[mode]}
      </Text>
    </View>
  );
}
