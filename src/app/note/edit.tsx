import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useNote, useStore } from '../../lib/store';
import type { Note } from '../../lib/types';
import { EMOJI_ESPECE } from '../../lib/libelles';
import { choix } from '../../lib/listes';
import { Bouton, Champ, Choix, Ecran, confirmer } from '../../components/ui';

export default function EditionNote() {
  const params = useLocalSearchParams<{ id?: string; animalId?: string; categorie?: string }>();
  const existante = useNote(params.id);
  const { donnees, enregistrer, supprimer } = useStore();
  const [n, setN] = useState<Note>(
    existante ?? {
      id: nouvelId(),
      titre: '',
      texte: '',
      categorie: params.categorie,
      animalIds: params.animalId ? [params.animalId] : [],
      modifieLe: '',
    },
  );
  const maj = (champs: Partial<Note>) => setN((x) => ({ ...x, ...champs }));
  const animaux = donnees.animaux.filter((a) => a.statut !== 'parti' || n.animalIds.includes(a.id));

  const valider = () => {
    const titre = n.titre.trim() || n.texte.trim().split('\n')[0].slice(0, 60);
    if (!titre) return;
    enregistrer('notes', { ...n, titre, modifieLe: new Date().toISOString() });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existante ? 'Modifier la note' : 'Nouvelle note' }} />
      <Champ label="Titre" value={n.titre} onChangeText={(titre) => maj({ titre })} placeholder="Ex. Vermifuge Caramel" autoFocus={!existante} />
      <Champ
        label="Note"
        value={n.texte}
        onChangeText={(texte) => maj({ texte })}
        multiline
        placeholder="Posologie, symptômes à surveiller, marche à suivre…"
      />
      <Choix
        label="Catégorie (facultatif)"
        options={choix(donnees.listes.categoriesNote)}
        valeur={n.categorie}
        onChange={(categorie) => maj({ categorie: categorie === n.categorie ? undefined : categorie })}
      />
      {animaux.length > 0 && (
        <Choix
          label="Pour quels animaux ? (facultatif)"
          options={animaux.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string])}
          valeur={n.animalIds}
          onChange={(id) => maj({ animalIds: n.animalIds.includes(id) ? n.animalIds.filter((x) => x !== id) : [...n.animalIds, id] })}
        />
      )}
      <Bouton titre="Enregistrer" onPress={valider} />
      {existante && (
        <Bouton
          titre="Supprimer la note"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer cette note ?', () => {
              supprimer('notes', existante.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
