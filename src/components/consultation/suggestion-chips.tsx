import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Row of terms under the search field; tapping one searches it. The term of the food shown is
 * filled in ink.
 */
export function SuggestionChips({
  labels,
  isActive,
  onPick,
}: {
  labels: readonly string[];
  isActive: (label: string) => boolean;
  onPick: (label: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {labels.map((label) => {
        const active = isActive(label);
        return (
          <Pressable
            key={label}
            role="button"
            aria-pressed={active}
            onPress={() => onPick(label)}
            className={cn(
              'border-ink h-11 justify-center border-[1.5px] px-3.5',
              active ? 'bg-ink' : 'active:bg-paper-dim'
            )}>
            <Text className={cn('font-body text-sm', active ? 'text-paper' : 'text-ink')}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
