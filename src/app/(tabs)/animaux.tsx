import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';
import type { Espece } from '../../lib/types';
import { ESPECES } from '../../lib/libelles';
import { BoutonFlottant, Choix, Ecran, Vide } from '../../components/ui';
import { CarteAnimal } from '../../components/elements';

type Filtre = 'presents' | 'mien' | 'passage' | 'partis';
const FILTRES: Record<Filtre, string> = {
  presents: 'Présents',
  mien: 'Mes animaux',
  passage: 'De passage',
  partis: 'Partis',
};

export default function Animaux() {
  const { donnees } = useStore();
  const [filtre, setFiltre] = useState<Filtre>('presents');
  const [espece, setEspece] = useState<Espece | undefined>();

  const liste = donnees.animaux
    .filter((a) => {
      if (filtre === 'presents') return a.statut !== 'parti';
      if (filtre === 'mien') return a.statut === 'mien';
      if (filtre === 'passage') return a.statut === 'famille_relais' || a.statut === 'refuge';
      return a.statut === 'parti';
    })
    .filter((a) => !espece || a.espece === espece)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <Choix options={FILTRES} valeur={filtre} onChange={setFiltre} />
        <Choix options={ESPECES} valeur={espece} onChange={(e) => setEspece(e === espece ? undefined : e)} />
        {liste.length === 0 && (
          <Vide>{donnees.animaux.length === 0 ? 'Ajoute ton premier animal avec le bouton +.' : 'Aucun animal dans cette liste.'}</Vide>
        )}
        {liste.map((a) => (
          <CarteAnimal key={a.id} animal={a} />
        ))}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/animal/edit')} />
    </View>
  );
}
