import { View } from 'react-native';

import { DashedRule } from '@/components/profile/dashed-rule';

/**
 * Tear-off line between the product and its alternatives: a dashed rule between two ink
 * half-discs that bite into the screen edges, like a ticket stub.
 */
export function TicketDivider() {
  return (
    <View aria-hidden className="mt-[34px] h-6 justify-center">
      <View className="bg-ink absolute -left-3 top-0 h-6 w-6 rounded-full" />
      <DashedRule className="mx-[22px]" />
      <View className="bg-ink absolute -right-3 top-0 h-6 w-6 rounded-full" />
    </View>
  );
}
