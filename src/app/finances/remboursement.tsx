import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { nouvelId, usePersonne, useStore } from '../../lib/store';
import { MOI, type Remboursement } from '../../lib/types';
import { euros, lireMontant, solde } from '../../lib/finances';
import { jourISO } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, Vide, confirmer } from '../../components/ui';

export default function EditionRemboursement() {
  const params = useLocalSearchParams<{ id?: string; personneId?: string }>();
  const { donnees, enregistrer, supprimer } = useStore();
  const existant = donnees.remboursements.find((r) => r.id === params.id);
  const personneId = existant ? (existant.de === MOI ? existant.a : existant.de) : params.personneId;
  const personne = usePersonne(personneId);
  const s = personne ? solde(donnees, personne.id) : 0;

  const [sens, setSens] = useState<'recu' | 'donne'>(existant ? (existant.a === MOI ? 'recu' : 'donne') : s < 0 ? 'donne' : 'recu');
  const [montantTexte, setMontantTexte] = useState(
    existant ? String(existant.montant).replace('.', ',') : s !== 0 ? String(Math.abs(s)).replace('.', ',') : '',
  );
  const [date, setDate] = useState(existant?.date ?? jourISO());
  const [notes, setNotes] = useState(existant?.notes ?? '');

  if (!personne) return <Ecran><Vide>Personne introuvable.</Vide></Ecran>;

  const valider = () => {
    const montant = lireMontant(montantTexte);
    if (!montant) return;
    const r: Remboursement = {
      id: existant?.id ?? nouvelId(),
      date,
      de: sens === 'recu' ? personne.id : MOI,
      a: sens === 'recu' ? MOI : personne.id,
      montant,
      notes: notes.trim() || undefined,
    };
    enregistrer('remboursements', r);
    router.back();
  };

  return (
    <Ecran>
      <Choix
        options={{ recu: `${personne.nom} m'a remboursé`, donne: `J'ai remboursé ${personne.nom}` }}
        valeur={sens}
        onChange={setSens}
      />
      {!existant && s !== 0 && <Petit>{s > 0 ? `${personne.nom} te doit ${euros(s)}.` : `Tu dois ${euros(-s)} à ${personne.nom}.`}</Petit>}
      <Champ label="Montant (€)" value={montantTexte} onChangeText={setMontantTexte} keyboardType="decimal-pad" />
      <ChampDate label="Date" mode="date" valeur={date} onChange={(v) => v && setDate(v)} />
      <Champ label="Notes" value={notes} onChangeText={setNotes} placeholder="Ex. virement, espèces…" />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && (
        <Bouton
          titre="Supprimer"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer ce remboursement ?', () => {
              supprimer('remboursements', existant.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
