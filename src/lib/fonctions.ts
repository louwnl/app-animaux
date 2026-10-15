import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import type { FonctionId, Place, Reglages } from './types';

export interface Fonction {
  id: FonctionId;
  titre: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Écran ouvert depuis Plus (pile de navigation, avec retour). */
  ecran: Href;
  /** Nom de l'onglet quand la fonction est dans la barre du bas. */
  onglet: string;
}

export const FONCTIONS: Record<FonctionId, Fonction> = {
  calendrier: { id: 'calendrier', titre: 'Calendrier', icone: 'calendar-outline', ecran: '/vue/calendrier', onglet: 'calendrier' },
  animaux: { id: 'animaux', titre: 'Animaux', icone: 'paw-outline', ecran: '/vue/animaux', onglet: 'animaux' },
  stock: { id: 'stock', titre: 'Stock', icone: 'cube-outline', ecran: '/vue/stock', onglet: 'stock' },
  finances: { id: 'finances', titre: 'Finances', icone: 'wallet-outline', ecran: '/vue/finances', onglet: 'finances' },
  taches: { id: 'taches', titre: 'Tâches', icone: 'checkbox-outline', ecran: '/taches', onglet: 'o-taches' },
  rdv: { id: 'rdv', titre: 'Rendez-vous', icone: 'medkit-outline', ecran: '/rdv', onglet: 'o-rdv' },
  sante: { id: 'sante', titre: 'Santé', icone: 'heart-outline', ecran: '/sante', onglet: 'o-sante' },
  notes: { id: 'notes', titre: 'Carnet', icone: 'book-outline', ecran: '/notes', onglet: 'o-notes' },
  contacts: { id: 'contacts', titre: 'Pros', icone: 'call-outline', ecran: '/contacts', onglet: 'o-contacts' },
  personnes: { id: 'personnes', titre: 'Personnes', icone: 'people-outline', ecran: '/personnes', onglet: 'o-personnes' },
};

/** Au-delà, les libellés de la barre deviennent illisibles (Aujourd'hui et Plus s'y ajoutent). */
export const MAX_BARRE = 4;

export const REGLAGES_DEFAUT: Reglages = {
  fonctions: [
    { id: 'calendrier', place: 'barre' },
    { id: 'animaux', place: 'barre' },
    { id: 'stock', place: 'barre' },
    { id: 'finances', place: 'barre' },
    { id: 'taches', place: 'plus' },
    { id: 'rdv', place: 'plus' },
    { id: 'sante', place: 'plus' },
    { id: 'notes', place: 'plus' },
    { id: 'contacts', place: 'plus' },
    { id: 'personnes', place: 'plus' },
  ],
};

/** Complète des réglages anciens avec les fonctions apparues depuis. */
export function completerReglages(r?: Partial<Reglages>): Reglages {
  const connues = (r?.fonctions ?? []).filter((f) => f.id in FONCTIONS);
  const manquantes = REGLAGES_DEFAUT.fonctions.filter((f) => !connues.some((c) => c.id === f.id));
  return { fonctions: [...connues, ...manquantes] };
}

export function placeDe(r: Reglages, id: FonctionId): Place {
  return r.fonctions.find((f) => f.id === id)?.place ?? 'plus';
}
