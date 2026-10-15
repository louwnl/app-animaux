import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Animal, Operation, Personne } from '../lib/types';
import { MOI } from '../lib/types';
import { euros, partDe, participants } from '../lib/finances';
import { libelle } from '../lib/listes';
import { useStore, nomPersonne } from '../lib/store';
import { formatJourCourt, jourISO } from '../lib/dates';
import { nomsAnimaux } from '../lib/libelles';
import { Carte, Petit, couleurs } from './ui';

export function CarteOperation({ o, personnes, animaux }: { o: Operation; personnes: Personne[]; animaux: Animal[] }) {
  const { donnees, enregistrer } = useStore();
  const p = participants(o);
  const pro = donnees.contacts.find((c) => c.id === o.contactId);
  const enRetard = o.aPayer && o.date < jourISO();
  const partage = p.length > 1;
  const maPart = partDe(o, MOI);
  const recette = o.sens === 'recette';
  const details = [
    o.aPayer ? `${enRetard ? 'Prévu le' : 'Pour le'} ${formatJourCourt(o.date)}` : formatJourCourt(o.date),
    pro && `🏷️ ${pro.nom}`,
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
    <Carte
      onPress={() => router.push(`/finances/operation?id=${o.id}`)}
      style={[{ flexDirection: 'row', gap: 10 }, enRetard && { borderColor: couleurs.danger, backgroundColor: '#FDF0EE' }]}
    >
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
        {o.aPayer && (
          <Pressable
            onPress={() => enregistrer('operations', { ...o, aPayer: undefined, date: jourISO() })}
            hitSlop={6}
            accessibilityLabel={recette ? `Marquer ${o.libelle} comme reçue` : `Marquer ${o.libelle} comme payée`}
            style={({ pressed }) => [
              { marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: couleurs.accentClair },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ color: couleurs.accent, fontWeight: '700' }}>{recette ? 'Reçue' : 'Payée'}</Text>
          </Pressable>
        )}
      </View>
    </Carte>
  );
}
