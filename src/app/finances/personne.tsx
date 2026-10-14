import { Linking, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { usePersonne, useStore } from '../../lib/store';
import { MOI } from '../../lib/types';
import { euros, solde } from '../../lib/finances';
import { formatJourCourt } from '../../lib/dates';
import { Bouton, Carte, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';
import { CarteOperation } from '../../components/finances';
import { CarteTache } from '../../components/elements';

/** Fiche d'une personne : ce qu'on se doit, l'historique commun, les tâches confiées. */
export default function ComptePersonne() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personne = usePersonne(id);
  const { donnees } = useStore();
  if (!personne) return <Ecran><Vide>Personne introuvable.</Vide></Ecran>;

  const s = solde(donnees, personne.id);
  const operations = donnees.operations
    .filter((o) => o.payePar === personne.id || o.partageAvec.includes(personne.id))
    .sort((a, b) => b.date.localeCompare(a.date));
  const remboursements = donnees.remboursements
    .filter((r) => r.de === personne.id || r.a === personne.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const taches = donnees.taches.filter((t) => t.assigneA === personne.id);

  return (
    <Ecran>
      <Stack.Screen options={{ title: personne.nom }} />
      <Carte style={{ alignItems: 'center', paddingVertical: 18, gap: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: s > 0 ? couleurs.accent : s < 0 ? couleurs.danger : couleurs.texte }}>
          {s === 0 ? 'Vous êtes quittes' : euros(Math.abs(s))}
        </Text>
        {s !== 0 && <Petit>{s > 0 ? `${personne.nom} te doit` : `tu dois à ${personne.nom}`}</Petit>}
      </Carte>
      <Bouton titre="Enregistrer un remboursement" onPress={() => router.push(`/finances/remboursement?personneId=${personne.id}`)} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Bouton titre="Modifier" variante="secondaire" onPress={() => router.push(`/personne/edit?id=${personne.id}`)} />
        </View>
        {!!personne.telephone && (
          <View style={{ flex: 1 }}>
            <Bouton titre="Appeler" variante="secondaire" onPress={() => Linking.openURL(`tel:${personne.telephone!.replace(/\s/g, '')}`)} />
          </View>
        )}
      </View>

      {taches.length > 0 && <Titre>Tâches confiées</Titre>}
      {taches.map((t) => (
        <CarteTache key={t.id} tache={t} animaux={donnees.animaux} />
      ))}

      <Titre>Remboursements</Titre>
      {remboursements.length === 0 && <Vide>Aucun remboursement.</Vide>}
      {remboursements.map((r) => (
        <Carte key={r.id} onPress={() => router.push(`/finances/remboursement?id=${r.id}`)} style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: couleurs.texte }}>{r.a === MOI ? `${personne.nom} t'a remboursé` : `Tu as remboursé ${personne.nom}`}</Text>
            <Petit>{[formatJourCourt(r.date), r.notes].filter(Boolean).join(' · ')}</Petit>
          </View>
          <Text style={{ fontWeight: '700', color: couleurs.texte }}>{euros(r.montant)}</Text>
        </Carte>
      ))}

      <Titre>Dépenses en commun</Titre>
      {operations.length === 0 && <Vide>Aucune dépense partagée.</Vide>}
      {operations.map((o) => (
        <CarteOperation key={o.id} o={o} personnes={donnees.personnes} animaux={donnees.animaux} />
      ))}
    </Ecran>
  );
}
