import { MOI, type Personne, type Tache } from './types';
import { ajouterJours, tachePrevue } from './dates';

/** La tâche me revient-elle (personne d'assigné, ou moi parmi les personnes) ? */
export function pourMoi(t: Tache): boolean {
  return t.assigneeIds.length === 0 || t.assigneeIds.includes(MOI);
}

/** Une tâche confiée à une seule autre personne est notée comme faite par elle. */
export function faitePar(t?: Tache): string | undefined {
  if (!t || t.assigneeIds.length !== 1 || t.assigneeIds[0] === MOI) return undefined;
  return t.assigneeIds[0];
}

/** Les autres personnes à qui la tâche est confiée. */
export function confiees(t: Tache, personnes: Personne[]): Personne[] {
  return t.assigneeIds.map((id) => personnes.find((p) => p.id === id)).filter((p): p is Personne => !!p);
}

/** « 👤 Marie, Paul » (avec « Moi » si je fais partie du lot), ou rien si la tâche n'est qu'à moi. */
export function libelleConfiee(t: Tache, personnes: Personne[]): string | undefined {
  const autres = confiees(t, personnes);
  if (autres.length === 0) return undefined;
  const noms = [...(t.assigneeIds.includes(MOI) ? ['Moi'] : []), ...autres.map((p) => p.nom)];
  return `👤 ${noms.join(', ')}`;
}

/**
 * Reporte l'occurrence d'un jour au lendemain.
 * Une tâche ponctuelle change simplement de date ; une tâche régulière garde son rythme
 * et note le report (les reports déjà arrivés ce jour-là sont décalés eux aussi).
 */
export function reporterAuLendemain(t: Tache, jour: string): Tache {
  const demain = ajouterJours(jour, 1);
  if (t.recurrence.type === 'unique') {
    return { ...t, dateDebut: demain, dateFin: t.dateFin && t.dateFin < demain ? demain : t.dateFin, reports: undefined };
  }
  // On oublie les vieux reports pour que la liste reste courte.
  const limite = ajouterJours(jour, -60);
  const reports = (t.reports ?? []).filter((r) => r.vers >= limite).map((r) => (r.vers === jour ? { ...r, vers: demain } : r));
  if (tachePrevue(t, jour) && !reports.some((r) => r.de === jour)) reports.push({ de: jour, vers: demain });
  return { ...t, reports };
}
