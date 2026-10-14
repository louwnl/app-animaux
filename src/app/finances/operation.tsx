import { useState } from 'react';
import { Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useStore } from '../../lib/store';
import { MOI, type CategorieOperation, type Operation } from '../../lib/types';
import { CATEGORIES_OPERATION, euros, lireMontant } from '../../lib/finances';
import { EMOJI_ESPECE } from '../../lib/libelles';
import { jourISO } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, confirmer, couleurs } from '../../components/ui';

export default function EditionOperation() {
  const params = useLocalSearchParams<{ id?: string; animalId?: string }>();
  const { donnees, enregistrer, supprimer } = useStore();
  const existante = donnees.operations.find((o) => o.id === params.id);

  const [o, setO] = useState<Operation>(
    existante ?? {
      id: nouvelId(),
      date: jourISO(),
      libelle: '',
      montant: 0,
      sens: 'depense',
      categorie: 'alimentation',
      animalId: params.animalId,
      payePar: MOI,
      partageAvec: [],
    },
  );
  const [montantTexte, setMontantTexte] = useState(existante ? String(existante.montant).replace('.', ',') : '');
  const maj = (champs: Partial<Operation>) => setO((x) => ({ ...x, ...champs }));

  const gens: [string, string][] = [[MOI, 'Moi'], ...donnees.personnes.map((p) => [p.id, p.nom] as [string, string])];
  const animaux = donnees.animaux.filter((a) => a.statut !== 'parti' || a.id === o.animalId);
  const montant = lireMontant(montantTexte);
  const recette = o.sens === 'recette';
  const partage = !recette && o.partageAvec.length > 1;

  const valider = () => {
    if (!montant) return;
    const libelle = o.libelle.trim() || CATEGORIES_OPERATION[o.categorie].split(' ').slice(1).join(' ');
    enregistrer('operations', { ...o, libelle, montant, partageAvec: recette ? [] : o.partageAvec });
    router.back();
  };

  // Au premier choix, le payeur est inclus d'office dans le partage.
  const basculerPartage = (id: string) => {
    if (o.partageAvec.length === 0 && id !== o.payePar) return maj({ partageAvec: [o.payePar, id] });
    maj({ partageAvec: o.partageAvec.includes(id) ? o.partageAvec.filter((x) => x !== id) : [...o.partageAvec, id] });
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existante ? "Modifier l'opération" : 'Nouvelle opération' }} />
      <Choix options={{ depense: 'Dépense', recette: 'Rentrée d’argent' }} valeur={o.sens} onChange={(sens) => maj({ sens })} />
      <Champ label="Montant (€)" value={montantTexte} onChangeText={setMontantTexte} keyboardType="decimal-pad" placeholder="Ex. 45,90" autoFocus={!existante} />
      <Choix label="Catégorie" options={CATEGORIES_OPERATION} valeur={o.categorie} onChange={(categorie: CategorieOperation) => maj({ categorie })} />
      <Champ label="Libellé" value={o.libelle} onChangeText={(libelle) => maj({ libelle })} placeholder="Ex. Foin pour l'hiver" />
      <ChampDate label="Date" mode="date" valeur={o.date} onChange={(v) => v && maj({ date: v })} />
      {animaux.length > 0 && (
        <Choix
          label="Pour quel animal ? (facultatif)"
          options={animaux.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string])}
          valeur={o.animalId}
          onChange={(animalId) => maj({ animalId: animalId === o.animalId ? undefined : animalId })}
        />
      )}

      <Choix label={recette ? 'Reçu par' : 'Payé par'} options={gens} valeur={o.payePar} onChange={(payePar) => maj({ payePar })} />

      {!recette && donnees.personnes.length > 0 && (
        <>
          <Choix label="Partagé entre (à parts égales)" options={gens} valeur={o.partageAvec} onChange={basculerPartage} />
          {partage && montant ? (
            <Text style={{ color: couleurs.texte }}>
              {o.partageAvec.length} personnes · {euros(montant / o.partageAvec.length)} chacune
            </Text>
          ) : (
            <Petit>Laisse vide si la dépense n'est pas partagée.</Petit>
          )}
        </>
      )}
      {!recette && donnees.personnes.length === 0 && (
        <Petit>Pour partager une dépense, ajoute d'abord les personnes concernées dans Plus › Personnes.</Petit>
      )}

      <Champ label="Notes" value={o.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existante && (
        <Bouton
          titre="Supprimer"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer cette opération ?', () => {
              supprimer('operations', existante.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
