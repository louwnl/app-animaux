import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useRdv, useStore } from '../../lib/store';
import type { Rappel, RendezVous, TypeRdv } from '../../lib/types';
import { CATEGORIES_CONTACT, EMOJI_ESPECE, RAPPELS, TYPES_RDV } from '../../lib/libelles';
import { depuisJour } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, confirmer } from '../../components/ui';

/** 9 h le jour donné, sinon demain. */
function neufHeures(jour?: string): string {
  const d = jour ? depuisJour(jour) : new Date();
  if (!jour) d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export default function EditionRdv() {
  const params = useLocalSearchParams<{ id?: string; animalId?: string; jour?: string }>();
  const existant = useRdv(params.id);
  const { donnees, enregistrer, supprimer } = useStore();

  const [r, setR] = useState<RendezVous>(
    existant ?? {
      id: nouvelId(),
      titre: '',
      type: 'veterinaire',
      dateHeure: neufHeures(params.jour),
      animalIds: params.animalId ? [params.animalId] : [],
      rappel: 'les_deux',
    },
  );
  const maj = (champs: Partial<RendezVous>) => setR((x) => ({ ...x, ...champs }));
  const passe = r.dateHeure < new Date().toISOString();

  const animaux = donnees.animaux.filter((a) => a.statut !== 'parti' || r.animalIds.includes(a.id));
  const contacts = [...donnees.contacts].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  const valider = () => {
    const titre = r.titre.trim() || TYPES_RDV[r.type];
    enregistrer('rdvs', { ...r, titre });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existant ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous' }} />
      <Choix label="Type" options={TYPES_RDV} valeur={r.type} onChange={(type: TypeRdv) => maj({ type })} />
      <Champ label="Objet" value={r.titre} onChangeText={(titre) => maj({ titre })} placeholder={`Ex. ${TYPES_RDV[r.type]} : vaccin annuel`} />
      <ChampDate label="Date et heure" mode="dateheure" valeur={r.dateHeure} onChange={(v) => v && maj({ dateHeure: v })} />
      <Choix
        label="Animaux concernés"
        options={animaux.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string])}
        valeur={r.animalIds}
        onChange={(id) => maj({ animalIds: r.animalIds.includes(id) ? r.animalIds.filter((x) => x !== id) : [...r.animalIds, id] })}
      />
      {contacts.length > 0 ? (
        <Choix
          label="Professionnel"
          options={contacts.map((c) => [c.id, `${c.nom} (${CATEGORIES_CONTACT[c.categorie]})`] as [string, string])}
          valeur={r.contactId}
          onChange={(contactId) => maj({ contactId: contactId === r.contactId ? undefined : contactId })}
        />
      ) : (
        <Petit>Ajoute tes professionnels dans Contacts pour les relier aux rendez-vous.</Petit>
      )}
      <Champ label="Lieu (facultatif)" value={r.lieu ?? ''} onChangeText={(lieu) => maj({ lieu })} placeholder="Ex. À l'écurie, clinique" />
      {!passe && <Choix label="Rappel" options={RAPPELS} valeur={r.rappel} onChange={(rappel: Rappel) => maj({ rappel })} />}
      {(passe || existant) && (
        <Champ
          label="Compte rendu"
          value={r.compteRendu ?? ''}
          onChangeText={(compteRendu) => maj({ compteRendu })}
          multiline
          placeholder="Ce qui a été fait, prescriptions, prochain rdv…"
        />
      )}
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && (
        <Bouton
          titre="Supprimer le rendez-vous"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer ce rendez-vous ?', () => {
              supprimer('rdvs', existant.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
