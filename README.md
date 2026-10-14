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

## Ajouté en V2

- **Calendrier** : vue du mois avec pastilles (rdv, tâches, arrivées / départs) et détail du jour choisi.
- **Finances** : toutes les dépenses et rentrées, par mois ou par année, par catégorie et par animal.
  Une dépense peut être payée par quelqu'un d'autre et partagée à parts égales (ex. le terrain des chevaux).
  Les soldes indiquent qui te doit quoi, et les remboursements se notent depuis la fiche de la personne.
- **Personnes** : l'entourage avec qui tu partages des frais ou à qui tu confies des tâches (sortir un cheval…).
  Les rappels ne concernent que les tâches dont tu t'occupes.
- **Sauvegarde** : export de toutes les données dans un fichier (Drive, e-mail…) et import sur un autre téléphone.

Les données restent sur le téléphone (aucun compte, fonctionne sans réseau). Les rappels sont des notifications locales,
reprogrammées à chaque modification pour les 14 jours à venir.

## Ajouté en V3

- **Suivis « au besoin »** (foin, abreuvoir…) : la dernière fois s'affiche dans Aujourd'hui et le calendrier, avec une alerte de retard.
- **Animaux d'autres propriétaires**, choisis parmi les Personnes.
- **Partage inégal** d'une dépense, en montants ou en pourcentages.
- **Icône** : l'emoji lapin.

## Ajouté en V4

- **Stock** (onglet) : foin, grain, croquettes, légumes… dans l'unité de son choix, avec boutons − / + et seuil d'alerte (« À racheter » dans Aujourd'hui).
- **Choix personnalisables** (Plus › Paramètres) : catégories de tâches, de dépenses et types de séances, avec leur emoji.
- **Plusieurs animaux** par tâche et **plusieurs propriétaires** par animal (copropriétaires d'un animal à soi).
- **Carnet de notes** avec recherche, lié à des animaux ou non.
- **Rappel par SMS ou WhatsApp** pour une tâche confiée à quelqu'un, message déjà écrit.
- **QR codes** : partager la fiche d'un animal ou d'un pro (lien `mesanimaux://import`, lu par Plus › Scanner), et faire installer l'app.

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

## Installer sur Android

À chaque mise à jour de `main`, GitHub compile l'application et publie le fichier `mes-animaux.apk`
dans les [Releases](../../releases/latest). Depuis le téléphone, ouvre la dernière release, télécharge
`mes-animaux.apk` et ouvre-le (Android demande d'autoriser l'installation depuis le navigateur).
Les mises à jour s'installent par-dessus sans perdre les données.

## Crédits

Icône : emoji « lapin » de [Noto Emoji](https://github.com/googlefonts/noto-emoji) (Google), sous licence Apache 2.0.
