import { useMemo } from 'react';
import { View } from 'react-native';
import QRCode from 'qrcode';

/** QR code dessiné avec des View : chaque suite de modules noirs d'une ligne devient un seul rectangle. */
export function CodeQR({ valeur, taille = 260 }: { valeur: string; taille?: number }) {
  const { n, lignes } = useMemo(() => {
    const m = QRCode.create(valeur, { errorCorrectionLevel: 'M' }).modules;
    const lignes: [number, number][][] = [];
    for (let y = 0; y < m.size; y++) {
      const segments: [number, number][] = [];
      let debut = -1;
      for (let x = 0; x <= m.size; x++) {
        const noir = x < m.size && m.get(y, x);
        if (noir && debut < 0) debut = x;
        if (!noir && debut >= 0) {
          segments.push([debut, x - debut]);
          debut = -1;
        }
      }
      lignes.push(segments);
    }
    return { n: m.size, lignes };
  }, [valeur]);

  const marge = 4; // zone blanche autour, nécessaire à la lecture
  const module = taille / (n + marge * 2);
  return (
    <View style={{ width: taille, height: taille, backgroundColor: '#fff' }} accessibilityLabel="QR code">
      {lignes.map((segments, y) =>
        segments.map(([x, l]) => (
          <View
            key={`${y}-${x}`}
            style={{
              position: 'absolute',
              left: (x + marge) * module,
              top: (y + marge) * module,
              width: l * module + 0.5,
              height: module + 0.5,
              backgroundColor: '#000',
            }}
          />
        )),
      )}
    </View>
  );
}
