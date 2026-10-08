import { useQueryClient } from '@tanstack/react-query';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, Flashlight } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileBadge } from '@/components/profile/profile-badge';
import { ManualEntryButton } from '@/components/scan/manual-entry-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useScanGuard } from '@/hooks/use-scan-guard';
import { useSettledFocus } from '@/hooks/use-settled-focus';
import { normalizeScannedCode, SCAN_BARCODE_TYPES } from '@/lib/barcode';
import { productQueryOptions } from '@/lib/off';
import { isInScanWindow, type ScanWindow } from '@/lib/scan-window';
import { cn } from '@/lib/utils';
import { LABEL } from '@/lib/theme';

const BARCODE_SETTINGS = { barcodeTypes: [...SCAN_BARCODE_TYPES] };

// Enough half-discs to cover the widest phone; the strip clips the overflow.
const PERFORATIONS = Array.from({ length: 48 }, (_, i) => i);

function confirmHaptic() {
  return Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

interface BarcodeScannerProps {
  /** Mount the camera; off while the permission is unknown, the frame still shows. */
  cameraEnabled: boolean;
  /** When set, shows an « Autoriser la caméra » button (permission not decided yet). */
  onRequestPermission?: () => void;
}

/** Live camera framed like the « 02 · Scan » mockup; opens the product sheet on a valid code. */
export function BarcodeScanner({ cameraEnabled, onRequestPermission }: BarcodeScannerProps) {
  const queryClient = useQueryClient();
  // Only one camera may run at a time, and unmounting is the only way to stop it on Android.
  // Remounted once the sheet has finished closing, not while it slides away.
  const cameraVisible = useSettledFocus();
  const insets = useSafeAreaInsets();
  const [torchOn, setTorchOn] = useState(false);

  // The torch always starts off when coming back to the screen (US-07).
  useFocusEffect(useCallback(() => () => setTorchOn(false), []));

  const openProduct = useCallback(
    (code: string) => {
      void confirmHaptic().catch(() => {});
      // Start loading the sheet while the screen transition runs.
      void queryClient.prefetchQuery(productQueryOptions(code));
      router.push({ pathname: '/produit/[code]', params: { code } });
    },
    [queryClient]
  );
  const submitCode = useScanGuard(openProduct);

  // Viewfinder in the camera view's coordinates: its row gives y and height, the viewfinder
  // itself x and width. A ref, as only the scan callback reads it.
  const windowRef = useRef<ScanWindow | null>(null);
  const rowRef = useRef<{ y: number; height: number } | null>(null);
  const frameRef = useRef<{ x: number; width: number } | null>(null);
  const updateWindow = () => {
    const row = rowRef.current;
    const frame = frameRef.current;
    windowRef.current = row && frame ? { ...frame, ...row } : null;
  };
  const onRowLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    rowRef.current = { y: layout.y, height: layout.height };
    updateWindow();
  };
  const onViewfinderLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    frameRef.current = { x: layout.x, width: layout.width };
    updateWindow();
  };

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      // The camera reads the whole picture: ignore codes not aimed at in the viewfinder.
      if (!isInScanWindow(result, windowRef.current)) return;
      const code = normalizeScannedCode(result.type, result.data);
      if (code) submitCode(code);
    },
    [submitCode]
  );

  return (
    <View className="bg-ink flex-1">
      <View className="flex-1">
        {cameraEnabled && cameraVisible && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={BARCODE_SETTINGS}
            onBarcodeScanned={onBarcodeScanned}
          />
        )}
        <View style={StyleSheet.absoluteFill}>
          <View className="bg-ink/60 flex-1" />
          <View className="h-[180px] flex-row" onLayout={onRowLayout}>
            <View className="bg-ink/60 flex-1" />
            <Viewfinder onLayout={onViewfinderLayout} />
            <View className="bg-ink/60 flex-1" />
          </View>
          <View className="bg-ink/60 flex-1 items-center gap-2 px-4 pt-7">
            <Text
              role="heading"
              className="font-display text-paper text-center text-[38px] uppercase leading-[38px]">
              Visez le code-barres
            </Text>
            <Text className="font-mono text-ink-soft text-center text-[11px] tracking-[1.1px]">
              LECTURE AUTOMATIQUE · EAN-13 · EAN-8 · UPC
            </Text>
          </View>
        </View>
        <View
          className="absolute left-4 right-4 flex-row items-center justify-between gap-3"
          style={{ top: insets.top + 8 }}>
          <ProfileBadge tone="dark" />
          {cameraEnabled && Platform.OS !== 'web' && (
            <TorchButton on={torchOn} onToggle={() => setTorchOn((on) => !on)} />
          )}
        </View>
      </View>

      <View className="bg-paper">
        <View className="h-[10px] flex-row overflow-hidden" aria-hidden>
          {PERFORATIONS.map((i) => (
            <View key={i} className="bg-ink mx-px -mt-[5px] h-[10px] w-[10px] rounded-full" />
          ))}
        </View>
        <View className="gap-2.5 px-4 pb-4 pt-2">
          {onRequestPermission && (
            <Button
              className="bg-ink active:bg-ink/90 h-[58px] justify-between rounded-none px-5"
              onPress={onRequestPermission}>
              <Text className="font-display-bold text-paper text-[22px] font-normal uppercase tracking-[0.4px]">
                Autoriser la caméra
              </Text>
              <Icon as={ArrowRight} size={22} strokeWidth={2.2} className="text-paper" />
            </Button>
          )}
          <ManualEntryButton />
        </View>
      </View>
    </View>
  );
}

function TorchButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Éteindre la torche' : 'Allumer la torche'}
      onPress={onToggle}
      className={cn(
        'border-paper h-12 w-12 items-center justify-center border-[1.5px]',
        on ? 'bg-paper' : 'bg-transparent'
      )}>
      {/* Same icon in both states: the inverted fill shows it is lit. */}
      <Icon as={Flashlight} size={22} className={on ? 'text-ink' : 'text-paper'} />
    </Pressable>
  );
}

/** 300×180 window: four paper corner brackets and a red aiming line. */
function Viewfinder({ onLayout }: { onLayout: (event: LayoutChangeEvent) => void }) {
  return (
    <View className="w-[300px]" aria-hidden onLayout={onLayout}>
      <View className="border-paper absolute left-0 top-0 h-9 w-9 border-l-4 border-t-4" />
      <View className="border-paper absolute right-0 top-0 h-9 w-9 border-r-4 border-t-4" />
      <View className="border-paper absolute bottom-0 left-0 h-9 w-9 border-b-4 border-l-4" />
      <View className="border-paper absolute bottom-0 right-0 h-9 w-9 border-b-4 border-r-4" />
      <View
        className="bg-scanline absolute -left-2.5 -right-2.5 top-[89px] h-[2px]"
        style={styles.scanlineGlow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scanlineGlow: {
    shadowColor: LABEL.scanline,
    shadowOpacity: 1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
});
