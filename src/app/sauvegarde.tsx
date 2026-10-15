import { useState } from 'react';
import { Alert, Platform, Text } from 'react-native';
import { useStore } from '../lib/store';
import { choisirSauvegarde, exporter } from '../lib/sauvegarde';
import type { Donnees } from '../lib/types';
import { Bouton, Carte, Ecran, Petit, Titre, couleurs } from '../components/ui';

function resume(d: Donnees): string {
  const n = (nb: number, un: string, plusieurs = `${un}s`) => `${nb} ${nb > 1 ? plusieurs : un}`;
  return [
    n(d.animaux.length, 'animal', 'animaux'),
    n(d.taches.length, 'tâche'),
    `${d.rdvs.length} rendez-vous`,
    n(d.operations.length, 'opération'),
    n(d.contacts.length, 'contact'),
    n(d.personnes.length, 'personne'),
  ].join(', ');
}

function confirmerRemplacement(message: string, action: () => void) {
  if (Platform.OS === 'web') {
     
    if (window.confirm(message)) action();
    return;
  }
  Alert.alert('Remplacer les données ?', message, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Remplacer', style: 'destructive', onPress: action },
  ]);
}

export default function Sauvegarde() {
  const { donnees, remplacerTout } = useStore();
  const [message, setMessage] = useState<string>();

  const lancerExport = async () => {
    try {
      await exporter(donnees);
      setMessage(undefined);
    } catch (e) {
      setMessage(`Export impossible : ${(e as Error).message}`);
    }
  };

  const lancerImport = async () => {
    try {
      const d = await choisirSauvegarde();
      if (!d) return;
      confirmerRemplacement(
        `La sauvegarde contient ${resume(d)}. Elle va remplacer toutes les données actuelles de l'app.`,
        () => {
          remplacerTout(d);
          setMessage('Sauvegarde restaurée ✅');
        },
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  return (
    <Ecran>
      <Carte>
        <Text style={{ color: couleurs.texte, fontWeight: '600' }}>Actuellement dans l’app</Text>
        <Petit>{resume(donnees)}</Petit>
      </Carte>

      <Titre>Exporter</Titre>
      <Petit>
        Crée un fichier avec toutes tes données. Enregistre-le dans Google Drive ou envoie-le-toi par e-mail : il permet de tout
        retrouver si tu changes de téléphone ou réinstalles l’app.
      </Petit>
      <Bouton titre="Exporter mes données" onPress={lancerExport} />

      <Titre>Importer</Titre>
      <Petit>Choisis un fichier de sauvegarde. Attention, il remplace toutes les données actuelles.</Petit>
      <Bouton titre="Importer une sauvegarde" variante="secondaire" onPress={lancerImport} />

      {!!message && <Text style={{ color: couleurs.texte, marginTop: 8 }}>{message}</Text>}
    </Ecran>
  );
}
