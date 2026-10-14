import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { nouvelId, useStore } from '../../lib/store';
import type { Produit } from '../../lib/types';
import { PRODUITS_SUGGERES, aRacheter, quantiteTexte } from '../../lib/stock';
import { BoutonFlottant, Carte, Choix, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';

function BoutonQuantite({ icone, onPress, label }: { icone: 'remove' | 'add'; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={label}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.accentClair },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icone} size={22} color={couleurs.accent} />
    </Pressable>
  );
}

function CarteProduit({ p, onChanger }: { p: Produit; onChanger: (delta: number) => void }) {
  const alerte = aRacheter(p);
  return (
    <Carte style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, alerte && { borderColor: couleurs.ambre, backgroundColor: '#FFF8EC' }]}>
      <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => router.push(`/stock/edit?id=${p.id}`)}>
        <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{p.nom}</Text>
          <Text style={{ fontSize: 15, color: alerte ? couleurs.ambre : couleurs.texte, fontWeight: alerte ? '700' : '400' }}>
            {quantiteTexte(p.quantite, p.unite)}
            {alerte ? ' · à racheter' : ''}
          </Text>
        </View>
      </Pressable>
      <BoutonQuantite icone="remove" label={`Retirer un ${p.unite}`} onPress={() => onChanger(-1)} />
      <BoutonQuantite icone="add" label={`Ajouter un ${p.unite}`} onPress={() => onChanger(1)} />
    </Carte>
  );
}

export default function Stock() {
  const { donnees, enregistrer } = useStore();
  const produits = [...donnees.produits].sort((a, b) => Number(aRacheter(b)) - Number(aRacheter(a)) || a.nom.localeCompare(b.nom, 'fr'));
  const suggestions = PRODUITS_SUGGERES.filter((s) => !donnees.produits.some((p) => p.nom === s.nom));
  const changer = (p: Produit, delta: number) =>
    enregistrer('produits', { ...p, quantite: Math.max(0, Math.round((p.quantite + delta) * 100) / 100) });

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        {produits.length === 0 && <Vide>Aucun produit. Ajoute le foin, le grain, les croquettes… avec le bouton +, ou en un geste ci-dessous.</Vide>}
        {produits.map((p) => (
          <CarteProduit key={p.id} p={p} onChanger={(d) => changer(p, d)} />
        ))}
        {produits.length > 0 && <Petit>Touche − ou + à chaque ballot entamé ou rentré. Touche un produit pour corriger la quantité ou régler l'alerte.</Petit>}
        {suggestions.length > 0 && (
          <>
            <Titre>Ajouter rapidement</Titre>
            <Choix
              options={suggestions.map((s) => [s.nom, `${s.emoji} ${s.nom}`] as [string, string])}
              valeur={undefined}
              onChange={(nom) => {
                const s = PRODUITS_SUGGERES.find((x) => x.nom === nom)!;
                const p: Produit = { id: nouvelId(), ...s, quantite: 0 };
                enregistrer('produits', p);
                router.push(`/stock/edit?id=${p.id}`);
              }}
            />
          </>
        )}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/stock/edit')} />
    </View>
  );
}
