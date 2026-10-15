import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Soin } from '../lib/types';
import { nomsAnimaux } from '../lib/libelles';
import { option } from '../lib/listes';
import { formatJourCourt } from '../lib/dates';
import { libelleEcheance, type Echeance } from '../lib/sante';
import { useStore } from '../lib/store';
import { Carte, Petit, couleurs } from './ui';

/** Échéance à venir : en rouge si dépassée, en orange dans la semaine. Bouton pour noter qu'on l'a refait. */
export function CarteEcheance({ e, avecAnimaux = true }: { e: Echeance; avecAnimaux?: boolean }) {
  const { donnees } = useStore();
  const type = option(donnees.listes.typesSante, e.soin.type);
  const couleur = e.dans < 0 ? couleurs.danger : e.dans <= 7 ? couleurs.ambre : couleurs.doux;
  return (
    <Carte
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, e.dans <= 7 && { borderColor: couleur, backgroundColor: e.dans < 0 ? '#FDF0EE' : '#FFF8EC' }]}
    >
      <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push(`/soin/edit?id=${e.soin.id}`)}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>
          {type.emoji} {type.nom}
        </Text>
        <Text style={{ color: couleur, fontWeight: e.dans <= 7 ? '600' : '400' }}>
          {formatJourCourt(e.jour)} · {libelleEcheance(e.dans)}
        </Text>
        {avecAnimaux && <Petit>{nomsAnimaux(e.animalIds, donnees.animaux)}</Petit>}
      </Pressable>
      <Pressable
        onPress={() => router.push(`/soin/edit?refaire=${e.soin.id}`)}
        style={({ pressed }) => [{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: couleurs.accentClair }, pressed && { opacity: 0.7 }]}
      >
        <Text style={{ color: couleurs.accent, fontWeight: '600' }}>Fait</Text>
      </Pressable>
    </Carte>
  );
}

export function CarteSoin({ s, avecAnimaux = true }: { s: Soin; avecAnimaux?: boolean }) {
  const { donnees } = useStore();
  const type = option(donnees.listes.typesSante, s.type);
  return (
    <Carte onPress={() => router.push(`/soin/edit?id=${s.id}`)} style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: couleurs.texte, flexShrink: 1 }}>
          {type.emoji} {type.nom}
        </Text>
        <Petit>{formatJourCourt(s.date)}</Petit>
      </View>
      {avecAnimaux && <Petit>{nomsAnimaux(s.animalIds, donnees.animaux)}</Petit>}
      {!!s.notes && <Petit>{s.notes}</Petit>}
    </Carte>
  );
}
