import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import { couleurs } from '../../components/ui';

type NomIcone = keyof typeof Ionicons.glyphMap;

const icone =
  (nom: NomIcone) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={nom} color={color as string} size={size} />;

export default function OngletsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: couleurs.accent,
        tabBarInactiveTintColor: couleurs.doux,
        headerStyle: { backgroundColor: couleurs.fond },
        headerShadowVisible: false,
        headerTintColor: couleurs.texte,
        sceneStyle: { backgroundColor: couleurs.fond },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Aujourd'hui", tabBarIcon: icone('sunny-outline') }} />
      <Tabs.Screen name="calendrier" options={{ title: 'Calendrier', tabBarIcon: icone('calendar-outline') }} />
      <Tabs.Screen name="animaux" options={{ title: 'Animaux', tabBarIcon: icone('paw-outline') }} />
      <Tabs.Screen name="stock" options={{ title: 'Stock', tabBarIcon: icone('cube-outline') }} />
      <Tabs.Screen name="finances" options={{ title: 'Finances', tabBarIcon: icone('wallet-outline') }} />
      <Tabs.Screen name="plus" options={{ title: 'Plus', tabBarIcon: icone('menu-outline') }} />
    </Tabs>
  );
}
