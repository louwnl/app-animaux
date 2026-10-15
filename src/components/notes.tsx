import { Text } from 'react-native';
import { router } from 'expo-router';
import type { Note } from '../lib/types';
import { nomsAnimaux } from '../lib/libelles';
import { option } from '../lib/listes';
import { formatJourCourt, jourISO } from '../lib/dates';
import { useStore } from '../lib/store';
import { Carte, Petit, couleurs } from './ui';

export function CarteNote({ note }: { note: Note }) {
  const { donnees } = useStore();
  const animaux = nomsAnimaux(note.animalIds, donnees.animaux);
  const apercu = note.texte.trim().split('\n').slice(0, 2).join(' · ');
  return (
    <Carte onPress={() => router.push(`/note/edit?id=${note.id}`)} style={{ gap: 2 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>
        {note.categorie ? `${option(donnees.listes.categoriesNote, note.categorie).emoji} ` : ''}
        {note.titre}
      </Text>
      {!!apercu && (
        <Text style={{ color: couleurs.texte }} numberOfLines={2}>
          {apercu}
        </Text>
      )}
      <Petit>{[animaux, `modifiée le ${formatJourCourt(jourISO(new Date(note.modifieLe)))}`].filter(Boolean).join(' · ')}</Petit>
    </Carte>
  );
}
