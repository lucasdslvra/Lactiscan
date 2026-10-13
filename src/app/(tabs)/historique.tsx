import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyHistory } from '@/components/history/empty-history';
import { HistoryRow } from '@/components/history/history-row';
import { OfflineBanner, useIsOffline } from '@/components/history/offline-banner';
import { DashedRule } from '@/components/profile/dashed-rule';
import { Text } from '@/components/ui/text';
import { useHistory } from '@/hooks/use-history';
import { useVerdictSettings } from '@/hooks/use-verdict-settings';
import { groupByDay, historyCountLabel } from '@/lib/history';
import { cn } from '@/lib/utils';
import { profileLabel } from '@/lib/verdict';

/**
 * « 06 · Historique hors ligne » and « 10 · Historique vide » mockups: the products consulted,
 * most recent first, by day, with their verdict recomputed for the active profile. Each sheet
 * opens from the copy kept on the phone, so the list stays usable without network.
 */
export default function HistoriqueScreen() {
  const insets = useSafeAreaInsets();
  const history = useHistory();
  const settings = useVerdictSettings();
  const offline = useIsOffline();
  const now = useNowOnFocus();
  const sections = groupByDay(history, now);

  return (
    <ScrollView
      className="bg-paper flex-1"
      contentContainerClassName="grow pb-6"
      contentContainerStyle={{ paddingTop: insets.top + 20 }}>
      <View className="gap-3.5 px-5">
        <View className="flex-row items-end justify-between">
          <Text
            role="heading"
            className="font-display text-ink text-[58px] uppercase leading-[49px]">
            Historique
          </Text>
          <Text className="font-mono text-ink pb-1 text-[11px] tracking-[1.1px]">
            {historyCountLabel(history.length)}
          </Text>
        </View>
        {offline && history.length > 0 && <OfflineBanner />}
      </View>

      {history.length === 0 ? (
        <EmptyHistory />
      ) : (
        <View className="px-5 pt-1">
          {sections.map((section, index) => (
            <View key={section.title}>
              <View
                role="heading"
                className={cn(
                  'flex-row items-center gap-2.5',
                  index === 0 ? 'mt-[18px]' : 'mt-[22px]'
                )}>
                <Text className="font-mono-semibold text-ink text-[11px] tracking-[1.3px]">
                  {section.title}
                </Text>
                <DashedRule className="flex-1" />
              </View>
              {section.entries.map((entry) => (
                <HistoryRow key={entry.code} entry={entry} settings={settings} />
              ))}
            </View>
          ))}
          <Text className="font-mono text-ink-muted mt-4 text-[10px] leading-[15px] tracking-[0.8px]">
            VERDICTS RECALCULÉS SELON VOTRE PROFIL ACTUEL : {profileLabel(settings)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/**
 * The time when the tab was last shown: tabs stay mounted, so « AUJOURD'HUI » and « HIER » are
 * worked out again each time the user comes back, past midnight too.
 */
function useNowOnFocus(): number {
  const [now, setNow] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, [])
  );
  return now;
}
