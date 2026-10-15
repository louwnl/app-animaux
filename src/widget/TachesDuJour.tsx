import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';
import type { LigneWidget } from './donnees';

const VERT = '#3F7D5C';
const FOND = '#F6F3EE';
const TEXTE = '#2B2420';
const DOUX = '#7A6E66';
const AMBRE = '#C27C0E';

/** Widget d'écran d'accueil : les tâches du jour, à cocher d'un appui. Le titre ouvre l'app. */
export function TachesDuJour({ lignes, titre }: { lignes: LigneWidget[]; titre: string }) {
  const restantes = lignes.filter((l) => !l.faite).length;
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: FOND, borderRadius: 20, padding: 12 }}>
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}
      >
        <TextWidget text={`🐇 ${titre}`} style={{ fontSize: 16, fontWeight: '700', color: TEXTE }} />
        <TextWidget
          text={lignes.length === 0 ? '' : restantes === 0 ? 'tout est fait 🎉' : `${restantes} à faire`}
          style={{ fontSize: 13, color: restantes === 0 ? VERT : DOUX }}
        />
      </FlexWidget>
      {lignes.length === 0 ? (
        <FlexWidget clickAction="OPEN_APP" style={{ width: 'match_parent', paddingTop: 8 }}>
          <TextWidget text="Aucune tâche aujourd'hui." style={{ fontSize: 14, color: DOUX }} />
        </FlexWidget>
      ) : (
        <ListWidget style={{ height: 'match_parent', width: 'match_parent' }}>
          {lignes.map((l) => (
            <FlexWidget
              key={l.tacheId}
              clickAction="BASCULER"
              clickActionData={{ tacheId: l.tacheId }}
              style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', paddingVertical: 7, flexGap: 10 }}
            >
              <TextWidget text={l.faite ? '✅' : '⬜'} style={{ fontSize: 18 }} />
              <TextWidget
                text={l.texte}
                maxLines={1}
                truncate="END"
                style={{ fontSize: 15, color: l.faite ? DOUX : l.retard ? AMBRE : TEXTE }}
              />
            </FlexWidget>
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
