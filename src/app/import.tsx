import { useState } from 'react';
import { Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useStore } from '../lib/store';
import type { Animal, StatutAnimal } from '../lib/types';
import { CATEGORIES_CONTACT, EMOJI_ESPECE, ESPECES, STATUTS } from '../lib/libelles';
import { lireFiche } from '../lib/partage';
import { jourISO } from '../lib/dates';
import { Bouton, Carte, Choix, Ecran, Petit, Vide, couleurs } from '../components/ui';

/** Écran ouvert par un QR code de fiche (depuis le scanner de l'app ou l'appareil photo du téléphone). */
export default function Import() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const fiche = lireFiche(d);
  const { donnees, enregistrer } = useStore();
  const [statut, setStatut] = useState<StatutAnimal>(fiche?.t === 'animal' ? fiche.a.statut : 'mien');

  if (!fiche) {
    return (
      <Ecran>
        <Stack.Screen options={{ title: 'Fiche partagée' }} />
        <Vide>Ce QR code ne contient pas de fiche lisible.</Vide>
      </Ecran>
    );
  }

  if (fiche.t === 'contact') {
    const c = fiche.c;
    const deja = donnees.contacts.some((x) => x.nom === c.nom && (x.telephone ?? '') === (c.telephone ?? ''));
    return (
      <Ecran>
        <Stack.Screen options={{ title: 'Contact partagé' }} />
        <Carte style={{ gap: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: couleurs.texte }}>📇 {c.nom}</Text>
          <Petit>{[CATEGORIES_CONTACT[c.categorie], c.structure, c.telephone, c.email, c.adresse].filter(Boolean).join(' · ')}</Petit>
          {!!c.notes && <Text style={{ color: couleurs.texte }}>{c.notes}</Text>}
        </Carte>
        {deja && <Petit>Tu as déjà ce contact.</Petit>}
        <Bouton
          titre="Ajouter à mes contacts"
          onPress={() => {
            enregistrer('contacts', { ...c, id: nouvelId() });
            router.replace('/contacts');
          }}
        />
      </Ecran>
    );
  }

  const a = fiche.a;
  const deja = donnees.animaux.some((x) => x.nom === a.nom && x.espece === a.espece);
  return (
    <Ecran>
      <Stack.Screen options={{ title: 'Animal partagé' }} />
      <Carte style={{ gap: 4, alignItems: 'center' }}>
        <Text style={{ fontSize: 44 }}>{EMOJI_ESPECE[a.espece]}</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: couleurs.texte }}>{a.nom}</Text>
        <Petit>{[ESPECES[a.espece].split(' ')[1], a.race, a.robe, a.identification].filter(Boolean).join(' · ')}</Petit>
        {!!a.notes && <Text style={{ color: couleurs.texte }}>{a.notes}</Text>}
      </Carte>
      {deja && <Petit>Tu as déjà un animal de ce nom : celui-ci sera ajouté en plus.</Petit>}
      <Choix label="Chez toi, cet animal est…" options={STATUTS} valeur={statut} onChange={setStatut} />
      <Bouton
        titre="Ajouter à mes animaux"
        onPress={() => {
          const animal: Animal = {
            ...a,
            id: nouvelId(),
            statut,
            proprietaireIds: [],
            accueils:
              statut === 'famille_relais' || statut === 'refuge' ? [{ id: nouvelId(), type: statut, dateArrivee: jourISO() }] : [],
            creeLe: new Date().toISOString(),
          };
          enregistrer('animaux', animal);
          router.replace(`/animal/${animal.id}`);
        }}
      />
    </Ecran>
  );
}
