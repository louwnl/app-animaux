import type { Animal, Recurrence, Tache } from './types';
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

function ecartJours(de: string, a: string): number {
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
      return r.jours.length === 7 ? 'Tous les jours' : [...r.jours].sort().map((j) => JOURS_COURTS[j]).join(', ');
    case 'intervalle':
      return `Tous les ${r.tousLes} jours`;
  }
}

/** La tâche tombe-t-elle ce jour-là ? Les tâches d'un animal parti s'arrêtent. */
export function tacheLeJour(t: Tache, jour: string, animaux: Animal[]): boolean {
  if (jour < t.dateDebut) return false;
  if (t.dateFin && jour > t.dateFin) return false;
  if (t.animalId) {
    const a = animaux.find((x) => x.id === t.animalId);
    if (a?.statut === 'parti') return false;
  }
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
