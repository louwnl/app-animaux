import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../lib/store';
import { FONCTIONS } from '../../lib/fonctions';
import type { Donnees, FonctionId } from '../../lib/types';
import { Carte, Ecran, Petit, Titre, couleurs } from '../../components/ui';

function Entree({ icone, titre, sous, vers }: { icone: keyof typeof Ionicons.glyphMap; titre: string; sous: string; vers: Href }) {
  return (
    <Carte onPress={() => router.push(vers)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Ionicons name={icone} size={26} color={couleurs.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{titre}</Text>
        <Petit>{sous}</Petit>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.doux} />
    </Carte>
  );
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Sous-titre de chaque fonction dans Plus. */
const SOUS: Record<FonctionId, (d: Donnees) => string> = {
  calendrier: () => 'Rendez-vous, tâches et suivis du mois',
  animaux: (d) => {
    const n = d.animaux.filter((a) => a.statut !== 'parti').length;
    return n > 1 ? `${n} animaux présents` : `${n} animal présent`;
  },
  stock: (d) => pluriel(d.produits.length, 'produit'),
  finances: () => 'Dépenses, comptes avec les autres',
  taches: (d) => pluriel(d.taches.length, 'tâche'),
  rdv: (d) => `${d.rdvs.length} rendez-vous`,
  sante: (d) => pluriel(d.soins.length, 'soin noté'),
  notes: (d) => pluriel(d.notes.length, 'note'),
  contacts: (d) => pluriel(d.contacts.length, 'contact'),
  personnes: () => 'Entourage : frais partagés, tâches confiées',
};

export default function Plus() {
  const { donnees } = useStore();
  const dansPlus = donnees.reglages.fonctions.filter((f) => f.place === 'plus');
  return (
    <Ecran>
      {dansPlus.map(({ id }) => {
        const f = FONCTIONS[id];
        return <Entree key={id} icone={f.icone} titre={f.titre} sous={SOUS[id](donnees)} vers={f.ecran} />;
      })}
      <Titre>Outils</Titre>
      <Entree icone="scan-outline" titre="Scanner un QR code" sous="Récupérer la fiche d'un animal ou d'un pro" vers="/scanner" />
      <Entree icone="qr-code-outline" titre="Partager l'app" sous="QR code pour la faire installer à quelqu'un" vers="/partage" />
      <Entree icone="options-outline" titre="Paramètres" sous="Barre du bas, catégories, stock, emojis" vers="/parametres" />
      <Entree icone="cloud-upload-outline" titre="Sauvegarde" sous="Exporter ou importer toutes tes données" vers="/sauvegarde" />
    </Ecran>
  );
}
