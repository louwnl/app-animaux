import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../lib/store';
import { ajouterJours, formatJour, jourISO, tacheActive, tacheLeJour } from '../../lib/dates';
import { aRacheter, quantiteTexte } from '../../lib/stock';
import { placeDe } from '../../lib/fonctions';
import { echeances } from '../../lib/sante';
import { CarteEcheance } from '../../components/sante';
import { useMajDisponible } from '../../lib/miseAJour';
import { BoutonFlottant, Carte, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';
import { BandeauAnnuler, CarteRdv, CarteSuivi, LigneTache } from '../../components/elements';
import { reporterAuLendemain } from '../../lib/taches';
import type { Tache } from '../../lib/types';

export default function Aujourdhui() {
  const { donnees, basculerRealisation, enregistrer } = useStore();
  // Dernier report, que l'on peut annuler quelques secondes.
  const [annulable, setAnnulable] = useState<Tache>();
  useEffect(() => {
    if (!annulable) return;
    const minuteur = setTimeout(() => setAnnulable(undefined), 6000);
    return () => clearTimeout(minuteur);
  }, [annulable]);
  const reporter = (t: Tache) => {
    enregistrer('taches', reporterAuLendemain(t, jour));
    setAnnulable(t);
  };
  const majPrete = useMajDisponible();
  const [jour, setJour] = useState(jourISO());
  const estAujourdhui = jour === jourISO();

  const taches = donnees.taches
    .filter((t) => tacheLeJour(t, jour, donnees.animaux))
    .sort((a, b) => (a.heure ?? '99').localeCompare(b.heure ?? '99'));
  const suivis = donnees.taches.filter((t) => t.recurrence.type === 'libre' && tacheActive(t, donnees.animaux));
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

  const aAcheter = donnees.produits.filter(aRacheter);
  const soinsProches = placeDe(donnees.reglages, 'sante') === 'masque' ? [] : echeances(donnees).filter((e) => e.dans <= 7);

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
            <Text style={{ fontSize: 20, fontWeight: '700', color: couleurs.texte, textTransform: 'capitalize' }}>{formatJour(jour)}</Text>
            {!estAujourdhui && <Petit>Revenir à aujourd’hui</Petit>}
          </Pressable>
          <Pressable onPress={() => setJour(ajouterJours(jour, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={couleurs.doux} />
          </Pressable>
        </View>

        {majPrete && (
          <Carte onPress={() => router.push('/mise-a-jour')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="arrow-down-circle" size={26} color={couleurs.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>Nouvelle version disponible</Text>
              <Petit>Touche ici pour mettre à jour l’app.</Petit>
            </View>
          </Carte>
        )}

        {rdvsDuJour.length > 0 && <Titre>Rendez-vous</Titre>}
        {rdvsDuJour.map((r) => (
          <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
        ))}

        {estAujourdhui && aAcheter.length > 0 && (
          <>
            <Titre>À racheter</Titre>
            <Carte
              onPress={() => router.push(placeDe(donnees.reglages, 'stock') === 'barre' ? '/stock' : '/vue/stock')}
              style={{ gap: 4, borderColor: couleurs.ambre, backgroundColor: '#FFF8EC' }}
            >
              {aAcheter.map((p) => (
                <Text key={p.id} style={{ color: couleurs.texte, fontSize: 15 }}>
                  {p.emoji} {p.nom}{' '}
                  <Text style={{ color: couleurs.ambre, fontWeight: '600' }}>· reste {quantiteTexte(p.quantite, p.unite)}</Text>
                </Text>
              ))}
            </Carte>
          </>
        )}

        {estAujourdhui && soinsProches.length > 0 && <Titre>Santé</Titre>}
        {estAujourdhui && soinsProches.map((e) => <CarteEcheance key={e.soin.id} e={e} />)}

        {suivis.length > 0 && <Titre>Suivis</Titre>}
        {suivis.map((t) => (
          <CarteSuivi
            key={t.id}
            tache={t}
            jour={jour}
            realisations={donnees.realisations}
            animaux={donnees.animaux}
            personnes={donnees.personnes}
            onBasculer={() => basculerRealisation(t.id, jour)}
          />
        ))}

        <Titre>Tâches{taches.length > 0 ? ` (${restantes === 0 ? 'tout est fait 🎉' : `${restantes} à faire`})` : ''}</Titre>
        {taches.length === 0 && <Vide>Aucune tâche prévue ce jour-là.</Vide>}
        {restantes > 0 && <Petit>Pas eu le temps ? Glisse une tâche vers la droite pour la reporter à demain.</Petit>}
        {taches.map((t) => (
          <LigneTache
            key={t.id}
            tache={t}
            jour={jour}
            faite={faites.has(t.id)}
            realisation={faites.get(t.id)}
            animaux={donnees.animaux}
            personnes={donnees.personnes}
            onBasculer={() => basculer(t.id, t.categorie)}
            onReporter={() => reporter(t)}
          />
        ))}

        <Titre>Dans les 7 jours</Titre>
        {rdvsAVenir.length === 0 && <Vide>Aucun rendez-vous prévu.</Vide>}
        {rdvsAVenir.map((r) => (
          <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
        ))}
      </Ecran>
      <BoutonFlottant onPress={() => router.push(`/tache/edit?jour=${jour}`)} />
      {annulable && (
        <BandeauAnnuler
          texte={`« ${annulable.titre} » reportée à demain`}
          onAnnuler={() => {
            enregistrer('taches', annulable);
            setAnnulable(undefined);
          }}
        />
      )}
    </View>
  );
}
