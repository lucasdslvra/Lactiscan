import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ProductPhoto } from '@/components/product/product-photo';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { nutriScoreGrade, type Alternative, type AlternativeOrigin } from '@/lib/alternatives';
import { brandLine, photoUrl, productName } from '@/lib/product';
import { cn } from '@/lib/utils';

const BADGE = 'font-mono text-ink text-[10px] tracking-[0.8px]';

// Origin badge: solid border for the exact category, dashed for the parent one (mockup), ink
// fill for an equivalence of the JSON. Told apart without color.
const ORIGIN_BADGE: Record<AlternativeOrigin, { text: string; frame: string; ink: string }> = {
  category: { text: 'MÊME CATÉGORIE', frame: '', ink: 'text-ink' },
  parent: { text: 'CATÉGORIE PARENTE', frame: 'border-dashed', ink: 'text-ink' },
  equivalence: { text: 'ÉQUIVALENCE', frame: 'bg-ink', ink: 'text-paper' },
};

/** One alternative: photo, name, brand, Nutri-Score; opens its own sheet with its verdict. */
export function AlternativeRow({
  alternative: { product, origin },
  first,
}: {
  alternative: Alternative;
  first: boolean;
}) {
  const uri = photoUrl(product);
  const name = productName(product);
  const brand = brandLine(product);
  const grade = nutriScoreGrade(product);
  const badge = ORIGIN_BADGE[origin];
  const label = [name, brand, grade && `Nutri-Score ${grade}`, badge.text.toLocaleLowerCase('fr-FR')]
    .filter(Boolean)
    .join(', ');

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
          {/* Border on a View: a dashed border on a Text is unreliable on Android. */}
          <View className={cn('border-ink border-[1.5px] px-1.5 py-[3px]', badge.frame)}>
            <Text className={cn(BADGE, badge.ink)}>{badge.text}</Text>
          </View>
        </View>
      </View>

      <Icon as={ChevronRight} size={22} strokeWidth={2} className="text-ink" />
    </Pressable>
  );
}
