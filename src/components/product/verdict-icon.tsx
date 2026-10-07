import Svg, { Circle, Path } from 'react-native-svg';

import type { VerdictKind } from '@/lib/verdict';

type DisplayedKind = Exclude<VerdictKind, 'not-found'>;

/** One shape per verdict, so verdicts stay distinct in greyscale. Paths from the mockup. */
export function VerdictIcon({
  kind,
  color,
  size = 22,
}: {
  kind: DisplayedKind;
  color: string;
  size?: number;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: kind === 'contains-milk' || kind === 'milk-free' ? 3 : 2.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  } as const;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'contains-milk' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {kind === 'milk-free' && <Path d="M5 12.5l4.5 4.5L19 7" {...stroke} />}
      {kind === 'lactose-free' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M12 3a9 9 0 0 1 0 18z" {...stroke} fill={color} />
        </>
      )}
      {kind === 'traces' && (
        <>
          <Path d="M12 3.5L21.5 20h-19z" {...stroke} />
          <Path d="M12 10v4.5M12 17.5v.01" {...stroke} />
        </>
      )}
      {kind === 'incomplete' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17.2v.01" {...stroke} />
        </>
      )}
    </Svg>
  );
}
