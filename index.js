// Point d'entrée : l'app (Expo Router), plus la tâche qui dessine le widget Android des tâches du jour.
import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { gestionWidget } = require('./src/widget/gestion');
  registerWidgetTaskHandler(gestionWidget);
}
