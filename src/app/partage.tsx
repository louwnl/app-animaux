import { Share, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAnimal, useContact } from '../lib/store';
import { EMOJI_ESPECE } from '../lib/libelles';
import { LIEN_APK, ficheAnimal, ficheContact, lienFiche } from '../lib/partage';
import { Bouton, Ecran, Petit, Vide, couleurs } from '../components/ui';
import { CodeQR } from '../components/qrcode';

export default function Partage() {
  const { animalId, contactId } = useLocalSearchParams<{ animalId?: string; contactId?: string }>();
  const animal = useAnimal(animalId);
  const contact = useContact(contactId);

  let titre = "Partager l'app";
  let nom = 'Mes Animaux';
  let lien = LIEN_APK;
  let explication =
    "Fais scanner ce code avec l'appareil photo : il télécharge l'app. Il faudra autoriser l'installation depuis le navigateur, comme pour toi.";
  if (animalId || contactId) {
    if (!animal && !contact) return <Ecran><Vide>Fiche introuvable.</Vide></Ecran>;
    titre = 'Partager la fiche';
    nom = animal ? `${EMOJI_ESPECE[animal.espece]} ${animal.nom}` : `📇 ${contact!.nom}`;
    lien = lienFiche(animal ? ficheAnimal(animal) : ficheContact(contact!));
    explication =
      "L'autre personne scanne ce code depuis son app (Plus › Scanner un QR code) et récupère une copie de la fiche. Les tâches, dépenses et rendez-vous restent sur ton téléphone.";
  }

  return (
    <Ecran style={{ alignItems: 'center' }}>
      <Stack.Screen options={{ title: titre }} />
      <Text style={{ fontSize: 22, fontWeight: '700', color: couleurs.texte }}>{nom}</Text>
      <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: couleurs.bord }}>
        <CodeQR valeur={lien} />
      </View>
      <Petit style={{ textAlign: 'center' }}>{explication}</Petit>
      {!animalId && !contactId && (
        <View style={{ alignSelf: 'stretch' }}>
          <Bouton titre="Envoyer le lien" variante="secondaire" onPress={() => Share.share({ message: `L'app Mes Animaux : ${LIEN_APK}` })} />
        </View>
      )}
    </Ecran>
  );
}
