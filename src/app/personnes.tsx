import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { euros, solde } from '../lib/finances';
import { BoutonFlottant, Carte, Ecran, Petit, Vide, couleurs } from '../components/ui';

export default function Personnes() {
  const { donnees } = useStore();
  const liste = [...donnees.personnes].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <Petit>
          Les personnes avec qui tu partages des frais (le terrain des chevaux…) ou à qui tu confies des tâches (sortir un cheval,
          nourrir les chats…).
        </Petit>
        {liste.length === 0 && <Vide>Ajoute une première personne avec le bouton +.</Vide>}
        {liste.map((p) => {
          const s = solde(donnees, p.id);
          const nbTaches = donnees.taches.filter((t) => t.assigneA === p.id).length;
          return (
            <Carte key={p.id} onPress={() => router.push(`/finances/personne?id=${p.id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{p.nom}</Text>
                {nbTaches > 0 && <Petit>{nbTaches} tâche{nbTaches > 1 ? 's' : ''} confiée{nbTaches > 1 ? 's' : ''}</Petit>}
              </View>
              {s !== 0 && (
                <Text style={{ fontWeight: '700', color: s > 0 ? couleurs.accent : couleurs.danger }}>
                  {s > 0 ? `te doit ${euros(s)}` : `tu dois ${euros(-s)}`}
                </Text>
              )}
            </Carte>
          );
        })}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/personne/edit')} />
    </View>
  );
}
