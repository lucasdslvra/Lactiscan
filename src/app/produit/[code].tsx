import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { IngredientsSection } from '@/components/product/ingredients-section';
import { OffDisclaimer } from '@/components/product/off-disclaimer';
import { ProductSummary } from '@/components/product/product-summary';
import { ProductTopBar } from '@/components/product/product-top-bar';
import { ScanAgainBar, scanAnotherProduct } from '@/components/product/scan-again-bar';
import { VerdictCard } from '@/components/product/verdict-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useVerdictSettings } from '@/hooks/use-verdict-settings';
import { useProduct, type OffClientError } from '@/lib/off';
import { LABEL } from '@/lib/theme';
import { evaluateVerdict } from '@/lib/verdict';

/**
 * « 04 · Fiche produit » mockup, landing screen of a scan or a manual entry: product,
 * verdict for the active profile, ingredients and traces, and the Open Food Facts warning.
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

        {product && (
          <>
            <ProductSummary product={product} />
            <VerdictCard verdict={evaluateVerdict(product, settings)} mode={settings.mode} />
            <IngredientsSection product={product} />
            <OffDisclaimer />
          </>
        )}
      </ScrollView>

      {product && <ScanAgainBar />}
    </View>
  );
}

function ProductError({ error, onRetry }: { error: OffClientError; onRetry: () => void }) {
  if (error.kind === 'not-found') {
    return (
      <View className="border-ink gap-2 border-2 p-4">
        <Text className="font-mono text-ink text-[10px] tracking-[1.2px]">CODE INCONNU</Text>
        <Text className="font-display text-ink text-3xl uppercase leading-[30px]">
          Produit introuvable
        </Text>
        <Text className="font-body text-ink text-sm">
          Lisez l&apos;étiquette du produit : aucun verdict n&apos;est affiché.
        </Text>
        <ScanAgainButton />
      </View>
    );
  }

  const offline = error.kind === 'network' || error.kind === 'timeout';
  return (
    <View className="bg-ink gap-2 p-4">
      <Text className="font-mono text-paper text-[10px] tracking-[1.2px]">
        {offline ? 'HORS LIGNE' : 'SERVICE INDISPONIBLE'}
      </Text>
      <Text className="font-display text-paper text-3xl uppercase leading-[30px]">
        {offline ? 'Pas de connexion' : 'Réessayez plus tard'}
      </Text>
      <Text className="font-body text-paper text-sm">Ce produit ne peut pas être chargé.</Text>
      <Button onPress={onRetry} className="bg-paper mt-1 h-12 rounded-none">
        <Text className="font-body-bold text-ink text-sm font-normal">Réessayer</Text>
      </Button>
    </View>
  );
}

function ScanAgainButton() {
  return (
    <Button
      variant="ghost"
      onPress={scanAnotherProduct}
      className="border-ink mt-1 h-12 rounded-none border-2">
      <Text className="font-body-bold text-ink text-sm font-normal">Scanner un autre produit</Text>
    </Button>
  );
}
