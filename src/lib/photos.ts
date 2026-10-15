import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';

// Une photo par animal, réduite à l'ajout pour peser peu (environ 100 Ko).
// Android : un fichier dans le dossier de l'app. Web : l'image directement dans les données.
const LARGEUR = 900;
const web = Platform.OS === 'web';
const dossier = () => new Directory(Paths.document, 'photos');

/** Adresse affichable de la photo enregistrée dans Animal.photo. */
export function uriPhoto(photo?: string): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('data:')) return photo;
  return new File(dossier(), photo).uri;
}

/** Ouvre la galerie ou l'appareil photo, recadre et réduit l'image. Renvoie l'image en base64, ou rien si annulé. */
export async function prendrePhoto(source: 'galerie' | 'camera'): Promise<string | undefined> {
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Appareil photo', "L'app n'a pas accès à l'appareil photo.");
      return undefined;
    }
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 1 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled || !res.assets[0]) return undefined;
  const contexte = ImageManipulator.manipulate(res.assets[0].uri);
  if ((res.assets[0].width ?? LARGEUR) > LARGEUR) contexte.resize({ width: LARGEUR });
  const image = await contexte.renderAsync();
  const resultat = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return resultat.base64;
}

/** Enregistre l'image (base64) et renvoie la valeur à mettre dans Animal.photo. */
export function enregistrerPhoto(animalId: string, base64: string): string {
  if (web) return `data:image/jpeg;base64,${base64}`;
  const d = dossier();
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  const nom = `${animalId}-${Date.now()}.jpg`;
  const f = new File(d, nom);
  f.create();
  f.write(base64, { encoding: 'base64' });
  return nom;
}

export function supprimerPhoto(photo?: string) {
  if (!photo || photo.startsWith('data:') || web) return;
  try {
    const f = new File(dossier(), photo);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn('Photo non supprimée', e);
  }
}

/** Contenu base64 d'une photo, pour la sauvegarde. */
export async function lirePhoto(photo?: string): Promise<string | undefined> {
  if (!photo) return undefined;
  if (photo.startsWith('data:')) return photo.slice(photo.indexOf(',') + 1);
  try {
    return await new File(dossier(), photo).base64();
  } catch {
    return undefined;
  }
}
