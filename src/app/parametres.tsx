import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { nouvelId, useStore } from '../lib/store';
import type { Donnees, Listes, Option, Place } from '../lib/types';
import { FONCTIONS, MAX_BARRE, REGLAGES_DEFAUT } from '../lib/fonctions';
import { LISTES_DEFAUT, NOMS_LISTES } from '../lib/listes';
import { Bouton, Carte, Choix, Ecran, Petit, Titre, alerte, confirmer, couleurs } from '../components/ui';

/** Combien d'éléments utilisent chaque entrée : on ne peut pas supprimer une entrée utilisée. */
function utilisations(d: Donnees, liste: keyof Listes): Map<string, number> {
  const ids: string[] = {
    categoriesTache: () => d.taches.map((t) => t.categorie),
    categoriesOperation: () => d.operations.map((o) => o.categorie),
    typesSeance: () => d.realisations.flatMap((r) => (r.seance ? [r.seance.type] : [])),
    categoriesNote: () => d.notes.flatMap((n) => (n.categorie ? [n.categorie] : [])),
    typesSante: () => d.soins.map((s) => s.type),
    // Les produits proposés et les unités ne sont que des modèles : rien n'en dépend.
    produitsStock: () => [],
    unitesStock: () => [],
  }[liste]();
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

function Lien({ titre, sous, vers }: { titre: string; sous: string; vers: Href }) {
  return (
    <Carte onPress={() => router.push(vers)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{titre}</Text>
        <Petit>{sous}</Petit>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.doux} />
    </Carte>
  );
}

function Choisir() {
  const { donnees } = useStore();
  const resume = (cle: keyof Listes) =>
    cle === 'unitesStock' ? donnees.listes[cle].map((o) => o.nom).join(', ') : donnees.listes[cle].map((o) => o.emoji).join(' ');
  const barre = donnees.reglages.fonctions.filter((f) => f.place === 'barre').map((f) => FONCTIONS[f.id].titre);
  return (
    <Ecran>
      <Titre>Affichage</Titre>
      <Lien titre="Barre du bas" sous={["Aujourd'hui", ...barre, 'Plus'].join(' · ')} vers="/parametres?liste=barre" />
      <Titre>Listes de choix</Titre>
      <Petit>Ajoute, renomme ou supprime les choix proposés dans l’app, avec l’emoji de ton choix.</Petit>
      {(Object.keys(NOMS_LISTES) as (keyof Listes)[]).map((cle) => (
        <Lien key={cle} titre={NOMS_LISTES[cle]} sous={resume(cle)} vers={`/parametres?liste=${cle}`} />
      ))}
    </Ecran>
  );
}

function Icone({ nom, onPress, couleur = couleurs.doux, label }: { nom: keyof typeof Ionicons.glyphMap; onPress: () => void; couleur?: string; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityLabel={label} style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}>
      <Ionicons name={nom} size={22} color={couleur} />
    </Pressable>
  );
}

type Entree = Option & { unite?: string };

function EditerListe({ cle }: { cle: keyof Listes }) {
  const { donnees, majListes } = useStore();
  const [entrees, setEntrees] = useState<Entree[]>(donnees.listes[cle]);
  const avecEmoji = cle !== 'unitesStock';
  const avecUnite = cle === 'produitsStock';
  const usages = utilisations(donnees, cle);
  const maj = (i: number, champs: Partial<Entree>) => setEntrees((l) => l.map((o, j) => (j === i ? { ...o, ...champs } : o)));
  const deplacer = (i: number, d: number) =>
    setEntrees((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const copie = [...l];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });

  const enregistrer = () => {
    const propres = entrees
      .map((o) => ({
        ...o,
        nom: o.nom.trim(),
        emoji: avecEmoji ? o.emoji.trim() || '📌' : '',
        ...(avecUnite ? { unite: o.unite?.trim() || 'pièce' } : {}),
      }))
      .filter((o) => o.nom);
    if (propres.length === 0) return alerte('Garde au moins un choix.');
    majListes({ ...donnees.listes, [cle]: propres });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: NOMS_LISTES[cle] }} />
      {entrees.map((o, i) => {
        const n = usages.get(o.id) ?? 0;
        return (
          <Carte key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            {avecEmoji && (
              <TextInput
                value={o.emoji}
                onChangeText={(emoji) => maj(i, { emoji })}
                style={{ width: 46, fontSize: 22, textAlign: 'center', borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, paddingVertical: 6 }}
                accessibilityLabel="Emoji"
              />
            )}
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <TextInput
                value={o.nom}
                onChangeText={(nom) => maj(i, { nom })}
                placeholder="Nom"
                placeholderTextColor="#B0A69D"
                style={champTexte}
              />
              {avecUnite && (
                <TextInput
                  value={o.unite ?? ''}
                  onChangeText={(unite) => maj(i, { unite })}
                  placeholder="Unité (ballot, kg…)"
                  placeholderTextColor="#B0A69D"
                  style={[champTexte, { fontSize: 14, paddingVertical: 5 }]}
                  accessibilityLabel="Unité"
                />
              )}
            </View>
            <Icone nom="chevron-up" label="Monter" onPress={() => deplacer(i, -1)} />
            <Icone nom="chevron-down" label="Descendre" onPress={() => deplacer(i, 1)} />
            <Icone
              nom="trash-outline"
              label="Supprimer"
              couleur={couleurs.danger}
              onPress={() =>
                n > 0
                  ? alerte(`« ${o.nom} » est utilisé ${n} fois. Change d'abord ces éléments de catégorie, ou renomme-le simplement.`)
                  : setEntrees((l) => l.filter((_, j) => j !== i))
              }
            />
          </Carte>
        );
      })}
      <Bouton titre="+ Ajouter un choix" variante="secondaire" onPress={() => setEntrees((l) => [...l, { id: nouvelId(), emoji: avecEmoji ? '📌' : '', nom: '', ...(avecUnite ? { unite: '' } : {}) }])}
      />
      {avecEmoji && <Petit>Pour l’emoji, touche la case de gauche puis le bouton emoji de ton clavier.</Petit>}
      <Bouton titre="Enregistrer" onPress={enregistrer} />
      <Bouton
        titre="Revenir aux choix de départ"
        variante="danger"
        onPress={() =>
          confirmer('Remettre les choix de départ ? Tes choix ajoutés encore utilisés seront gardés.', () =>
            setEntrees([...LISTES_DEFAUT[cle], ...entrees.filter((o) => usages.has(o.id) && !LISTES_DEFAUT[cle].some((d) => d.id === o.id))]),
            'Remettre',
          )
        }
      />
    </Ecran>
  );
}

const champTexte = { fontSize: 16, color: couleurs.texte, borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, padding: 8 } as const;

const PLACES: Record<Place, string> = { barre: 'Barre', plus: 'Plus', masque: 'Masqué' };

/** Choisir quelles fonctions vont dans la barre du bas, lesquelles restent dans Plus, et lesquelles sont masquées. */
function EditerBarre() {
  const { donnees, majReglages } = useStore();
  const [fonctions, setFonctions] = useState(donnees.reglages.fonctions);
  const dansBarre = fonctions.filter((f) => f.place === 'barre').length;
  const deplacer = (i: number, d: number) =>
    setFonctions((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const copie = [...l];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });
  const placer = (i: number, place: Place) => {
    if (place === 'barre' && fonctions[i].place !== 'barre' && dansBarre >= MAX_BARRE) {
      return alerte(`La barre contient déjà ${MAX_BARRE} fonctions en plus d'Aujourd'hui et Plus. Passe-en une dans Plus d'abord.`);
    }
    setFonctions((l) => l.map((f, j) => (j === i ? { ...f, place } : f)));
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: 'Barre du bas' }} />
      <Petit>
        Aujourd’hui et Plus restent toujours dans la barre. Choisis jusqu’à {MAX_BARRE} autres fonctions, dans l’ordre de ton choix ; les
        autres sont dans Plus, ou masquées si tu ne t’en sers pas.
      </Petit>
      {fonctions.map((f, i) => (
        <Carte key={f.id} style={{ gap: 8, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={FONCTIONS[f.id].icone} size={22} color={f.place === 'masque' ? couleurs.doux : couleurs.accent} />
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: f.place === 'masque' ? couleurs.doux : couleurs.texte }}>
              {FONCTIONS[f.id].titre}
            </Text>
            <Icone nom="chevron-up" label="Monter" onPress={() => deplacer(i, -1)} />
            <Icone nom="chevron-down" label="Descendre" onPress={() => deplacer(i, 1)} />
          </View>
          <Choix options={PLACES} valeur={f.place} onChange={(p) => placer(i, p)} />
        </Carte>
      ))}
      <Bouton
        titre="Enregistrer"
        onPress={() => {
          majReglages({ ...donnees.reglages, fonctions });
          router.back();
        }}
      />
      <Bouton titre="Revenir à la barre de départ" variante="danger" onPress={() => setFonctions(REGLAGES_DEFAUT.fonctions)} />
    </Ecran>
  );
}

export default function Parametres() {
  const { liste } = useLocalSearchParams<{ liste?: keyof Listes | 'barre' }>();
  if (liste === 'barre') return <EditerBarre />;
  return liste && liste in NOMS_LISTES ? <EditerListe key={liste} cle={liste} /> : <Choisir />;
}
