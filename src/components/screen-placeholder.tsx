import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface ScreenPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}

/** Centered icon + title + description, for screens whose feature is not built yet. */
export function ScreenPlaceholder({ icon, title, description, children }: ScreenPlaceholderProps) {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-4 px-6">
      <View className="bg-muted rounded-full p-5">
        <Icon as={icon} size={40} className="text-muted-foreground" />
      </View>
      <Text variant="h3" className="text-center">
        {title}
      </Text>
      <Text variant="muted" className="max-w-xs text-center">
        {description}
      </Text>
      {children}
    </View>
  );
}
