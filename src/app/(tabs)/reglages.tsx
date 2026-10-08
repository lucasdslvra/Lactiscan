import Constants from 'expo-constants';
import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { CheckSquare } from '@/components/profile/check-square';
import { DashedRule } from '@/components/profile/dashed-rule';
import { PROFILES, type ProfileCopy } from '@/components/profile/profile-copy';
import { TracesToggle } from '@/components/profile/traces-toggle';
import { Text } from '@/components/ui/text';
import { setVerdictSettings, useVerdictSettings } from '@/hooks/use-verdict-settings';
import { FONTS, LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';

// Version of the bundled equivalences JSON; to be read from it once it ships (E6).
const EQUIVALENCES_VERSION = '28/09/2026';

/** « 07 · Réglages » mockup: profile, data and about. Every change is saved at once. */
export default function ReglagesScreen() {
  const insets = useSafeAreaInsets();
  const settings = useVerdictSettings();

  return (
    <ScrollView
      className="bg-paper flex-1"
      contentContainerClassName="pb-6"
      contentContainerStyle={{ paddingTop: insets.top + 20 }}>
      <Text
        role="heading"
        className="font-display text-ink px-5 text-[58px] uppercase leading-[49px]">
        Réglages
      </Text>

      <Section title="PROFIL" className="pt-[22px]">
        {PROFILES.map((profile) => (
          <ProfileRow
            key={profile.mode}
            profile={profile}
            selected={settings.mode === profile.mode}
            // The traces option is kept when switching to « Sans lactose »: hidden and ignored
            // there, it comes back as it was.
            onPress={() => setVerdictSettings({ ...settings, mode: profile.mode })}
          />
        ))}
        {settings.mode === 'strict' && (
          <TracesToggle
            value={settings.excludeTraces}
            onChange={(excludeTraces) => setVerdictSettings({ ...settings, excludeTraces })}
            variant="settings"
          />
        )}
        <Note>Changer de profil recalcule aussitôt les verdicts et les alternatives.</Note>
      </Section>

      <Section title="DONNÉES">
        <View className="border-ink flex-row items-center justify-between border-b-[1.5px] pb-3 pt-1.5">
          <Text className="font-body text-ink text-base">Équivalences</Text>
          <Text className="font-mono text-ink text-[11px] tracking-[0.9px]">
            VERSION DU {EQUIVALENCES_VERSION}
          </Text>
        </View>
        {/* Wired with the offline history (E9); shown as in the mockup until then. */}
        <Pressable
          role="button"
          disabled
          className="border-verdict-milk h-[52px] flex-row items-center justify-center gap-2.5 border-2">
          <Trash2 color={LABEL.verdictMilk} size={20} strokeWidth={2} />
          <Text className="font-body-bold text-verdict-milk text-base">
            Effacer l&apos;historique
          </Text>
        </Pressable>
        <Note>Une confirmation vous sera demandée. Vos réglages sont conservés.</Note>
      </Section>

      <Section title="À PROPOS">
        <View className="border-ink bg-field gap-2.5 border-2 p-3.5">
          <Text className="font-body text-ink text-[15px] leading-[22px]">
            Données produits :{' '}
            <ExternalLink
              href="https://world.openfoodfacts.org"
              style={{
                fontFamily: FONTS.bodyBold,
                color: LABEL.link,
                textDecorationLine: 'underline',
              }}>
              Open Food Facts
            </ExternalLink>
            , sous licence ODbL.
          </Text>
          <Text className="font-body text-ink text-[15px] leading-[22px]">
            Aucune donnée personnelle collectée. Historique et réglages restent sur ce téléphone.
          </Text>
          <View className="gap-2.5">
            <DashedRule />
            <View className="flex-row justify-between">
              <Text className="font-mono text-ink text-[11px] tracking-[0.9px]">
                MILKAPP {Constants.expoConfig?.version}
              </Text>
              <Text className="font-mono text-ink text-[11px] tracking-[0.9px]">
                ANDROID · HORS STORE
              </Text>
            </View>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <View className={cn('gap-2.5 px-5 pt-[26px]', className)}>
      <View role="heading" className="flex-row items-center gap-2.5">
        <Text className="font-mono-semibold text-ink text-[11px] tracking-[1.3px]">{title}</Text>
        <DashedRule className="flex-1" />
      </View>
      {children}
    </View>
  );
}

function Note({ children }: { children: string }) {
  return <Text className="font-body text-ink-muted text-[13px] leading-[18px]">{children}</Text>;
}

function ProfileRow({
  profile,
  selected,
  onPress,
}: {
  profile: ProfileCopy;
  selected: boolean;
  onPress: () => void;
}) {
  const inkClass = selected ? 'text-paper' : 'text-ink';

  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={onPress}
      className={cn(
        'border-ink flex-row items-start gap-3.5 border-2 p-3.5',
        selected ? 'bg-ink' : 'bg-paper'
      )}>
      <CheckSquare checked={selected} color={selected ? LABEL.paper : LABEL.ink} className="mt-px" />
      <View className="flex-1 gap-[3px]">
        <Text className={cn('font-body-bold text-[17px]', inkClass)}>{profile.title}</Text>
        <Text className={cn('font-body text-sm leading-[20px] opacity-[0.85]', inkClass)}>
          {profile.settings}
        </Text>
      </View>
    </Pressable>
  );
}
