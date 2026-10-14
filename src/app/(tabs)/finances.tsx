import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../lib/store';
import { bilan, euros, solde } from '../../lib/finances';
import { libelle } from '../../lib/listes';
import { EMOJI_ESPECE } from '../../lib/libelles';
import { jourISO } from '../../lib/dates';
import { BoutonFlottant, Carte, Choix, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';
import { CarteOperation } from '../../components/finances';

type Periode = 'mois' | 'annee';

function decaler(mois: string, n: number): string {
  const [a, m] = mois.split('-').map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function Chiffre({ label, valeur, couleur }: { label: string; valeur: string; couleur?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: couleur ?? couleurs.texte }}>{valeur}</Text>
      <Petit style={{ textAlign: 'center' }}>{label}</Petit>
    </View>
  );
}

function Barre({ label, montant, max }: { label: string; montant: number; max: number }) {
  return (
    <View style={{ gap: 4, paddingVertical: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: couleurs.texte }}>{label}</Text>
        <Text style={{ color: couleurs.texte, fontWeight: '600' }}>{euros(montant)}</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: couleurs.fond }}>
        <View style={{ height: 6, borderRadius: 3, width: `${Math.max(3, (montant / max) * 100)}%`, backgroundColor: couleurs.accent }} />
      </View>
    </View>
  );
}

export default function Finances() {
  const { donnees } = useStore();
  const [periode, setPeriode] = useState<Periode>('mois');
  const [mois, setMois] = useState(jourISO().slice(0, 7));
  const prefixe = periode === 'mois' ? mois : mois.slice(0, 4);

  const operations = donnees.operations
    .filter((o) => o.date.startsWith(prefixe))
    .sort((a, b) => b.date.localeCompare(a.date));
  const b = bilan(operations);

  const soldes = donnees.personnes
    .map((p) => ({ p, s: solde(donnees, p.id) }))
    .filter((x) => x.s !== 0)
    .sort((a, b) => b.s - a.s);

  const libellePeriode =
    periode === 'mois'
      ? new Date(Number(mois.slice(0, 4)), Number(mois.slice(5)) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : mois.slice(0, 4);
  const pas = periode === 'mois' ? 1 : 12;

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <Choix options={{ mois: 'Par mois', annee: 'Par année' }} valeur={periode} onChange={setPeriode} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setMois(decaler(mois, -pas))} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={couleurs.doux} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: couleurs.texte, textTransform: 'capitalize' }}>{libellePeriode}</Text>
          <Pressable onPress={() => setMois(decaler(mois, pas))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={couleurs.doux} />
          </Pressable>
        </View>

        <Carte style={{ flexDirection: 'row', paddingVertical: 16 }}>
          <Chiffre label="Mes dépenses (ma part)" valeur={euros(b.maPart)} />
          <Chiffre label="Payé de ma poche" valeur={euros(b.payeParMoi)} />
          {b.recettes > 0 && <Chiffre label="Rentrées" valeur={euros(b.recettes)} couleur={couleurs.accent} />}
        </Carte>

        {soldes.length > 0 && (
          <>
            <Titre>Comptes avec les autres</Titre>
            {soldes.map(({ p, s }) => (
              <Carte key={p.id} onPress={() => router.push(`/finances/personne?id=${p.id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, fontSize: 16, color: couleurs.texte }}>{p.nom}</Text>
                <Text style={{ fontWeight: '700', color: s > 0 ? couleurs.accent : couleurs.danger }}>
                  {s > 0 ? `te doit ${euros(s)}` : `tu lui dois ${euros(-s)}`}
                </Text>
              </Carte>
            ))}
          </>
        )}

        {b.parCategorie.length > 0 && (
          <>
            <Titre>Par catégorie</Titre>
            <Carte>
              {b.parCategorie.map(([c, m]) => (
                <Barre key={c} label={libelle(donnees.listes.categoriesOperation, c)} montant={m} max={b.parCategorie[0][1]} />
              ))}
            </Carte>
          </>
        )}

        {b.parAnimal.some(([id]) => id) && (
          <>
            <Titre>Par animal</Titre>
            <Carte>
              {b.parAnimal.map(([id, m]) => {
                const a = donnees.animaux.find((x) => x.id === id);
                return (
                  <Barre key={id ?? 'general'} label={a ? `${EMOJI_ESPECE[a.espece]} ${a.nom}` : 'Général'} montant={m} max={b.parAnimal[0][1]} />
                );
              })}
            </Carte>
          </>
        )}

        <Titre>Opérations</Titre>
        {operations.length === 0 && <Vide>Aucune dépense sur cette période. Ajoute-en une avec le bouton +.</Vide>}
        {operations.map((o) => (
          <CarteOperation key={o.id} o={o} personnes={donnees.personnes} animaux={donnees.animaux} />
        ))}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/finances/operation')} />
    </View>
  );
}
