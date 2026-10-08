import { Pressable, View } from 'react-native';

import { DashedRule } from '@/components/profile/dashed-rule';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const LABEL_TEXT = 'Exclure aussi « peut contenir des traces de lait »';

/**
 * « Sans lait strict » option: also treat « may contain milk » products as unsuitable.
 * Square switch of the mockup, in a 68×48 touch target.
 */
export function TracesToggle({
  value,
  onChange,
  variant,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  /** Dashed rules above and below on the profile screen, a solid one below in Réglages. */
  variant: 'onboarding' | 'settings';
}) {
  const onboarding = variant === 'onboarding';

  return (
    <View>
      {onboarding && <DashedRule />}
      <View
        className={cn(
          'flex-row items-center justify-between gap-3 py-1',
          !onboarding && 'border-ink border-b-[1.5px] pl-0.5'
        )}>
        <Text
          className={cn(
            'font-body text-ink flex-1',
            onboarding ? 'text-sm leading-[19px]' : 'text-[15px] leading-5'
          )}>
          {LABEL_TEXT}
        </Text>
        <Pressable
          role="switch"
          aria-checked={value}
          aria-label={LABEL_TEXT}
          onPress={() => onChange(!value)}
          className="h-12 w-[68px] shrink-0 items-center justify-center">
          <View
            className={cn(
              'border-ink h-[30px] w-14 flex-row border-2 p-[3px]',
              value ? 'bg-ink justify-end' : 'bg-paper justify-start'
            )}>
            <View className={cn('h-5 w-5', value ? 'bg-paper' : 'bg-ink')} />
          </View>
        </Pressable>
      </View>
      {onboarding && <DashedRule />}
    </View>
  );
}
