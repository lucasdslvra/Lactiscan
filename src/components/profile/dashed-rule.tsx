import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * 2px dashed ink rule. Drawn in SVG: a dashed border on a single side of a View is not
 * rendered reliably on Android.
 */
export function DashedRule({ className }: { className?: string }) {
  return (
    <View aria-hidden className={cn('h-0.5', className)}>
      <Svg height={2} width="100%">
        <Line
          x1={0}
          y1={1}
          x2="100%"
          y2={1}
          stroke={LABEL.ink}
          strokeWidth={2}
          strokeDasharray="6 6"
        />
      </Svg>
    </View>
  );
}
