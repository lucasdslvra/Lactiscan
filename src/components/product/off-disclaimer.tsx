import { Link } from 'expo-router';
import { Info } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const OFF_URL = 'https://world.openfoodfacts.org';

/** Warning required on every product sheet. */
export function OffDisclaimer() {
  return (
    <View className="border-ink mx-4 mt-[18px] flex-row items-start gap-3 border-2 border-dashed px-3.5 py-3">
      <Icon as={Info} size={22} strokeWidth={2} className="text-ink" />
      <Text className="font-body text-ink flex-1 text-sm leading-[20px]">
        Données issues d&apos;Open Food Facts, une base collaborative.{' '}
        <Text className="font-body-bold text-ink text-sm">L&apos;étiquette du produit fait foi</Text>
        , surtout en cas d&apos;allergie.
      </Text>
    </View>
  );
}

/** Open Food Facts source and licence, at the foot of the sheet. */
export function OffSource() {
  return (
    <Text className="font-mono text-ink-muted px-4 py-[18px] text-[10px] tracking-[1px]">
      SOURCE :{' '}
      <Link href={OFF_URL} className="font-mono text-link text-[10px] underline">
        OPEN FOOD FACTS
      </Link>{' '}
      · LICENCE ODbL
    </Text>
  );
}
