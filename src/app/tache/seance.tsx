import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, useTache } from '../../lib/store';
import type { TypeSeance } from '../../lib/types';
import { choix } from '../../lib/listes';
import { formatJour } from '../../lib/dates';
import { Bouton, Champ, Choix, Ecran, Petit, Titre, Vide } from '../../components/ui';

export default function Seance() {
  const { tacheId, jour } = useLocalSearchParams<{ tacheId: string; jour: string }>();
  const tache = useTache(tacheId);
  const { donnees, basculerRealisation } = useStore();
  const types = donnees.listes.typesSeance;
  // Devine le type d'après le titre de la tâche (« Travail à la longe » → Longe).
  const devine = types.find((o) => tache?.titre.toLowerCase().includes(o.nom.toLowerCase()));
  const [type, setType] = useState<TypeSeance | undefined>(devine?.id ?? types[0]?.id);
  const [duree, setDuree] = useState('');
  const [ressenti, setRessenti] = useState('');

  if (!tache) return <Ecran><Vide>Tâche introuvable.</Vide></Ecran>;

  const valider = () => {
    const dureeMin = parseInt(duree, 10);
    basculerRealisation(tacheId, jour, {
      seance: { type: type ?? 'autre', dureeMin: Number.isFinite(dureeMin) ? dureeMin : undefined, ressenti: ressenti.trim() || undefined },
    });
    router.back();
  };

  return (
    <Ecran>
      <Titre>{tache.titre}</Titre>
      <Petit style={{ textTransform: 'capitalize' }}>{formatJour(jour)}</Petit>
      <Choix label="Type de séance" options={choix(types)} valeur={type} onChange={setType} />
      <Champ label="Durée (minutes)" keyboardType="number-pad" value={duree} onChangeText={setDuree} placeholder="Ex. 30" />
      <Champ label="Ressenti" value={ressenti} onChangeText={setRessenti} multiline placeholder="Énergie, progrès, points à travailler…" />
      <Bouton titre="Valider la séance" onPress={valider} />
      <Bouton
        titre="Cocher sans détails"
        variante="secondaire"
        onPress={() => {
          basculerRealisation(tacheId, jour);
          router.back();
        }}
      />
    </Ecran>
  );
}
