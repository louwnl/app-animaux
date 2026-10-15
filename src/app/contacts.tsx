import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../lib/store';
import type { CategorieContact, Contact } from '../lib/types';
import { CATEGORIES_CONTACT } from '../lib/libelles';
import { BoutonFlottant, Carte, Ecran, Petit, Titre, Vide, couleurs } from '../components/ui';

function Action({ icone, onPress }: { icone: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: couleurs.accentClair,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icone} size={20} color={couleurs.accent} />
    </Pressable>
  );
}

/** www.site.fr → https://www.site.fr */
const url = (lien: string) => (/^https?:\/\//i.test(lien) ? lien : `https://${lien}`);
/** https://www.site.fr/boutique → site.fr */
const domaine = (lien: string) =>
  lien
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];

function CarteContact({ c }: { c: Contact }) {
  const tel = c.telephone?.replace(/\s/g, '');
  return (
    <Carte onPress={() => router.push(`/contact/edit?id=${c.id}`)} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>{c.nom}</Text>
          {!!c.structure && <Petit>{c.structure}</Petit>}
          {!!c.telephone && <Petit>{c.telephone}</Petit>}
        </View>
        {!!tel && <Action icone="call" onPress={() => Linking.openURL(`tel:${tel}`)} />}
        {!!tel && <Action icone="chatbubble" onPress={() => Linking.openURL(`sms:${tel}`)} />}
        {!!c.email && <Action icone="mail" onPress={() => Linking.openURL(`mailto:${c.email}`)} />}
        {!!c.adresse && (
          <Action icone="navigate" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(c.adresse!)}`)} />
        )}
      </View>
      {!!c.liens?.length && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {c.liens.map((l) => (
            <Pressable
              key={l}
              onPress={() => Linking.openURL(url(l))}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: couleurs.accentClair,
                },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="globe-outline" size={16} color={couleurs.accent} />
              <Text style={{ color: couleurs.accent, fontWeight: '600' }}>{domaine(l)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Carte>
  );
}

export default function Contacts() {
  const { donnees } = useStore();
  const categories = Object.keys(CATEGORIES_CONTACT) as CategorieContact[];

  return (
    <View style={{ flex: 1 }}>
      <Ecran>
        {donnees.contacts.length === 0 && <Vide>Ajoute ton vétérinaire, ton maréchal ou ton refuge avec le bouton +.</Vide>}
        {categories.map((cat) => {
          const liste = donnees.contacts.filter((c) => c.categorie === cat).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
          if (liste.length === 0) return null;
          return (
            <View key={cat} style={{ gap: 10 }}>
              <Titre>{CATEGORIES_CONTACT[cat]}</Titre>
              {liste.map((c) => (
                <CarteContact key={c.id} c={c} />
              ))}
            </View>
          );
        })}
      </Ecran>
      <BoutonFlottant onPress={() => router.push('/contact/edit')} />
    </View>
  );
}
