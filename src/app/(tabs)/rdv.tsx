import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';
import { BoutonFlottant, Choix, Ecran, Vide } from '../../components/ui';
import { CarteRdv } from '../../components/elements';

export default function Rdvs() {
  const { donnees } = useStore();
  const [vue, setVue] = useState<'avenir' | 'passes'>('avenir');
  const maintenant = new Date().toISOString();

  const liste = donnees.rdvs
    .filter((r) => (vue === 'avenir' ? r.dateHeure >= maintenant : r.dateHeure < maintenant))
    .sort((a, b) => (vue === 'avenir' ? a.dateHeure.localeCompare(b.dateHeure) : b.dateHeure.localeCompare(a.dateHeure)));

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <Choix options={{ avenir: 'À venir', passes: 'Passés' }} valeur={vue} onChange={setVue} />
        {liste.length === 0 && <Vide>{vue === 'avenir' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous passé.'}</Vide>}
        {liste.map((r) => (
          <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
        ))}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/rdv/edit')} />
    </View>
  );
}
