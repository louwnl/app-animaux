import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Pesee } from '../lib/types';
import { depuisJour, formatJourCourt, jourISO } from '../lib/dates';
import { nouvelId, useStore } from '../lib/store';
import { lireQuantite } from '../lib/stock';
import { Bouton, Carte, Champ, Petit, confirmer, couleurs } from './ui';

const kg = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg`;
const HAUTEUR = 150;
const POINT = 8;

/** Courbe dessinée avec des View : un point par pesée, reliés par des segments tournés. */
function Courbe({ pesees }: { pesees: Pesee[] }) {
  const [largeur, setLargeur] = useState(0);
  const t = pesees.map((p) => depuisJour(p.date).getTime());
  const min = Math.min(...pesees.map((p) => p.kg));
  const max = Math.max(...pesees.map((p) => p.kg));
  const marge = Math.max((max - min) * 0.15, max * 0.02, 0.1);
  const bas = min - marge;
  const haut = max + marge;
  const t0 = t[0];
  const duree = Math.max(t[t.length - 1] - t0, 1);
  const points = pesees.map((p, i) => ({
    x: pesees.length === 1 ? largeur / 2 : ((t[i] - t0) / duree) * (largeur - POINT) + POINT / 2,
    y: HAUTEUR - ((p.kg - bas) / (haut - bas)) * HAUTEUR,
  }));

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Petit>{kg(Math.round(haut * 10) / 10)}</Petit>
      </View>
      <View
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
        style={{ height: HAUTEUR, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: couleurs.bord }}
        accessibilityLabel={`Courbe de poids, de ${kg(pesees[0].kg)} à ${kg(pesees[pesees.length - 1].kg)}`}
      >
        {largeur > 0 &&
          points.slice(1).map((b, i) => {
            const a = points[i];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const l = Math.sqrt(dx * dx + dy * dy);
            return (
              <View
                key={`l${i}`}
                style={{
                  position: 'absolute',
                  left: (a.x + b.x) / 2 - l / 2,
                  top: (a.y + b.y) / 2 - 1,
                  width: l,
                  height: 2,
                  backgroundColor: couleurs.accent,
                  transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                }}
              />
            );
          })}
        {largeur > 0 &&
          points.map((p, i) => (
            <View
              key={`p${i}`}
              style={{
                position: 'absolute',
                left: p.x - POINT / 2,
                top: p.y - POINT / 2,
                width: POINT,
                height: POINT,
                borderRadius: POINT / 2,
                backgroundColor: couleurs.accent,
              }}
            />
          ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Petit>{kg(Math.round(bas * 10) / 10)}</Petit>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Petit>{formatJourCourt(pesees[0].date)}</Petit>
        {pesees.length > 1 && <Petit>{formatJourCourt(pesees[pesees.length - 1].date)}</Petit>}
      </View>
    </View>
  );
}

/** Section « Poids » de la fiche : courbe, ajout rapide d'une pesée, dernières valeurs. */
export function SuiviPoids({ animalId }: { animalId: string }) {
  const { donnees, enregistrer, supprimer } = useStore();
  const [saisie, setSaisie] = useState('');
  const pesees = donnees.pesees.filter((p) => p.animalId === animalId).sort((a, b) => a.date.localeCompare(b.date));
  const derniere = pesees[pesees.length - 1];
  const avant = pesees[pesees.length - 2];
  const ecart = derniere && avant ? Math.round((derniere.kg - avant.kg) * 100) / 100 : undefined;

  const ajouter = () => {
    const n = lireQuantite(saisie);
    if (!n) return;
    const jour = jourISO();
    // Une seule pesée par jour : la nouvelle remplace celle du jour.
    const duJour = pesees.find((p) => p.date === jour);
    enregistrer('pesees', { id: duJour?.id ?? nouvelId(), animalId, date: jour, kg: n });
    setSaisie('');
  };

  return (
    <Carte style={{ gap: 10 }}>
      {derniere ? (
        <Text style={{ fontSize: 22, fontWeight: '700', color: couleurs.texte }}>
          {kg(derniere.kg)}
          {ecart !== undefined && ecart !== 0 && (
            <Text style={{ fontSize: 15, fontWeight: '600', color: couleurs.doux }}>
              {'  '}
              {ecart > 0 ? '+' : '−'}
              {kg(Math.abs(ecart))}
            </Text>
          )}
        </Text>
      ) : (
        <Petit>Aucune pesée pour l’instant.</Petit>
      )}
      {pesees.length > 0 && <Courbe pesees={pesees} />}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Champ label="Poids du jour (kg)" value={saisie} onChangeText={setSaisie} keyboardType="decimal-pad" placeholder="Ex. 2,4" />
        </View>
        <View style={{ width: 110, paddingBottom: 2 }}>
          <Bouton titre="Ajouter" onPress={ajouter} />
        </View>
      </View>
      {pesees
        .slice(-5)
        .reverse()
        .map((p) => (
          <Pressable
            key={p.id}
            onLongPress={() => confirmer(`Supprimer la pesée du ${formatJourCourt(p.date)} ?`, () => supprimer('pesees', p.id))}
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Petit>{formatJourCourt(p.date)}</Petit>
            <Text style={{ color: couleurs.texte }}>{kg(p.kg)}</Text>
          </Pressable>
        ))}
      {pesees.length > 0 && <Petit>Appui long sur une pesée pour la supprimer.</Petit>}
    </Carte>
  );
}
