import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { EMOJI_ESPECE } from '../lib/libelles';
import { echeances } from '../lib/sante';
import { BoutonFlottant, Choix, Ecran, Petit, Titre, Vide } from '../components/ui';
import { CarteEcheance, CarteSoin } from '../components/sante';

export default function Sante() {
  const { donnees } = useStore();
  const [animalId, setAnimalId] = useState<string | undefined>();
  const aVenir = echeances(donnees, animalId);
  const historique = donnees.soins
    .filter((s) => !animalId || s.animalIds.includes(animalId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);
  const animaux = donnees.animaux.filter((a) => donnees.soins.some((s) => s.animalIds.includes(a.id)));

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        {animaux.length > 1 && (
          <Choix
            options={animaux.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string])}
            valeur={animalId}
            onChange={(id) => setAnimalId(id === animalId ? undefined : id)}
          />
        )}
        {donnees.soins.length === 0 && (
          <Vide>Note ici les vaccins, vermifuges, passages du maréchal ou du dentiste, avec la date du prochain : l’app te le rappellera.</Vide>
        )}
        {aVenir.length > 0 && <Titre>À prévoir</Titre>}
        {aVenir.map((e) => (
          <CarteEcheance key={e.soin.id} e={e} />
        ))}
        {aVenir.length > 0 && <Petit>« Fait » note le nouveau soin et programme le suivant au même rythme.</Petit>}
        {historique.length > 0 && <Titre>Historique</Titre>}
        {historique.map((s) => (
          <CarteSoin key={s.id} s={s} />
        ))}
      </Ecran>
      <BoutonFlottant onPress={() => router.push(animalId ? `/soin/edit?animalId=${animalId}` : '/soin/edit')} />
    </View>
  );
}
