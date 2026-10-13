import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { LABEL } from '@/lib/theme';

/** Bars of one 36px repeat of the « Choix du profil » mockup stripe, as `[x, width]`. */
const BARS: [number, number][] = [
  [0, 2],
  [4, 1],
  [7, 3],
  [11, 1],
  [15, 2],
  [18, 1],
  [22, 3],
  [26, 1],
  [29, 1],
  [33, 2],
];

/** Decorative barcode band under the app name, or on the empty history ticket. */
export function BarcodeStripe({ height = 28 }: { height?: number }) {
  const id = `barcode-stripe-${height}`;
  return (
    <Svg height={height} width="100%" aria-hidden>
      <Defs>
        <Pattern id={id} width={36} height={height} patternUnits="userSpaceOnUse">
          {BARS.map(([x, width]) => (
            <Rect key={x} x={x} width={width} height={height} fill={LABEL.ink} />
          ))}
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
