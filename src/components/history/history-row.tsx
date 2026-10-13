import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { seedProductSheet } from '@/components/product/alternative-row';
import { ProductPhoto } from '@/components/product/product-photo';
import { VerdictBadge } from '@/components/product/verdict-badge';
import { Text } from '@/components/ui/text';
import { formatTime, type HistoryEntry } from '@/lib/history';
import { photoUrl, productName } from '@/lib/product';
import { evaluateVerdict, type VerdictSettings } from '@/lib/verdict';

const SPOKEN_VERDICT = {
  'contains-milk': 'contient du lait',
  'lactose-free': 'sans lactose',
  traces: 'traces possibles',
  'milk-free': 'sans lait',
  incomplete: 'information incomplète',
} as const;

/**
 * One product of the history: photo, name, verdict for the active profile, time of the visit.
 * Opens the sheet from the copy kept in the history, so it shows offline too; its alternatives
 * come from the offline cache.
 */
export function HistoryRow({
  entry,
  settings,
}: {
  entry: HistoryEntry;
  settings: VerdictSettings;
}) {
  const queryClient = useQueryClient();
  const { product } = entry;
  const uri = photoUrl(product);
  const name = productName(product);
  const time = formatTime(entry.viewedAt);
  // A sheet kept in the history always exists: never « not found ».
  const kind = evaluateVerdict(product, settings).kind as keyof typeof SPOKEN_VERDICT;

  function openSheet() {
    seedProductSheet(queryClient, product);
    router.push({ pathname: '/produit/[code]', params: { code: product.code } });
  }

  return (
    <Pressable
      role="link"
      aria-label={`${name}, ${SPOKEN_VERDICT[kind]}, consulté à ${time}`}
      onPress={openSheet}
      className="border-ink active:bg-paper-dim flex-row items-center gap-3 border-b-[1.5px] py-3">
      <ProductPhoto key={uri ?? 'none'} uri={uri} size="xs" />
      <View className="min-w-0 flex-1 gap-[5px]">
        <Text numberOfLines={1} className="font-body-bold text-ink text-[15px]">
          {name}
        </Text>
        <VerdictBadge kind={kind} />
      </View>
      <Text className="font-mono text-ink-muted text-xs">{time}</Text>
    </Pressable>
  );
}
