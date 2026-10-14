import { useState } from 'react';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { nouvelId, useAnimal, useStore } from '../../lib/store';
import type { Animal, Espece, StatutAnimal } from '../../lib/types';
import { ESPECES, STATUTS } from '../../lib/libelles';
import { jourISO } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, confirmer } from '../../components/ui';

export default function EditionAnimal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existant = useAnimal(id);
  const { enregistrer, supprimer } = useStore();

  const [a, setA] = useState<Animal>(
    existant ?? {
      id: nouvelId(),
      nom: '',
      espece: 'chat',
      statut: 'mien',
      sexe: 'inconnu',
      accueils: [],
      creeLe: new Date().toISOString(),
    },
  );
  const maj = (champs: Partial<Animal>) => setA((x) => ({ ...x, ...champs }));

  const valider = () => {
    if (!a.nom.trim()) return;
    let animal = { ...a, nom: a.nom.trim() };
    // Un nouvel animal de passage reçoit directement son premier accueil, daté d'aujourd'hui.
    const passage = animal.statut === 'famille_relais' || animal.statut === 'refuge';
    if (!existant && passage) {
      animal.accueils = [{ id: nouvelId(), type: animal.statut as 'famille_relais' | 'refuge', dateArrivee: jourISO() }];
    }
    enregistrer('animaux', animal);
    if (existant) router.back();
    else router.replace(`/animal/${animal.id}`);
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existant ? `Modifier ${existant.nom}` : 'Nouvel animal' }} />
      <Champ label="Nom" value={a.nom} onChangeText={(nom) => maj({ nom })} placeholder="Ex. Caramel" autoFocus={!existant} />
      <Choix label="Espèce" options={ESPECES} valeur={a.espece} onChange={(espece: Espece) => maj({ espece })} />
      <Choix label="Statut" options={STATUTS} valeur={a.statut} onChange={(statut: StatutAnimal) => maj({ statut })} />
      <Champ label="Race" value={a.race ?? ''} onChangeText={(race) => maj({ race })} />
      <Choix
        label="Sexe"
        options={{ male: 'Mâle', femelle: 'Femelle', inconnu: 'Inconnu' }}
        valeur={a.sexe}
        onChange={(sexe) => maj({ sexe })}
      />
      <ChampDate label="Date de naissance" mode="date" optionnel valeur={a.dateNaissance} onChange={(dateNaissance) => maj({ dateNaissance })} />
      <Champ label={a.espece === 'cheval' ? 'Robe' : 'Couleur'} value={a.robe ?? ''} onChangeText={(robe) => maj({ robe })} />
      <Champ
        label="Identification"
        value={a.identification ?? ''}
        onChangeText={(identification) => maj({ identification })}
        placeholder={a.espece === 'cheval' ? 'N° SIRE / UELN / puce' : 'N° de puce ou tatouage'}
      />
      <Champ label="Notes" value={a.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline placeholder="Caractère, santé, habitudes…" />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && (
        <Bouton
          titre="Supprimer définitivement"
          variante="danger"
          onPress={() =>
            confirmer(`Supprimer ${existant.nom} et ses tâches ? Pour garder l'historique, passe plutôt son statut à « Parti ».`, () => {
              supprimer('animaux', existant.id);
              router.dismissTo('/animaux');
            })
          }
        />
      )}
    </Ecran>
  );
}
