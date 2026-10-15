import { requestWidgetUpdate, type WidgetTaskHandlerProps } from 'react-native-android-widget';
import type { Donnees } from '../lib/types';
import { formatJour, jourISO } from '../lib/dates';
import { TachesDuJour } from './TachesDuJour';
import { basculer, lignesDuJour, lire } from './donnees';

export const NOM_WIDGET = 'TachesDuJour';

function rendu(d: Donnees) {
  const titre = formatJour(jourISO());
  return <TachesDuJour lignes={lignesDuJour(d)} titre={titre.charAt(0).toUpperCase() + titre.slice(1)} />;
}

/** Appelé par Android (tâche en arrière-plan) quand le widget est ajouté, mis à jour ou touché. */
export async function gestionWidget({ widgetAction, clickAction, clickActionData, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED') return;
  if (widgetAction === 'WIDGET_CLICK' && clickAction === 'BASCULER' && typeof clickActionData?.tacheId === 'string') {
    renderWidget(rendu(await basculer(clickActionData.tacheId)));
    return;
  }
  renderWidget(rendu(await lire()));
}

/** Rafraîchit les widgets posés sur l'écran d'accueil après une modification dans l'app. */
export function rafraichirWidget(d: Donnees) {
  requestWidgetUpdate({ widgetName: NOM_WIDGET, renderWidget: () => rendu(d) }).catch(() => {});
}
