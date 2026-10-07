import { View } from 'react-native';

import { ProductPhoto } from '@/components/product/product-photo';
import { Text } from '@/components/ui/text';
import type { OffProduct } from '@/lib/off';
import { brandLine, categoryLabel, photoUrl, productName } from '@/lib/product';

/** Photo, category, name, brand and quantity: enough to check it is the right product. */
export function ProductSummary({ product }: { product: OffProduct }) {
  const uri = photoUrl(product);
  const category = categoryLabel(product);
  const brand = brandLine(product);

  return (
    <View className="flex-row items-start gap-3.5 px-4 pt-5">
      <ProductPhoto key={uri ?? 'none'} uri={uri} />
      <View className="min-w-0 flex-1 gap-[5px]">
        {!!category && (
          <Text className="font-mono text-ink-muted text-[10px] tracking-[1.2px]">{category}</Text>
        )}
        <Text
          role="heading"
          className="font-display-bold text-ink text-[32px] uppercase leading-[31px]">
          {productName(product)}
        </Text>
        {!!brand && <Text className="font-body text-ink-muted text-sm">{brand}</Text>}
      </View>
    </View>
  );
}
