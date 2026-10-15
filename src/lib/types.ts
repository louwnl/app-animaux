export type Espece = 'lapin' | 'chat' | 'cheval' | 'autre';
export type StatutAnimal = 'mien' | 'famille_relais' | 'refuge' | 'autre_proprio' | 'parti';
export type TypeAccueil = 'famille_relais' | 'refuge';
export type IssueAccueil = 'adopte' | 'retour_refuge' | 'transfert' | 'decede' | 'autre';

/** Un séjour d'un animal de passage (un animal peut en avoir plusieurs). */
export interface Accueil {
  id: string;
  type: TypeAccueil;
  structureId?: string; // Contact de type refuge / association
  dateArrivee: string; // AAAA-MM-JJ
  dateDepart?: string;
  issue?: IssueAccueil;
  notes?: string;
}

export interface Animal {
  id: string;
  nom: string;
  espece: Espece;
  race?: string;
  sexe?: 'male' | 'femelle' | 'inconnu';
  dateNaissance?: string;
  robe?: string;
  identification?: string;
  statut: StatutAnimal;
  /** Personnes propriétaires : les propriétaires d'un animal à quelqu'un d'autre, ou les copropriétaires d'un animal à moi. */
  proprietaireIds: string[];
  /** Photo : nom du fichier dans le dossier photos (Android) ou image en data URI (web). */
  photo?: string;
  /** Afficher la courbe de poids sur la fiche. */
  suiviPoids?: boolean;
  notes?: string;
  accueils: Accueil[];
  creeLe: string;
}

/** Identifiant d'une entrée de liste personnalisable (voir Listes). */
export type CategorieTache = string;

export type Recurrence =
  | { type: 'unique' }
  | { type: 'quotidienne' }
  | { type: 'hebdo'; jours: number[] } // 0 = dimanche … 6 = samedi
  | { type: 'intervalle'; tousLes: number } // tous les N jours depuis dateDebut
  | { type: 'libre'; alerteApresJours?: number }; // au besoin : on note quand c'est fait

export interface Tache {
  id: string;
  titre: string;
  categorie: CategorieTache;
  animalIds: string[];
  lieu?: string;
  recurrence: Recurrence;
  dateDebut: string; // AAAA-MM-JJ
  dateFin?: string;
  heure?: string; // HH:MM
  rappel: boolean;
  /** Qui s'en occupe : ids de Personne, et MOI. Vide = moi. */
  assigneeIds: string[];
}

export type TypeSeance = string;

/** Une occurrence de tâche cochée. */
export interface Realisation {
  id: string;
  tacheId: string;
  date: string; // jour de l'occurrence
  faiteLe: string; // ISO
  seance?: { type: TypeSeance; dureeMin?: number; ressenti?: string };
  faitePar?: string; // id de Personne ; absent = moi
  notes?: string;
}

export type TypeRdv = 'veterinaire' | 'marechal' | 'osteo' | 'dentiste' | 'toilettage' | 'pre_adoption' | 'autre';
export type Rappel = 'aucun' | 'heure' | 'veille' | 'les_deux';

export interface RendezVous {
  id: string;
  titre: string;
  type: TypeRdv;
  dateHeure: string; // ISO
  lieu?: string;
  contactId?: string;
  animalIds: string[];
  rappel: Rappel;
  compteRendu?: string;
}

export type CategorieContact =
  | 'veterinaire'
  | 'marechal'
  | 'refuge'
  | 'pension'
  | 'petsitter'
  | 'soigneur'
  | 'fournisseur'
  | 'autre';

export interface Contact {
  id: string;
  /** Sites web (commande en ligne…). */
  liens?: string[];
  nom: string;
  structure?: string;
  categorie: CategorieContact;
  telephone?: string;
  email?: string;
  adresse?: string;
  notes?: string;
}

/** Identifiant réservé désignant l'utilisatrice / l'utilisateur de l'app. */
export const MOI = 'moi';

/** Une personne de l'entourage : partage des frais, tâches confiées. */
export interface Personne {
  id: string;
  nom: string;
  telephone?: string;
  notes?: string;
}

export type CategorieOperation = string;

export interface Operation {
  id: string;
  date: string; // AAAA-MM-JJ
  libelle: string;
  montant: number; // en euros, toujours positif
  sens: 'depense' | 'recette';
  categorie: CategorieOperation;
  animalIds: string[];
  payePar: string; // MOI ou id de Personne
  /** Personnes qui se partagent la dépense à parts égales (MOI inclus le cas échéant). Vide = seul le payeur. */
  partageAvec: string[];
  /** Partage inégal : montant de chaque personne. Prioritaire sur le partage à parts égales. */
  parts?: Record<string, number>;
  notes?: string;
}

export interface Remboursement {
  id: string;
  date: string;
  de: string; // MOI ou id de Personne
  a: string;
  montant: number;
  notes?: string;
}

/** Une entrée d'une liste personnalisable (catégorie, type de séance…). */
export interface Option {
  id: string;
  emoji: string;
  nom: string;
}

export interface OptionProduit extends Option {
  unite: string;
}

export interface Listes {
  categoriesNote: Option[];
  typesSante: Option[];
  /** Produits proposés en ajout rapide dans le stock. */
  produitsStock: OptionProduit[];
  /** Unités proposées pour le stock (seul le nom compte). */
  unitesStock: Option[];
  categoriesTache: Option[];
  categoriesOperation: Option[];
  typesSeance: Option[];
}

/** Une note du carnet, liée ou non à des animaux. */
export interface Note {
  id: string;
  categorie?: string;
  titre: string;
  texte: string;
  animalIds: string[];
  modifieLe: string; // ISO
}

/** Un produit en stock (foin, grain, croquettes…), compté dans l'unité choisie. */
export interface Produit {
  id: string;
  nom: string;
  emoji: string;
  unite: string;
  quantite: number;
  seuil?: number; // alerte quand la quantité descend à ce niveau
  notes?: string;
}

export interface Donnees {
  version: 4;
  animaux: Animal[];
  taches: Tache[];
  realisations: Realisation[];
  rdvs: RendezVous[];
  contacts: Contact[];
  personnes: Personne[];
  operations: Operation[];
  remboursements: Remboursement[];
  notes: Note[];
  produits: Produit[];
  listes: Listes;
  soins: Soin[];
  pesees: Pesee[];
  reglages: Reglages;
}

/** Un soin de santé (vaccin, vermifuge, maréchal…) fait à une date, avec la prochaine échéance éventuelle. */
export interface Soin {
  id: string;
  type: string; // Listes.typesSante
  animalIds: string[];
  date: string; // AAAA-MM-JJ, jour où il a été fait
  prochaine?: string; // AAAA-MM-JJ, prochaine échéance
  rappel: boolean;
  notes?: string;
}

export interface Pesee {
  id: string;
  animalId: string;
  date: string; // AAAA-MM-JJ
  kg: number;
}

/** Fonctions de l'app qu'on peut placer dans la barre du bas, dans Plus, ou masquer. */
export type FonctionId = 'calendrier' | 'animaux' | 'stock' | 'finances' | 'taches' | 'rdv' | 'sante' | 'notes' | 'contacts' | 'personnes';
export type Place = 'barre' | 'plus' | 'masque';

export interface Reglages {
  /** Ordre et place de chaque fonction. */
  fonctions: { id: FonctionId; place: Place }[];
}
