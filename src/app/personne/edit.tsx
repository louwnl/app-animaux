import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, usePersonne, useStore } from '../../lib/store';
import type { Personne } from '../../lib/types';
import { Bouton, Champ, Ecran, Petit, confirmer } from '../../components/ui';

export default function EditionPersonne() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existante = usePersonne(id);
  const { donnees, enregistrer, supprimer } = useStore();
  const [p, setP] = useState<Personne>(existante ?? { id: nouvelId(), nom: '' });
  const maj = (champs: Partial<Personne>) => setP((x) => ({ ...x, ...champs }));

  const valider = () => {
    if (!p.nom.trim()) return;
    enregistrer('personnes', { ...p, nom: p.nom.trim() });
    router.back();
  };

  const aDesComptes =
    !!existante &&
    (donnees.operations.some((o) => o.payePar === existante.id || o.partageAvec.includes(existante.id)) ||
      donnees.remboursements.some((r) => r.de === existante.id || r.a === existante.id));

  return (
    <Ecran>
      <Stack.Screen options={{ title: existante ? `Modifier ${existante.nom}` : 'Nouvelle personne' }} />
      <Champ label="Nom" value={p.nom} onChangeText={(nom) => maj({ nom })} placeholder="Ex. Marie" autoFocus={!existante} />
      <Champ label="Téléphone" value={p.telephone ?? ''} onChangeText={(telephone) => maj({ telephone })} keyboardType="phone-pad" />
      <Champ label="Notes" value={p.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existante &&
        (aDesComptes ? (
          <Petit>{existante.nom} apparaît dans tes finances : supprime d'abord ses dépenses et remboursements pour pouvoir la retirer.</Petit>
        ) : (
          <Bouton
            titre="Supprimer"
            variante="danger"
            onPress={() =>
              confirmer(`Supprimer ${existante.nom} ? Ses tâches te reviendront.`, () => {
                supprimer('personnes', existante.id);
                router.back();
              })
            }
          />
        ))}
    </Ecran>
  );
}
