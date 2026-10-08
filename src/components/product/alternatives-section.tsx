import { ActivityIndicator, View } from 'react-native';

import { AlternativeRow } from '@/components/product/alternative-row';
import { OffErrorPanel } from '@/components/product/off-error-panel';
import { Text } from '@/components/ui/text';
import { useAlternatives } from '@/hooks/use-alternatives';
import type { OffProduct } from '@/lib/off';
import { LABEL } from '@/lib/theme';
import type { Verdict, VerdictSettings } from '@/lib/verdict';

const ERROR_MESSAGES = {
  offline: 'Les alternatives ne peuvent pas être chargées.',
  unavailable: 'Les alternatives ne peuvent pas être chargées.',
};

/**
 * « Alternatives sans lait » block under the product: same category, sold in France, only
 * products the active profile accepts, completed by the parent category then the equivalences
 * when there are fewer than three. For a product the user can already eat, the mockup calls
 * them « Autres options ».
 */
export function AlternativesSection({
  product,
  verdict,
  settings,
}: {
  product: OffProduct;
  verdict: Verdict;
  settings: VerdictSettings;
}) {
  const { alternatives, isPending, isLoadingMore, error, retry } = useAlternatives(
    product,
    settings
  );
  const otherOptions = verdict.acceptable;
  const without = settings.mode === 'lactose-free' ? 'sans lactose' : 'sans lait';
  const count = alternatives.length;

  return (
    <View role="region" aria-label="Alternatives" className="px-4 pt-[18px]">
      <View className="flex-row items-end justify-between">
        <Text
          role="heading"
          className="font-display text-ink text-[38px] uppercase leading-[34px]">
          {otherOptions ? 'Autres options' : 'Alternatives'}
          {'\n'}
          {without}
        </Text>
        {count > 0 && (
          <Text aria-hidden className="font-display text-ink text-[64px] leading-[52px]">
            {String(count).padStart(2, '0')}
          </Text>
        )}
      </View>
      <Text className="font-body text-ink-muted mb-3.5 mt-2.5 text-sm leading-[20px]">
        {otherOptions
          ? 'Même catégorie, vendues en France, triées par popularité puis Nutri-Score.'
          : 'Vendues en France, triées par popularité puis Nutri-Score.'}
      </Text>

      {isPending || (count === 0 && isLoadingMore) ? (
        <ActivityIndicator
          color={LABEL.ink}
          size="large"
          className="py-6"
          aria-label="Recherche des alternatives"
        />
      ) : error ? (
        <OffErrorPanel error={error} messages={ERROR_MESSAGES} onRetry={retry} />
      ) : count === 0 ? (
        <NoAlternative />
      ) : (
        <>
          <View className="border-ink border-b-2">
            {alternatives.map((alternative, index) => (
              <AlternativeRow
                key={alternative.product.code}
                alternative={alternative}
                first={index === 0}
              />
            ))}
          </View>
          {/* Progressive loading: the parent category arrives below the first results. */}
          {isLoadingMore && (
            <ActivityIndicator
              color={LABEL.ink}
              className="pt-3.5"
              aria-label="Recherche dans la catégorie parente"
            />
          )}
        </>
      )}
    </View>
  );
}

function NoAlternative() {
  return (
    <View className="border-ink gap-2 border-2 p-4">
      <Text className="font-mono text-ink text-[10px] tracking-[1.2px]">AUCUNE ALTERNATIVE</Text>
      <Text className="font-display text-ink text-3xl uppercase leading-[27px]">
        Rien de compatible
      </Text>
      <Text className="font-body text-ink text-sm leading-[20px]">
        Aucun produit de cette catégorie, vendu en France, ne correspond à votre profil.
      </Text>
    </View>
  );
}
