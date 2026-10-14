import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { nouvelId, useStore } from '../lib/store';
import type { Donnees, Listes, Option } from '../lib/types';
import { LISTES_DEFAUT, NOMS_LISTES } from '../lib/listes';
import { Bouton, Carte, Ecran, Petit, alerte, confirmer, couleurs } from '../components/ui';

/** Combien d'éléments utilisent chaque entrée : on ne peut pas supprimer une entrée utilisée. */
function utilisations(d: Donnees, liste: keyof Listes): Map<string, number> {
  const ids =
    liste === 'categoriesTache'
      ? d.taches.map((t) => t.categorie)
      : liste === 'categoriesOperation'
        ? d.operations.map((o) => o.categorie)
        : d.realisations.flatMap((r) => (r.seance ? [r.seance.type] : []));
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

function Choisir() {
  const { donnees } = useStore();
  return (
    <Ecran>
      <Petit>Ajoute, renomme ou supprime les choix proposés dans l'app, avec l'emoji de ton choix.</Petit>
      {(Object.keys(NOMS_LISTES) as (keyof Listes)[]).map((cle) => (
        <Carte key={cle} onPress={() => router.push(`/parametres?liste=${cle}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{NOMS_LISTES[cle]}</Text>
            <Petit>{donnees.listes[cle].map((o) => o.emoji).join(' ')}</Petit>
          </View>
          <Ionicons name="chevron-forward" size={20} color={couleurs.doux} />
        </Carte>
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

function EditerListe({ cle }: { cle: keyof Listes }) {
  const { donnees, majListes } = useStore();
  const [entrees, setEntrees] = useState<Option[]>(donnees.listes[cle]);
  const usages = utilisations(donnees, cle);
  const maj = (i: number, champs: Partial<Option>) => setEntrees((l) => l.map((o, j) => (j === i ? { ...o, ...champs } : o)));
  const deplacer = (i: number, d: number) =>
    setEntrees((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const copie = [...l];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });

  const enregistrer = () => {
    const propres = entrees.map((o) => ({ ...o, nom: o.nom.trim(), emoji: o.emoji.trim() || '📌' })).filter((o) => o.nom);
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
            <TextInput
              value={o.emoji}
              onChangeText={(emoji) => maj(i, { emoji })}
              style={{ width: 46, fontSize: 22, textAlign: 'center', borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, paddingVertical: 6 }}
              accessibilityLabel="Emoji"
            />
            <TextInput
              value={o.nom}
              onChangeText={(nom) => maj(i, { nom })}
              placeholder="Nom"
              placeholderTextColor="#B0A69D"
              style={{ flex: 1, minWidth: 0, fontSize: 16, color: couleurs.texte, borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, padding: 8 }}
            />
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
      <Bouton titre="+ Ajouter un choix" variante="secondaire" onPress={() => setEntrees((l) => [...l, { id: nouvelId(), emoji: '📌', nom: '' }])} />
      <Petit>Pour l'emoji, touche la case de gauche puis le bouton emoji de ton clavier.</Petit>
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

export default function Parametres() {
  const { liste } = useLocalSearchParams<{ liste?: keyof Listes }>();
  return liste && liste in NOMS_LISTES ? <EditerListe key={liste} cle={liste} /> : <Choisir />;
}
