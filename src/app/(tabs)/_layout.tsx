import { Tabs } from 'expo-router';
import { History, ScanBarcode, Search, SlidersHorizontal } from 'lucide-react-native';
import { Text, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS, LABEL } from '@/lib/theme';

const TAB_BAR_HEIGHT = 68;

// Every tab but the first is separated from its left neighbour by an ink rule.
const separatedItem = { borderLeftWidth: 1.5, borderLeftColor: LABEL.ink };

function TabLabel({
  focused,
  color,
  children,
}: {
  focused: boolean;
  color: ColorValue;
  children: string;
}) {
  return (
    <Text
      style={{ color, fontSize: 12, fontFamily: focused ? FONTS.bodyBold : FONTS.body }}
      numberOfLines={1}>
      {children}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: LABEL.paper,
        tabBarInactiveTintColor: LABEL.ink,
        tabBarActiveBackgroundColor: LABEL.ink,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: LABEL.paper,
          borderTopWidth: 2,
          borderTopColor: LABEL.ink,
        },
        tabBarItemStyle: separatedItem,
        tabBarLabel: TabLabel,
      }}>
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarItemStyle: { borderLeftWidth: 0 },
          tabBarIcon: ({ color }) => <ScanBarcode color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="consultation"
        options={{
          title: 'Consultation',
          tabBarIcon: ({ color }) => <Search color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => <History color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="reglages"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color }) => <SlidersHorizontal color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
