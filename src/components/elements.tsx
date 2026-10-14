import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Animal, Contact, Personne, Realisation, RendezVous, Tache } from '../lib/types';
import { EMOJI_ESPECE, STATUTS, TYPES_RDV, nomsAnimaux } from '../lib/libelles';
import { option } from '../lib/listes';
import { useStore } from '../lib/store';
import { proposerRappel } from '../lib/rappel';
import { age, derniereFois, ecartJours, formatDateHeure, formatJourCourt, ilYA, jourISO, libelleRecurrence } from '../lib/dates';
import { Carte, Petit, couleurs } from './ui';

export { nomsAnimaux };

/** « à Marie, Paul » pour un animal à d'autres, « avec Marie » pour un animal partagé avec moi. */
export function proprietaires(animal: Animal, personnes: Personne[]): string | undefined {
  const noms = animal.proprietaireIds.map((id) => personnes.find((p) => p.id === id)?.nom).filter(Boolean);
  if (noms.length === 0 || animal.statut === 'parti') return undefined;
  return `${animal.statut === 'autre_proprio' ? 'à' : 'avec'} ${noms.join(', ')}`;
}

/** Les animaux de la tâche, ou son lieu. */
function cible(tache: Tache, animaux: Animal[]): string | undefined {
  return nomsAnimaux(tache.animalIds, animaux) || tache.lieu;
}

/** Petit bouton qui prépare un rappel par SMS ou WhatsApp pour la personne à qui la tâche est confiée. */
function BoutonRappel({ tache, personne, jour }: { tache: Tache; personne?: Personne; jour?: string }) {
  const { donnees } = useStore();
  if (!personne?.telephone) return null;
  return (
    <Pressable
      onPress={() => proposerRappel(personne, tache, donnees.animaux, jour)}
      hitSlop={8}
      accessibilityLabel={`Envoyer un rappel à ${personne.nom}`}
      style={({ pressed }) => [{ padding: 6, borderRadius: 10, backgroundColor: couleurs.accentClair }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={couleurs.accent} />
    </Pressable>
  );
}

export function CarteAnimal({ animal, personnes = [] }: { animal: Animal; personnes?: Personne[] }) {
  const passage = animal.statut === 'famille_relais' || animal.statut === 'refuge' || animal.statut === 'autre_proprio';
  const details = [proprietaires(animal, personnes), animal.race, age(animal.dateNaissance)].filter(Boolean).join(' · ');
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
  jour,
  onBasculer,
}: {
  tache: Tache;
  jour?: string;
  faite: boolean;
  realisation?: Realisation;
  animaux: Animal[];
  personnes?: Personne[];
  onBasculer: () => void;
}) {
  const { donnees } = useStore();
  const confiee = personnes.find((p) => p.id === tache.assigneA);
  const sous = [
    confiee && `👤 ${confiee.nom}`,
    cible(tache, animaux),
    tache.heure?.replace(':', 'h'),
    realisation?.seance &&
      `${option(donnees.listes.typesSeance, realisation.seance.type).nom}${realisation.seance.dureeMin ? ` ${realisation.seance.dureeMin} min` : ''}`,
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
          {option(donnees.listes.categoriesTache, tache.categorie).emoji} {tache.titre}
        </Text>
        {!!sous && <Petit>{sous}</Petit>}
      </Pressable>
      {!faite && <BoutonRappel tache={tache} personne={confiee} jour={jour} />}
    </Carte>
  );
}

export function CarteTache({ tache, animaux, personnes = [] }: { tache: Tache; animaux: Animal[]; personnes?: Personne[] }) {
  const { donnees } = useStore();
  const confiee = personnes.find((p) => p.id === tache.assigneA);
  const sous = [
    confiee && `👤 ${confiee.nom}`,
    libelleRecurrence(tache.recurrence),
    tache.heure?.replace(':', 'h'),
    cible(tache, animaux),
    tache.rappel && tache.heure ? '🔔' : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Carte onPress={() => router.push(`/tache/edit?id=${tache.id}`)}>
      <Text style={{ fontSize: 16, color: couleurs.texte }}>
        {option(donnees.listes.categoriesTache, tache.categorie).emoji} {tache.titre}
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

/** Tâche « au besoin » : dernière fois, alerte de retard, bouton pour noter que c'est fait. */
export function CarteSuivi({
  tache,
  jour,
  realisations,
  animaux,
  personnes = [],
  onBasculer,
}: {
  tache: Tache;
  jour: string;
  realisations: Realisation[];
  animaux: Animal[];
  personnes?: Personne[];
  onBasculer: () => void;
}) {
  const { donnees } = useStore();
  const confiee = personnes.find((p) => p.id === tache.assigneA);
  const faitCeJour = realisations.some((r) => r.tacheId === tache.id && r.date === jour);
  const derniere = derniereFois(tache.id, realisations);
  const alerte = tache.recurrence.type === 'libre' ? tache.recurrence.alerteApresJours : undefined;
  const enRetard = !!alerte && (!derniere || ecartJours(derniere, jourISO()) >= alerte);
  const sous = [cible(tache, animaux), confiee && `👤 ${confiee.nom}`]
    .filter(Boolean)
    .join(' · ');
  return (
    <Carte style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, enRetard && { borderColor: couleurs.ambre, backgroundColor: '#FFF8EC' }]}>
      <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push(`/tache/edit?id=${tache.id}`)}>
        <Text style={{ fontSize: 16, color: couleurs.texte, fontWeight: '600' }}>
          {option(donnees.listes.categoriesTache, tache.categorie).emoji} {tache.titre}
        </Text>
        <Text style={{ fontSize: 13, color: enRetard ? couleurs.ambre : couleurs.doux, fontWeight: enRetard ? '600' : '400' }}>
          {derniere ? `Dernière fois ${ilYA(derniere)} (${formatJourCourt(derniere)})` : 'Jamais noté'}
          {enRetard ? ' · à refaire' : ''}
        </Text>
        {!!sous && <Petit>{sous}</Petit>}
      </Pressable>
      {enRetard && <BoutonRappel tache={tache} personne={confiee} />}
      <Pressable
        onPress={onBasculer}
        style={({ pressed }) => [
          {
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 10,
            backgroundColor: faitCeJour ? couleurs.accent : couleurs.accentClair,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={{ color: faitCeJour ? '#fff' : couleurs.accent, fontWeight: '600' }}>{faitCeJour ? '✓ Fait' : 'Fait'}</Text>
      </Pressable>
    </Carte>
  );
}
