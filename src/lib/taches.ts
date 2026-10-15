import { MOI, type Personne, type Tache } from './types';

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
