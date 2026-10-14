import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../lib/store';
import { ajouterJours, formatJour, jourISO, tacheLeJour } from '../../lib/dates';
import { BoutonFlottant, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';
import { CarteRdv, LigneTache } from '../../components/elements';

export default function Aujourdhui() {
  const { donnees, basculerRealisation } = useStore();
  const [jour, setJour] = useState(jourISO());
  const estAujourdhui = jour === jourISO();

  const taches = donnees.taches
    .filter((t) => tacheLeJour(t, jour, donnees.animaux))
    .sort((a, b) => (a.heure ?? '99').localeCompare(b.heure ?? '99'));
  const faites = new Map(donnees.realisations.filter((r) => r.date === jour).map((r) => [r.tacheId, r]));
  const restantes = taches.filter((t) => !faites.has(t.id)).length;

  const rdvsDuJour = donnees.rdvs
    .filter((r) => jourISO(new Date(r.dateHeure)) === jour)
    .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));
  const limite = ajouterJours(jour, 8);
  const rdvsAVenir = donnees.rdvs
    .filter((r) => {
      const j = jourISO(new Date(r.dateHeure));
      return j > jour && j < limite;
    })
    .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));

  const basculer = (tacheId: string, categorie: string) => {
    // Pour le travail des chevaux, on note la séance en cochant.
    if (categorie === 'travail' && !faites.has(tacheId)) {
      router.push(`/tache/seance?tacheId=${tacheId}&jour=${jour}`);
      return;
    }
    basculerRealisation(tacheId, jour);
  };

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setJour(ajouterJours(jour, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={couleurs.doux} />
          </Pressable>
          <Pressable onPress={() => setJour(jourISO())} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: couleurs.texte, textTransform: 'capitalize' }}>
              {formatJour(jour)}
            </Text>
            {!estAujourdhui && <Petit>Revenir à aujourd'hui</Petit>}
          </Pressable>
          <Pressable onPress={() => setJour(ajouterJours(jour, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={couleurs.doux} />
          </Pressable>
        </View>

        {rdvsDuJour.length > 0 && <Titre>Rendez-vous</Titre>}
        {rdvsDuJour.map((r) => (
          <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
        ))}

        <Titre>
          Tâches{taches.length > 0 ? ` (${restantes === 0 ? 'tout est fait 🎉' : `${restantes} à faire`})` : ''}
        </Titre>
        {taches.length === 0 && <Vide>Aucune tâche prévue ce jour-là.</Vide>}
        {taches.map((t) => (
          <LigneTache
            key={t.id}
            tache={t}
            faite={faites.has(t.id)}
            realisation={faites.get(t.id)}
            animaux={donnees.animaux}
            personnes={donnees.personnes}
            onBasculer={() => basculer(t.id, t.categorie)}
          />
        ))}

        <Titre>Dans les 7 jours</Titre>
        {rdvsAVenir.length === 0 && <Vide>Aucun rendez-vous prévu.</Vide>}
        {rdvsAVenir.map((r) => (
          <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
        ))}
      </Ecran>
      <BoutonFlottant onPress={() => router.push(`/tache/edit?jour=${jour}`)} />
    </View>
  );
}
