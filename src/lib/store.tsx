import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  MOI,
  type Animal,
  type Contact,
  type Donnees,
  type Listes,
  type Operation,
  type Personne,
  type Realisation,
  type Reglages,
  type RendezVous,
  type Tache,
} from './types';
import { LISTES_DEFAUT } from './listes';
import { completerReglages, REGLAGES_DEFAUT } from './fonctions';
import { demanderPermission, replanifierTout } from './notifications';
import { faitePar } from './taches';

export const CLE = 'mes-animaux:donnees';

const VIDE: Donnees = {
  version: 4,
  animaux: [],
  taches: [],
  realisations: [],
  rdvs: [],
  contacts: [],
  personnes: [],
  operations: [],
  remboursements: [],
  notes: [],
  produits: [],
  listes: LISTES_DEFAUT,
  soins: [],
  pesees: [],
  reglages: REGLAGES_DEFAUT,
};

/** Champs des versions précédentes, repris à la lecture. */
type Ancien = { animalId?: string; proprietaireId?: string; assigneA?: string };

/** Complète des données anciennes ou importées avec les collections manquantes et les migre au format actuel. */
export function normaliser(brut: Partial<Donnees>): Donnees {
  const d: Donnees = { ...VIDE, ...brut, version: 4 };
  d.listes = { ...LISTES_DEFAUT, ...brut.listes };
  // V4 : une tâche peut concerner plusieurs animaux, un animal avoir plusieurs propriétaires.
  d.reglages = completerReglages(brut.reglages);
  d.taches = d.taches.map((t) => {
    const { animalId, assigneA, ...reste } = t as Tache & Ancien;
    return {
      ...reste,
      animalIds: t.animalIds ?? (animalId ? [animalId] : []),
      // V5 : plusieurs personnes par tâche.
      assigneeIds: t.assigneeIds ?? (assigneA ? [assigneA] : []),
    };
  });
  d.operations = d.operations.map((o) => {
    const { animalId, ...reste } = o as Operation & Ancien;
    return { ...reste, animalIds: o.animalIds ?? (animalId ? [animalId] : []) };
  });
  d.animaux = d.animaux.map((a) => {
    const { proprietaireId, ...reste } = a as Animal & Ancien;
    return { ...reste, proprietaireIds: a.proprietaireIds ?? (proprietaireId ? [proprietaireId] : []) };
  });
  return d;
}

/** Met à jour le widget d'écran d'accueil (Android seulement ; chargé à la demande pour éviter un import circulaire). */
function rafraichirWidget(d: Donnees) {
  if (Platform.OS !== 'android') return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('../widget/gestion') as typeof import('../widget/gestion')).rafraichirWidget(d);
}

export function nouvelId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Collection =
  | 'animaux'
  | 'taches'
  | 'realisations'
  | 'rdvs'
  | 'contacts'
  | 'personnes'
  | 'operations'
  | 'remboursements'
  | 'notes'
  | 'produits'
  | 'soins'
  | 'pesees';
type Element<C extends Collection> = Donnees[C][number];

interface Store {
  pret: boolean;
  donnees: Donnees;
  enregistrer: <C extends Collection>(collection: C, element: Element<C>) => void;
  supprimer: (collection: Collection, id: string) => void;
  basculerRealisation: (tacheId: string, jour: string, details?: Partial<Realisation>) => void;
  remplacerTout: (d: Donnees) => void;
  majListes: (listes: Listes) => void;
  majReglages: (reglages: Reglages) => void;
}

const Contexte = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [donnees, setDonnees] = useState<Donnees>(VIDE);
  const [pret, setPret] = useState(false);
  const delaiRappels = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const brut = await AsyncStorage.getItem(CLE);
        if (brut) {
          const d = normaliser(JSON.parse(brut));
          setDonnees(d);
          demanderPermission().then((ok) => {
            if (ok) replanifierTout(d);
          });
        } else {
          demanderPermission();
        }
      } finally {
        setPret(true);
      }
    })();
  }, []);

  // Le widget peut cocher des tâches pendant que l'app est en arrière-plan : on relit les données au retour.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat !== 'active') return;
      AsyncStorage.getItem(CLE).then((brut) => {
        if (brut) setDonnees(normaliser(JSON.parse(brut)));
      });
    });
    return () => abonnement.remove();
  }, []);

  const appliquer = useCallback((modif: (d: Donnees) => Donnees) => {
    setDonnees((avant) => {
      const apres = modif(avant);
      AsyncStorage.setItem(CLE, JSON.stringify(apres)).catch((e) => console.warn('Sauvegarde échouée', e));
      // Regroupe les reprogrammations quand plusieurs modifications s'enchaînent.
      if (delaiRappels.current) clearTimeout(delaiRappels.current);
      delaiRappels.current = setTimeout(() => {
        replanifierTout(apres);
        rafraichirWidget(apres);
      }, 800);
      return apres;
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      pret,
      donnees,
      enregistrer: (collection, element) =>
        appliquer((d) => {
          const liste = d[collection] as { id: string }[];
          const existe = liste.some((x) => x.id === element.id);
          return {
            ...d,
            [collection]: existe ? liste.map((x) => (x.id === element.id ? element : x)) : [...liste, element],
          };
        }),
      supprimer: (collection, id) =>
        appliquer((d) => {
          const suite: Donnees = { ...d, [collection]: (d[collection] as { id: string }[]).filter((x) => x.id !== id) };
          // Nettoyage des liens vers l'élément supprimé.
          if (collection === 'taches') suite.realisations = suite.realisations.filter((r) => r.tacheId !== id);
          if (collection === 'animaux') {
            // Une tâche qui ne concernait que cet animal disparaît, les autres le perdent simplement.
            const seules = new Set(suite.taches.filter((t) => t.animalIds.length === 1 && t.animalIds[0] === id).map((t) => t.id));
            suite.taches = suite.taches
              .filter((t) => !seules.has(t.id))
              .map((t) => ({ ...t, animalIds: t.animalIds.filter((a) => a !== id) }));
            suite.realisations = suite.realisations.filter((r) => !seules.has(r.tacheId));
            suite.notes = suite.notes.map((n) => ({ ...n, animalIds: n.animalIds.filter((a) => a !== id) }));
            suite.rdvs = suite.rdvs.map((r) => ({ ...r, animalIds: r.animalIds.filter((a) => a !== id) }));
            suite.operations = suite.operations.map((o) => ({ ...o, animalIds: o.animalIds.filter((a) => a !== id) }));
            suite.pesees = suite.pesees.filter((p) => p.animalId !== id);
            const soinsSeuls = new Set(suite.soins.filter((s) => s.animalIds.length === 1 && s.animalIds[0] === id).map((s) => s.id));
            suite.soins = suite.soins
              .filter((s) => !soinsSeuls.has(s.id))
              .map((s) => ({ ...s, animalIds: s.animalIds.filter((a) => a !== id) }));
          }
          if (collection === 'personnes') {
            suite.taches = suite.taches.map((t) => ({ ...t, assigneeIds: t.assigneeIds.filter((p) => p !== id) }));
            suite.animaux = suite.animaux.map((a) => ({ ...a, proprietaireIds: a.proprietaireIds.filter((p) => p !== id) }));
          }
          return suite;
        }),
      basculerRealisation: (tacheId, jour, details) =>
        appliquer((d) => {
          const existante = d.realisations.find((r) => r.tacheId === tacheId && r.date === jour);
          if (existante && !details) {
            return { ...d, realisations: d.realisations.filter((r) => r.id !== existante.id) };
          }
          const r: Realisation = {
            id: existante?.id ?? nouvelId(),
            tacheId,
            date: jour,
            faiteLe: new Date().toISOString(),
            faitePar: faitePar(d.taches.find((t) => t.id === tacheId)),
            ...details,
          };
          return { ...d, realisations: [...d.realisations.filter((x) => x.id !== r.id), r] };
        }),
      remplacerTout: (nouvelles) => appliquer(() => normaliser(nouvelles)),
      majListes: (listes) => appliquer((d) => ({ ...d, listes })),
      majReglages: (reglages) => appliquer((d) => ({ ...d, reglages })),
    }),
    [pret, donnees, appliquer],
  );

  return <Contexte.Provider value={store}>{children}</Contexte.Provider>;
}

export function useStore(): Store {
  const s = useContext(Contexte);
  if (!s) throw new Error('useStore hors de StoreProvider');
  return s;
}

export function useAnimal(id?: string): Animal | undefined {
  return useStore().donnees.animaux.find((a) => a.id === id);
}
export function useContact(id?: string): Contact | undefined {
  return useStore().donnees.contacts.find((c) => c.id === id);
}
export function useTache(id?: string): Tache | undefined {
  return useStore().donnees.taches.find((t) => t.id === id);
}
export function useRdv(id?: string): RendezVous | undefined {
  return useStore().donnees.rdvs.find((r) => r.id === id);
}
export function useNote(id?: string) {
  return useStore().donnees.notes.find((n) => n.id === id);
}
export function useProduit(id?: string) {
  return useStore().donnees.produits.find((p) => p.id === id);
}
export function usePersonne(id?: string): Personne | undefined {
  return useStore().donnees.personnes.find((p) => p.id === id);
}

/** Nom affiché d'une personne (MOI → « Moi »). */
export function nomPersonne(id: string | undefined, personnes: Personne[]): string {
  if (!id || id === MOI) return 'Moi';
  return personnes.find((p) => p.id === id)?.nom ?? 'Personne supprimée';
}
