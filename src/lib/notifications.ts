import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Donnees } from './types';
import { ajouterJours, depuisJour, derniereFois, ilYA, jourISO, tacheLeJour } from './dates';
import { nomsAnimaux } from './libelles';
import { pourMoi } from './taches';
import { echeances } from './sante';
import { option } from './listes';

// Les notifications locales ne sont pas disponibles sur le web.
const actif = Platform.OS !== 'web';
const CANAL = 'rappels';
const JOURS_PLANIFIES = 14;
const MAX_NOTIFICATIONS = 400;

if (actif) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function demanderPermission(): Promise<boolean> {
  if (!actif) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Rappels',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const actuel = await Notifications.getPermissionsAsync();
  if (actuel.granted) return true;
  const demande = await Notifications.requestPermissionsAsync();
  return demande.granted;
}

/**
 * Efface puis reprogramme tous les rappels : rendez-vous à venir et tâches
 * des 14 prochains jours. Appelé au démarrage et après chaque modification,
 * ce qui garde les rappels cohérents (animal parti, tâche supprimée…).
 */
export async function replanifierTout(d: Donnees): Promise<void> {
  if (!actif) return;
  try {
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.cancelAllScheduledNotificationsAsync();

    const maintenant = Date.now();
    const aPlanifier: { titre: string; corps: string; date: Date }[] = [];

    for (const rdv of d.rdvs) {
      if (rdv.rappel === 'aucun') continue;
      const debut = new Date(rdv.dateHeure).getTime();
      const noms = nomsAnimaux(rdv.animalIds, d.animaux);
      const heure = new Date(rdv.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      if (rdv.rappel === 'heure' || rdv.rappel === 'les_deux') {
        aPlanifier.push({ titre: `Rdv dans 1 h : ${rdv.titre}`, corps: `${heure} ${noms}`.trim(), date: new Date(debut - 3600_000) });
      }
      if (rdv.rappel === 'veille' || rdv.rappel === 'les_deux') {
        aPlanifier.push({ titre: `Demain : ${rdv.titre}`, corps: `${heure} ${noms}`.trim(), date: new Date(debut - 86400_000) });
      }
    }

    const aujourdhui = jourISO();
    for (const t of d.taches) {
      // Seules les tâches dont je m'occupe me sont rappelées.
      if (!t.rappel || !t.heure || !pourMoi(t)) continue;
      const [h, m] = t.heure.split(':').map(Number);
      const animaux = nomsAnimaux(t.animalIds, d.animaux);
      if (t.recurrence.type === 'libre') {
        // Une seule alerte : le jour où la tâche passe en retard (ou dès que possible si elle l'est déjà).
        if (!t.recurrence.alerteApresJours) continue;
        const derniere = derniereFois(t.id, d.realisations);
        let jour = derniere ? ajouterJours(derniere, t.recurrence.alerteApresJours) : aujourdhui;
        if (jour < aujourdhui) jour = aujourdhui;
        const date = depuisJour(jour);
        date.setHours(h, m, 0, 0);
        if (date.getTime() <= maintenant) date.setDate(date.getDate() + 1);
        aPlanifier.push({
          titre: `À faire : ${t.titre}`,
          corps: derniere ? `Dernière fois ${ilYA(derniere)}` : 'Pas encore noté',
          date,
        });
        continue;
      }
      for (let i = 0; i < JOURS_PLANIFIES; i++) {
        const jour = ajouterJours(aujourdhui, i);
        if (!tacheLeJour(t, jour, d.animaux)) continue;
        const date = depuisJour(jour);
        date.setHours(h, m, 0, 0);
        aPlanifier.push({
          titre: t.titre,
          corps: animaux || t.lieu || 'Tâche à faire',
          date,
        });
      }
    }

    for (const e of echeances(d)) {
      if (!e.soin.rappel) continue;
      const type = option(d.listes.typesSante, e.soin.type);
      const corps = nomsAnimaux(e.animalIds, d.animaux);
      const veille = depuisJour(ajouterJours(e.jour, -1));
      veille.setHours(9, 0, 0, 0);
      const jour = depuisJour(e.jour);
      jour.setHours(9, 0, 0, 0);
      aPlanifier.push({ titre: `Demain : ${type.emoji} ${type.nom}`, corps, date: veille });
      aPlanifier.push({ titre: `Aujourd'hui : ${type.emoji} ${type.nom}`, corps, date: jour });
    }

    const futurs = aPlanifier
      .filter((n) => n.date.getTime() > maintenant)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, MAX_NOTIFICATIONS);

    for (const n of futurs) {
      await Notifications.scheduleNotificationAsync({
        content: { title: n.titre, body: n.corps },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date, channelId: CANAL },
      });
    }
  } catch (e) {
    console.warn('Rappels non programmés', e);
  }
}
