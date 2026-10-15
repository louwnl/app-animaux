import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Donnees, Realisation, Tache } from '../lib/types';
import { CLE, normaliser, nouvelId } from '../lib/store';
import { derniereFois, ecartJours, jourISO, tacheActive, tacheLeJour } from '../lib/dates';
import { faitePar } from '../lib/taches';
import { option } from '../lib/listes';

export async function lire(): Promise<Donnees> {
  const brut = await AsyncStorage.getItem(CLE);
  return normaliser(brut ? JSON.parse(brut) : {});
}

export interface LigneWidget {
  tacheId: string;
  texte: string;
  faite: boolean;
  /** Suivi « au besoin » en retard : affiché en orange. */
  retard: boolean;
}

/** Les tâches du jour puis les suivis en retard, comme dans Aujourd'hui. */
export function lignesDuJour(d: Donnees): LigneWidget[] {
  const jour = jourISO();
  const faites = new Set(d.realisations.filter((r) => r.date === jour).map((r) => r.tacheId));
  const emoji = (t: Tache) => option(d.listes.categoriesTache, t.categorie).emoji;
  const taches = d.taches
    .filter((t) => tacheLeJour(t, jour, d.animaux))
    .sort((a, b) => (a.heure ?? '99').localeCompare(b.heure ?? '99'))
    .map((t) => ({
      tacheId: t.id,
      texte: `${emoji(t)} ${t.titre}${t.heure ? ` · ${t.heure.replace(':', 'h')}` : ''}`,
      faite: faites.has(t.id),
      retard: false,
    }));
  const suivis = d.taches
    .filter((t) => t.recurrence.type === 'libre' && t.recurrence.alerteApresJours && tacheActive(t, d.animaux))
    .filter((t) => {
      const derniere = derniereFois(t.id, d.realisations);
      const alerte = t.recurrence.type === 'libre' ? t.recurrence.alerteApresJours! : 0;
      return faites.has(t.id) || !derniere || ecartJours(derniere, jour) >= alerte;
    })
    .map((t) => ({ tacheId: t.id, texte: `${emoji(t)} ${t.titre}`, faite: faites.has(t.id), retard: !faites.has(t.id) }));
  return [...taches, ...suivis];
}

/** Coche ou décoche une tâche pour aujourd'hui depuis le widget, directement dans les données enregistrées. */
export async function basculer(tacheId: string): Promise<Donnees> {
  const d = await lire();
  const jour = jourISO();
  const existante = d.realisations.find((r) => r.tacheId === tacheId && r.date === jour);
  let realisations: Realisation[];
  if (existante) realisations = d.realisations.filter((r) => r.id !== existante.id);
  else {
    const t = d.taches.find((x) => x.id === tacheId);
    if (!t) return d;
    realisations = [...d.realisations, { id: nouvelId(), tacheId, date: jour, faiteLe: new Date().toISOString(), faitePar: faitePar(t) }];
  }
  const suite = { ...d, realisations };
  await AsyncStorage.setItem(CLE, JSON.stringify(suite));
  return suite;
}
