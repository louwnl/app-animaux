import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import type { CategorieTache } from '../lib/types';
import { CATEGORIES_TACHE } from '../lib/libelles';
import { jourISO } from '../lib/dates';
import { BoutonFlottant, Ecran, Titre, Vide } from '../components/ui';
import { CarteTache } from '../components/elements';

export default function Taches() {
  const { donnees } = useStore();
  const aujourdhui = jourISO();
  // Les tâches ponctuelles passées et les tâches terminées sont masquées.
  const actives = donnees.taches.filter((t) => {
    if (t.dateFin && t.dateFin < aujourdhui) return false;
    if (t.recurrence.type === 'unique' && t.dateDebut < aujourdhui) return false;
    const animal = donnees.animaux.find((a) => a.id === t.animalId);
    return animal?.statut !== 'parti';
  });

  const categories = Object.keys(CATEGORIES_TACHE) as CategorieTache[];

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        {actives.length === 0 && (
          <Vide>
            Aucune tâche. Ajoute par exemple « Nettoyer les gamelles » tous les jours, ou « Brossage » pour un cheval, avec le
            bouton +.
          </Vide>
        )}
        {categories.map((c) => {
          const liste = actives.filter((t) => t.categorie === c).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
          if (liste.length === 0) return null;
          return (
            <View key={c} style={{ gap: 10 }}>
              <Titre>{CATEGORIES_TACHE[c]}</Titre>
              {liste.map((t) => (
                <CarteTache key={t.id} tache={t} animaux={donnees.animaux} personnes={donnees.personnes} />
              ))}
            </View>
          );
        })}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/tache/edit')} />
    </View>
  );
}
