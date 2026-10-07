import { View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { VerdictIcon } from '@/components/product/verdict-icon';
import { Text } from '@/components/ui/text';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { MODE_LABEL, type MilkMode, type Verdict, type VerdictKind } from '@/lib/verdict';

type DisplayedKind = Exclude<VerdictKind, 'not-found'>;

interface Variant {
  title: string;
  /** Spoken label, as the title is split over two lines. */
  label: string;
  /** Inner panel: background, and the dashed border of « Information incomplète ». */
  panel: string;
  /** Text and icon color. */
  ink: string;
  inkClass: string;
  /** Rule above the detail line. */
  ruleClass: string;
  /** The card tilts like a label stuck on by hand. */
  tilt: string;
}

const INK = { ink: LABEL.ink, inkClass: 'text-ink', ruleClass: 'border-ink' };

// « Système visuel · verdicts » mockup: color + icon + text, readable in greyscale.
const VARIANTS: Record<DisplayedKind, Variant> = {
  'contains-milk': {
    title: 'Contient\ndu lait',
    label: 'contient du lait',
    panel: 'bg-verdict-milk',
    ink: LABEL.verdictMilkFg,
    inkClass: 'text-verdict-milk-fg',
    ruleClass: 'border-verdict-milk-rule',
    tilt: '-rotate-[1.2deg]',
  },
  'lactose-free': {
    title: 'Sans\nlactose',
    label: 'sans lactose, contient du lait',
    panel: 'bg-verdict-lactose',
    ...INK,
    tilt: '-rotate-[1.2deg]',
  },
  traces: {
    title: 'Traces\npossibles',
    label: 'traces de lait possibles',
    panel: 'bg-verdict-traces',
    ...INK,
    tilt: '-rotate-[1.2deg]',
  },
  'milk-free': {
    title: 'Sans\nlait',
    label: 'sans lait',
    panel: 'bg-verdict-free',
    ...INK,
    tilt: 'rotate-[1deg]',
  },
  incomplete: {
    title: 'Information\nincomplète',
    label: 'information incomplète',
    panel: 'bg-paper border-ink border-[2.5px] border-dashed',
    ...INK,
    tilt: '-rotate-[1.2deg]',
  },
};

function detailLine({ kind, acceptable, milkTraces }: Verdict): string {
  switch (kind) {
    case 'contains-milk':
      return 'LAIT DANS LES ALLERGÈNES';
    case 'lactose-free':
      return 'CONTIENT DU LAIT';
    case 'traces':
      return acceptable ? 'PEUT CONTENIR DES TRACES DE LAIT' : 'TRACES EXCLUES PAR VOS RÉGLAGES';
    case 'milk-free':
      return milkTraces ? 'TRACES DE LAIT POSSIBLES' : 'AUCUN INGRÉDIENT LAITIER · AUCUNE TRACE';
    default:
      return 'INGRÉDIENTS OU ALLERGÈNES MANQUANTS';
  }
}

/** Hatched band of « Traces possibles », the one verdict told apart by a pattern too. */
function TracesBand() {
  return (
    <Svg height={12} width="100%" aria-hidden>
      <Defs>
        <Pattern
          id="traces-band"
          width={12}
          height={12}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)">
          <Rect width={6} height={12} fill={LABEL.ink} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={LABEL.verdictTraces} />
      <Rect width="100%" height="100%" fill="url(#traces-band)" />
    </Svg>
  );
}

/** The verdict as a big label, for the active profile. Nothing for an unknown product. */
export function VerdictCard({ verdict, mode }: { verdict: Verdict; mode: MilkMode }) {
  if (verdict.kind === 'not-found') return null;
  const variant = VARIANTS[verdict.kind];
  const isTraces = verdict.kind === 'traces';

  return (
    <View className={cn('border-ink bg-paper mx-[18px] mt-[26px] border-[3px] p-1', variant.tilt)}>
      <View role="status" aria-label={`Verdict : ${variant.label}`} className={variant.panel}>
        {isTraces && <TracesBand />}
        <View className={cn('gap-2.5 px-4', isTraces ? 'py-2' : 'py-3.5')}>
          <View className="flex-row items-center justify-between">
            <Text className={cn('font-mono text-[11px] tracking-[1.3px]', variant.inkClass)}>
              VERDICT · {MODE_LABEL[mode]}
            </Text>
            <View
              aria-hidden
              className="h-10 w-10 items-center justify-center rounded-full border-[2.5px]"
              style={{ borderColor: variant.ink }}>
              <VerdictIcon kind={verdict.kind} color={variant.ink} />
            </View>
          </View>
          <Text
            aria-hidden
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            className={cn(
              'font-display text-[62px] uppercase leading-[54px]',
              variant.inkClass
            )}>
            {variant.title}
          </Text>
          <View className={cn('border-t-[1.5px] pt-2', variant.ruleClass)}>
            <Text className={cn('font-mono text-[11px] tracking-[1.1px]', variant.inkClass)}>
              {detailLine(verdict)}
            </Text>
          </View>
        </View>
        {isTraces && <TracesBand />}
      </View>
    </View>
  );
}
