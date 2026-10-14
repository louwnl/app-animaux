import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useContact, useStore } from '../../lib/store';
import type { CategorieContact, Contact } from '../../lib/types';
import { CATEGORIES_CONTACT } from '../../lib/libelles';
import { Bouton, Champ, Choix, Ecran, confirmer } from '../../components/ui';

export default function EditionContact() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existant = useContact(id);
  const { enregistrer, supprimer } = useStore();

  const [c, setC] = useState<Contact>(existant ?? { id: nouvelId(), nom: '', categorie: 'veterinaire' });
  const maj = (champs: Partial<Contact>) => setC((x) => ({ ...x, ...champs }));

  const valider = () => {
    if (!c.nom.trim()) return;
    enregistrer('contacts', { ...c, nom: c.nom.trim() });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existant ? 'Modifier le contact' : 'Nouveau contact' }} />
      <Choix label="Catégorie" options={CATEGORIES_CONTACT} valeur={c.categorie} onChange={(categorie: CategorieContact) => maj({ categorie })} />
      <Champ label="Nom" value={c.nom} onChangeText={(nom) => maj({ nom })} placeholder="Ex. Dr Martin" />
      <Champ label="Structure" value={c.structure ?? ''} onChangeText={(structure) => maj({ structure })} placeholder="Ex. Clinique des Prés, SPA de…" />
      <Champ label="Téléphone" value={c.telephone ?? ''} onChangeText={(telephone) => maj({ telephone })} keyboardType="phone-pad" />
      <Champ label="E-mail" value={c.email ?? ''} onChangeText={(email) => maj({ email })} keyboardType="email-address" autoCapitalize="none" />
      <Champ label="Adresse" value={c.adresse ?? ''} onChangeText={(adresse) => maj({ adresse })} />
      <Champ label="Notes" value={c.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline placeholder="Horaires, urgences, tarifs…" />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && <Bouton titre="Partager (QR code)" variante="secondaire" onPress={() => router.push(`/partage?contactId=${existant.id}`)} />}
      {existant && (
        <Bouton
          titre="Supprimer le contact"
          variante="danger"
          onPress={() =>
            confirmer(`Supprimer ${existant.nom} ?`, () => {
              supprimer('contacts', existant.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
