import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useProduit, useStore } from '../../lib/store';
import type { Produit } from '../../lib/types';
import { EMOJIS_PRODUIT, UNITES, lireQuantite } from '../../lib/stock';
import { Bouton, Champ, Choix, Ecran, Petit, confirmer } from '../../components/ui';

const texte = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));

export default function EditionProduit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existant = useProduit(id);
  const { enregistrer, supprimer } = useStore();
  const [p, setP] = useState<Produit>(existant ?? { id: nouvelId(), nom: '', emoji: '🌾', unite: 'ballot', quantite: 0 });
  const [quantite, setQuantite] = useState(texte(existant?.quantite));
  const [seuil, setSeuil] = useState(texte(existant?.seuil));
  const [autreUnite, setAutreUnite] = useState(!!existant && !UNITES.includes(existant.unite));
  const maj = (champs: Partial<Produit>) => setP((x) => ({ ...x, ...champs }));

  const valider = () => {
    if (!p.nom.trim() || !p.unite.trim()) return;
    enregistrer('produits', {
      ...p,
      nom: p.nom.trim(),
      unite: p.unite.trim(),
      quantite: lireQuantite(quantite) ?? 0,
      seuil: seuil.trim() ? lireQuantite(seuil) : undefined,
    });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existant ? p.nom || 'Produit' : 'Nouveau produit' }} />
      <Champ label="Produit" value={p.nom} onChangeText={(nom) => maj({ nom })} placeholder="Ex. Foin des chevaux" autoFocus={!existant} />
      <Choix label="Emoji" options={EMOJIS_PRODUIT.map((e) => [e, e] as [string, string])} valeur={p.emoji} onChange={(emoji) => maj({ emoji })} />
      <Choix
        label="Unité"
        options={[...UNITES.map((u) => [u, u] as [string, string]), ['__autre', 'Autre…'] as [string, string]]}
        valeur={autreUnite ? '__autre' : p.unite}
        onChange={(u) => {
          setAutreUnite(u === '__autre');
          maj({ unite: u === '__autre' ? '' : u });
        }}
      />
      {autreUnite && <Champ label="Mon unité" value={p.unite} onChangeText={(unite) => maj({ unite })} placeholder="Ex. seau, filet, round" />}
      <Champ label={`Quantité en stock${p.unite ? ` (${p.unite})` : ''}`} value={quantite} onChangeText={setQuantite} keyboardType="decimal-pad" placeholder="Ex. 12" />
      <Champ label="M'alerter à partir de (facultatif)" value={seuil} onChangeText={setSeuil} keyboardType="decimal-pad" placeholder="Ex. 3" />
      <Petit>Quand il en reste autant ou moins, le produit passe en orange et apparaît dans Aujourd'hui.</Petit>
      <Champ label="Notes" value={p.notes ?? ''} onChangeText={(notes) => maj({ notes })} multiline placeholder="Fournisseur, prix, où c'est rangé…" />
      <Bouton titre="Enregistrer" onPress={valider} />
      {existant && (
        <Bouton
          titre="Supprimer le produit"
          variante="danger"
          onPress={() =>
            confirmer(`Supprimer ${existant.nom} du stock ?`, () => {
              supprimer('produits', existant.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
