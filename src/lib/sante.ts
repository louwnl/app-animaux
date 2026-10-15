import type { Donnees, Soin } from './types';
import { ajouterJours, depuisJour, ecartJours, jourISO } from './dates';

/** Prochaine échéance d'un soin, pour les animaux qui n'ont pas eu de soin du même type depuis. */
export interface Echeance {
  soin: Soin;
  animalIds: string[];
  jour: string;
  /** Jours restants (négatif : en retard). */
  dans: number;
}

/** Les échéances encore ouvertes, de la plus proche à la plus lointaine. */
export function echeances(d: Donnees, animalId?: string): Echeance[] {
  const aujourdhui = jourISO();
  const liste: Echeance[] = [];
  for (const s of d.soins) {
    if (!s.prochaine) continue;
    const animalIds = s.animalIds.filter((id) => {
      if (animalId && id !== animalId) return false;
      if (d.animaux.find((a) => a.id === id)?.statut === 'parti') return false;
      // Un soin du même type fait depuis remplace celui-ci.
      return !d.soins.some((x) => x.id !== s.id && x.type === s.type && x.animalIds.includes(id) && x.date > s.date);
    });
    if (animalIds.length === 0 && s.animalIds.length > 0) continue;
    liste.push({ soin: s, animalIds, jour: s.prochaine, dans: ecartJours(aujourdhui, s.prochaine) });
  }
  return liste.sort((a, b) => a.jour.localeCompare(b.jour));
}

export function libelleEcheance(dans: number): string {
  if (dans < -1) return `en retard de ${-dans} jours`;
  if (dans === -1) return 'en retard depuis hier';
  if (dans === 0) return "aujourd'hui";
  if (dans === 1) return 'demain';
  if (dans < 60) return `dans ${dans} jours`;
  return `dans ${Math.round(dans / 30)} mois`;
}

/** Ajoute des mois à une date (le 31 janvier + 1 mois donne le 28 ou 29 février). */
export function ajouterMois(jour: string, mois: number): string {
  const d = depuisJour(jour);
  const j = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + mois);
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(j, fin));
  return jourISO(d);
}

/** Écart en mois entier entre deux dates, si c'en est un (pour « refaire » avec le même rythme). */
export function intervalleMois(de: string, a: string): number | undefined {
  for (let m = 1; m <= 36; m++) if (ajouterMois(de, m) === a) return m;
  return undefined;
}

export { ajouterJours };
