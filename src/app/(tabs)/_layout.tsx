import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeTabs, type SFSymbolIcon } from 'expo-router/native-tabs';
import type { ComponentProps } from 'react';

import { navigationStrings } from '@/components/navigation/navigation-strings';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type SFSymbol = Extract<SFSymbolIcon['sf'], string>;

type TabDefinition = {
  icon: { default: IoniconName; selected: IoniconName };
  label: string;
  name: 'appointments' | 'find-care' | 'home' | 'profile';
  symbol: { default: SFSymbol; selected: SFSymbol };
};

/**
 * The system tab bar: Liquid Glass on iOS 26 and later, Material 3 navigation
 * on Android. iOS draws SF Symbols; Android and web use the same Ionicons as
 * the rest of the app.
 */
export default function TabLayout() {
  const theme = useAppTheme();
  const strings = useStrings(navigationStrings);
  const tabs: readonly TabDefinition[] = [
    {
      icon: { default: 'home-outline', selected: 'home' },
      label: strings.tabs.home,
      name: 'home',
      symbol: { default: 'house', selected: 'house.fill' },
    },
    {
      icon: { default: 'search-outline', selected: 'search' },
      label: strings.tabs.findCare,
      name: 'find-care',
      symbol: { default: 'magnifyingglass', selected: 'magnifyingglass' },
    },
    {
      icon: { default: 'calendar-outline', selected: 'calendar' },
      label: strings.tabs.appointments,
      name: 'appointments',
      symbol: { default: 'calendar', selected: 'calendar' },
    },
    {
      icon: { default: 'person-outline', selected: 'person' },
      label: strings.tabs.profile,
      name: 'profile',
      symbol: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' },
    },
  ];

  return (
    <NativeTabs
      backgroundColor={theme.colors.surfaceRaised}
      iconColor={{ default: theme.colors.textSecondary, selected: theme.colors.brand }}
      indicatorColor={theme.colors.brandSoft}
      labelStyle={{
        default: { color: theme.colors.textSecondary },
        selected: { color: theme.colors.brand },
      }}
      minimizeBehavior="onScrollDown"
      tintColor={theme.colors.brand}
    >
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon
            sf={tab.symbol}
            src={{
              default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name={tab.icon.default} />,
              selected: (
                <NativeTabs.Trigger.VectorIcon family={Ionicons} name={tab.icon.selected} />
              ),
            }}
          />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
