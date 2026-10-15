import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import { couleurs } from '../../components/ui';
import { useStore } from '../../lib/store';
import { FONCTIONS } from '../../lib/fonctions';

type NomIcone = keyof typeof Ionicons.glyphMap;

const icone = (nom: NomIcone) =>
  function IconeOnglet({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nom} color={color as string} size={size} />;
  };

export default function OngletsLayout() {
  const { donnees } = useStore();
  const fonctions = donnees.reglages.fonctions;
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
      {/* Tous les onglets existent ; ceux qui ne sont pas dans la barre (réglages) sont simplement cachés. */}
      {fonctions.map(({ id, place }) => {
        const f = FONCTIONS[id];
        return (
          <Tabs.Screen
            key={id}
            name={f.onglet}
            options={{ title: f.titre, tabBarIcon: icone(f.icone), href: place === 'barre' ? undefined : null }}
          />
        );
      })}
      <Tabs.Screen name="plus" options={{ title: 'Plus', tabBarIcon: icone('menu-outline') }} />
    </Tabs>
  );
}
