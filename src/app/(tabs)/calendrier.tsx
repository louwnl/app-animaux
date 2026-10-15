import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../lib/store';
import { ajouterJours, depuisJour, formatJour, jourISO, tacheLeJour } from '../../lib/dates';
import { EMOJI_ESPECE, ISSUES, JOURS_COURTS, TYPES_ACCUEIL } from '../../lib/libelles';
import { BoutonFlottant, Carte, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';
import { CarteRdv, CarteSuivi, LigneTache } from '../../components/elements';
import { CarteEcheance, CarteSoin } from '../../components/sante';
import { echeances } from '../../lib/sante';

// Semaine commençant le lundi.
const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0];

function grilleDuMois(mois: string): (string | null)[] {
  const premier = depuisJour(`${mois}-01`);
  const decalage = (premier.getDay() + 6) % 7;
  const nbJours = new Date(premier.getFullYear(), premier.getMonth() + 1, 0).getDate();
  const cases: (string | null)[] = Array(decalage).fill(null);
  for (let j = 1; j <= nbJours; j++) cases.push(`${mois}-${String(j).padStart(2, '0')}`);
  while (cases.length % 7 !== 0) cases.push(null);
  return cases;
}

function decalerMois(mois: string, n: number): string {
  const [a, m] = mois.split('-').map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Calendrier() {
  const { donnees, basculerRealisation } = useStore();
  const aujourdhui = jourISO();
  const [jour, setJour] = useState(aujourdhui);
  const [mois, setMois] = useState(aujourdhui.slice(0, 7));

  const cases = useMemo(() => grilleDuMois(mois), [mois]);

  // Pastilles du mois : rendez-vous, tâches, arrivées / départs.
  const marques = useMemo(() => {
    const m = new Map<string, { rdv: boolean; taches: number; accueil: boolean; suivi: boolean; sante: boolean }>();
    const joursSante = new Set([...donnees.soins.map((s) => s.date), ...echeances(donnees).map((e) => e.jour)]);
    const libres = new Set(donnees.taches.filter((t) => t.recurrence.type === 'libre').map((t) => t.id));
    const joursSuivis = new Set(donnees.realisations.filter((r) => libres.has(r.tacheId)).map((r) => r.date));
    for (const j of cases) {
      if (!j) continue;
      m.set(j, {
        rdv: donnees.rdvs.some((r) => jourISO(new Date(r.dateHeure)) === j),
        taches: donnees.taches.filter((t) => tacheLeJour(t, j, donnees.animaux)).length,
        accueil: donnees.animaux.some((a) => a.accueils.some((ac) => ac.dateArrivee === j || ac.dateDepart === j)),
        suivi: joursSuivis.has(j),
        sante: joursSante.has(j),
      });
    }
    return m;
  }, [cases, donnees]);

  const rdvs = donnees.rdvs.filter((r) => jourISO(new Date(r.dateHeure)) === jour).sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));
  const taches = donnees.taches
    .filter((t) => tacheLeJour(t, jour, donnees.animaux))
    .sort((a, b) => (a.heure ?? '99').localeCompare(b.heure ?? '99'));
  const faites = new Map(donnees.realisations.filter((r) => r.date === jour).map((r) => [r.tacheId, r]));
  const suivis = donnees.taches.filter((t) => t.recurrence.type === 'libre');
  const suivisFaits = suivis.filter((t) => faites.has(t.id));
  const soinsDuJour = donnees.soins.filter((s) => s.date === jour);
  const echeancesDuJour = echeances(donnees).filter((e) => e.jour === jour);
  const mouvements = donnees.animaux.flatMap((a) =>
    a.accueils
      .filter((ac) => ac.dateArrivee === jour || ac.dateDepart === jour)
      .map((ac) => ({ a, ac, arrivee: ac.dateArrivee === jour })),
  );

  const choisir = (j: string) => {
    setJour(j);
    setMois(j.slice(0, 7));
  };

  const libelleMois = depuisJour(`${mois}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setMois(decalerMois(mois, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={couleurs.doux} />
          </Pressable>
          <Pressable onPress={() => choisir(aujourdhui)}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: couleurs.texte, textTransform: 'capitalize' }}>{libelleMois}</Text>
          </Pressable>
          <Pressable onPress={() => setMois(decalerMois(mois, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={couleurs.doux} />
          </Pressable>
        </View>

        <Carte style={{ padding: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            {ORDRE_JOURS.map((j) => (
              <Text key={j} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: couleurs.doux, paddingVertical: 4 }}>
                {JOURS_COURTS[j]}
              </Text>
            ))}
          </View>
          {Array.from({ length: cases.length / 7 }, (_, semaine) => (
            <View key={semaine} style={{ flexDirection: 'row' }}>
              {cases.slice(semaine * 7, semaine * 7 + 7).map((j, i) => {
                if (!j) return <View key={i} style={{ flex: 1, height: 46 }} />;
                const m = marques.get(j);
                const choisi = j === jour;
                const estAujourdhui = j === aujourdhui;
                return (
                  <Pressable key={j} onPress={() => choisir(j)} style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: choisi ? couleurs.accent : 'transparent',
                        borderWidth: estAujourdhui && !choisi ? 1.5 : 0,
                        borderColor: couleurs.accent,
                      }}
                    >
                      <Text style={{ color: choisi ? '#fff' : couleurs.texte, fontWeight: estAujourdhui ? '700' : '400' }}>
                        {Number(j.slice(8))}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2, height: 5, marginTop: 1 }}>
                      {m?.rdv && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: couleurs.danger }} />}
                      {!!m?.taches && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: couleurs.accent }} />}
                      {m?.accueil && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: couleurs.ambre }} />}
                      {m?.suivi && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#3B6FB6' }} />}
                      {m?.sante && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#8A4FB3' }} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, paddingTop: 6 }}>
            <Petit>🔴 Rdv</Petit>
            <Petit>🟢 Tâches</Petit>
            <Petit>🟠 Arrivée / départ</Petit>
            <Petit>🔵 Suivi fait</Petit>
            <Petit>🟣 Santé</Petit>
          </View>
        </Carte>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Pressable onPress={() => choisir(ajouterJours(jour, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={couleurs.doux} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: couleurs.texte, textTransform: 'capitalize' }}>{formatJour(jour)}</Text>
          <Pressable onPress={() => choisir(ajouterJours(jour, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={couleurs.doux} />
          </Pressable>
        </View>

        {mouvements.map(({ a, ac, arrivee }) => (
          <Carte key={ac.id + (arrivee ? 'a' : 'd')} onPress={() => router.push(`/animal/${a.id}`)}>
            <Text style={{ color: couleurs.texte, fontWeight: '600' }}>
              {EMOJI_ESPECE[a.espece]} {arrivee ? 'Arrivée' : 'Départ'} de {a.nom}
            </Text>
            <Petit>
              {TYPES_ACCUEIL[ac.type]}
              {!arrivee && ac.issue ? ` · ${ISSUES[ac.issue]}` : ''}
            </Petit>
          </Carte>
        ))}

        {rdvs.map((r) => (
          <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
        ))}

        {taches.length > 0 && <Titre>Tâches</Titre>}
        {taches.map((t) => (
          <LigneTache
            key={t.id}
            tache={t}
            jour={jour}
            faite={faites.has(t.id)}
            realisation={faites.get(t.id)}
            animaux={donnees.animaux}
            personnes={donnees.personnes}
            onBasculer={() =>
              t.categorie === 'travail' && !faites.has(t.id)
                ? router.push(`/tache/seance?tacheId=${t.id}&jour=${jour}`)
                : basculerRealisation(t.id, jour)
            }
          />
        ))}

        {suivis.length > 0 && <Titre>Suivis</Titre>}
        {suivis.length > 0 && suivisFaits.length === 0 && <Petit>Rien de noté ce jour-là. Touche « Fait » pour l’ajouter à cette date.</Petit>}
        {[...suivisFaits, ...suivis.filter((t) => !faites.has(t.id))].map((t) => (
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

        {soinsDuJour.length + echeancesDuJour.length > 0 && <Titre>Santé</Titre>}
        {echeancesDuJour.map((e) => (
          <CarteEcheance key={e.soin.id} e={e} />
        ))}
        {soinsDuJour.map((s) => (
          <CarteSoin key={s.id} s={s} />
        ))}

        {rdvs.length === 0 && taches.length === 0 && mouvements.length === 0 && suivis.length === 0 && soinsDuJour.length + echeancesDuJour.length === 0 && (
          <Vide>Rien de prévu ce jour-là.</Vide>
        )}
      </Ecran>
      <BoutonFlottant onPress={() => router.push(`/rdv/edit?jour=${jour}`)} />
    </View>
  );
}
