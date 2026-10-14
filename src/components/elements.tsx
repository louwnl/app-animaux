import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Animal, Contact, Personne, Realisation, RendezVous, Tache } from '../lib/types';
import { CATEGORIES_TACHE, EMOJI_ESPECE, STATUTS, TYPES_RDV, TYPES_SEANCE } from '../lib/libelles';
import { age, formatDateHeure, libelleRecurrence } from '../lib/dates';
import { Carte, Petit, couleurs } from './ui';

export function nomsAnimaux(ids: string[], animaux: Animal[]): string {
  return ids
    .map((id) => animaux.find((a) => a.id === id))
    .filter((a): a is Animal => !!a)
    .map((a) => `${EMOJI_ESPECE[a.espece]} ${a.nom}`)
    .join(', ');
}

export function CarteAnimal({ animal }: { animal: Animal }) {
  const passage = animal.statut === 'famille_relais' || animal.statut === 'refuge';
  const details = [animal.race, age(animal.dateNaissance)].filter(Boolean).join(' · ');
  return (
    <Carte onPress={() => router.push(`/animal/${animal.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontSize: 34 }}>{EMOJI_ESPECE[animal.espece]}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: couleurs.texte }}>{animal.nom}</Text>
        {!!details && <Petit>{details}</Petit>}
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          backgroundColor: passage ? '#FDF1DC' : animal.statut === 'parti' ? '#EEE' : couleurs.accentClair,
        }}
      >
        <Text style={{ fontSize: 12, color: passage ? couleurs.ambre : animal.statut === 'parti' ? couleurs.doux : couleurs.accent }}>
          {STATUTS[animal.statut]}
        </Text>
      </View>
    </Carte>
  );
}

export function LigneTache({
  tache,
  faite,
  realisation,
  animaux,
  personnes = [],
  onBasculer,
}: {
  tache: Tache;
  faite: boolean;
  realisation?: Realisation;
  animaux: Animal[];
  personnes?: Personne[];
  onBasculer: () => void;
}) {
  const animal = animaux.find((a) => a.id === tache.animalId);
  const confiee = personnes.find((p) => p.id === tache.assigneA);
  const sous = [
    confiee && `👤 ${confiee.nom}`,
    animal ? `${EMOJI_ESPECE[animal.espece]} ${animal.nom}` : tache.lieu,
    tache.heure?.replace(':', 'h'),
    realisation?.seance &&
      `${TYPES_SEANCE[realisation.seance.type]}${realisation.seance.dureeMin ? ` ${realisation.seance.dureeMin} min` : ''}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Carte style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={onBasculer} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: faite }}>
        <Ionicons name={faite ? 'checkmark-circle' : 'ellipse-outline'} size={30} color={faite ? couleurs.accent : couleurs.bord} />
      </Pressable>
      <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push(`/tache/edit?id=${tache.id}`)}>
        <Text
          style={{
            fontSize: 16,
            color: faite ? couleurs.doux : couleurs.texte,
            textDecorationLine: faite ? 'line-through' : 'none',
          }}
        >
          {CATEGORIES_TACHE[tache.categorie].split(' ')[0]} {tache.titre}
        </Text>
        {!!sous && <Petit>{sous}</Petit>}
      </Pressable>
    </Carte>
  );
}

export function CarteTache({ tache, animaux, personnes = [] }: { tache: Tache; animaux: Animal[]; personnes?: Personne[] }) {
  const animal = animaux.find((a) => a.id === tache.animalId);
  const confiee = personnes.find((p) => p.id === tache.assigneA);
  const sous = [
    confiee && `👤 ${confiee.nom}`,
    libelleRecurrence(tache.recurrence),
    tache.heure?.replace(':', 'h'),
    animal ? `${EMOJI_ESPECE[animal.espece]} ${animal.nom}` : tache.lieu,
    tache.rappel && tache.heure ? '🔔' : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Carte onPress={() => router.push(`/tache/edit?id=${tache.id}`)}>
      <Text style={{ fontSize: 16, color: couleurs.texte }}>
        {CATEGORIES_TACHE[tache.categorie].split(' ')[0]} {tache.titre}
      </Text>
      <Petit>{sous}</Petit>
    </Carte>
  );
}

export function CarteRdv({ rdv, animaux, contacts }: { rdv: RendezVous; animaux: Animal[]; contacts: Contact[] }) {
  const contact = contacts.find((c) => c.id === rdv.contactId);
  const noms = nomsAnimaux(rdv.animalIds, animaux);
  return (
    <Carte onPress={() => router.push(`/rdv/edit?id=${rdv.id}`)}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: couleurs.accent }}>{formatDateHeure(rdv.dateHeure)}</Text>
      <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{rdv.titre}</Text>
      <Petit>{[TYPES_RDV[rdv.type], contact?.nom, rdv.lieu].filter(Boolean).join(' · ')}</Petit>
      {!!noms && <Petit>{noms}</Petit>}
      {rdv.rappel !== 'aucun' && Platform.OS !== 'web' && <Petit>🔔 Rappel programmé</Petit>}
    </Carte>
  );
}
