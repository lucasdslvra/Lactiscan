import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { seedProductSheet } from '@/components/product/alternative-row';
import { ProductPhoto } from '@/components/product/product-photo';
import { Text } from '@/components/ui/text';
import { nutriScoreGrade } from '@/lib/alternatives';
import type { OffProduct } from '@/lib/off';
import { brandLine, photoUrl, productName } from '@/lib/product';
import { cn } from '@/lib/utils';

/**
 * One product of « Les plus scannés »: photo, name, brand, Nutri-Score. Opens its sheet, already
 * filled from the equivalences file, so it shows offline too.
 */
export function ScannedProductRow({ product, last }: { product: OffProduct; last: boolean }) {
  const queryClient = useQueryClient();
  const uri = photoUrl(product);
  const name = productName(product);
  const brand = brandLine(product);
  const grade = nutriScoreGrade(product);
  const label = [name, brand, grade ? `Nutri-Score ${grade}` : 'Nutri-Score inconnu']
    .filter(Boolean)
    .join(', ');

  function openSheet() {
    seedProductSheet(queryClient, product);
    router.push({ pathname: '/produit/[code]', params: { code: product.code } });
  }

  return (
    <Pressable
      role="link"
      aria-label={label}
      onPress={openSheet}
      className={cn(
        'border-ink active:bg-paper-dim flex-row items-center gap-3 py-3',
        !last && 'border-b-[1.5px]'
      )}>
      <ProductPhoto key={uri ?? 'none'} uri={uri} size="xs" />

      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-body-bold text-ink text-[15px]">{name}</Text>
        {!!brand && <Text className="font-body text-ink-muted text-[13px]">{brand}</Text>}
      </View>

      <View className="border-ink shrink-0 flex-row border-[1.5px]">
        <Text className="font-mono text-ink px-1.5 py-[3px] text-[10px] tracking-[0.8px]">
          NUTRI
        </Text>
        <Text className="bg-ink font-mono-semibold text-paper px-[7px] py-[3px] text-[10px] tracking-[0.8px]">
          {grade ?? '?'}
        </Text>
      </View>
    </Pressable>
  );
}
