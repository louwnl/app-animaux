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
      <Stack.Screen name="taches" options={{ title: 'Tâches' }} />
      <Stack.Screen name="rdv/index" options={{ title: 'Rendez-vous' }} />
      <Stack.Screen name="contacts" options={{ title: 'Contacts des pros' }} />
      <Stack.Screen name="personnes" options={{ title: 'Personnes' }} />
      <Stack.Screen name="personne/edit" options={{ title: 'Personne', presentation: 'modal' }} />
      <Stack.Screen name="finances/operation" options={{ title: 'Opération', presentation: 'modal' }} />
      <Stack.Screen name="finances/remboursement" options={{ title: 'Remboursement', presentation: 'modal' }} />
      <Stack.Screen name="finances/personne" options={{ title: 'Compte' }} />
      <Stack.Screen name="sauvegarde" options={{ title: 'Sauvegarde' }} />
      <Stack.Screen name="notes" options={{ title: 'Carnet de notes' }} />
      <Stack.Screen name="note/edit" options={{ title: 'Note', presentation: 'modal' }} />
      <Stack.Screen name="stock/edit" options={{ title: 'Produit', presentation: 'modal' }} />
      <Stack.Screen name="parametres" options={{ title: 'Paramètres' }} />
      <Stack.Screen name="partage" options={{ title: 'Partager' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scanner un QR code' }} />
      <Stack.Screen name="mise-a-jour" options={{ title: 'Mettre à jour l’app' }} />
      <Stack.Screen name="import" options={{ title: 'Fiche partagée' }} />
      <Stack.Screen name="rappel" options={{ title: 'Envoyer un rappel', presentation: 'modal' }} />
      <Stack.Screen name="sante" options={{ title: 'Santé' }} />
      <Stack.Screen name="soin/edit" options={{ title: 'Soin', presentation: 'modal' }} />
      <Stack.Screen name="vue/calendrier" options={{ title: 'Calendrier' }} />
      <Stack.Screen name="vue/animaux" options={{ title: 'Animaux' }} />
      <Stack.Screen name="vue/stock" options={{ title: 'Stock' }} />
      <Stack.Screen name="vue/finances" options={{ title: 'Finances' }} />
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
