import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { VerdictIcon } from '@/components/product/verdict-icon';
import { Text } from '@/components/ui/text';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { VerdictKind } from '@/lib/verdict';

type DisplayedKind = Exclude<VerdictKind, 'not-found'>;

interface Badge {
  text: string;
  /** Background, and the dashed border of « Information incomplète ». */
  panel: string;
  ink: string;
  inkClass: string;
  /** « Traces possibles » is hatched, as in the mockup, to tell it from « Sans lait » in grey. */
  hatched?: boolean;
}

const INK = { ink: LABEL.ink, inkClass: 'text-ink' };

// « 06 · Historique » mockup and the « Système visuel » colors: color + icon + text.
const BADGES: Record<DisplayedKind, Badge> = {
  'contains-milk': {
    text: 'CONTIENT DU LAIT',
    panel: 'bg-verdict-milk',
    ink: LABEL.verdictMilkFg,
    inkClass: 'text-verdict-milk-fg',
  },
  'lactose-free': { text: 'SANS LACTOSE', panel: 'bg-verdict-lactose', ...INK },
  traces: { text: 'TRACES POSSIBLES', panel: '', hatched: true, ...INK },
  'milk-free': { text: 'SANS LAIT', panel: 'bg-verdict-free', ...INK },
  incomplete: { text: 'INFORMATION INCOMPLÈTE', panel: 'border-dashed', ...INK },
};

/** Small verdict label of a list row, recomputed for the active profile by the caller. */
export function VerdictBadge({ kind }: { kind: DisplayedKind }) {
  const badge = BADGES[kind];

  return (
    <View
      className={cn(
        'border-ink flex-row items-center gap-[5px] self-start overflow-hidden',
        'border-[1.5px] px-[7px] py-[3px]',
        badge.panel
      )}>
      {badge.hatched && <Hatch />}
      <VerdictIcon kind={kind} color={badge.ink} size={12} />
      <Text className={cn('font-mono-semibold text-[10px] tracking-[0.8px]', badge.inkClass)}>
        {badge.text}
      </Text>
    </View>
  );
}

/** 4px diagonal stripes, light and dark peach. */
function Hatch() {
  return (
    <Svg style={StyleSheet.absoluteFill} aria-hidden>
      <Defs>
        <Pattern
          id="verdict-badge-hatch"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)">
          <Rect width={4} height={8} fill={LABEL.verdictTraces} />
          <Rect x={4} width={4} height={8} fill={LABEL.verdictTracesHatch} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#verdict-badge-hatch)" />
    </Svg>
  );
}
