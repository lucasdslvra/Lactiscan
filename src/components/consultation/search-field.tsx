import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

import { FONTS, LABEL } from '@/lib/theme';

/** Food search field of the « 05 · Consultation » mockup; the keyboard key launches the search. */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <View className="border-ink bg-field h-14 flex-row items-center gap-2 border-2 pl-3.5 pr-1">
      <Search color={LABEL.ink} size={22} strokeWidth={2} aria-hidden />
      <TextInput
        aria-label="Rechercher un aliment"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        placeholder="Beurre, lait, crème…"
        placeholderTextColor={LABEL.inkMuted}
        selectionColor={LABEL.link}
        style={{ fontFamily: FONTS.body }}
        className="text-ink h-full min-w-0 flex-1 text-lg"
      />
      {value.length > 0 && (
        <Pressable
          role="button"
          aria-label="Effacer la recherche"
          onPress={onClear}
          className="active:bg-paper-dim h-11 w-11 items-center justify-center">
          <X color={LABEL.ink} size={20} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
