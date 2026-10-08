import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

/** Square box of the profile options, ticked when the option is selected. */
export function CheckSquare({
  checked,
  color,
  className,
}: {
  checked: boolean;
  color: string;
  className?: string;
}) {
  return (
    <View
      aria-hidden
      className={cn('h-[22px] w-[22px] items-center justify-center border-2', className)}
      style={{ borderColor: color }}>
      {checked && <Check color={color} size={14} strokeWidth={3} />}
    </View>
  );
}
