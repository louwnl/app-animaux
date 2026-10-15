import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

const DEPOT = 'louwnl/app-animaux';
export const LIEN_APK = `https://github.com/${DEPOT}/releases/latest/download/mes-animaux.apk`;

/** Numéro de la version installée (le numéro de compilation, ex. 12), ou undefined hors APK. */
export function versionInstallee(): number | undefined {
  const n = Number(Application.nativeBuildVersion);
  return Number.isFinite(n) && n > 1 ? n : undefined;
}

/** Numéro de la dernière version publiée (release « build-N »). */
export async function derniereVersion(): Promise<number | undefined> {
  const r = await fetch(`https://api.github.com/repos/${DEPOT}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const { tag_name } = (await r.json()) as { tag_name?: string };
  const n = Number(tag_name?.replace('build-', ''));
  return Number.isFinite(n) ? n : undefined;
}

/** Une nouvelle version est-elle disponible ? (false si on ne peut pas le savoir) */
export async function majDisponible(): Promise<boolean> {
  const installee = versionInstallee();
  if (!installee) return false;
  const derniere = await derniereVersion();
  return !!derniere && derniere > installee;
}

/**
 * Télécharge l'APK puis ouvre l'installeur d'Android.
 * La première fois, Android demande d'autoriser l'app à installer des applications.
 */
export async function installerMaj(): Promise<void> {
  if (Platform.OS !== 'android') {
    await Linking.openURL(LIEN_APK);
    return;
  }
  const fichier = new File(Paths.cache, 'mes-animaux.apk');
  if (fichier.exists) fichier.delete();
  const apk = await File.downloadFileAsync(LIEN_APK, fichier);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: apk.contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  });
}

// Vérifiée une seule fois par lancement de l'app.
let verification: Promise<boolean> | undefined;

/** true quand une nouvelle version est publiée (vérification discrète, sans message d'erreur). */
export function useMajDisponible(): boolean {
  const [dispo, setDispo] = useState(false);
  useEffect(() => {
    let actif = true;
    verification ??= majDisponible().catch(() => false);
    verification.then((v) => actif && setDispo(v));
    return () => {
      actif = false;
    };
  }, []);
  return dispo;
}
