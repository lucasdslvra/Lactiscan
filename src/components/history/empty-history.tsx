import { router } from 'expo-router';
import { ScanBarcode } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import { BarcodeStripe } from '@/components/profile/barcode-stripe';
import { Text } from '@/components/ui/text';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';

const TICKET_TEXT = 'font-mono text-ink text-[11px] tracking-[0.9px]';

/** « 10 · Historique vide » mockup: a blank receipt, then a way to the scanner. */
export function EmptyHistory() {
  return (
    <View className="flex-1 items-center justify-center gap-7 px-5 py-8">
      <BlankTicket />
      <View className="items-center gap-2.5">
        <Text className="font-display text-ink text-center text-[40px] uppercase leading-[36px]">
          Rien pour{'\n'}l&apos;instant
        </Text>
        <Text className="font-body text-ink max-w-[300px] text-center text-base leading-[23px]">
          Chaque produit scanné s&apos;ajoute ici et reste consultable sans réseau.
        </Text>
      </View>
      <Pressable
        role="link"
        onPress={() => router.navigate('/scan')}
        className={cn(
          'bg-ink h-[58px] flex-row items-center justify-center gap-3 self-stretch',
          'active:opacity-80'
        )}>
        <ScanBarcode color={LABEL.paper} size={24} strokeWidth={2.2} />
        <Text className="font-display-bold text-paper text-[22px] uppercase tracking-[0.4px]">
          Scanner un premier produit
        </Text>
      </Pressable>
    </View>
  );
}

/** Receipt tilted like a label stuck on by hand, with a torn, scalloped bottom edge. */
function BlankTicket() {
  return (
    <View aria-hidden className="w-[236px] -rotate-2">
      <View className="border-ink bg-field gap-2.5 border-2 border-b-0 px-[18px] pb-3.5 pt-[18px]">
        <Text className="font-display text-ink text-center text-[22px] tracking-[0.9px]">
          MILKAPP
        </Text>
        <BarcodeStripe height={22} />
        <Rule />
        <Text className={TICKET_TEXT}>AUCUN PRODUIT SCANNÉ</Text>
        {[0, 1, 2].map((line) => (
          <Rule key={line} dotted className="mt-2.5" />
        ))}
        <Rule />
        <View className="flex-row justify-between">
          <Text className="font-mono-semibold text-ink text-[11px] tracking-[0.9px]">TOTAL</Text>
          <Text className="font-mono-semibold text-ink text-[11px] tracking-[0.9px]">0</Text>
        </View>
      </View>
      <ScallopedEdge />
    </View>
  );
}

/**
 * 1.5px rule of the receipt: dashed ink between parts, dotted grey for the blank lines. Drawn in
 * SVG: a dashed or dotted border on one side of a View is unreliable on Android.
 */
function Rule({ dotted = false, className }: { dotted?: boolean; className?: string }) {
  return (
    <View className={className}>
      <Svg height={2} width="100%">
        <Line
          x1={0}
          y1={1}
          x2="100%"
          y2={1}
          stroke={dotted ? LABEL.inkMuted : LABEL.ink}
          strokeWidth={1.5}
          strokeDasharray={dotted ? '1.5 3' : '5 4'}
        />
      </Svg>
    </View>
  );
}

/** Half-discs of the page color bitten out of the bottom of the receipt, every 12px. */
function ScallopedEdge() {
  return (
    <View className="border-ink h-2.5 border-x-2">
      <Svg height={10} width="100%">
        <Defs>
          <Pattern id="ticket-scallops" width={12} height={10} patternUnits="userSpaceOnUse">
            <Rect width={12} height={10} fill={LABEL.field} />
            <Circle cx={6} cy={10} r={5} fill={LABEL.paper} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ticket-scallops)" />
      </Svg>
    </View>
  );
}
