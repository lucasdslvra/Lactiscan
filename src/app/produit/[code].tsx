import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { AlternativesSection } from '@/components/product/alternatives-section';
import { IngredientsSection } from '@/components/product/ingredients-section';
import { OffDisclaimer, OffSource } from '@/components/product/off-disclaimer';
import { OffErrorPanel } from '@/components/product/off-error-panel';
import { ProductSummary } from '@/components/product/product-summary';
import { ProductTopBar } from '@/components/product/product-top-bar';
import { ScanAgainBar, scanAnotherProduct } from '@/components/product/scan-again-bar';
import { TicketDivider } from '@/components/product/ticket-divider';
import { VerdictCard } from '@/components/product/verdict-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useVerdictSettings } from '@/hooks/use-verdict-settings';
import { findDairyIngredients } from '@/lib/dairy';
import { useProduct, type OffClientError, type OffProduct } from '@/lib/off';
import { productIngredients } from '@/lib/product';
import { LABEL } from '@/lib/theme';
import { evaluateVerdict, type VerdictSettings } from '@/lib/verdict';

/**
 * « 04 · Fiche produit et alternatives » mockup, landing screen of a scan or a manual entry:
 * product, verdict for the active profile, ingredients and traces, the Open Food Facts warning,
 * then the alternatives the profile accepts.
 */
export default function ProduitScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const settings = useVerdictSettings();
  const { data: product, error, isPending, refetch } = useProduct(code);

  return (
    <View className="bg-paper flex-1">
      <ProductTopBar code={code} mode={settings.mode} />

      <ScrollView className="flex-1" contentContainerClassName="pb-2">
        {isPending && <ActivityIndicator color={LABEL.ink} size="large" className="mt-12" />}

        {error && (
          <View className="px-4 pt-5">
            <ProductError error={error} onRetry={() => void refetch()} />
          </View>
        )}

        {product && <ProductSheet product={product} settings={settings} />}
      </ScrollView>

      {product && <ScanAgainBar />}
    </View>
  );
}

function ProductSheet({ product, settings }: { product: OffProduct; settings: VerdictSettings }) {
  const verdict = evaluateVerdict(product, settings);
  const ingredients = productIngredients(product);
  const dairy = findDairyIngredients(ingredients?.text ?? '');

  return (
    <>
      <ProductSummary product={product} />
      <VerdictCard verdict={verdict} mode={settings.mode} dairyCount={dairy.names.length} />
      <IngredientsSection
        ingredients={ingredients}
        dairy={dairy}
        highlight={verdict.kind !== 'milk-free'}
        tracesTags={product.traces_tags}
      />
      <OffDisclaimer />
      <TicketDivider />
      <AlternativesSection product={product} verdict={verdict} settings={settings} />
      <OffSource />
    </>
  );
}

const PRODUCT_ERROR_MESSAGES = {
  offline: 'Ce nouveau produit ne peut pas être chargé.',
  unavailable: 'Ce produit ne peut pas être chargé.',
};

function ProductError({ error, onRetry }: { error: OffClientError; onRetry: () => void }) {
  if (error.kind === 'not-found') {
    return (
      <View className="border-ink gap-2 border-2 p-4">
        <Text className="font-mono text-ink text-[10px] tracking-[1.2px]">CODE INCONNU</Text>
        <Text className="font-display text-ink text-3xl uppercase leading-[27px]">
          Produit introuvable
        </Text>
        <Text className="font-body text-ink text-sm leading-[20px]">
          Lisez l&apos;étiquette du produit : aucun verdict n&apos;est affiché.
        </Text>
        <ScanAgainButton />
      </View>
    );
  }

  return <OffErrorPanel error={error} messages={PRODUCT_ERROR_MESSAGES} onRetry={onRetry} />;
}

function ScanAgainButton() {
  return (
    <Button
      variant="ghost"
      onPress={scanAnotherProduct}
      className="border-ink mt-1 h-11 rounded-none border-2">
      <Text className="font-body-bold text-ink text-sm font-normal">Scanner un autre produit</Text>
    </Button>
  );
}
