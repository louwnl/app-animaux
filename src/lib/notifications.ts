import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Donnees } from './types';
import { ajouterJours, depuisJour, jourISO, tacheLeJour } from './dates';
import { EMOJI_ESPECE } from './libelles';

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
      const noms = rdv.animalIds
        .map((id) => d.animaux.find((a) => a.id === id))
        .filter(Boolean)
        .map((a) => `${EMOJI_ESPECE[a!.espece]} ${a!.nom}`)
        .join(', ');
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
      if (!t.rappel || !t.heure) continue;
      const [h, m] = t.heure.split(':').map(Number);
      const animal = d.animaux.find((a) => a.id === t.animalId);
      for (let i = 0; i < JOURS_PLANIFIES; i++) {
        const jour = ajouterJours(aujourdhui, i);
        if (!tacheLeJour(t, jour, d.animaux)) continue;
        const date = depuisJour(jour);
        date.setHours(h, m, 0, 0);
        aPlanifier.push({
          titre: t.titre,
          corps: animal ? `${EMOJI_ESPECE[animal.espece]} ${animal.nom}` : t.lieu ?? 'Tâche à faire',
          date,
        });
      }
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
