import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeStripe } from '@/components/profile/barcode-stripe';
import { CheckSquare } from '@/components/profile/check-square';
import { PROFILES, type ProfileCopy } from '@/components/profile/profile-copy';
import { TracesToggle } from '@/components/profile/traces-toggle';
import { Text } from '@/components/ui/text';
import { setVerdictSettings } from '@/hooks/use-verdict-settings';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { MilkMode } from '@/lib/verdict';

/**
 * « 01 · Choix du profil » mockup, shown until a profile is saved. No mode is preselected:
 * nothing is saved before « Commencer à scanner ».
 */
export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<MilkMode | null>(null);
  const [excludeTraces, setExcludeTraces] = useState(false);

  function start() {
    if (!mode) return;
    // The root layout's guard then removes this screen and opens the tabs, on Scan: navigating
    // from here would race the guard, as the tabs are not mounted yet.
    setVerdictSettings({ mode, excludeTraces });
  }

  return (
    <ScrollView
      className="bg-paper flex-1"
      contentContainerClassName="grow gap-4 px-5"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}>
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-ink text-[22px] tracking-[0.9px]">MILKAPP</Text>
        <Text className="font-mono text-ink text-[11px] tracking-[1.3px]">PREMIER LANCEMENT</Text>
      </View>

      <BarcodeStripe />

      <View className="gap-2.5">
        <Text role="heading" className="font-display text-ink text-[60px] uppercase leading-[52px]">
          {'Lactose\nou lait ?'}
        </Text>
        <Text className="font-body text-ink text-base leading-[23px]">
          Le verdict dépend de votre profil. Choisissez-le une fois, l&apos;app s&apos;en souvient.
        </Text>
      </View>

      <View role="radiogroup" aria-label="Profil" className="gap-3">
        {PROFILES.map((profile) => (
          <ProfileCard
            key={profile.mode}
            profile={profile}
            selected={mode === profile.mode}
            onPress={() => setMode(profile.mode)}
          />
        ))}
      </View>

      {mode === 'strict' && (
        <TracesToggle value={excludeTraces} onChange={setExcludeTraces} variant="onboarding" />
      )}

      <View className="grow" />

      {mode ? (
        <Pressable
          role="button"
          onPress={start}
          className="bg-ink active:bg-ink/90 h-[60px] flex-row items-center justify-between px-5">
          <Text className="font-display-bold text-paper text-2xl uppercase tracking-[0.5px]">
            Commencer à scanner
          </Text>
          <ArrowRight color={LABEL.paper} size={26} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <Pressable
          role="button"
          disabled
          aria-disabled
          className="border-ink h-[60px] items-center justify-center border-2 border-dashed">
          <Text className="font-body text-ink-muted text-[15px]">
            Choisissez un profil pour continuer
          </Text>
        </Pressable>
      )}

      <Text className="font-mono text-ink-muted text-center text-[11px] tracking-[0.9px]">
        MODIFIABLE À TOUT MOMENT DANS RÉGLAGES
      </Text>
    </ScrollView>
  );
}

function ProfileCard({
  profile,
  selected,
  onPress,
}: {
  profile: ProfileCopy;
  selected: boolean;
  onPress: () => void;
}) {
  const ink = selected ? LABEL.paper : LABEL.ink;
  const inkClass = selected ? 'text-paper' : 'text-ink';

  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={onPress}
      className={cn('border-ink gap-1.5 border-2 px-4 py-3.5', selected ? 'bg-ink' : 'bg-paper')}>
      <View className="flex-row items-center justify-between">
        <Text className={cn('font-mono text-[11px] tracking-[1.3px]', inkClass)}>
          {profile.tag}
        </Text>
        <CheckSquare checked={selected} color={ink} />
      </View>
      <Text className={cn('font-display-bold text-[32px] uppercase leading-8', inkClass)}>
        {profile.title}
      </Text>
      <Text className={cn('font-body text-sm leading-[20px] opacity-[0.85]', inkClass)}>
        {profile.onboarding}
      </Text>
    </Pressable>
  );
}
