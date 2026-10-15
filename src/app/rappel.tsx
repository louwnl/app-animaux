import { Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useStore, useTache } from '../lib/store';
import { confiees } from '../lib/taches';
import { messageRappel, ouvrirSms, ouvrirWhatsapp } from '../lib/rappel';
import { Bouton, Carte, Ecran, Petit, Vide, couleurs } from '../components/ui';

/** Choisir à qui envoyer le rappel d'une tâche confiée à plusieurs personnes. */
export default function Rappel() {
  const { tacheId, jour } = useLocalSearchParams<{ tacheId: string; jour?: string }>();
  const tache = useTache(tacheId);
  const { donnees } = useStore();
  if (!tache)
    return (
      <Ecran>
        <Vide>Tâche introuvable.</Vide>
      </Ecran>
    );
  const texte = messageRappel(tache, donnees.animaux, jour || undefined);
  const personnes = confiees(tache, donnees.personnes);

  return (
    <Ecran>
      <Stack.Screen options={{ title: 'Envoyer un rappel' }} />
      <Carte>
        <Petit>Message</Petit>
        <Text style={{ color: couleurs.texte, fontSize: 15 }}>{texte}</Text>
      </Carte>
      {personnes.map((p) => (
        <Carte key={p.id} style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{p.nom}</Text>
          {p.telephone ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Bouton titre="SMS" variante="secondaire" onPress={() => ouvrirSms(p.telephone!, texte)} />
              </View>
              <View style={{ flex: 1 }}>
                <Bouton titre="WhatsApp" variante="secondaire" onPress={() => ouvrirWhatsapp(p.telephone!, texte)} />
              </View>
            </View>
          ) : (
            <Bouton titre="Ajouter son numéro" variante="secondaire" onPress={() => router.push(`/personne/edit?id=${p.id}`)} />
          )}
        </Carte>
      ))}
    </Ecran>
  );
}
