import { Alert, Linking, Platform } from 'react-native';
import type { Animal, Personne, Tache } from './types';
import { formatJour, jourISO } from './dates';
import { nomsAnimaux } from './libelles';

/** 06 12 34 56 78 → 33612345678 (format attendu par WhatsApp). Les numéros déjà internationaux sont gardés. */
export function numeroInternational(tel: string): string {
  let n = tel.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) return n.slice(1);
  if (n.startsWith('00')) return n.slice(2);
  if (n.startsWith('0')) n = '33' + n.slice(1);
  return n;
}

export function messageRappel(tache: Tache, animaux: Animal[], jour?: string): string {
  const quoi = [tache.titre, nomsAnimaux(tache.animalIds, animaux) || tache.lieu].filter(Boolean).join(' – ');
  const quand =
    tache.recurrence.type === 'libre' || !jour
      ? ''
      : jour === jourISO()
        ? " aujourd'hui"
        : ` ${formatJour(jour)}`;
  const heure = tache.heure && quand ? ` à ${tache.heure.replace(':', 'h')}` : '';
  return `Petit rappel : ${quoi}${quand}${heure} 🙂 Merci !`;
}

/** Ouvre SMS ou WhatsApp avec le rappel déjà écrit : il ne reste qu'à appuyer sur envoyer. */
export function proposerRappel(personne: Personne, tache: Tache, animaux: Animal[], jour?: string) {
  if (!personne.telephone) return;
  const texte = messageRappel(tache, animaux, jour);
  const sms = () => Linking.openURL(`sms:${personne.telephone!.replace(/\s/g, '')}?body=${encodeURIComponent(texte)}`);
  const whatsapp = () =>
    Linking.openURL(`https://wa.me/${numeroInternational(personne.telephone!)}?text=${encodeURIComponent(texte)}`).catch(() =>
      Alert.alert('WhatsApp', "Impossible d'ouvrir WhatsApp."),
    );
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Envoyer par WhatsApp ? (Annuler = SMS)\n\n${texte}`)) whatsapp();
    else sms();
    return;
  }
  Alert.alert(`Rappel pour ${personne.nom}`, texte, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'SMS', onPress: sms },
    { text: 'WhatsApp', onPress: whatsapp },
  ]);
}
