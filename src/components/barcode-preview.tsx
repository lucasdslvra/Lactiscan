import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { eanBarModules, formatGtin } from '@/lib/barcode';
import { LABEL } from '@/lib/theme';

const BAR_HEIGHT = 60;

/** Consecutive bar modules merged into `[start, width]` runs, one rectangle each. */
function barRuns(modules: string): [number, number][] {
  const runs: [number, number][] = [];
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] !== '1') continue;
    const start = i;
    while (modules[i + 1] === '1') i++;
    runs.push([start, i - start + 1]);
  }
  return runs;
}

/** The typed code drawn as its real EAN bars, with the digits grouped as on a label. */
export function BarcodePreview({ code }: { code: string }) {
  const modules = eanBarModules(code);
  if (!modules) return null;

  return (
    <View className="border-ink bg-field items-center gap-2 border-2 p-4" aria-hidden>
      <Svg
        width="100%"
        height={BAR_HEIGHT}
        viewBox={`0 0 ${modules.length} ${BAR_HEIGHT}`}
        preserveAspectRatio="none">
        {barRuns(modules).map(([x, width]) => (
          <Rect key={x} x={x} width={width} height={BAR_HEIGHT} fill={LABEL.ink} />
        ))}
      </Svg>
      <Text className="font-mono text-ink text-sm tracking-[4px]">{formatGtin(code)}</Text>
    </View>
  );
}
