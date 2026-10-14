import { Pressable, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAnimal, useStore } from '../../lib/store';
import { EMOJI_ESPECE, ESPECES, ISSUES, STATUTS, TYPES_ACCUEIL } from '../../lib/libelles';
import { option } from '../../lib/listes';
import { age, formatJourCourt } from '../../lib/dates';
import { Bouton, Carte, Ecran, Petit, Titre, Vide, couleurs } from '../../components/ui';
import { CarteRdv, CarteTache, proprietaires } from '../../components/elements';
import { CarteNote } from '../../components/notes';
import { CarteOperation } from '../../components/finances';
import { bilan, euros } from '../../lib/finances';

function Info({ label, valeur }: { label: string; valeur?: string }) {
  if (!valeur) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Petit>{label}</Petit>
      <Text style={{ color: couleurs.texte, fontSize: 15, flexShrink: 1, textAlign: 'right' }}>{valeur}</Text>
    </View>
  );
}

export default function FicheAnimal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animal = useAnimal(id);
  const { donnees } = useStore();

  if (!animal) {
    return (
      <Ecran>
        <Vide>Cet animal n'existe plus.</Vide>
      </Ecran>
    );
  }

  const taches = donnees.taches.filter((t) => t.animalIds.includes(animal.id));
  const notes = donnees.notes.filter((n) => n.animalIds.includes(animal.id)).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
  const maintenant = new Date().toISOString();
  const rdvs = donnees.rdvs.filter((r) => r.animalIds.includes(animal.id)).sort((a, b) => b.dateHeure.localeCompare(a.dateHeure));
  const rdvsAVenir = rdvs.filter((r) => r.dateHeure >= maintenant).reverse();
  const rdvsPasses = rdvs.filter((r) => r.dateHeure < maintenant).slice(0, 5);
  const idsTaches = new Set(taches.map((t) => t.id));
  const seances = donnees.realisations
    .filter((r) => idsTaches.has(r.tacheId) && r.seance)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  const proprio = proprietaires(animal, donnees.personnes);
  const operations = donnees.operations.filter((o) => o.animalId === animal.id).sort((a, b) => b.date.localeCompare(a.date));
  const annee = String(new Date().getFullYear());
  const accueils = [...animal.accueils].sort((a, b) => b.dateArrivee.localeCompare(a.dateArrivee));
  const sexe = animal.sexe === 'male' ? 'Mâle' : animal.sexe === 'femelle' ? 'Femelle' : undefined;
  const passageOuAncien = animal.statut !== 'mien' || accueils.length > 0;

  return (
    <Ecran>
      <Stack.Screen options={{ title: animal.nom }} />
      <Carte style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 56 }}>{EMOJI_ESPECE[animal.espece]}</Text>
        <Text style={{ fontSize: 24, fontWeight: '700', color: couleurs.texte }}>{animal.nom}</Text>
        <Petit>
          {STATUTS[animal.statut]}
          {proprio ? ` · ${proprio}` : ''}
        </Petit>
      </Carte>

      <Carte>
        <Info label="Espèce" valeur={ESPECES[animal.espece].split(' ')[1]} />
        <Info label="Race" valeur={animal.race} />
        <Info label="Sexe" valeur={sexe} />
        <Info
          label="Naissance"
          valeur={animal.dateNaissance && `${formatJourCourt(animal.dateNaissance)} (${age(animal.dateNaissance) ?? '?'})`}
        />
        <Info label={animal.espece === 'cheval' ? 'Robe' : 'Couleur'} valeur={animal.robe} />
        <Info label="Identification" valeur={animal.identification} />
        {!!animal.notes && <Text style={{ color: couleurs.texte, marginTop: 6 }}>{animal.notes}</Text>}
      </Carte>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Bouton titre="Modifier la fiche" variante="secondaire" onPress={() => router.push(`/animal/edit?id=${animal.id}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Partager (QR)" variante="secondaire" onPress={() => router.push(`/partage?animalId=${animal.id}`)} />
        </View>
      </View>

      {passageOuAncien && (
        <>
          <Titre
            action={
              <Pressable onPress={() => router.push(`/animal/accueil?animalId=${animal.id}`)}>
                <Text style={{ color: couleurs.accent, fontWeight: '600' }}>+ Accueil</Text>
              </Pressable>
            }
          >
            Accueils
          </Titre>
          {accueils.length === 0 && <Vide>Aucun accueil enregistré.</Vide>}
          {accueils.map((ac) => {
            const structure = donnees.contacts.find((c) => c.id === ac.structureId);
            return (
              <Carte key={ac.id} onPress={() => router.push(`/animal/accueil?animalId=${animal.id}&accueilId=${ac.id}`)}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>
                  {TYPES_ACCUEIL[ac.type]}
                  {structure ? ` · ${structure.nom}` : ''}
                </Text>
                <Petit>
                  Du {formatJourCourt(ac.dateArrivee)}
                  {ac.dateDepart ? ` au ${formatJourCourt(ac.dateDepart)}` : ' · en cours'}
                  {ac.issue ? ` · ${ISSUES[ac.issue]}` : ''}
                </Petit>
                {!!ac.notes && <Petit>{ac.notes}</Petit>}
              </Carte>
            );
          })}
        </>
      )}

      <Titre
        action={
          <Pressable onPress={() => router.push(`/rdv/edit?animalId=${animal.id}`)}>
            <Text style={{ color: couleurs.accent, fontWeight: '600' }}>+ Rdv</Text>
          </Pressable>
        }
      >
        Rendez-vous
      </Titre>
      {rdvsAVenir.length === 0 && rdvsPasses.length === 0 && <Vide>Aucun rendez-vous.</Vide>}
      {rdvsAVenir.map((r) => (
        <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
      ))}
      {rdvsPasses.length > 0 && <Petit>Derniers rendez-vous passés</Petit>}
      {rdvsPasses.map((r) => (
        <CarteRdv key={r.id} rdv={r} animaux={donnees.animaux} contacts={donnees.contacts} />
      ))}

      <Titre
        action={
          <Pressable onPress={() => router.push(`/tache/edit?animalId=${animal.id}`)}>
            <Text style={{ color: couleurs.accent, fontWeight: '600' }}>+ Tâche</Text>
          </Pressable>
        }
      >
        Tâches
      </Titre>
      {taches.length === 0 && <Vide>Aucune tâche liée à {animal.nom}.</Vide>}
      {taches.map((t) => (
        <CarteTache key={t.id} tache={t} animaux={donnees.animaux} personnes={donnees.personnes} />
      ))}

      <Titre
        action={
          <Pressable onPress={() => router.push(`/finances/operation?animalId=${animal.id}`)}>
            <Text style={{ color: couleurs.accent, fontWeight: '600' }}>+ Dépense</Text>
          </Pressable>
        }
      >
        Dépenses
      </Titre>
      {operations.length === 0 ? (
        <Vide>Aucune dépense pour {animal.nom}.</Vide>
      ) : (
        <Petit>
          Total (ma part) : {euros(bilan(operations).maPart)} · cette année : {euros(bilan(operations.filter((o) => o.date.startsWith(annee))).maPart)}
        </Petit>
      )}
      {operations.slice(0, 5).map((o) => (
        <CarteOperation key={o.id} o={o} personnes={donnees.personnes} animaux={donnees.animaux} />
      ))}

      <Titre
        action={
          <Pressable onPress={() => router.push(`/note/edit?animalId=${animal.id}`)}>
            <Text style={{ color: couleurs.accent, fontWeight: '600' }}>+ Note</Text>
          </Pressable>
        }
      >
        Notes
      </Titre>
      {notes.length === 0 && <Vide>Aucune note pour {animal.nom} (posologie, conduite à tenir…).</Vide>}
      {notes.map((n) => (
        <CarteNote key={n.id} note={n} />
      ))}

      {seances.length > 0 && (
        <>
          <Titre>Dernières séances de travail</Titre>
          {seances.map((s) => (
            <Carte key={s.id}>
              <Text style={{ color: couleurs.texte, fontWeight: '600' }}>
                {formatJourCourt(s.date)} · {option(donnees.listes.typesSeance, s.seance!.type).nom}
                {s.seance!.dureeMin ? ` · ${s.seance!.dureeMin} min` : ''}
              </Text>
              {!!s.seance!.ressenti && <Petit>{s.seance!.ressenti}</Petit>}
            </Carte>
          ))}
        </>
      )}
    </Ecran>
  );
}
