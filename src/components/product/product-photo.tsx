import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { LABEL } from '@/lib/theme';

/**
 * Front photo in a 96 pt frame. The hatched « PHOTO » placeholder shows while it loads, and
 * stays when the product has no photo or the photo fails. Key it by `uri` to reset it.
 */
export function ProductPhoto({ uri }: { uri: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && !failed;

  return (
    <View
      aria-hidden
      className="border-ink h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-2">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="photo-hatch"
            width={12}
            height={12}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <Rect width={6} height={12} fill={LABEL.paperHatch} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={LABEL.paper} />
        <Rect width="100%" height="100%" fill="url(#photo-hatch)" />
      </Svg>
      <Text className="bg-paper font-mono text-ink px-[5px] py-0.5 text-[10px] tracking-[1px]">
        PHOTO
      </Text>
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
