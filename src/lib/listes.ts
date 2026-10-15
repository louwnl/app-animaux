import type { Listes, Option } from './types';
import { PRODUITS_SUGGERES, UNITES } from './stock';

/** Listes de départ, reprises des choix fixes des versions précédentes (mêmes identifiants). */
export const LISTES_DEFAUT: Listes = {
  categoriesTache: [
    { id: 'nettoyage', emoji: '🧽', nom: 'Nettoyage' },
    { id: 'alimentation', emoji: '🥕', nom: 'Alimentation' },
    { id: 'soins', emoji: '🪮', nom: 'Soins / brossage' },
    { id: 'travail', emoji: '🏇', nom: 'Travail' },
    { id: 'autre', emoji: '📌', nom: 'Autre' },
  ],
  categoriesOperation: [
    { id: 'alimentation', emoji: '🥕', nom: 'Alimentation' },
    { id: 'litiere', emoji: '🧺', nom: 'Litière / paille' },
    { id: 'veterinaire', emoji: '🩺', nom: 'Vétérinaire' },
    { id: 'marechal', emoji: '🧲', nom: 'Maréchal' },
    { id: 'soins', emoji: '💊', nom: 'Soins / médicaments' },
    { id: 'materiel', emoji: '🧰', nom: 'Matériel' },
    { id: 'pension', emoji: '🏠', nom: 'Pension' },
    { id: 'terrain', emoji: '🌾', nom: 'Terrain' },
    { id: 'adoption', emoji: '🐾', nom: 'Adoption / refuge' },
    { id: 'autre', emoji: '📌', nom: 'Autre' },
  ],
  categoriesNote: [
    { id: 'sante', emoji: '💊', nom: 'Santé' },
    { id: 'alimentation', emoji: '🥕', nom: 'Alimentation' },
    { id: 'tuto', emoji: '🛠️', nom: 'Tutos' },
    { id: 'divers', emoji: '📒', nom: 'Divers' },
  ],
  typesSante: [
    { id: 'vaccin', emoji: '💉', nom: 'Vaccin' },
    { id: 'vermifuge', emoji: '💊', nom: 'Vermifuge' },
    { id: 'antiparasitaire', emoji: '🪲', nom: 'Antiparasitaire' },
    { id: 'marechal', emoji: '🧲', nom: 'Maréchal / parage' },
    { id: 'dentiste', emoji: '🦷', nom: 'Dentiste' },
    { id: 'osteo', emoji: '🤲', nom: 'Ostéo' },
    { id: 'griffes', emoji: '✂️', nom: 'Griffes / dents (lapin)' },
    { id: 'autre', emoji: '📌', nom: 'Autre' },
  ],
  produitsStock: PRODUITS_SUGGERES.map((p, i) => ({ id: `p${i}`, ...p })),
  unitesStock: UNITES.map((u) => ({ id: u, emoji: '', nom: u })),
  typesSeance: [
    { id: 'longe', emoji: '🔄', nom: 'Longe' },
    { id: 'monte', emoji: '🏇', nom: 'Monté' },
    { id: 'liberte', emoji: '🐎', nom: 'Liberté' },
    { id: 'balade', emoji: '🌳', nom: 'Balade' },
    { id: 'autre', emoji: '📌', nom: 'Autre' },
  ],
};

export const NOMS_LISTES: Record<keyof Listes, string> = {
  categoriesTache: 'Catégories de tâches',
  categoriesOperation: 'Catégories de dépenses',
  typesSeance: 'Types de séances',
  categoriesNote: 'Catégories de notes',
  typesSante: 'Types de soins',
  produitsStock: 'Produits du stock (ajout rapide)',
  unitesStock: 'Unités du stock',
};

/** L'entrée d'une liste, ou une entrée de remplacement si elle a disparu. */
export function option(liste: Option[], id: string | undefined): Option {
  return liste.find((o) => o.id === id) ?? { id: id ?? '', emoji: '📌', nom: 'Autre' };
}

/** « 🥕 Alimentation » */
export function libelle(liste: Option[], id: string | undefined): string {
  const o = option(liste, id);
  return `${o.emoji} ${o.nom}`;
}

/** Les entrées au format attendu par le composant Choix. */
export function choix(liste: Option[]): [string, string][] {
  return liste.map((o) => [o.id, `${o.emoji} ${o.nom}`]);
}
