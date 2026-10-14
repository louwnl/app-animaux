export type Espece = 'lapin' | 'chat' | 'cheval' | 'autre';
export type StatutAnimal = 'mien' | 'famille_relais' | 'refuge' | 'parti';
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
  notes?: string;
  accueils: Accueil[];
  creeLe: string;
}

export type CategorieTache = 'nettoyage' | 'alimentation' | 'soins' | 'travail' | 'autre';

export type Recurrence =
  | { type: 'unique' }
  | { type: 'quotidienne' }
  | { type: 'hebdo'; jours: number[] } // 0 = dimanche … 6 = samedi
  | { type: 'intervalle'; tousLes: number }; // tous les N jours depuis dateDebut

export interface Tache {
  id: string;
  titre: string;
  categorie: CategorieTache;
  animalId?: string;
  lieu?: string;
  recurrence: Recurrence;
  dateDebut: string; // AAAA-MM-JJ
  dateFin?: string;
  heure?: string; // HH:MM
  rappel: boolean;
  assigneA?: string; // id de Personne ; absent = moi
}

export type TypeSeance = 'longe' | 'monte' | 'liberte' | 'balade' | 'autre';

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

export type CategorieOperation =
  | 'alimentation'
  | 'litiere'
  | 'veterinaire'
  | 'marechal'
  | 'soins'
  | 'materiel'
  | 'pension'
  | 'terrain'
  | 'adoption'
  | 'autre';

export interface Operation {
  id: string;
  date: string; // AAAA-MM-JJ
  libelle: string;
  montant: number; // en euros, toujours positif
  sens: 'depense' | 'recette';
  categorie: CategorieOperation;
  animalId?: string;
  payePar: string; // MOI ou id de Personne
  /** Personnes qui se partagent la dépense à parts égales (MOI inclus le cas échéant). Vide = seul le payeur. */
  partageAvec: string[];
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

export interface Donnees {
  version: 1 | 2;
  animaux: Animal[];
  taches: Tache[];
  realisations: Realisation[];
  rdvs: RendezVous[];
  contacts: Contact[];
  personnes: Personne[];
  operations: Operation[];
  remboursements: Remboursement[];
}
