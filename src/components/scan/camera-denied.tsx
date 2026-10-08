import type { PermissionResponse } from 'expo-camera';
import { ArrowRight, CameraOff, ExternalLink } from 'lucide-react-native';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { ProfileBadge } from '@/components/profile/profile-badge';
import { ManualEntryButton } from '@/components/scan/manual-entry-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { LABEL } from '@/lib/theme';

const STEPS = [
  "Ouvrez les réglages de l'appli",
  'Autorisations, puis Appareil photo',
  'Choisissez « Autoriser », puis revenez ici',
];

const SETTINGS_LABEL =
  Platform.OS === 'android' ? 'Ouvrir les réglages Android' : 'Ouvrir les réglages';

interface CameraDeniedProps {
  permission: PermissionResponse;
  onRequest: () => void;
  onOpenSettings: () => void;
}

/**
 * « 08 · Scan, caméra refusée » mockup. While the system still lets the app ask, the main
 * button asks again; once the user chose « Ne plus demander », it opens the app settings.
 * Returning from the settings is picked up by `useCameraPermission`.
 */
export function CameraDenied({ permission, onRequest, onOpenSettings }: CameraDeniedProps) {
  const insets = useSafeAreaInsets();
  const canAsk = permission.canAskAgain;

  return (
    <ScrollView
      className="bg-paper flex-1"
      contentContainerClassName="grow gap-[18px] px-5 pb-4"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}>
      <ProfileBadge tone="light" />
      <View
        className="border-ink h-[200px] items-center justify-center overflow-hidden border-2 border-dashed"
        aria-hidden>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern
              id="stripes"
              width={12}
              height={12}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)">
              <Rect width={6} height={12} fill={LABEL.paperDim} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#stripes)" />
        </Svg>
        <View className="border-ink bg-paper h-[92px] w-[92px] items-center justify-center border-[3px]">
          <Icon as={CameraOff} size={48} strokeWidth={1.8} className="text-ink" />
        </View>
        <Text className="bg-paper font-mono text-ink absolute left-3 top-2.5 px-[5px] py-0.5 text-[10px] tracking-[1.2px]">
          APERÇU INDISPONIBLE
        </Text>
      </View>

      <View className="gap-2.5">
        <Text className="font-mono text-ink text-[11px] tracking-[1.3px]">AUTORISATION REFUSÉE</Text>
        <Text
          role="heading"
          className="font-display text-ink text-[52px] uppercase leading-[50px]">
          {'La caméra\nest bloquée'}
        </Text>
        <Text className="font-body text-ink text-base leading-[23px]">
          MilkApp en a besoin pour lire les codes-barres. L&apos;image n&apos;est ni enregistrée ni
          envoyée.
        </Text>
      </View>

      <View className="border-ink border-t-2">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <View
              key={step}
              className={cn(
                'border-ink flex-row gap-2 py-[9px]',
                isLast ? 'border-b-2' : 'border-b-[1.5px] border-dashed'
              )}>
              <Text className="font-mono text-ink w-7 pt-0.5 text-xs">
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text className="font-body text-ink flex-1 text-[15px]">{step}</Text>
            </View>
          );
        })}
      </View>

      <View className="grow" />

      <View className="gap-2.5">
        <Button
          className="bg-ink active:bg-ink/90 h-[58px] justify-between rounded-none px-5"
          onPress={canAsk ? onRequest : onOpenSettings}>
          <Text className="font-display-bold text-paper shrink text-[22px] font-normal uppercase tracking-[0.4px]">
            {canAsk ? 'Autoriser la caméra' : SETTINGS_LABEL}
          </Text>
          <Icon
            as={canAsk ? ArrowRight : ExternalLink}
            size={22}
            strokeWidth={2.2}
            className="text-paper"
          />
        </Button>
        <ManualEntryButton />
      </View>
    </ScrollView>
  );
}
