import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function tabBarIcon(name: TabIconName) {
  return function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons color={String(color)} name={name} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0B6B69',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabBarIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="find-care"
        options={{
          title: 'Find care',
          tabBarIcon: tabBarIcon('search-outline'),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: tabBarIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabBarIcon('person-outline'),
        }}
      />
    </Tabs>
  );
}
