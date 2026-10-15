import { MOI, type CategorieOperation, type Donnees, type Operation } from './types';

export function euros(montant: number): string {
  return montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/** Les personnes qui partagent la dépense (le payeur seul si personne n'est indiqué). */
export function participants(o: Operation): string[] {
  if (o.parts && Object.keys(o.parts).length > 0) return Object.keys(o.parts);
  return o.partageAvec.length > 0 ? o.partageAvec : [o.payePar];
}

/** Part d'une personne dans une dépense (0 si elle n'y participe pas). */
export function partDe(o: Operation, personneId: string): number {
  if (o.sens !== 'depense') return 0;
  if (o.parts && Object.keys(o.parts).length > 0) return o.parts[personneId] ?? 0;
  const p = participants(o);
  return p.includes(personneId) ? o.montant / p.length : 0;
}

/**
 * Solde entre moi et une personne : positif, elle me doit ; négatif, je lui dois.
 * Une dépense que j'ai payée et qu'elle partage augmente ce qu'elle me doit, et inversement.
 * Les remboursements soldent la dette.
 */
export function solde(d: Donnees, personneId: string): number {
  let s = 0;
  for (const o of d.operations) {
    if (o.sens !== 'depense') continue;
    if (o.payePar === MOI) s += partDe(o, personneId);
    else if (o.payePar === personneId) s -= partDe(o, MOI);
  }
  for (const r of d.remboursements) {
    if (r.de === personneId && r.a === MOI) s -= r.montant;
    if (r.de === MOI && r.a === personneId) s += r.montant;
  }
  return Math.round(s * 100) / 100;
}

export interface Bilan {
  /** Ce que me coûtent réellement mes dépenses (ma part). */
  maPart: number;
  /** Ce que j'ai sorti de ma poche, avant remboursements. */
  payeParMoi: number;
  recettes: number;
  parCategorie: [CategorieOperation, number][];
  parAnimal: [string | undefined, number][];
}

/** Bilan des opérations d'une période (filtre libre), du point de vue de ma part. */
export function bilan(operations: Operation[]): Bilan {
  let maPart = 0;
  let payeParMoi = 0;
  let recettes = 0;
  const cat = new Map<CategorieOperation, number>();
  const ani = new Map<string | undefined, number>();
  for (const o of operations) {
    if (o.sens === 'recette') {
      if (o.payePar === MOI) recettes += o.montant;
      continue;
    }
    if (o.payePar === MOI) payeParMoi += o.montant;
    const part = partDe(o, MOI);
    if (part === 0) continue;
    maPart += part;
    cat.set(o.categorie, (cat.get(o.categorie) ?? 0) + part);
    // Une dépense pour plusieurs animaux est répartie à parts égales entre eux.
    const ids = o.animalIds.length > 0 ? o.animalIds : [undefined];
    for (const id of ids) ani.set(id, (ani.get(id) ?? 0) + part / ids.length);
  }
  const trie = <K,>(m: Map<K, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return { maPart, payeParMoi, recettes, parCategorie: trie(cat), parAnimal: trie(ani) };
}

/** Lit un montant saisi au clavier (« 12,50 », « 12.5 »). */
export function lireMontant(texte: string): number | undefined {
  const n = parseFloat(texte.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}
