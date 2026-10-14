import type { Animal, Contact } from './types';

export const LIEN_APK = 'https://github.com/louwnl/app-animaux/releases/latest/download/mes-animaux.apk';
const PREFIXE = 'mesanimaux://import?d=';

/** Ce qu'un QR code transporte : une copie de la fiche, sans les liens propres à mon téléphone. */
export type Fiche =
  | { t: 'animal'; a: Pick<Animal, 'nom' | 'espece' | 'statut' | 'race' | 'sexe' | 'dateNaissance' | 'robe' | 'identification' | 'notes'> }
  | { t: 'contact'; c: Omit<Contact, 'id'> };

const sansVides = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T;

// Plus le QR code est dense, plus il est dur à scanner sur un écran : on raccourcit les notes.
const MAX_NOTES = 400;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Base64 « URL » du texte en UTF-8, sans dépendre de btoa ni de TextEncoder. */
export function versBase64(texte: string): string {
  const octets = Array.from(unescape(encodeURIComponent(texte)), (c) => c.charCodeAt(0));
  let sortie = '';
  for (let i = 0; i < octets.length; i += 3) {
    const [a, b = 0, c = 0] = octets.slice(i, i + 3);
    const n = (a << 16) | (b << 8) | c;
    const reste = octets.length - i;
    sortie += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    if (reste > 1) sortie += ALPHABET[(n >> 6) & 63];
    if (reste > 2) sortie += ALPHABET[n & 63];
  }
  return sortie;
}

export function depuisBase64(b64: string): string {
  let binaire = '';
  for (let i = 0; i < b64.length; i += 4) {
    const v = Array.from(b64.slice(i, i + 4), (c) => ALPHABET.indexOf(c));
    if (v.some((x) => x < 0)) throw new Error('base64 invalide');
    const n = (v[0] << 18) | (v[1] << 12) | ((v[2] ?? 0) << 6) | (v[3] ?? 0);
    binaire += String.fromCharCode((n >> 16) & 255);
    if (v.length > 2) binaire += String.fromCharCode((n >> 8) & 255);
    if (v.length > 3) binaire += String.fromCharCode(n & 255);
  }
  return decodeURIComponent(escape(binaire));
}
const couper = (s?: string) => (s && s.length > MAX_NOTES ? `${s.slice(0, MAX_NOTES)}…` : s);

export function ficheAnimal(a: Animal): Fiche {
  const { nom, espece, statut, race, sexe, dateNaissance, robe, identification, notes } = a;
  return { t: 'animal', a: sansVides({ nom, espece, statut, race, sexe, dateNaissance, robe, identification, notes: couper(notes) }) };
}

export function ficheContact(c: Contact): Fiche {
  const { id: _id, ...reste } = c;
  return { t: 'contact', c: sansVides({ ...reste, notes: couper(reste.notes) }) };
}

/** Lien à mettre dans le QR code : il ouvre l'app sur l'écran d'import, depuis l'app ou l'appareil photo. */
export function lienFiche(f: Fiche): string {
  return PREFIXE + versBase64(JSON.stringify(f));
}

/** Lit le paramètre d (base64) ou un lien complet. */
export function lireFiche(brut: string | undefined): Fiche | undefined {
  if (!brut) return undefined;
  try {
    const f = JSON.parse(depuisBase64(brut.startsWith(PREFIXE) ? brut.slice(PREFIXE.length) : brut)) as Fiche;
    if (f.t === 'animal' && f.a?.nom && f.a.espece) return f;
    if (f.t === 'contact' && f.c?.nom) return f;
  } catch {
    // pas une fiche
  }
  return undefined;
}

export function estLienFiche(texte: string): boolean {
  return texte.startsWith(PREFIXE);
}
