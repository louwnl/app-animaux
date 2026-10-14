import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { nouvelId, useStore, useTache } from '../../lib/store';
import type { CategorieTache, Recurrence, Tache } from '../../lib/types';
import { EMOJI_ESPECE, JOURS_COURTS } from '../../lib/libelles';
import { choix } from '../../lib/listes';
import { jourISO } from '../../lib/dates';
import { Bouton, Champ, ChampDate, Choix, Ecran, Petit, confirmer, couleurs } from '../../components/ui';

type TypeRec = Recurrence['type'];
const TYPES_REC: Record<TypeRec, string> = {
  unique: 'Une fois',
  quotidienne: 'Tous les jours',
  hebdo: 'Certains jours',
  intervalle: 'Tous les N jours',
  libre: 'Au besoin (je note quand c’est fait)',
};

// Idées pour aller vite, selon la catégorie.
const SUGGESTIONS: Record<CategorieTache, string[] | undefined> = {
  nettoyage: ['Nettoyer la cage', 'Changer la litière', 'Laver les gamelles', 'Curer le box'],
  alimentation: ['Gamelles', 'Eau fraîche', 'Foin', 'Légumes frais'],
  soins: ['Brossage', 'Curer les pieds', 'Couper les griffes', 'Vermifuge'],
  travail: ['Travail à la longe', 'Séance montée', 'Balade', 'Travail en liberté'],
  autre: [],
};

export default function EditionTache() {
  const params = useLocalSearchParams<{ id?: string; animalId?: string; jour?: string }>();
  const existante = useTache(params.id);
  const { donnees, enregistrer, supprimer } = useStore();

  const [t, setT] = useState<Tache>(
    existante ?? {
      id: nouvelId(),
      titre: '',
      categorie: 'nettoyage',
      animalIds: params.animalId ? [params.animalId] : [],
      recurrence: { type: 'quotidienne' },
      dateDebut: params.jour ?? jourISO(),
      rappel: false,
    },
  );
  const maj = (champs: Partial<Tache>) => setT((x) => ({ ...x, ...champs }));

  const changerRecurrence = (type: TypeRec) => {
    if (type === 'hebdo') maj({ recurrence: { type, jours: [new Date().getDay()] } });
    else if (type === 'intervalle') maj({ recurrence: { type, tousLes: 2 } });
    else if (type === 'libre') maj({ recurrence: { type } });
    else maj({ recurrence: { type } });
  };

  const animauxPresents = donnees.animaux.filter((a) => a.statut !== 'parti' || t.animalIds.includes(a.id));
  const suggestions = SUGGESTIONS[t.categorie] ?? [];

  const valider = () => {
    if (!t.titre.trim()) return;
    if (t.recurrence.type === 'hebdo' && t.recurrence.jours.length === 0) return;
    enregistrer('taches', { ...t, titre: t.titre.trim(), rappel: t.rappel && !!t.heure });
    router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existante ? 'Modifier la tâche' : 'Nouvelle tâche' }} />
      <Choix label="Catégorie" options={choix(donnees.listes.categoriesTache)} valeur={t.categorie} onChange={(categorie: CategorieTache) => maj({ categorie })} />
      <Champ label="Tâche" value={t.titre} onChangeText={(titre) => maj({ titre })} placeholder="Ex. Laver les gamelles" />
      {!t.titre && suggestions.length > 0 && (
        <Choix options={suggestions.map((s) => [s, s] as [string, string])} valeur={undefined} onChange={(titre) => maj({ titre })} />
      )}

      <Choix
        label="Pour quels animaux ? (facultatif)"
        options={animauxPresents.map((a) => [a.id, `${EMOJI_ESPECE[a.espece]} ${a.nom}`] as [string, string])}
        valeur={t.animalIds}
        onChange={(id) => maj({ animalIds: t.animalIds.includes(id) ? t.animalIds.filter((x) => x !== id) : [...t.animalIds, id] })}
      />
      {t.animalIds.length === 0 && <Champ label="Ou quel lieu ? (facultatif)" value={t.lieu ?? ''} onChangeText={(lieu) => maj({ lieu })} placeholder="Ex. Cage des lapins, écurie" />}

      {donnees.personnes.length > 0 && (
        <Choix
          label="Qui s'en occupe ?"
          options={[['moi', 'Moi'] as [string, string], ...donnees.personnes.map((p) => [p.id, p.nom] as [string, string])]}
          valeur={t.assigneA ?? 'moi'}
          onChange={(id) => maj({ assigneA: id === 'moi' ? undefined : id })}
        />
      )}

      <Choix label="Fréquence" options={TYPES_REC} valeur={t.recurrence.type} onChange={changerRecurrence} />
      {t.recurrence.type === 'hebdo' && (
        <Choix
          options={[1, 2, 3, 4, 5, 6, 0].map((j) => [String(j), JOURS_COURTS[j]] as [string, string])}
          valeur={t.recurrence.jours.map(String)}
          onChange={(v) => {
            const j = Number(v);
            const jours = (t.recurrence as { jours: number[] }).jours;
            maj({ recurrence: { type: 'hebdo', jours: jours.includes(j) ? jours.filter((x) => x !== j) : [...jours, j] } });
          }}
        />
      )}
      {t.recurrence.type === 'intervalle' && (
        <Champ
          label="Tous les combien de jours ?"
          keyboardType="number-pad"
          value={String(t.recurrence.tousLes)}
          onChangeText={(v) => maj({ recurrence: { type: 'intervalle', tousLes: Math.max(1, parseInt(v, 10) || 1) } })}
        />
      )}
      {t.recurrence.type === 'libre' && (
        <>
          <Petit>
            Pour ce qu'on fait quand il faut (mettre le foin, nettoyer l'abreuvoir…) : tu notes chaque fois que c'est fait, l'app
            affiche la dernière fois et le note dans le calendrier.
          </Petit>
          <Champ
            label="M'alerter si pas fait depuis (jours, facultatif)"
            keyboardType="number-pad"
            value={t.recurrence.alerteApresJours ? String(t.recurrence.alerteApresJours) : ''}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              maj({ recurrence: { type: 'libre', alerteApresJours: n > 0 ? n : undefined } });
            }}
            placeholder="Ex. 3"
          />
        </>
      )}
      {t.recurrence.type !== 'libre' && (
        <ChampDate
          label={t.recurrence.type === 'unique' ? 'Date' : 'À partir du'}
          mode="date"
          valeur={t.dateDebut}
          onChange={(v) => v && maj({ dateDebut: v })}
        />
      )}
      {t.recurrence.type !== 'unique' && t.recurrence.type !== 'libre' && (
        <ChampDate label="Jusqu'au (facultatif)" mode="date" optionnel valeur={t.dateFin} onChange={(dateFin) => maj({ dateFin })} />
      )}
      {(t.recurrence.type !== 'libre' || !!t.recurrence.alerteApresJours) && (
        <ChampDate label="Heure (facultatif)" mode="heure" optionnel valeur={t.heure} onChange={(heure) => maj({ heure })} />
      )}
      {!!t.heure && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
          <Text style={{ color: couleurs.texte, fontSize: 16, flex: 1 }}>
            {t.recurrence.type === 'libre' ? "🔔 Me prévenir à cette heure quand c'est en retard" : "🔔 Me le rappeler à l'heure"}
          </Text>
          <Switch value={t.rappel} onValueChange={(rappel) => maj({ rappel })} trackColor={{ true: couleurs.accent }} />
        </View>
      )}
      {t.categorie === 'travail' && <Petit>En cochant cette tâche, tu pourras noter le type de séance, sa durée et ton ressenti.</Petit>}

      <Bouton titre="Enregistrer" onPress={valider} />
      {existante && (
        <Bouton
          titre="Supprimer la tâche"
          variante="danger"
          onPress={() =>
            confirmer('Supprimer cette tâche et son historique ?', () => {
              supprimer('taches', existante.id);
              router.back();
            })
          }
        />
      )}
    </Ecran>
  );
}
