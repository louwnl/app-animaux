import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { libelle } from '../lib/listes';
import { jourISO, tacheActive, tacheTerminee } from '../lib/dates';
import { BoutonFlottant, Ecran, Titre, Vide } from '../components/ui';
import { CarteTache } from '../components/elements';

export default function Taches() {
  const { donnees } = useStore();
  const aujourdhui = jourISO();
  // Les tâches ponctuelles passées et les tâches terminées sont masquées.
  const actives = donnees.taches.filter((t) => !tacheTerminee(t, aujourdhui) && tacheActive(t, donnees.animaux));

  // Ordre des paramètres, puis les catégories qui n'y sont plus (données importées).
  const categories = [...new Set([...donnees.listes.categoriesTache.map((c) => c.id), ...actives.map((t) => t.categorie)])];

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
              <Titre>{libelle(donnees.listes.categoriesTache, c)}</Titre>
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
