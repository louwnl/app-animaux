import type {
  CategorieContact,
  CategorieTache,
  Espece,
  IssueAccueil,
  Rappel,
  StatutAnimal,
  TypeAccueil,
  TypeRdv,
  TypeSeance,
} from './types';

export const ESPECES: Record<Espece, string> = {
  lapin: '🐇 Lapin',
  chat: '🐈 Chat',
  cheval: '🐎 Cheval',
  autre: '🐾 Autre',
};

export const EMOJI_ESPECE: Record<Espece, string> = {
  lapin: '🐇',
  chat: '🐈',
  cheval: '🐎',
  autre: '🐾',
};

export const STATUTS: Record<StatutAnimal, string> = {
  mien: 'Le mien',
  famille_relais: 'Famille relais',
  refuge: 'Au refuge',
  parti: 'Parti',
};

export const TYPES_ACCUEIL: Record<TypeAccueil, string> = {
  famille_relais: 'Famille relais',
  refuge: 'Refuge',
};

export const ISSUES: Record<IssueAccueil, string> = {
  adopte: 'Adopté',
  retour_refuge: 'Retour refuge',
  transfert: 'Transfert',
  decede: 'Décédé',
  autre: 'Autre',
};

export const CATEGORIES_TACHE: Record<CategorieTache, string> = {
  nettoyage: '🧽 Nettoyage',
  alimentation: '🥕 Alimentation',
  soins: '🪮 Soins / brossage',
  travail: '🏇 Travail',
  autre: '📌 Autre',
};

export const TYPES_SEANCE: Record<TypeSeance, string> = {
  longe: 'Longe',
  monte: 'Monté',
  liberte: 'Liberté',
  balade: 'Balade',
  autre: 'Autre',
};

export const TYPES_RDV: Record<TypeRdv, string> = {
  veterinaire: 'Vétérinaire',
  marechal: 'Maréchal-ferrant',
  osteo: 'Ostéopathe',
  dentiste: 'Dentiste équin',
  toilettage: 'Toilettage',
  pre_adoption: 'Visite pré-adoption',
  autre: 'Autre',
};

export const RAPPELS: Record<Rappel, string> = {
  aucun: 'Aucun',
  heure: '1 h avant',
  veille: 'La veille',
  les_deux: 'Les deux',
};

export const CATEGORIES_CONTACT: Record<CategorieContact, string> = {
  veterinaire: 'Vétérinaire',
  marechal: 'Maréchal-ferrant',
  refuge: 'Refuge / association',
  pension: 'Pension / écurie',
  petsitter: 'Pet-sitter',
  soigneur: 'Soigneur / ostéo',
  fournisseur: 'Fournisseur',
  autre: 'Autre',
};

export const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
