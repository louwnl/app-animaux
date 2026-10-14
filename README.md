# Mes Animaux

Application mobile (Android, et version web) pour suivre mes animaux et les animaux de passage
(famille relais, bénévolat en refuge) : tâches d'entretien, rendez-vous, contacts des professionnels.

La conception complète est dans le document de projet `conception-app-animaux.md`.

## Ce que fait la V1

- **Aujourd'hui** : tâches du jour à cocher, rendez-vous du jour et des 7 prochains jours. Les flèches changent de jour.
- **Animaux** : lapins, chats, chevaux… avec statut *Le mien / Famille relais / Au refuge / Parti*.
  Les animaux de passage ont un historique d'accueils (arrivée, départ, issue, refuge).
  Enregistrer un départ archive l'animal et arrête ses tâches, sans rien effacer.
- **Tâches** : ponctuelles ou récurrentes (tous les jours, certains jours, tous les N jours), liées à un animal ou à un lieu,
  avec rappel optionnel. Cocher une tâche « Travail » permet de noter la séance (type, durée, ressenti).
- **Rendez-vous** : vétérinaire, maréchal, ostéo… avec animaux concernés, professionnel, rappel 1 h avant et/ou la veille,
  et compte rendu.
- **Contacts** : par catégorie, avec boutons appel, SMS, e-mail et itinéraire.

Les données restent sur le téléphone (aucun compte, fonctionne sans réseau). Les rappels sont des notifications locales,
reprogrammées à chaque modification pour les 14 jours à venir.

## Lancer l'application

```bash
npm install
npx expo start      # puis scanner le QR code avec l'app Expo Go sur Android
npx expo start --web
```

## Technique

Expo SDK 57, Expo Router (`src/app/`), stockage AsyncStorage (`src/lib/store.tsx`),
notifications locales `expo-notifications` (`src/lib/notifications.ts`).

```bash
npx tsc --noEmit    # vérification des types
```
