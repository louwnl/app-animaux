import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { Donnees } from './types';
import { jourISO } from './dates';
import { normaliser } from './store';

const MARQUEUR = 'mes-animaux';

/** Crée le fichier de sauvegarde et ouvre le partage (Drive, e-mail…) ou le téléchargement sur le web. */
export async function exporter(d: Donnees): Promise<void> {
  const contenu = JSON.stringify({ application: MARQUEUR, exporteLe: new Date().toISOString(), donnees: d }, null, 2);
  const nom = `mes-animaux-${jourISO()}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.click();
    URL.revokeObjectURL(url);
    return;
  }

  const fichier = new File(Paths.cache, nom);
  if (fichier.exists) fichier.delete();
  fichier.create();
  fichier.write(contenu);
  await Sharing.shareAsync(fichier.uri, { mimeType: 'application/json', dialogTitle: 'Enregistrer la sauvegarde' });
}

/** Ouvre le sélecteur de fichiers et lit une sauvegarde. Renvoie undefined si annulé. */
export async function choisirSauvegarde(): Promise<Donnees | undefined> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return undefined;
  const asset = res.assets[0];
  const texte = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();

  let json: { application?: string; donnees?: Partial<Donnees> };
  try {
    json = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde de Mes Animaux.");
  }
  if (json.application !== MARQUEUR || !json.donnees || !Array.isArray(json.donnees.animaux)) {
    throw new Error("Ce fichier n'est pas une sauvegarde de Mes Animaux.");
  }
  return normaliser(json.donnees);
}
