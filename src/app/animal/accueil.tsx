import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { nouvelId, useAnimal, useStore } from '../../lib/store';
import type { Accueil, IssueAccueil, TypeAccueil } from '../../lib/types';
import { ISSUES, TYPES_ACCUEIL } from '../../lib/libelles';
import { jourISO } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, Vide, confirmer } from '../../components/ui';

export default function EditionAccueil() {
  const { animalId, accueilId } = useLocalSearchParams<{ animalId: string; accueilId?: string }>();
  const animal = useAnimal(animalId);
  const { donnees, enregistrer } = useStore();
  const existant = animal?.accueils.find((a) => a.id === accueilId);

  const [ac, setAc] = useState<Accueil>(
    existant ?? { id: nouvelId(), type: animal?.statut === 'refuge' ? 'refuge' : 'famille_relais', dateArrivee: jourISO() },
  );
  const maj = (champs: Partial<Accueil>) => setAc((x) => ({ ...x, ...champs }));

  if (!animal) return <Ecran><Vide>Animal introuvable.</Vide></Ecran>;

  const structures = donnees.contacts.filter((c) => c.categorie === 'refuge');

  const valider = () => {
    const accueils = existant ? animal.accueils.map((x) => (x.id === ac.id ? ac : x)) : [...animal.accueils, ac];
    // Le statut suit l'accueil le plus récent : en cours → passage, terminé → parti.
    const dernier = [...accueils].sort((a, b) => b.dateArrivee.localeCompare(a.dateArrivee))[0];
    const statut = animal.statut === 'mien' ? 'mien' : dernier.dateDepart ? 'parti' : dernier.type;
    enregistrer('animaux', { ...animal, accueils, statut });
    router.back();
  };

  return (
    <Ecran>
      <Choix label="Type" options={TYPES_ACCUEIL} valeur={ac.type} onChange={(type: TypeAccueil) => maj({ type })} />
      {structures.length > 0 ? (
        <Choix
          label="Refuge / association"
          options={structures.map((s) => [s.id, s.nom] as [string, string])}
          valeur={ac.structureId}
          onChange={(structureId) => maj({ structureId: structureId === ac.structureId ? undefined : structureId })}
        />
      ) : (
        <Petit>Astuce : ajoute ton refuge dans Contacts (catégorie « Refuge / association ») pour le relier ici.</Petit>
      )}
      <ChampDate label="Arrivée" mode="date" valeur={ac.dateArrivee} onChange={(v) => v && maj({ dateArrivee: v })} />
      <ChampDate label="Départ" mode="date" optionnel valeur={ac.dateDepart} onChange={(dateDepart) => maj({ dateDepart })} />
      {!!ac.dateDepart && (
        <Choix label="Issue" options={ISSUES} valeur={ac.issue} onChange={(issue: IssueAccueil) => maj({ issue })} />
      )}
      {!!ac.dateDepart && animal.statut !== 'mien' && (
        <Petit>En enregistrant un départ, {animal.nom} passe dans « Partis » et ses tâches s’arrêtent. Son historique est conservé.</Petit>
      )}
      <Champ label="Notes" value={ac.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline placeholder="Comportement, consignes du refuge…" />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && (
        <Bouton
          titre="Supprimer cet accueil"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer cet accueil ?', () => {
              enregistrer('animaux', { ...animal, accueils: animal.accueils.filter((x) => x.id !== existant.id) });
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
