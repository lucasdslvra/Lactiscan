import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useVerdictSettings } from '@/hooks/use-verdict-settings';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { profileLabel, type MilkMode } from '@/lib/verdict';

// The mockup only shows « Sans lait strict » (« Sans lait » blue); « Sans lactose » takes the
// color of its own verdict.
const MODE_COLOR: Record<MilkMode, string> = {
  strict: LABEL.verdictFree,
  'lactose-free': LABEL.verdictLactose,
};

/**
 * Reminder of the active profile, top left of the scan screens; opens Réglages.
 * `dark` over the camera, `light` on paper.
 */
export function ProfileBadge({ tone }: { tone: 'dark' | 'light' }) {
  const settings = useVerdictSettings();
  const label = profileLabel(settings);
  const dark = tone === 'dark';

  return (
    <Pressable
      role="link"
      aria-label={`Profil actif : ${label.toLowerCase()}. Modifier dans Réglages.`}
      onPress={() => router.navigate('/reglages')}
      className={cn(
        'h-11 shrink flex-row items-center gap-2 self-start border-[1.5px] px-3',
        dark ? 'border-paper' : 'border-ink'
      )}>
      <View
        aria-hidden
        className={cn('h-2.5 w-2.5', !dark && 'border-ink border-[1.5px]')}
        style={{ backgroundColor: MODE_COLOR[settings.mode] }}
      />
      <Text
        numberOfLines={1}
        className={cn(
          'font-mono shrink text-[11px] tracking-[1.1px]',
          dark ? 'text-paper' : 'text-ink'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
