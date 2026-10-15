import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { derniereVersion, installerMaj, versionInstallee } from '../lib/miseAJour';
import { Bouton, Carte, Ecran, Petit, couleurs } from '../components/ui';

type Etat = 'verification' | 'a-jour' | 'disponible' | 'telechargement' | 'erreur';

export default function MiseAJour() {
  const installee = versionInstallee();
  const [derniere, setDerniere] = useState<number>();
  const [etat, setEtat] = useState<Etat>('verification');
  const [erreur, setErreur] = useState('');

  const [essai, setEssai] = useState(0);

  useEffect(() => {
    let actif = true;
    derniereVersion()
      .then((n) => {
        if (!actif) return;
        setDerniere(n);
        setEtat(n && (!installee || n > installee) ? 'disponible' : 'a-jour');
      })
      .catch(() => {
        if (!actif) return;
        setErreur('Impossible de vérifier pour le moment. Vérifie ta connexion internet.');
        setEtat('erreur');
      });
    return () => {
      actif = false;
    };
  }, [essai, installee]);

  const verifier = () => {
    setEtat('verification');
    setEssai((n) => n + 1);
  };

  const installer = async () => {
    setEtat('telechargement');
    try {
      await installerMaj();
      setEtat('disponible');
    } catch {
      setErreur('Le téléchargement n’a pas abouti. Réessaie avec une bonne connexion.');
      setEtat('erreur');
    }
  };

  return (
    <Ecran>
      <Carte style={{ gap: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: couleurs.texte }}>Version installée : {installee ?? 'inconnue'}</Text>
        {derniere !== undefined && <Petit>Dernière version publiée : {derniere}</Petit>}
      </Carte>

      {(etat === 'verification' || etat === 'telechargement') && (
        <Carte style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator color={couleurs.accent} />
          <Text style={{ color: couleurs.texte }}>
            {etat === 'verification' ? 'Vérification…' : 'Téléchargement de la nouvelle version…'}
          </Text>
        </Carte>
      )}
      {etat === 'a-jour' && <Petit>✅ Tu as déjà la dernière version.</Petit>}
      {etat === 'erreur' && <Petit>{erreur}</Petit>}

      {etat === 'disponible' && (
        <>
          <Text style={{ fontSize: 16, color: couleurs.texte }}>🎉 Une nouvelle version est disponible.</Text>
          <Bouton titre="Mettre à jour" onPress={installer} />
          <Petit>
            L’app télécharge la nouvelle version puis Android te propose de l’installer. Tes données sont gardées. La première fois,
            Android peut demander d’autoriser Mes animaux à installer des applications : accepte, puis reviens ici et touche encore le
            bouton.
          </Petit>
        </>
      )}
      {(etat === 'a-jour' || etat === 'erreur') && <Bouton titre="Vérifier à nouveau" variante="secondaire" onPress={verifier} />}
    </Ecran>
  );
}
