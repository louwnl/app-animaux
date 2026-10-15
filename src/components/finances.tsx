import { Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Animal, Operation, Personne } from '../lib/types';
import { MOI } from '../lib/types';
import { euros, partDe, participants } from '../lib/finances';
import { libelle } from '../lib/listes';
import { useStore , nomPersonne } from '../lib/store';
import { formatJourCourt } from '../lib/dates';
import { nomsAnimaux } from '../lib/libelles';
import { Carte, Petit, couleurs } from './ui';

export function CarteOperation({ o, personnes, animaux }: { o: Operation; personnes: Personne[]; animaux: Animal[] }) {
  const { donnees } = useStore();
  const p = participants(o);
  const partage = p.length > 1;
  const maPart = partDe(o, MOI);
  const recette = o.sens === 'recette';
  const details = [
    formatJourCourt(o.date),
    libelle(donnees.listes.categoriesOperation, o.categorie),
    nomsAnimaux(o.animalIds, animaux) || undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  const qui = recette
    ? o.payePar === MOI
      ? undefined
      : `Reçu par ${nomPersonne(o.payePar, personnes)}`
    : partage
      ? `Payé par ${nomPersonne(o.payePar, personnes)} · partagé entre ${p.map((x) => (o.parts ? `${nomPersonne(x, personnes)} ${euros(o.parts[x] ?? 0)}` : nomPersonne(x, personnes))).join(', ')}`
      : o.payePar !== MOI
        ? `Payé par ${nomPersonne(o.payePar, personnes)}`
        : undefined;

  return (
    <Carte onPress={() => router.push(`/finances/operation?id=${o.id}`)} style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 16, color: couleurs.texte, fontWeight: '600' }}>{o.libelle}</Text>
        <Petit>{details}</Petit>
        {!!qui && <Petit>{qui}</Petit>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: recette ? couleurs.accent : couleurs.texte }}>
          {recette ? '+' : '−'}
          {euros(o.montant)}
        </Text>
        {partage && <Petit>ma part {euros(maPart)}</Petit>}
      </View>
    </Carte>
  );
}
