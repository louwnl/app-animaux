import { createElement, type ReactNode } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { depuisJour, formatDateHeure, formatJourCourt, jourISO } from '../lib/dates';

export const couleurs = {
  fond: '#F6F3EE',
  carte: '#FFFFFF',
  texte: '#2B2420',
  doux: '#7A6E66',
  bord: '#E4DDD4',
  accent: '#3F7D5C',
  accentClair: '#E3F0E8',
  danger: '#B4442E',
  ambre: '#C27C0E',
};

export function Ecran({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView style={styles.ecran} contentContainerStyle={[styles.ecranContenu, style]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Titre({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.titreLigne}>
      <Text style={styles.titre}>{children}</Text>
      {action}
    </View>
  );
}

export function Carte({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!onPress) return <View style={[styles.carte, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.carte, style, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

export function Vide({ children }: { children: ReactNode }) {
  return <Text style={styles.vide}>{children}</Text>;
}

export function Petit({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.petit, style]}>{children}</Text>;
}

export function Bouton({
  titre,
  onPress,
  variante = 'principal',
}: {
  titre: string;
  onPress: () => void;
  variante?: 'principal' | 'secondaire' | 'danger';
}) {
  const fond = variante === 'principal' ? couleurs.accent : variante === 'danger' ? '#fff' : couleurs.accentClair;
  const texte = variante === 'principal' ? '#fff' : variante === 'danger' ? couleurs.danger : couleurs.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond },
        variante === 'danger' && { borderWidth: 1, borderColor: couleurs.danger },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.boutonTexte, { color: texte }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={styles.champ}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#B0A69D"
        {...props}
        style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function Libelle({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Puces de sélection, simple ou multiple. */
export function Choix<T extends string>({
  label,
  options,
  valeur,
  onChange,
}: {
  label?: string;
  options: Record<T, string> | [T, string][];
  valeur: T | T[] | undefined;
  onChange: (v: T) => void;
}) {
  const liste = Array.isArray(options) ? options : (Object.entries(options) as [T, string][]);
  const actif = (v: T) => (Array.isArray(valeur) ? valeur.includes(v) : valeur === v);
  return (
    <View style={styles.champ}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.puces}>
        {liste.map(([v, texte]) => (
          <Pressable key={v} onPress={() => onChange(v)} style={[styles.puce, actif(v) && styles.puceActive]}>
            <Text style={[styles.puceTexte, actif(v) && styles.puceTexteActive]}>{texte}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Sélecteur de date (AAAA-MM-JJ), d'heure (HH:MM) ou de date et heure (ISO).
 * Android : boîtes de dialogue natives. Web : champs HTML.
 */
export function ChampDate({
  label,
  mode,
  valeur,
  onChange,
  optionnel,
}: {
  label: string;
  mode: 'date' | 'heure' | 'dateheure';
  valeur?: string;
  onChange: (v: string | undefined) => void;
  optionnel?: boolean;
}) {
  const enDate = (): Date => {
    if (!valeur) return new Date();
    if (mode === 'date') return depuisJour(valeur);
    if (mode === 'heure') {
      const [h, m] = valeur.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    return new Date(valeur);
  };
  const versValeur = (d: Date) =>
    mode === 'date' ? jourISO(d) : mode === 'heure' ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : d.toISOString();

  const affichage = !valeur
    ? 'Choisir…'
    : mode === 'date'
      ? formatJourCourt(valeur)
      : mode === 'heure'
        ? valeur.replace(':', 'h')
        : formatDateHeure(valeur);

  const effacer = optionnel && valeur ? (
    <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
      <Text style={{ color: couleurs.doux, fontSize: 18 }}>✕</Text>
    </Pressable>
  ) : null;

  if (Platform.OS === 'web') {
    const d = enDate();
    const valeurWeb = !valeur
      ? ''
      : mode === 'date'
        ? valeur
        : mode === 'heure'
          ? valeur
          : `${jourISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return (
      <View style={styles.champ}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.dateLigne}>
          {createElement('input', {
            type: mode === 'date' ? 'date' : mode === 'heure' ? 'time' : 'datetime-local',
            value: valeurWeb,
            onChange: (e: { target: { value: string } }) => {
              const v = e.target.value;
              if (!v) return onChange(undefined);
              onChange(mode === 'dateheure' ? new Date(v).toISOString() : v);
            },
            style: { flex: 1, fontSize: 16, padding: 10, borderRadius: 10, border: `1px solid ${couleurs.bord}`, backgroundColor: '#fff' },
          })}
          {effacer}
        </View>
      </View>
    );
  }

  const ouvrir = () => {
    const depart = enDate();
    if (Platform.OS === 'android') {
      const ouvrirHeure = (base: Date) =>
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          is24Hour: true,
          onChange: (e, d) => {
            if (e.type !== 'set' || !d) return;
            const r = new Date(base);
            r.setHours(d.getHours(), d.getMinutes(), 0, 0);
            onChange(versValeur(r));
          },
        });
      if (mode === 'heure') return ouvrirHeure(depart);
      DateTimePickerAndroid.open({
        value: depart,
        mode: 'date',
        onChange: (e, d) => {
          if (e.type !== 'set' || !d) return;
          if (mode === 'date') return onChange(versValeur(d));
          const base = new Date(d);
          base.setHours(depart.getHours(), depart.getMinutes(), 0, 0);
          ouvrirHeure(base);
        },
      });
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.champ}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.dateLigne}>
          <DateTimePicker
            value={enDate()}
            mode={mode === 'date' ? 'date' : mode === 'heure' ? 'time' : 'datetime'}
            locale="fr-FR"
            onChange={(_, d) => d && onChange(versValeur(d))}
          />
          {effacer}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.champ}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateLigne}>
        <Pressable onPress={ouvrir} style={[styles.input, { flex: 1 }]}>
          <Text style={{ fontSize: 16, color: valeur ? couleurs.texte : '#B0A69D' }}>{affichage}</Text>
        </Pressable>
        {effacer}
      </View>
    </View>
  );
}

/** Bouton rond « + » en bas à droite. */
export function BoutonFlottant({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]} accessibilityLabel="Ajouter">
      <Text style={styles.fabTexte}>+</Text>
    </Pressable>
  );
}

export function confirmer(message: string, action: () => void, bouton = 'Supprimer') {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(message)) action();
    return;
  }
  Alert.alert('Confirmer', message, [
    { text: 'Annuler', style: 'cancel' },
    { text: bouton, style: 'destructive', onPress: action },
  ]);
}

export function alerte(message: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message);
    return;
  }
  Alert.alert('Attention', message);
}

export const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  ecranContenu: { padding: 16, paddingBottom: 100, gap: 10 },
  titreLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte },
  carte: {
    backgroundColor: couleurs.carte,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: couleurs.bord,
    gap: 4,
  },
  vide: { color: couleurs.doux, fontStyle: 'italic', paddingVertical: 6 },
  petit: { color: couleurs.doux, fontSize: 13 },
  bouton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  boutonTexte: { fontSize: 16, fontWeight: '600' },
  champ: { gap: 6, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.doux, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: couleurs.bord,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: couleurs.texte,
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: couleurs.bord,
    backgroundColor: '#fff',
  },
  puceActive: { backgroundColor: couleurs.accent, borderColor: couleurs.accent },
  puceTexte: { color: couleurs.texte, fontSize: 14 },
  puceTexteActive: { color: '#fff', fontWeight: '600' },
  dateLigne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: couleurs.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabTexte: { color: '#fff', fontSize: 32, lineHeight: 34, fontWeight: '400' },
});
