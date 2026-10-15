import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { EMOJI_ESPECE } from '../lib/libelles';
import { choix } from '../lib/listes';
import { BoutonFlottant, Champ, Choix, Ecran, Vide } from '../components/ui';
import { CarteNote } from '../components/notes';

/** Sans accents ni majuscules, pour une recherche tolérante. */
const simplifier = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function Carnet() {
  const { donnees } = useStore();
  const [recherche, setRecherche] = useState('');
  const [animalId, setAnimalId] = useState<string | undefined>();
  const [categorie, setCategorie] = useState<string | undefined>();

  const mots = simplifier(recherche).split(/\s+/).filter(Boolean);
  const notes = donnees.notes
    .filter((n) => !animalId || (animalId === 'aucun' ? n.animalIds.length === 0 : n.animalIds.includes(animalId)))
    .filter((n) => !categorie || n.categorie === categorie)
    .filter((n) => {
      const texte = simplifier(`${n.titre} ${n.texte}`);
      return mots.every((m) => texte.includes(m));
    })
    .sort((a, b) => b.modifieLe.localeCompare(a.modifieLe));

  const categoriesUtilisees = donnees.listes.categoriesNote.filter((c) => donnees.notes.some((n) => n.categorie === c.id));
  const animauxAvecNotes = donnees.animaux.filter((a) => donnees.notes.some((n) => n.animalIds.includes(a.id)));

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <Champ label="Rechercher" value={recherche} onChangeText={setRecherche} placeholder="Ex. vermifuge, tracteur…" />
        {categoriesUtilisees.length > 0 && (
          <Choix
            options={choix(categoriesUtilisees)}
            valeur={categorie}
            onChange={(c) => setCategorie(c === categorie ? undefined : c)}
          />
        )}
        {animauxAvecNotes.length > 0 && (
          <Choix
            options={[
              ...animauxAvecNotes.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string]),
              ['aucun', '📒 Générales'] as [string, string],
            ]}
            valeur={animalId}
            onChange={(id) => setAnimalId(id === animalId ? undefined : id)}
          />
        )}
        {notes.length === 0 && (
          <Vide>
            {donnees.notes.length === 0
              ? 'Ton carnet est vide. Note une posologie, la conduite à tenir face à un symptôme, ou ton tuto pour démarrer le tracteur, avec le bouton +.'
              : 'Aucune note ne correspond.'}
          </Vide>
        )}
        {notes.map((n) => (
          <CarteNote key={n.id} note={n} />
        ))}
      </Ecran>
      <BoutonFlottant
        onPress={() =>
          router.push({
            pathname: '/note/edit',
            params: {
              ...(animalId && animalId !== 'aucun' ? { animalId } : {}),
              ...(categorie ? { categorie } : {}),
            },
          })
        }
      />
    </View>
  );
}
