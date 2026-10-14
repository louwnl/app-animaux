import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { StoreProvider, useStore } from '../lib/store';
import { couleurs } from '../components/ui';

function Contenu() {
  const { pret } = useStore();
  if (!pret) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond }}>
        <ActivityIndicator color={couleurs.accent} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.fond },
        headerTintColor: couleurs.texte,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: couleurs.fond },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="animal/[id]" options={{ title: 'Fiche animal' }} />
      <Stack.Screen name="animal/edit" options={{ title: 'Animal', presentation: 'modal' }} />
      <Stack.Screen name="animal/accueil" options={{ title: 'Accueil', presentation: 'modal' }} />
      <Stack.Screen name="tache/edit" options={{ title: 'Tâche', presentation: 'modal' }} />
      <Stack.Screen name="tache/seance" options={{ title: 'Séance de travail', presentation: 'modal' }} />
      <Stack.Screen name="rdv/edit" options={{ title: 'Rendez-vous', presentation: 'modal' }} />
      <Stack.Screen name="contact/edit" options={{ title: 'Contact', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Contenu />
    </StoreProvider>
  );
}
