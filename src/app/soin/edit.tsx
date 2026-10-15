import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useStore } from '../../lib/store';
import type { Soin } from '../../lib/types';
import { EMOJI_ESPECE } from '../../lib/libelles';
import { choix } from '../../lib/listes';
import { ajouterJours, ecartJours, jourISO } from '../../lib/dates';
import { ajouterMois, intervalleMois } from '../../lib/sante';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, confirmer, couleurs } from '../../components/ui';

const DELAIS: [string, string][] = [
  ['1', 'Dans 1 mois'],
  ['3', '3 mois'],
  ['6', '6 mois'],
  ['12', '1 an'],
];

export default function EditionSoin() {
  const params = useLocalSearchParams<{ id?: string; animalId?: string; refaire?: string }>();
  const { donnees, enregistrer, supprimer } = useStore();
  const existant = donnees.soins.find((s) => s.id === params.id);
  const modele = donnees.soins.find((s) => s.id === params.refaire);

  const [s, setS] = useState<Soin>(() => {
    if (existant) return existant;
    const aujourdhui = jourISO();
    if (modele) {
      // Refaire : même soin, mêmes animaux, et la prochaine échéance au même rythme.
      const mois = modele.prochaine ? intervalleMois(modele.date, modele.prochaine) : undefined;
      const jours = modele.prochaine ? ecartJours(modele.date, modele.prochaine) : undefined;
      return {
        id: nouvelId(),
        type: modele.type,
        animalIds: modele.animalIds,
        date: aujourdhui,
        prochaine: mois ? ajouterMois(aujourdhui, mois) : jours ? ajouterJours(aujourdhui, jours) : undefined,
        rappel: modele.rappel,
      };
    }
    return {
      id: nouvelId(),
      type: donnees.listes.typesSante[0]?.id ?? 'autre',
      animalIds: params.animalId ? [params.animalId] : [],
      date: aujourdhui,
      rappel: true,
    };
  });
  const maj = (champs: Partial<Soin>) => setS((x) => ({ ...x, ...champs }));
  const animaux = donnees.animaux.filter((a) => a.statut !== 'parti' || s.animalIds.includes(a.id));
  const delaiActif = DELAIS.find(([m]) => s.prochaine === ajouterMois(s.date, Number(m)))?.[0];

  const valider = () => {
    if (s.animalIds.length === 0) return;
    enregistrer('soins', { ...s, notes: s.notes?.trim() || undefined, rappel: s.rappel && !!s.prochaine });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existant ? 'Modifier le soin' : 'Nouveau soin' }} />
      <Choix label="Soin" options={choix(donnees.listes.typesSante)} valeur={s.type} onChange={(type) => maj({ type })} />
      <Choix
        label="Pour quels animaux ?"
        options={animaux.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string])}
        valeur={s.animalIds}
        onChange={(id) => maj({ animalIds: s.animalIds.includes(id) ? s.animalIds.filter((x) => x !== id) : [...s.animalIds, id] })}
      />
      {s.animalIds.length === 0 && <Petit>Choisis au moins un animal.</Petit>}
      <ChampDate label="Fait le" mode="date" valeur={s.date} onChange={(date) => date && maj({ date })} />
      <Choix
        label="À refaire"
        options={DELAIS}
        valeur={delaiActif}
        onChange={(m) => maj({ prochaine: ajouterMois(s.date, Number(m)) })}
      />
      <ChampDate label="Prochaine fois (facultatif)" mode="date" optionnel valeur={s.prochaine} onChange={(prochaine) => maj({ prochaine })} />
      {!!s.prochaine && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
          <Text style={{ color: couleurs.texte, fontSize: 16, flex: 1 }}>🔔 Me prévenir la veille et le jour même</Text>
          <Switch value={s.rappel} onValueChange={(rappel) => maj({ rappel })} trackColor={{ true: couleurs.accent }} />
        </View>
      )}
      <Champ label="Notes" value={s.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline placeholder="Produit, dose, vétérinaire…" />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && (
        <Bouton
          titre="Supprimer ce soin"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer ce soin ?', () => {
              supprimer('soins', existant.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
