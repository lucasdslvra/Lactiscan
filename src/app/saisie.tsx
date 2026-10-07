import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodePreview } from '@/components/barcode-preview';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { checkManualCode, type ManualCodeCheck } from '@/lib/barcode';
import { FONTS, LABEL } from '@/lib/theme';

const MAX_LENGTH = 13;

/**
 * « 03 · Saisie manuelle » mockup. The length and the EAN check digit are verified as the
 * user types, so Open Food Facts is only called with a valid code; the result is the same
 * product screen as a scan.
 */
export default function SaisieScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const check = checkManualCode(code);

  const submit = () => {
    if (check.status !== 'valid') return;
    router.push({ pathname: '/produit/[code]', params: { code: check.code } });
  };

  return (
    <ScrollView
      className="bg-paper flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-[22px] px-5 pb-6"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}>
      <View className="flex-row items-center gap-3">
        <Pressable
          role="button"
          aria-label="Retour au scan"
          onPress={() => router.back()}
          className="border-ink h-12 w-12 items-center justify-center border-2">
          <Icon as={ArrowLeft} size={22} className="text-ink" />
        </Pressable>
        <Text className="font-mono text-ink text-[11px] tracking-[1.3px]">
          QUAND LE SCAN NE PASSE PAS
        </Text>
      </View>

      <Text role="heading" className="font-display text-ink text-[56px] uppercase leading-[54px]">
        {'Saisir\nle code'}
      </Text>

      <View className="gap-2">
        <Text nativeID="ean-label" className="font-body-bold text-ink text-[15px]">
          Code-barres
        </Text>
        <TextInput
          aria-labelledby="ean-label"
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, MAX_LENGTH))}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={MAX_LENGTH}
          returnKeyType="go"
          onSubmitEditing={submit}
          placeholder="3 760123 456784"
          placeholderTextColor={LABEL.inkSoft}
          selectionColor={LABEL.link}
          style={{ fontFamily: FONTS.mono }}
          className="border-ink bg-field text-ink h-[68px] border-2 px-4 text-[26px] tracking-[3px]"
        />
        <View className="flex-row justify-between">
          <Text className="font-mono text-ink-muted text-xs">8, 12 OU 13 CHIFFRES</Text>
          <Text className="font-mono text-ink-muted text-xs">
            {code.length} / {MAX_LENGTH}
          </Text>
        </View>
      </View>

      <CheckStatus check={check} />

      {check.status === 'valid' && <BarcodePreview code={code} />}

      <Button
        disabled={check.status !== 'valid'}
        onPress={submit}
        className="bg-ink active:bg-ink/90 h-[60px] justify-between rounded-none px-5">
        <Text className="font-display-bold text-paper text-2xl font-normal uppercase tracking-[0.5px]">
          Afficher la fiche
        </Text>
        <Icon as={ArrowRight} size={26} strokeWidth={2.5} className="text-paper" />
      </Button>
    </ScrollView>
  );
}

/** Live result of the check under the field; nothing until the length is a GTIN one. */
function CheckStatus({ check }: { check: ManualCodeCheck }) {
  if (check.status === 'incomplete') return null;

  if (check.status === 'valid') {
    return (
      <View
        role="status"
        className="bg-verdict-free border-ink flex-row items-center gap-2.5 border-2 px-3.5 py-3">
        <Icon as={Check} size={20} strokeWidth={3} className="text-ink" />
        <Text className="font-body-bold text-ink text-[15px]">Clé de contrôle valide</Text>
        <Text className="font-mono text-ink ml-auto text-[11px] tracking-[0.9px]">
          {check.format}
        </Text>
      </View>
    );
  }

  return (
    <View
      role="status"
      className="bg-field border-ink flex-row items-center gap-2.5 border-2 border-dashed px-3.5 py-3">
      <Icon as={TriangleAlert} size={20} strokeWidth={2.5} className="text-ink" />
      <View className="flex-1 gap-0.5">
        <Text className="font-body-bold text-ink text-[15px]">Clé de contrôle incorrecte</Text>
        <Text className="font-body text-ink-muted text-sm">Vérifiez les chiffres saisis.</Text>
      </View>
      <Text className="font-mono text-ink text-[11px] tracking-[0.9px]">{check.format}</Text>
    </View>
  );
}
