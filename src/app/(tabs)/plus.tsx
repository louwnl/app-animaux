import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../lib/store';
import { Carte, Ecran, Petit, couleurs } from '../../components/ui';

function Entree({ icone, titre, sous, vers }: { icone: keyof typeof Ionicons.glyphMap; titre: string; sous: string; vers: Href }) {
  return (
    <Carte onPress={() => router.push(vers)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Ionicons name={icone} size={26} color={couleurs.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{titre}</Text>
        <Petit>{sous}</Petit>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.doux} />
    </Carte>
  );
}

export default function Plus() {
  const { donnees } = useStore();
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  return (
    <Ecran>
      <Entree icone="checkbox-outline" titre="Tâches" sous={pluriel(donnees.taches.length, 'tâche')} vers="/taches" />
      <Entree icone="medkit-outline" titre="Rendez-vous" sous={`${donnees.rdvs.length} rendez-vous`} vers="/rdv" />
      <Entree icone="people-outline" titre="Personnes" sous="Entourage : frais partagés, tâches confiées" vers="/personnes" />
      <Entree icone="call-outline" titre="Contacts des pros" sous={pluriel(donnees.contacts.length, 'contact')} vers="/contacts" />
      <Entree icone="book-outline" titre="Carnet de notes" sous={pluriel(donnees.notes.length, 'note')} vers="/notes" />
      <Entree icone="scan-outline" titre="Scanner un QR code" sous="Récupérer la fiche d'un animal ou d'un pro" vers="/scanner" />
      <Entree icone="qr-code-outline" titre="Partager l'app" sous="QR code pour la faire installer à quelqu'un" vers="/partage" />
      <Entree icone="options-outline" titre="Paramètres" sous="Catégories, types de séances et leurs emojis" vers="/parametres" />
      <Entree icone="cloud-upload-outline" titre="Sauvegarde" sous="Exporter ou importer toutes tes données" vers="/sauvegarde" />
    </Ecran>
  );
}
