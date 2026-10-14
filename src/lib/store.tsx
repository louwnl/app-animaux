import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MOI, type Animal, type Contact, type Donnees, type Personne, type Realisation, type RendezVous, type Tache } from './types';
import { demanderPermission, replanifierTout } from './notifications';

const CLE = 'mes-animaux:donnees';

const VIDE: Donnees = {
  version: 2,
  animaux: [],
  taches: [],
  realisations: [],
  rdvs: [],
  contacts: [],
  personnes: [],
  operations: [],
  remboursements: [],
};

/** Complète des données anciennes ou importées avec les collections manquantes. */
export function normaliser(brut: Partial<Donnees>): Donnees {
  return { ...VIDE, ...brut, version: 2 };
}

export function nouvelId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Collection = 'animaux' | 'taches' | 'realisations' | 'rdvs' | 'contacts' | 'personnes' | 'operations' | 'remboursements';
type Element<C extends Collection> = Donnees[C][number];

interface Store {
  pret: boolean;
  donnees: Donnees;
  enregistrer: <C extends Collection>(collection: C, element: Element<C>) => void;
  supprimer: (collection: Collection, id: string) => void;
  basculerRealisation: (tacheId: string, jour: string, details?: Partial<Realisation>) => void;
  remplacerTout: (d: Donnees) => void;
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

  const appliquer = useCallback((modif: (d: Donnees) => Donnees) => {
    setDonnees((avant) => {
      const apres = modif(avant);
      AsyncStorage.setItem(CLE, JSON.stringify(apres)).catch((e) => console.warn('Sauvegarde échouée', e));
      // Regroupe les reprogrammations quand plusieurs modifications s'enchaînent.
      if (delaiRappels.current) clearTimeout(delaiRappels.current);
      delaiRappels.current = setTimeout(() => replanifierTout(apres), 800);
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
            suite.taches = suite.taches.filter((t) => t.animalId !== id);
            suite.rdvs = suite.rdvs.map((r) => ({ ...r, animalIds: r.animalIds.filter((a) => a !== id) }));
            suite.operations = suite.operations.map((o) => (o.animalId === id ? { ...o, animalId: undefined } : o));
          }
          if (collection === 'personnes') {
            suite.taches = suite.taches.map((t) => (t.assigneA === id ? { ...t, assigneA: undefined } : t));
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
            faitePar: d.taches.find((t) => t.id === tacheId)?.assigneA,
            ...details,
          };
          return { ...d, realisations: [...d.realisations.filter((x) => x.id !== r.id), r] };
        }),
      remplacerTout: (nouvelles) => appliquer(() => normaliser(nouvelles)),
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
export function usePersonne(id?: string): Personne | undefined {
  return useStore().donnees.personnes.find((p) => p.id === id);
}

/** Nom affiché d'une personne (MOI → « Moi »). */
export function nomPersonne(id: string | undefined, personnes: Personne[]): string {
  if (!id || id === MOI) return 'Moi';
  return personnes.find((p) => p.id === id)?.nom ?? 'Personne supprimée';
}
