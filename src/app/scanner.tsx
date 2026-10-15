import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { estLienFiche, lireFiche } from '../lib/partage';
import { Bouton, Ecran, Petit, couleurs } from '../components/ui';

export default function Scanner() {
  const [permission, demander] = useCameraPermissions();
  const [message, setMessage] = useState<string>();
  const lu = useRef(false);

  if (!permission) return <View style={{ flex: 1 }} />;
  if (!permission.granted) {
    return (
      <Ecran>
        <Petit>L’app a besoin de la caméra pour lire le QR code d’une fiche partagée.</Petit>
        <Bouton titre="Autoriser la caméra" onPress={demander} />
      </Ecran>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (lu.current) return;
          if (estLienFiche(data) && lireFiche(data)) {
            lu.current = true;
            router.replace({ pathname: '/import', params: { d: data.slice(data.indexOf('d=') + 2) } });
          } else {
            setMessage("Ce QR code n'est pas une fiche de Mes Animaux.");
          }
        }}
      />
      <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20, padding: 14, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 15 }}>{message ?? 'Vise le QR code de la fiche à récupérer.'}</Text>
      </View>
      <View style={{ position: 'absolute', top: '30%', alignSelf: 'center', width: 230, height: 230, borderWidth: 3, borderColor: couleurs.accentClair, borderRadius: 18 }} />
    </View>
  );
}
