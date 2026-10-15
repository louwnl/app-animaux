import type { Produit } from './types';

/** Unités de départ, modifiables dans les paramètres. */
export const UNITES = ['ballot', 'botte', 'kg', 'litre', 'sac', 'paquet', 'boîte', 'pièce'];

/** Produits proposés pour démarrer vite, modifiables dans les paramètres. */
export const PRODUITS_SUGGERES: Pick<Produit, 'nom' | 'emoji' | 'unite'>[] = [
  { nom: 'Foin des chevaux', emoji: '🌾', unite: 'ballot' },
  { nom: 'Grain des chevaux', emoji: '🌽', unite: 'sac' },
  { nom: 'Foin des lapins', emoji: '🌾', unite: 'botte' },
  { nom: 'Granulés des lapins', emoji: '🐇', unite: 'kg' },
  { nom: 'Légumes des lapins', emoji: '🥕', unite: 'kg' },
  { nom: 'Croquettes du chat', emoji: '🐈', unite: 'paquet' },
  { nom: 'Litière', emoji: '🧺', unite: 'sac' },
];

/** Emojis proposés en plus de ceux des produits des paramètres. */
export const EMOJIS_PRODUIT = ['🌾', '🌽', '🥕', '🥬', '🍎', '🐇', '🐈', '🐎', '🧺', '🪵', '💊', '🧴', '📦'];

export function aRacheter(p: Produit): boolean {
  return p.seuil !== undefined && p.quantite <= p.seuil;
}

/** « 3 ballots », « 1,5 kg » : pluriel simple pour les unités en toutes lettres. */
export function quantiteTexte(n: number, unite: string): string {
  const nombre = n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const abrege = unite.length <= 2 || /^[A-Z]/.test(unite);
  const pluriel = !abrege && Math.abs(n) >= 2 && !/[sxz]$/.test(unite) ? `${unite}s` : unite;
  return `${nombre} ${pluriel}`;
}

/** Lit « 2,5 » ou « 2.5 ». Accepte 0. */
export function lireQuantite(texte: string): number | undefined {
  const n = parseFloat(texte.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}
