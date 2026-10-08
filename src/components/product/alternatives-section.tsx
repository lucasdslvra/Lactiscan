import { ActivityIndicator, View } from 'react-native';

import { AlternativeRow } from '@/components/product/alternative-row';
import { OffErrorPanel } from '@/components/product/off-error-panel';
import { Text } from '@/components/ui/text';
import { useAlternatives } from '@/hooks/use-alternatives';
import type { Alternative } from '@/lib/alternatives';
import { alternativesView, type AlternativesView } from '@/lib/alternatives-view';
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
  const { alternatives, retry, ...status } = useAlternatives(product, settings);
  const count = alternatives.length;
  const view = alternativesView({ ...status, count });
  const otherOptions = verdict.acceptable;
  const without = settings.mode === 'lactose-free' ? 'sans lactose' : 'sans lait';

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
        {view.kind === 'list' && (
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

      <AlternativesBody view={view} alternatives={alternatives} onRetry={retry} />
    </View>
  );
}

function AlternativesBody({
  view,
  alternatives,
  onRetry,
}: {
  view: AlternativesView;
  alternatives: Alternative[];
  onRetry: () => void;
}) {
  switch (view.kind) {
    case 'loading':
      return (
        <ActivityIndicator
          color={LABEL.ink}
          size="large"
          className="py-6"
          aria-label="Recherche des alternatives"
        />
      );
    case 'error':
      return <OffErrorPanel error={view.error} messages={ERROR_MESSAGES} onRetry={onRetry} />;
    case 'empty':
      return <NoAlternative reason={view.reason} />;
    case 'list':
      return (
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
          {view.loadingMore && (
            <ActivityIndicator
              color={LABEL.ink}
              className="pt-3.5"
              aria-label="Recherche dans la catégorie parente"
            />
          )}
        </>
      );
  }
}

const NO_ALTERNATIVE_TEXT = {
  'no-match': 'Aucun produit de cette catégorie, vendu en France, ne correspond à votre profil.',
  'no-category': "Ce produit n'a pas de catégorie exploitable pour chercher des remplacements.",
};

function NoAlternative({ reason }: { reason: keyof typeof NO_ALTERNATIVE_TEXT }) {
  return (
    <View className="border-ink gap-2 border-2 p-4">
      <Text className="font-mono text-ink text-[10px] tracking-[1.2px]">
        AUCUNE ALTERNATIVE TROUVÉE
      </Text>
      <Text className="font-display text-ink text-3xl uppercase leading-[27px]">
        Rien de compatible
      </Text>
      <Text className="font-body text-ink text-sm leading-[20px]">{NO_ALTERNATIVE_TEXT[reason]}</Text>
    </View>
  );
}
