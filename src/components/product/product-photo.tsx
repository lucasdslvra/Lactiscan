import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';

const SIZES = {
  /** Product sheet: 96 pt, labelled « PHOTO ». */
  md: { frame: 'h-24 w-24', hatch: 12, label: true },
  /** Alternatives list: 60 pt thumbnail, hatch only. */
  sm: { frame: 'h-[60px] w-[60px]', hatch: 10, label: false },
} as const;

/**
 * Front photo in a square frame. The hatched placeholder shows while it loads, and stays when
 * the product has no photo or the photo fails. Key it by `uri` to reset it.
 */
export function ProductPhoto({
  uri,
  size = 'md',
}: {
  uri: string | null;
  size?: keyof typeof SIZES;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && !failed;
  const { frame, hatch, label } = SIZES[size];
  const patternId = `photo-hatch-${size}`;

  return (
    <View
      aria-hidden
      className={cn(
        'border-ink shrink-0 items-center justify-center overflow-hidden border-2',
        frame
      )}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id={patternId}
            width={hatch}
            height={hatch}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <Rect width={hatch / 2} height={hatch} fill={LABEL.paperHatch} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={LABEL.paper} />
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
      {label && (
        <Text className="bg-paper font-mono text-ink px-[5px] py-0.5 text-[10px] tracking-[1px]">
          PHOTO
        </Text>
      )}
      {showPhoto && (
        <Image
          source={{ uri }}
          contentFit="contain"
          transition={150}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, loaded && { backgroundColor: LABEL.field }]}
        />
      )}
    </View>
  );
}
