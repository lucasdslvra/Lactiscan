import { useState } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EquivalenceCard } from '@/components/consultation/equivalence-card';
import { SearchField } from '@/components/consultation/search-field';
import { SuggestionChips } from '@/components/consultation/suggestion-chips';
import { Text } from '@/components/ui/text';
import { useEquivalences } from '@/hooks/use-equivalences';
import { useVerdictSettings } from '@/hooks/use-verdict-settings';
import {
  MIN_QUERY_LENGTH,
  foodSuggestions,
  isSameTerm,
  normalizeTerm,
  searchFoods,
} from '@/lib/food-search';

/**
 * « 05 · Consultation » mockup: search a generic food (« beurre », « crème fraîche ») and see
 * what replaces it for the active profile. Everything comes from the equivalences file kept on
 * the phone, so it works offline. Suggestions follow the typing; the keyboard key or a
 * suggestion launches the search.
 */
export default function ConsultationScreen() {
  const insets = useSafeAreaInsets();
  const equivalences = useEquivalences();
  const settings = useVerdictSettings();
  const [query, setQuery] = useState('');
  // Last term searched; the card stays on it while another one is typed.
  const [searched, setSearched] = useState<string | null>(null);

  const suggestions = foodSuggestions(equivalences, query).map((suggestion) => suggestion.label);
  const food = searched === null ? null : (searchFoods(equivalences, searched)[0] ?? null);

  function search(term: string) {
    // Nothing is searched below two letters: the field just keeps what was typed.
    if (normalizeTerm(term).length < MIN_QUERY_LENGTH) return;
    setQuery(term);
    setSearched(term);
    Keyboard.dismiss();
  }

  function clear() {
    setQuery('');
    setSearched(null);
  }

  return (
    <ScrollView
      className="bg-paper flex-1"
      contentContainerClassName="pb-6"
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <View className="gap-3.5 px-5">
        <Text className="font-mono text-ink text-[11px] tracking-[1.3px]">
          À LA MAISON · CONSULTATION
        </Text>
        <Text
          role="heading"
          className="font-display text-ink text-[54px] uppercase leading-[47px]">
          Par quoi{'\n'}remplacer ?
        </Text>
        <SearchField
          value={query}
          onChangeText={setQuery}
          onSubmit={() => search(query)}
          onClear={clear}
        />
        {suggestions.length > 0 ? (
          <SuggestionChips
            labels={suggestions}
            isActive={(label) => searched !== null && isSameTerm(label, searched)}
            onPick={search}
          />
        ) : (
          // Before anything is typed: every food of the file, to start without the keyboard.
          query.trim() === '' && (
            <View className="gap-2.5 pt-1">
              <Text className="font-mono-semibold text-ink text-[11px] tracking-[1.1px]">
                ALIMENTS DISPONIBLES
              </Text>
              <SuggestionChips
                labels={equivalences.manual.map((manual) => manual.name)}
                isActive={() => false}
                onPick={search}
              />
            </View>
          )
        )}
      </View>

      {food ? (
        <EquivalenceCard food={food} file={equivalences} settings={settings} />
      ) : (
        searched !== null && <NoFood term={searched} />
      )}
    </ScrollView>
  );
}

function NoFood({ term }: { term: string }) {
  return (
    <View className="border-ink bg-field mx-3 mt-[22px] gap-2 border-2 p-4">
      <Text className="font-mono text-ink text-[10px] tracking-[1.2px]">AUCUN ALIMENT TROUVÉ</Text>
      <Text className="font-display text-ink text-3xl uppercase leading-[27px]">
        Rien pour « {term.trim()} »
      </Text>
      <Text className="font-body text-ink text-sm leading-[20px]">
        Essayez un aliment courant : beurre, lait, crème, yaourt, fromage râpé…
      </Text>
    </View>
  );
}
