import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useProduct, type OffClientError } from '@/lib/off';
import { LABEL } from '@/lib/theme';

/**
 * Landing screen of a scan or a manual entry, first cut: name and brand only.
 * The full sheet (photo, ingredients, verdict) comes with US-08 and following.
 */
export default function ProduitScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data: product, error, isPending, refetch } = useProduct(code);

  return (
    <ScrollView className="bg-paper flex-1" contentContainerClassName="gap-4 p-5">
      <Text className="font-mono text-ink text-xs tracking-[1.4px]">EAN {code}</Text>

      {isPending && <ActivityIndicator color={LABEL.ink} size="large" className="mt-8" />}

      {error && <ProductError error={error} onRetry={() => void refetch()} />}

      {product && (
        <View className="gap-2">
          <Text role="heading" className="font-display text-ink text-[40px] uppercase leading-[40px]">
            {product.product_name_fr || product.product_name || 'Produit sans nom'}
          </Text>
          {!!product.brands && (
            <Text className="font-body text-ink-muted text-base">{product.brands}</Text>
          )}
        </View>
      )}
    </ScrollView>
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
      onPress={() => router.back()}
      className="border-ink mt-1 h-12 rounded-none border-2">
      <Text className="font-body-bold text-ink text-sm font-normal">Scanner un autre produit</Text>
    </Button>
  );
}
