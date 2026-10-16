import type { Animal, Realisation, Recurrence, Tache } from './types';
import { JOURS_COURTS } from './libelles';

const pad = (n: number) => String(n).padStart(2, '0');

/** Date locale au format AAAA-MM-JJ. */
export function jourISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Interprète AAAA-MM-JJ comme une date locale à minuit. */
export function depuisJour(jour: string): Date {
  const [a, m, j] = jour.split('-').map(Number);
  return new Date(a, m - 1, j);
}

export function ajouterJours(jour: string, n: number): string {
  const d = depuisJour(jour);
  d.setDate(d.getDate() + n);
  return jourISO(d);
}

export function ecartJours(de: string, a: string): number {
  return Math.round((depuisJour(a).getTime() - depuisJour(de).getTime()) / 86400000);
}

export function formatJour(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatJourCourt(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

export function formatHeure(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

export function libelleRecurrence(r: Recurrence): string {
  switch (r.type) {
    case 'unique':
      return 'Une fois';
    case 'quotidienne':
      return 'Tous les jours';
    case 'hebdo':
      return r.jours.length === 7
        ? 'Tous les jours'
        : [...r.jours]
            .sort()
            .map((j) => JOURS_COURTS[j])
            .join(', ');
    case 'intervalle':
      return `Tous les ${r.tousLes} jours`;
    case 'libre':
      return r.alerteApresJours ? `Au besoin · alerte après ${r.alerteApresJours} j` : 'Au besoin';
  }
}

/** Une tâche liée à des animaux s'arrête quand ils sont tous partis. */
export function tacheActive(t: Tache, animaux: Animal[]): boolean {
  if (t.animalIds.length === 0) return true;
  return t.animalIds.some((id) => animaux.find((a) => a.id === id)?.statut !== 'parti');
}

/** Tâche finie : ponctuelle déjà passée, ou arrivée à sa date de fin. */
export function tacheTerminee(t: Tache, aujourdhui: string): boolean {
  if (t.reports?.some((r) => r.vers >= aujourdhui)) return false;
  if (t.dateFin && t.dateFin < aujourdhui) return true;
  return t.recurrence.type === 'unique' && t.dateDebut < aujourdhui;
}

/** La tâche tombe-t-elle ce jour-là ? Les tâches d'animaux partis s'arrêtent. */
export function tacheLeJour(t: Tache, jour: string, animaux: Animal[]): boolean {
  if (!tacheActive(t, animaux)) return false;
  // Une occurrence reportée quitte son jour d'origine et arrive le jour choisi.
  if (t.reports?.some((r) => r.vers === jour)) return true;
  if (t.reports?.some((r) => r.de === jour)) return false;
  return tachePrevue(t, jour);
}

/** Le jour fait-il partie du rythme de la tâche (sans tenir compte des reports) ? */
export function tachePrevue(t: Tache, jour: string): boolean {
  if (jour < t.dateDebut) return false;
  if (t.dateFin && jour > t.dateFin) return false;
  const r = t.recurrence;
  switch (r.type) {
    case 'unique':
      return jour === t.dateDebut;
    case 'quotidienne':
      return true;
    case 'hebdo':
      return r.jours.includes(depuisJour(jour).getDay());
    case 'intervalle':
      return ecartJours(t.dateDebut, jour) % Math.max(1, r.tousLes) === 0;
    case 'libre':
      return false; // pas de date prévue, voir derniereFois
  }
}

export function age(dateNaissance?: string): string | undefined {
  if (!dateNaissance) return undefined;
  const n = depuisJour(dateNaissance);
  const now = new Date();
  let mois = (now.getFullYear() - n.getFullYear()) * 12 + now.getMonth() - n.getMonth();
  if (now.getDate() < n.getDate()) mois--;
  if (mois < 0) return undefined;
  if (mois < 24) return `${mois} mois`;
  return `${Math.floor(mois / 12)} ans`;
}

/** Jour de la dernière réalisation d'une tâche, s'il y en a une. */
export function derniereFois(tacheId: string, realisations: Realisation[]): string | undefined {
  let max: string | undefined;
  for (const r of realisations) if (r.tacheId === tacheId && (!max || r.date > max)) max = r.date;
  return max;
}

export function ilYA(jour: string): string {
  const n = ecartJours(jour, jourISO());
  if (n <= 0) return "aujourd'hui";
  if (n === 1) return 'hier';
  return `il y a ${n} jours`;
}
