import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useAppTheme } from '@/theme';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function tabBarIcon(activeName: TabIconName, inactiveName: TabIconName) {
  return function TabBarIcon({
    color,
    focused,
    size,
  }: {
    color: ColorValue;
    focused: boolean;
    size: number;
  }) {
    return (
      <Ionicons color={String(color)} name={focused ? activeName : inactiveName} size={size} />
    );
  };
}

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: theme.typeScale.labelSmall,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceRaised,
          borderTopColor: theme.colors.borderSubtle,
          height: 82,
          paddingBottom: theme.spacing.sm,
          paddingTop: theme.spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabBarIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="find-care"
        options={{
          title: 'Find care',
          tabBarIcon: tabBarIcon('search', 'search-outline'),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: tabBarIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabBarIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}
