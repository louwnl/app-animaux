import { useState } from 'react';
import { Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useStore } from '../../lib/store';
import { MOI, type CategorieOperation, type Operation } from '../../lib/types';
import { euros, lireMontant } from '../../lib/finances';
import { choix, option } from '../../lib/listes';
import { EMOJI_ESPECE } from '../../lib/libelles';
import { jourISO } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, alerte, confirmer, couleurs } from '../../components/ui';

type ModePartage = 'egal' | 'montants' | 'pourcentages';
const MODES: Record<ModePartage, string> = { egal: 'Parts égales', montants: 'Montants', pourcentages: 'Pourcentages' };

/** Comme lireMontant, mais accepte 0 et une saisie vide (0). */
function lireNombre(texte: string): number {
  const n = parseFloat(texte.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}
const nombre = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

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
  const [mode, setMode] = useState<ModePartage>(existante?.parts ? 'montants' : 'egal');
  // Saisie brute par personne (montants en € ou pourcentages selon le mode).
  const [saisies, setSaisies] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(existante?.parts ?? {}).map(([id, v]) => [id, String(v).replace('.', ',')])),
  );
  const maj = (champs: Partial<Operation>) => setO((x) => ({ ...x, ...champs }));

  const gens: [string, string][] = [[MOI, 'Moi'], ...donnees.personnes.map((p) => [p.id, p.nom] as [string, string])];
  const animaux = donnees.animaux.filter((a) => a.statut !== 'parti' || a.id === o.animalId);
  const montant = lireMontant(montantTexte);
  const recette = o.sens === 'recette';
  const partage = !recette && o.partageAvec.length > 1;
  const inegal = partage && mode !== 'egal';

  // Parts en euros calculées depuis la saisie.
  const valeurs = o.partageAvec.map((id) => lireNombre(saisies[id] ?? ''));
  const totalSaisi = valeurs.reduce((a, b) => a + b, 0);
  const cible = mode === 'pourcentages' ? 100 : (montant ?? 0);
  const ecart = Math.round((cible - totalSaisi) * 100) / 100;
  const parts: Record<string, number> = {};
  o.partageAvec.forEach((id, i) => {
    parts[id] = mode === 'pourcentages' ? Math.round(((montant ?? 0) * valeurs[i]) / 100 * 100) / 100 : valeurs[i];
  });

  const valider = () => {
    if (!montant) return;
    if (inegal && ecart !== 0) {
      return alerte(
        mode === 'pourcentages'
          ? `Les pourcentages font ${nombre(totalSaisi)} % au lieu de 100 %.`
          : `Les parts font ${euros(totalSaisi)} au lieu de ${euros(montant)}.`,
      );
    }
    const libelle = o.libelle.trim() || option(donnees.listes.categoriesOperation, o.categorie).nom;
    const op: Operation = { ...o, libelle, montant, partageAvec: recette ? [] : o.partageAvec };
    if (inegal) {
      // Les centimes d'arrondi des pourcentages vont au payeur (ou au premier participant).
      const reste = Math.round((montant - Object.values(parts).reduce((a, b) => a + b, 0)) * 100) / 100;
      if (reste !== 0) {
        const qui = o.partageAvec.includes(o.payePar) ? o.payePar : o.partageAvec[0];
        parts[qui] = Math.round((parts[qui] + reste) * 100) / 100;
      }
      op.parts = parts;
    } else delete op.parts;
    enregistrer('operations', op);
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
      <Choix label="Catégorie" options={choix(donnees.listes.categoriesOperation)} valeur={o.categorie} onChange={(categorie: CategorieOperation) => maj({ categorie })} />
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
          <Choix label="Partagé entre" options={gens} valeur={o.partageAvec} onChange={basculerPartage} />
          {partage && <Choix label="Répartition" options={MODES} valeur={mode} onChange={setMode} />}
          {inegal &&
            o.partageAvec.map((id) => (
              <Champ
                key={id}
                label={`${gens.find((g) => g[0] === id)?.[1] ?? '?'} (${mode === 'pourcentages' ? '%' : '€'})`}
                value={saisies[id] ?? ''}
                onChangeText={(t) => setSaisies((x) => ({ ...x, [id]: t }))}
                keyboardType="decimal-pad"
                placeholder={mode === 'pourcentages' ? 'Ex. 50' : 'Ex. 20'}
              />
            ))}
          {inegal && montant ? (
            <Text style={{ color: ecart === 0 ? couleurs.texte : couleurs.danger }}>
              {ecart === 0
                ? mode === 'pourcentages'
                  ? o.partageAvec.map((id) => `${gens.find((g) => g[0] === id)?.[1]} ${euros(parts[id])}`).join(' · ')
                  : 'Le compte est bon.'
                : mode === 'pourcentages'
                  ? `Total ${nombre(totalSaisi)} % · ${ecart > 0 ? `il manque ${nombre(ecart)} %` : `${nombre(-ecart)} % en trop`}`
                  : `Total ${euros(totalSaisi)} · ${ecart > 0 ? `il manque ${euros(ecart)}` : `${euros(-ecart)} en trop`}`}
            </Text>
          ) : partage && montant ? (
            <Text style={{ color: couleurs.texte }}>
              {o.partageAvec.length} personnes · {euros(montant / o.partageAvec.length)} chacune
            </Text>
          ) : (
            !partage && <Petit>Laisse vide si la dépense n'est pas partagée.</Petit>
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
