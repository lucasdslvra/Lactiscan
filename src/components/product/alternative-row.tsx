import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ProductPhoto } from '@/components/product/product-photo';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { nutriScoreGrade } from '@/lib/alternatives';
import type { OffProduct } from '@/lib/off';
import { brandLine, photoUrl, productName } from '@/lib/product';
import { cn } from '@/lib/utils';

const BADGE = 'font-mono text-ink text-[10px] tracking-[0.8px]';

/** One alternative: photo, name, brand, Nutri-Score; opens its own sheet with its verdict. */
export function AlternativeRow({ product, first }: { product: OffProduct; first: boolean }) {
  const uri = photoUrl(product);
  const name = productName(product);
  const brand = brandLine(product);
  const grade = nutriScoreGrade(product);
  const label = [name, brand, grade && `Nutri-Score ${grade}`].filter(Boolean).join(', ');

  return (
    <Pressable
      role="link"
      aria-label={label}
      onPress={() =>
        // `push`: each alternative stacks a new sheet, the back button returns to this one.
        router.push({ pathname: '/produit/[code]', params: { code: product.code } })
      }
      className={cn(
        'border-ink active:bg-paper-dim flex-row items-center gap-3 py-3.5',
        first ? 'border-t-2' : 'border-t-[1.5px]'
      )}>
      <ProductPhoto key={uri ?? 'none'} uri={uri} size="sm" />

      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-body-bold text-ink text-base">{name}</Text>
        {!!brand && <Text className="font-body text-ink-muted text-[13px]">{brand}</Text>}
        <View className="flex-row flex-wrap gap-1.5 pt-0.5">
          {grade && (
            <View className="border-ink flex-row border-[1.5px]">
              <Text className={cn(BADGE, 'px-1.5 py-[3px]')}>NUTRI-SCORE</Text>
              <Text className="bg-ink font-mono-semibold text-paper px-[7px] py-[3px] text-[10px] tracking-[0.8px]">
                {grade}
              </Text>
            </View>
          )}
          <Text className={cn(BADGE, 'border-ink border-[1.5px] px-1.5 py-[3px]')}>
            MÊME CATÉGORIE
          </Text>
        </View>
      </View>

      <Icon as={ChevronRight} size={22} strokeWidth={2} className="text-ink" />
    </Pressable>
  );
}
